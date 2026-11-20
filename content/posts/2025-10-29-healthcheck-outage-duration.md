---
title: 헬스체크 로그로 장애가 몇 분 이어졌는지 계산하기
date: 2025-10-29
summary: 1분마다 쌓이는 헬스체크 로그에서 서비스별로 fail이 연속된 구간을 찾아 1분, 10분 기준으로 알림 보내기 (pandas, SQL)
tags: [Python, pandas, SQL, 모니터링]
---

서비스 헬스체크 결과가 1분마다 DB에 한 줄씩 쌓이고 있었다. 각 줄에는 시간과 nginx, uwsgi, MySQL 같은 구성 요소별 상태(`ok`/`fail`)가 들어 있다.

하고 싶은 건 "**1분 이상** 실패하면 경고, **10분 이상**이면 심각" 같은 알림이다. 그런데 한 줄만 봐서는 지금 실패 중이라는 것만 알지, 얼마나 오래 실패했는지는 모른다. 연속된 로그 사이의 **상태 변화**를 따라가야 한다.

## 구조

```
DB → pandas로 최근 로그 조회 → 서비스별 상태 구간 계산 → 임계 시간 넘으면 알림
```

## 1. 최근 로그 읽기

```python
import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine(DATABASE_URL)  # 접속 정보는 환경 변수로

def fetch_health_logs(minutes: int = 30) -> pd.DataFrame:
    query = text("""
        SELECT checked_at, nginx_status, uwsgi_status, mysql_status, api_status
        FROM health_log
        WHERE checked_at >= NOW() - INTERVAL :minutes MINUTE
        ORDER BY checked_at
    """)
    return pd.read_sql(query, engine, params={'minutes': minutes}, parse_dates=['checked_at'])
```

## 2. 상태가 바뀌는 지점으로 구간 나누기

핵심은 이 한 줄이다.

```python
df['group'] = df[col].ne(df[col].shift()).cumsum()
```

- `shift()`로 바로 앞 줄의 상태를 가져와서
- `ne()`로 앞 줄과 다르면 `True`(상태가 바뀐 지점)
- `cumsum()`으로 누적하면, 상태가 바뀔 때마다 번호가 1씩 올라간다.

| 시각 | 상태 | 바뀜 | group |
| --- | --- | --- | --- |
| 15:50 | ok | True | 1 |
| 15:51 | fail | True | 2 |
| 15:52 | fail | False | 2 |
| 15:53 | fail | False | 2 |
| 15:54 | ok | True | 3 |

같은 번호끼리 묶으면 그게 "같은 상태가 이어진 구간"이다.

```python
def calc_durations(df: pd.DataFrame, col: str) -> list[dict]:
    d = df[['checked_at', col]].copy()
    d['group'] = d[col].ne(d[col].shift()).cumsum()

    segments = d.groupby('group').agg(
        status=(col, 'first'),
        start=('checked_at', 'first'),
        last=('checked_at', 'last'),
    )
    # 구간의 끝 = 다음 구간이 시작한 시각 (마지막 구간이면 마지막 로그 시각)
    segments['end'] = segments['start'].shift(-1).fillna(segments['last'])
    segments['duration_sec'] = (segments['end'] - segments['start']).dt.total_seconds()
    segments['service'] = col.removesuffix('_status')
    return segments.reset_index(drop=True).to_dict('records')
```

처음에는 구간의 끝을 "그 구간의 마지막 로그 시각"으로 계산했다. 그러면 fail 로그가 한 줄뿐인 구간은 0초가 되고, 위 표의 장애도 15:51~15:53, 2분으로 나온다. 실제로는 15:54에 복구가 확인될 때까지 실패 상태였으니 3분이다. 그래서 **다음 구간의 시작 시각**을 끝으로 잡았다.

## 3. 1분, 10분 기준으로 판단

```python
def detect_failures(segments: list[dict]) -> list[dict]:
    alerts = []
    for s in segments:
        if s['status'] != 'fail':
            continue
        if s['duration_sec'] >= 600:
            level = 'CRITICAL'
        elif s['duration_sec'] >= 60:
            level = 'WARNING'
        else:
            continue
        alerts.append({**s, 'level': level})
    return alerts
```

## 4. 실행

```python
if __name__ == '__main__':
    df = fetch_health_logs(30)
    services = [c for c in df.columns if c.endswith('_status')]

    segments = [seg for col in services for seg in calc_durations(df, col)]
    alerts = detect_failures(segments)

    for a in alerts:
        print(f"- {a['service']}: {a['level']} ({a['duration_sec']:.0f}초) {a['start']} ~ {a['end']}")
```

```
- nginx: WARNING (122초) 2025-10-29 15:59:00 ~ 2025-10-29 16:01:02
- mysql: CRITICAL (622초) 2025-10-29 15:52:00 ~ 2025-10-29 16:02:22
```

알림은 Slack 웹훅이나 메일로 보내면 된다. 웹훅 URL도 비밀 값이니 환경 변수로 둔다.

```python
import requests

def send_slack(alerts):
    if not alerts:
        return
    lines = [f"- `{a['service']}`: {a['level']} ({a['duration_sec']:.0f}초)" for a in alerts]
    requests.post(os.environ['SLACK_WEBHOOK_URL'], json={'text': '*🚨 서비스 장애 감지*\n' + '\n'.join(lines)})
```

## 5. 주기적으로 돌리기

1분마다 crontab으로 실행했다.

```
* * * * * /usr/bin/python3 /opt/health/analyzer.py >> /var/log/health_analyzer.log 2>&1
```

1분마다 최근 30분을 보니까, 같은 장애가 이어지는 동안 **매분 같은 알림이 또 간다.** 그래서 장애마다 (서비스, 시작 시각)을 키로 "이미 보낸 단계"를 저장해 두고, WARNING → CRITICAL처럼 단계가 올라갈 때와 복구됐을 때만 보내도록 했다.

## SQL로만 할 수는 없을까?

MySQL 8 이상이면 윈도우 함수로 같은 계산을 할 수 있다. "상태가 바뀔 때마다 번호를 올린다"는 pandas의 `cumsum()` 아이디어를 그대로 SQL로 옮긴 것이다(gaps and islands 패턴).

```sql
WITH marked AS (
  SELECT checked_at, nginx_status AS status,
         CASE WHEN nginx_status <> LAG(nginx_status) OVER (ORDER BY checked_at)
              THEN 1 ELSE 0 END AS changed
  FROM health_log
  WHERE checked_at >= NOW() - INTERVAL 30 MINUTE
),
grouped AS (
  SELECT *, SUM(changed) OVER (ORDER BY checked_at) AS grp
  FROM marked
)
SELECT status, MIN(checked_at) AS started_at, MAX(checked_at) AS last_seen_at,
       TIMESTAMPDIFF(SECOND, MIN(checked_at), MAX(checked_at)) AS duration_sec
FROM grouped
GROUP BY grp, status
HAVING status = 'fail' AND duration_sec >= 60;
```

처음에 시도한 `LAG()`로 "바로 앞 줄과의 간격이 60초 이상인 fail"을 찾는 쿼리는 틀린 방법이었다. 그건 로그가 1분 넘게 비어 있는 지점을 찾을 뿐, 장애가 이어진 시간을 재는 게 아니다.

SQL 버전은 서비스(컬럼)마다 쿼리를 따로 써야 하고 구간 끝 처리도 번거로워서, 결국 pandas 쪽을 썼다.

## 정리

- 지속 시간은 한 줄로는 알 수 없다. 앞뒤 줄과 비교해서 **상태 구간**을 만들어야 한다.
- `ne(shift()).cumsum()`은 연속 구간을 나누는 아주 쓸모 있는 패턴이다.
- 주기적으로 도는 알림은 중복 발송을 막는 장치가 꼭 필요하다.
