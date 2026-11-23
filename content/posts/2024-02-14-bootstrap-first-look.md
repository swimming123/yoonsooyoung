---
title: 부트스트랩 맛보기
date: 2024-02-14
summary: 부트스트랩 3 CDN으로 레이아웃 잡기, header.jsp를 include해서 갤러리·게시판 페이지 나누기
tags: [HTML, CSS]
---
[Bootstrap](https://getbootstrap.kr/)에서 마음에 드는 레이아웃을 긁어 와서 적용해 봤다.

## 부트스트랩 적용하기

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
<!-- 디바이스, 장치(PC, Mobile 화면에 맞게 반응형 웹 설정)  -->
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
<!-- CDN : 지속적으로 서비스 할 것들(css, js)을 서버에 올려놓고
필요할 때마다 외부 링크를 통해 1번만 다운로드 후 캐시한다.  -->
<style>

</style>

</head>
<body>
	<div class="container-fluid bg-secondary p-5 text-white text-center" style="margin-top:60px">
		<h1>ICT 웹 페이지</h1>
		<p>여기는 bootstrap 견본입니다.</p>
	</div>

	<!-- 네비게이션 영역 시작 -->
	<nav class="navbar navbar-inverse navbar-fixed-top">
	  <div class="container-fluid">
	    <div class="navbar-header">
	      <a class="navbar-brand" href="https://github.com/swimming123"><img src="image/logo2.png" width="40px"></a>
	    </div>
	    <ul class="nav navbar-nav">
	      <li class="active"><a href="#">Home</a></li>
	      <li><a href="#">Page 1</a></li>
	      <li><a href="#">Page 2</a></li>
	      <li><a href="#">Page 3</a></li>
	    </ul>
	  </div>
	</nav>

	<div class="container" style="margin-top:50px">
	  <h3>Fixed Navbar</h3>
	  <div class="row">
	    <div class="col-md-4">
	      <p>A fixed navigation bar stays visible in a fixed position (top or bottom) independent of the page scroll.</p>
	      <p>A fixed navigation bar stays visible in a fixed position (top or bottom) independent of the page scroll.</p>
	    </div>
	    <div class="col-md-4">
	      <p>A fixed navigation bar stays visible in a fixed position (top or bottom) independent of the page scroll.</p>
	      <p>A fixed navigation bar stays visible in a fixed position (top or bottom) independent of the page scroll.</p>
	    </div>
	    <div class="col-md-4">
	      <p>A fixed navigation bar stays visible in a fixed position (top or bottom) independent of the page scroll.</p>
	      <p>A fixed navigation bar stays visible in a fixed position (top or bottom) independent of the page scroll.</p>
	    </div>
	  </div>
	</div>
	<!-- 네비게이션 영역 끝 -->

	<div class="container" style="margin-top:100px">
		<div class="row">
			<div class="col-sm-4">
				<h2>여기는 본문 제목 1</h2>
				<p>본문이 들어갈 레이아웃 자리 입니다.~~~~~~~~</p>
				<p>본문이 들어갈 레이아웃 자리 입니다.~~~~~~~~</p>
			</div>
			<div class="col-sm-4">
				<h2>여기는 본문 제목 2</h2>
				<p>본문이 들어갈 레이아웃 자리 입니다.~~~~~~~~</p>
				<p>본문이 들어갈 레이아웃 자리 입니다.~~~~~~~~</p>
			</div>
			<div class="col-sm-4">
				<h2>여기는 본문 제목 3</h2>
				<p>본문이 들어갈 레이아웃 자리 입니다.~~~~~~~~</p>
				<p>본문이 들어갈 레이아웃 자리 입니다.~~~~~~~~</p>
			</div>
		</div>
	</div>

</body>
</html>
```

![](/images/posts/bootstrap-first-look/01.png)

일단 적용 성공!

이제 이걸 header 영역, gallery 페이지, boardList 페이지로 나눠서 작업해 보자. JSP 파일로!

## header.jsp

헤더 영역을 따로 만드는 이유

1. 잘 안 바뀐다. 항상 그 자리에서 같은 기능을 한다.
2. 헤더가 페이지마다 들어 있으면, 고칠 일이 생겼을 때 모든 페이지에 가서 같은 수정을 반복해야 한다.
3. 따로 관리하면 한 번만 고쳐도 include한 모든 페이지에 적용된다.

```jsp
<%@ page language="java" contentType="text/html; charset=EUC-KR"
    pageEncoding="EUC-KR"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.min.js"></script>
<style>
	#images img{
		width: 200px;
		height:150px;
	}
</style>
</head>
<body>
	<div class="container-fluid bg-secondary p-5 text-white text-center" style="margin-top:60px">
		<h1>ICT 웹 페이지</h1>
		<p>여기는 bootstrap 견본입니다.</p>
	</div>

	<!-- 네비게이션 영역 시작 -->
	<nav class="navbar navbar-inverse navbar-fixed-top">
	  <div class="container-fluid">
	    <div class="navbar-header">
	      <a class="navbar-brand" href="index.jsp"><img src="../image/logo2.png" width="40px"></a>
	    </div>
	    <ul class="nav navbar-nav">
	      <li class="active"><a href="#">Home</a></li>
	      <li><a href="boardList.jsp">게시판 1</a></li>
	      <li><a href="gallery.jsp">갤러리</a></li>
	      <li><a href="#">Page 3</a></li>
	      <li class="nav-item dropdown">
	          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
	            Dropdown
	          </a>
	          <ul class="dropdown-menu">
	            <li><a class="dropdown-item" href="#">Action</a></li>
	            <li><a class="dropdown-item" href="#">Another action</a></li>
	            <li><hr class="dropdown-divider"></li>
	            <li><a class="dropdown-item" href="#">Something else here</a></li>
	          </ul>
        </li>
	    </ul>
	  </div>
	</nav>
	<!-- 네비게이션 영역 끝 -->
```

## gallery.jsp

헤더를 include한다: `<%@include file="header.jsp" %>`

gallery.jsp 파일 = header.jsp 파일 + gallery.jsp 파일, 이런 느낌.

```jsp
<%@ page language="java" contentType="text/html; charset=EUC-KR"
    pageEncoding="EUC-KR"%>
 <%@include file="header.jsp" %>
	<div class="container" style="margin-top:100px">
		<h2>갤러리</h2>
		<div id="images">
			<div class="container-fluid grid text-center" style="columns: 3;">
				<div><img src="img/1.jpg" class="img-thumbnail"></div>
				<div><img src="img/2.jpg" class="img-thumbnail"></div>
				<div><img src="img/3.jpg" class="img-thumbnail"></div>
				<div><img src="img/4.jpg" class="img-thumbnail"></div>
				<div><img src="img/5.jpg" class="img-thumbnail"></div>
				<div><img src="img/6.jpg" class="img-thumbnail"></div>
				<div><img src="img/7.jpg" class="img-thumbnail"></div>
				<div><img src="img/7.jpg" class="img-thumbnail"></div>
				<div><img src="img/7.jpg" class="img-thumbnail"></div>
			</div>
		</div> <!-- id:images 끝  -->
		<div id="forms">
			<form>
				<div class="mb-3">
				  <label for="exampleFormControlInput1" class="form-label">Email address</label>
				  <input type="email" class="form-control" id="exampleFormControlInput1" placeholder="name@example.com">
				</div>
				<div class="mb-3">
				  <label for="exampleFormControlTextarea1" class="form-label">Example textarea</label>
				  <textarea class="form-control" id="exampleFormControlTextarea1" rows="3"></textarea>
				</div>
				<label for="inputPassword5" class="form-label">Password</label>
				<input type="password" id="inputPassword5" class="form-control" aria-describedby="passwordHelpBlock">
				<div id="passwordHelpBlock" class="form-text">
				  Your password must be 8-20 characters long, contain letters and numbers, and must not contain spaces, special characters, or emoji.
				</div>
				<div class="row g-3 align-items-center">
				  	<div class="col-auto">
				    <label for="inputPassword6" class="col-form-label">Password</label>
				  </div>
				  <div class="col-auto">
				    <input type="password" id="inputPassword6" class="form-control" aria-describedby="passwordHelpInline">
				  </div>
				  <div class="col-auto">
				    <span id="passwordHelpInline" class="form-text">
				      Must be 8-20 characters long.
				    </span>
				  </div>
				</div>
				<input class="form-control" type="text" placeholder="Disabled input" aria-label="Disabled input example" disabled>
				<input class="form-control" type="text" value="Disabled readonly input" aria-label="Disabled input example" disabled readonly>
				<div class="mb-3 row">
			    <label for="staticEmail" class="col-sm-2 col-form-label">Email</label>
			    <div class="col-sm-10">
			      <input type="text" readonly class="form-control-plaintext" id="staticEmail" value="email@example.com">
			    </div>
			  </div>
			  <div class="mb-3 row">
			    <label for="inputPassword" class="col-sm-2 col-form-label">Password</label>
			    <div class="col-sm-10">
			      <input type="password" class="form-control" id="inputPassword">
			    </div>
			  </div>EmailPasswordConfirm identityHTML

			  <div class="col-auto">
			    <label for="staticEmail2" class="visually-hidden">Email</label>
			    <input type="text" readonly class="form-control-plaintext" id="staticEmail2" value="email@example.com">
			  </div>
			  <div class="col-auto">
			    <label for="inputPassword2" class="visually-hidden">Password</label>
			    <input type="password" class="form-control" id="inputPassword2" placeholder="Password">
			  </div>
			  <div class="col-auto">
			    <button type="submit" class="btn btn-primary mb-3">Confirm identity</button>
			  </div>

			  <div class="mb-3">
				  <label for="formFile" class="form-label">Default file input example</label>
				  <input class="form-control" type="file" id="formFile">
				</div>
				<div class="mb-3">
				  <label for="formFileMultiple" class="form-label">Multiple files input example</label>
				  <input class="form-control" type="file" id="formFileMultiple" multiple>
				</div>
				<div class="mb-3">
				  <label for="formFileDisabled" class="form-label">Disabled file input example</label>
				  <input class="form-control" type="file" id="formFileDisabled" disabled>
				</div>
				<div class="mb-3">
				  <label for="formFileSm" class="form-label">Small file input example</label>
				  <input class="form-control form-control-sm" id="formFileSm" type="file">
				</div>
				<div>
				  <label for="formFileLg" class="form-label">Large file input example</label>
				  <input class="form-control form-control-lg" id="formFileLg" type="file">
				</div>

				<label for="exampleColorInput" class="form-label">Color picker</label>
				<input type="color" class="form-control form-control-color" id="exampleColorInput" value="#563d7c" title="Choose your color">

				<label for="exampleDataList" class="form-label">Datalist example</label>
				<input class="form-control" list="datalistOptions" id="exampleDataList" placeholder="Type to search...">
				<datalist id="datalistOptions">
				  <option value="San Francisco">
				  <option value="New York">
				  <option value="Seattle">
				  <option value="Los Angeles">
				  <option value="Chicago">
				</datalist>

			</form>
		</div> <!-- forms끝 -->

	</div><!-- container 끝 -->
</body>
</html>
```

![](/images/posts/bootstrap-first-look/02.png)

## boardList.jsp

여기는 부트스트랩의 테이블 클래스를 가져와서 테이블 스타일을 적용했다.

```jsp
<%@ page language="java" contentType="text/html; charset=EUC-KR"
    pageEncoding="EUC-KR"%>
 <%@include file="header.jsp" %>
	<div class="container mt-5">
		<div class="row">
			<h2>보드 리스트</h2>
			<table class="table table-hover ">
				<thead class="table-warning">
					<tr>
						<th>번호</th>
						<th>제목</th>
						<th>작성자</th>
						<th>날짜</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>1</td>
						<td>CSS3부트스트랩 기초</td>
						<td class="table-active">하잉</td>
						<td>2024/02/13</td>
					</tr>
					<tr>
						<td>2</td>
						<td>우왕 신기하당</td>
						<td>수영2</td>
						<td>2024/02/15</td>
					</tr>
					<tr>
						<td>3</td>
						<td class="table-active">편하당....</td>
						<td>수영3</td>
						<td>2024/02/16</td>
					</tr>
					<tr>
						<td>4</td>
						<td class="table-active">AI야 이제 자동으로 해줄 때가 되지 않았니</td>
						<td>수영4</td>
						<td>2024/02/17</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</body>
</html>
```

![](/images/posts/bootstrap-first-look/03.png)
