---
title: "Spring: 파라미터 받기 연습"
date: 2024-03-23
summary: "@PathVariable로 경로 값을 받아 JSON·문자열로 돌려주고, @RequestParam Map으로 받은 값을 JSP에 뿌려 보기"
tags: [Spring]
---

컨트롤러에서 요청 파라미터를 받는 방법을 연습했다.

- `@PathVariable`: `/school/1/홍길동`처럼 URL 경로에 들어 있는 값을 받는다.
- `@ResponseBody`: 뷰(JSP)를 찾지 않고 반환값을 그대로 응답 본문에 쓴다. 객체를 반환하면 JSON으로 바뀐다.
- `@RequestParam Map<String, String>`: `?id=a&name=b` 같은 쿼리 스트링을 전부 Map으로 받는다.

## Param.java

```java
package kr.co.ictedu.mvc.controller.ex1;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class Param {

	// JSON으로 응답
	@GetMapping("/school/{num}/{name}")
	@ResponseBody
	public SchoolVO mySchool(@PathVariable Integer num, @PathVariable String name) {
		SchoolVO vo = new SchoolVO();
		vo.setNum(num);
		vo.setName(name);
		vo.setGrade(num + 1);
		vo.setClasses(num + 100);
		vo.setAdress("집주소" + name);
		vo.setPhone("010-0000-0000");
		return vo;
	}

	@GetMapping("/event/{eventname}/{count}/{saled}")
	@ResponseBody
	public EventVO myEvent(@PathVariable String eventname, @PathVariable int count, @PathVariable boolean saled) {
		EventVO vo = new EventVO();
		vo.setEventname(eventname);
		vo.setCount(count - 10);
		vo.setSaled(saled);
		return vo;
	}

	@GetMapping("/joinin/{userID}/{userPW}/{userName}")
	@ResponseBody
	public JoinInVO myJoin(@PathVariable String userID, @PathVariable String userPW, @PathVariable String userName) {
		JoinInVO vo = new JoinInVO();
		vo.setUserID(userID);
		vo.setUserPW(userPW);
		vo.setUserName(userName);
		vo.setUserNum(1);
		vo.setUserCoin(10000);
		return vo;
	}

	// 문자열로 응답
	@GetMapping("/workingday/{id}/{pw}")
	@ResponseBody
	public String workingday(@PathVariable String id, @PathVariable String pw) {
		String date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
		String msg = "id : " + id + ", pw : " + pw + ", date : " + date;
		System.out.println(msg);
		return msg;
	}

	@GetMapping("/membership/{memid}/{memname}/{cost}")
	@ResponseBody
	public String membership(@PathVariable String memid, @PathVariable String memname, @PathVariable int cost) {
		String date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
		StringBuilder sb = new StringBuilder();
		sb.append("member id : " + memid);
		sb.append(", member name : " + memname);
		sb.append(", cost : " + cost);
		sb.append(", point : " + (cost * 0.1));
		sb.append(", date : " + date);
		return sb.toString();
	}

	// 쿼리 스트링을 Map으로 받아서 JSP로 넘기기
	@GetMapping("/myJoinmodel")
	public String myJoinmodel(Model model, @RequestParam Map<String, String> param) {
		StringBuilder sb = new StringBuilder();
		sb.append("회원입니다.").append("\n");
		for (Map.Entry<String, String> e : param.entrySet()) {
			sb.append(e.getKey()).append(":");
			sb.append(e.getValue()).append("\n");
		}
		model.addAttribute("models", param);
		System.out.println(sb);
		System.out.println("--------------------");
		return "member/maps";
	}
}
```

날짜 포맷에서 `MM`은 월, `mm`은 분이다. `HH`는 24시간제, `hh`는 12시간제.

## maps.jsp

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
</head>
<body>

<c:forEach var="i" items="${models}">
	<p>${i.key} / ${i.value}</p>
</c:forEach>

</body>
</html>
```

## VO

필드만 적었다. getter/setter가 있는 평범한 POJO다.

```java
public class EventVO {
	private String eventname;
	private boolean saled;
	private int count;
}

public class JoinInVO {
	private String userID;
	private String userPW;
	private String userName;
	private int userNum;
	private int userCoin;
}

public class SchoolVO {
	private int num;
	private String name;
	private int grade;
	private int classes;
	private String adress;
	private String phone;
}
```

## 결과

![](/images/posts/spring-request-params/01.png)

![](/images/posts/spring-request-params/02.png)
