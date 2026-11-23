---
title: "Spring: 등록된 호텔 수정, 삭제하는 기능 만들기"
date: 2024-04-20
summary: 목록·상세·수정 폼을 만들고, 컨트롤러에서 수정과 삭제 요청을 DAO로 넘기기
tags: [Spring, MyBatis]
---

[호텔 등록하기](/blog/2024-04-20-spring-hotel-create/)에 이어서 등록된 호텔을 수정하고 삭제하는 기능을 만들었다.

## 폼 만들기

### 수정 폼 (updateForm)

등록 번호는 `readonly`로 보여 주고, 나머지 값은 기존 값을 채워서 보여 준다.

```jsp
<form action="todayHtUp" method="post" id="todayHtUp" class="form-subscribe" enctype="multipart/form-data">
<div class="row justify-content-center">
<table id="rwd-table-large" style="text-align:left">
    <tr>
        <td>등록 번호</td>
        <td><input type="text" id="tHtNum" name="tHtNum" value="${thtlist.tHtNum}" readonly="readonly"></td>
    </tr>
    <tr>
        <td><label for="tHtName">호텔이름</label></td>
        <td>
        <div class="col">
             <input type="text"
                class="form-control form-control mb-1" id="tHtName"
                placeholder="호텔이름(5-100)" name="tHtName" maxlength="100"
                required="required" pattern=".{5,100}"
                value="${thtlist.tHtName}">
        </div>
        </td>
    </tr>
    <tr>
        <td><label for="tHtGrade">호텔별점</label> </td>
        <td>
        <div class="col">
            <input type="number" class="form-control form-control mb-1" id="tHtGrade"
                name="tHtGrade" placeholder="0점 ~ 5점" min="0" max="5"
                required="required" value="${thtlist.tHtGrade}">
        </div>
        </td>
    </tr>
    <tr>
        <td><label for="tHtPrice">호텔가격</label></td>
        <td>
        <div class="col">
            <input type="number" class="form-control form-control mb-1" id="tHtPrice"
                name="tHtPrice" placeholder="1박 가격" required="required"
                value="${thtlist.tHtPrice}">
        </div>
        </td>
    </tr>
    <tr>
        <td><label for="mfile">이미지</label></td>
        <td>
            <div class="col">
                <div class="col-sm-10">
                    <%-- 이미지 미리보기 --%>
                    <img src="${rPath }/img/${thtlist.tHtImg}" id="imgx"
                        style="width: 500px; border: dotted 1px; margin: 5px 5px">
                </div>
                <div class="col-sm-10">
                    <input type="file" class="form-control form-control mb-1"
                        id="mfile" name="mfile">
                </div>
            </div>
        </td>
    </tr>
    <tr>
        <td colspan="2">
        <div class="text-center">
            <button type="submit" class="btn btn-outline-warning">수정하기</button>
            <button type="button" class="btn btn-outline-danger" onclick="location='todayHtDelete?tHtNum=${thtlist.tHtNum}'">삭제</button>
            <button type="button" class="btn btn-outline-secondary" onclick="location='main'">목록</button>
        </div>
        </td>
    </tr>
</table>
</div>
</form>
```

### 목록 (listForm)

```jsp
<section class="bg-light text-center">
<div>
<br>
</div>
<div class="container">
<h2  class="bi-star-fill">오늘의 호텔</h2>
<div class="row">
    <c:forEach var="e" items="${thtlist}">
        <div class="col-lg-4 mb-3">
            <div
                class="mx-auto mt-5 mb-5 mb-lg-0 mx-auto mb-5 mb-lg-0 mb-lg-3">
                <img class="mb-5" src="${rPath }/img/${e.tHtImg}" alt="..."
                    style="width: 216px; height: 216px;" />
            </div>
            <h3>
                <a href="todayHtDetail?tHtNum=${e.tHtNum }">${e.tHtName}</a>
            </h3>
            <div class="d-flex justify-content-center small text-warning mb-2">
                <div class="bi-star-fill">${e.tHtGrade}점</div>
            </div>

            <p class="lead mb-2">${e.tHtPrice}원부터~</p>
            <button class="btn btn-primary btn-lg" id="bookingButton1"
                type="button"
                onclick="location.href='todayHtDetail?tHtNum=${e.tHtNum }'">상세보기</button>
        </div>
    </c:forEach>
</div>
</div>
</section>
```

### 상세 보기 (DetailForm)

```jsp
<form action="" method="post" id="" class="form-subscribe" enctype="multipart/form-data">
<div class="row justify-content-center">
<div class="col-xl-6">
        <div class="text-black">
        <input type="hidden" name="tHtNum" value="${thtlist.tHtNum}" readonly="readonly">
            <div class="col">
                <label for="mfile"><p>이미지</p></label>
                <div class="col-sm-10">
                    <img src="${rPath }/img/${thtlist.tHtImg}" id="imgx"
                        style="width: 500px; border: dotted 1px; margin: 5px 5px">
                </div>
            </div>
            <div class="col">
                <label for="tHtName"><p>호텔이름</p></label> <input type="text"
                    class="form-control form-control mb-1" id="tHtName"
                    placeholder="호텔이름(5-100)" name="tHtName" maxlength="100"
                    required="required" pattern=".{5,100}"
                    value="${thtlist.tHtName}" readonly="readonly">
            </div>
            <div class="col">
                <label for="tHtGrade"><p>호텔별점</p></label> <input type="number"
                    class="form-control form-control mb-1" id="tHtGrade"
                    name="tHtGrade" placeholder="0점 ~ 5점" min="0" max="5"
                    required="required" value="${thtlist.tHtGrade}" readonly="readonly">
            </div>
            <div class="col">
                <label for="tHtPrice"><p>호텔가격</p></label> <input type="number"
                    class="form-control form-control mb-1" id="tHtPrice"
                    name="tHtPrice" placeholder="1박 가격" required="required"
                    value="${thtlist.tHtPrice}" readonly="readonly">
            </div>
        </div>
</div>
</div>
<div class="text-center">
<button type="button" class="btn btn-primary" onclick="location='todayHtRerv'">예약하기</button>
<button type="button" class="btn btn-primary" onclick="location='todayHtList'">목록</button>
</div>
</form>
```

## DAO에 정의한 내용 확인

등록 글에서 만든 DAO에 삭제와 수정이 이미 들어 있다.

```java
@Repository
public class TodayHt implements TodayHtDaoInter {
	@Autowired
	private SqlSessionTemplate ss;

	// 등록
	@Override
	public void addTodayHt(TodayHtDTO vo) {
		ss.insert("thtvo.add", vo);
	}

	// 목록 조회
	@Override
	public List<TodayHtDTO> listTodayHt() {
		return ss.selectList("thtvo.list");
	}

	// 상세 조회
	@Override
	public TodayHtDTO detailTodayHt(int tHtNum) {
		return ss.selectOne("thtvo.detail", tHtNum);
	}

	// 삭제
	@Override
	public void deleteTodayHt(int tHtNum) {
		ss.delete("thtvo.del", tHtNum);
	}

	// 수정
	@Override
	public void updateTodayHt(TodayHtDTO vo) {
		ss.update("thtvo.up", vo);
	}
}
```

## 컨트롤러 만들기

```java
@SessionAttributes("pageType")
@Controller
public class AdminController {

	@Autowired
	private TodayHtDaoInter todayHtDaoInter;

	@GetMapping("/todayHtDetail")
	public String todayHtDetail(@RequestParam("tHtNum") int tHtNum, Model m) {
		TodayHtDTO tht = todayHtDaoInter.detailTodayHt(tHtNum);
		m.addAttribute("thtlist", tht);
		return "hotel/admThtUpdate";
	}

	@GetMapping("/todayHtDelete")
	public String todayHtDelete(@RequestParam(name = "tHtNum") int tHtNum) {
		todayHtDaoInter.deleteTodayHt(tHtNum);
		return "redirect:main";
	}

	@GetMapping("/todayHtUpdate")
	public String todayHtUpdate(@RequestParam("tHtNum") int tHtNum, Model m) {
		TodayHtDTO tht = todayHtDaoInter.detailTodayHt(tHtNum);
		m.addAttribute("thtlist", tht);
		return "hotel/thtUpdate";
	}

	@PostMapping("/todayHtUp")
	public String todayHtUp(Model m, TodayHtDTO vo, HttpServletRequest request) {
		todayHtDaoInter.updateTodayHt(vo);
		return "redirect:main";
	}
}
```

수정에는 컨트롤러 메서드가 2개 필요하다.

- `todayHtUpdate`: `tHtNum` 값으로 기존 데이터를 조회해서 수정 폼으로 이동한다.
- `todayHtUp`: 수정된 값을 받아서 DAO에 넘기고 메인으로 돌아간다.

`todayHtUp`은 아직 업로드 파일을 처리하지 않는다. 그래서 매퍼의 `tHtImg=#{tHtImg}`에 null이 들어가서, 수정하면 기존 이미지 이름이 지워진다. 등록 때처럼 파일이 있으면 저장하고 `tHtImg`를 채우고, 파일이 없으면 기존 이미지 이름을 그대로 두도록(예: 수정 폼에 hidden으로 `tHtImg`를 넣기) 고쳐야 한다.

## 실행 결과

목록

![](/images/posts/spring-hotel-update-delete/01.png)

수정하기

![](/images/posts/spring-hotel-update-delete/02.png)
