---
title: "Spring: 호텔 등록하기 기능 구현하기"
date: 2024-04-20
summary: 테이블과 DTO, MyBatis 매퍼, 등록 폼, DAO, 컨트롤러까지 이미지 업로드가 있는 호텔 등록 기능 만들기
tags: [Spring, MyBatis]
---

| 항목 | 버전 |
| --- | --- |
| 자바 | Java 11 |
| 오라클 | Oracle 11g |
| 톰캣 | Apache Tomcat 8 |
| IDE | STS3 |
| DB 툴 | SQLGate |

## 1. 테이블 만들기

![](/images/posts/spring-hotel-create/01.png)

`THTNAME`이 `VARCHAR2(50 BYTE)`라서 한글은 16자 정도밖에 안 들어간다. 폼에서는 최대 100자까지 받으니, 길게 넣으면 insert에서 에러가 난다. 컬럼을 `VARCHAR2(300 BYTE)`나 `VARCHAR2(100 CHAR)`로 늘려 두는 게 안전하다.

## 2. DTO 만들기

```java
public class TodayHtDTO {
	private int tHtNum;
	private String tHtName;
	private int tHtGrade;
	private int tHtPrice;
	private String tHtImg;
	private String tHtWrtDt;
	private MultipartFile mfile;

	public int gettHtNum() {
		return tHtNum;
	}
	public void settHtNum(int tHtNum) {
		this.tHtNum = tHtNum;
	}
	public String gettHtName() {
		return tHtName;
	}
	public void settHtName(String tHtName) {
		this.tHtName = tHtName;
	}
	public int gettHtGrade() {
		return tHtGrade;
	}
	public void settHtGrade(int tHtGrade) {
		this.tHtGrade = tHtGrade;
	}
	public int gettHtPrice() {
		return tHtPrice;
	}
	public void settHtPrice(int tHtPrice) {
		this.tHtPrice = tHtPrice;
	}
	public String gettHtImg() {
		return tHtImg;
	}
	public void settHtImg(String tHtImg) {
		this.tHtImg = tHtImg;
	}
	public String gettHtWrtDt() {
		return tHtWrtDt;
	}
	public void settHtWrtDt(String tHtWrtDt) {
		this.tHtWrtDt = tHtWrtDt;
	}
	public MultipartFile getMfile() {
		return mfile;
	}
	public void setMfile(MultipartFile mfile) {
		this.mfile = mfile;
	}
}
```

업로드한 파일은 `MultipartFile mfile`로 받고, DB에는 파일 이름(`tHtImg`)만 저장한다.

## 3. Config 설정, Mapper 만들기

MyBatis 설정에서 DTO에 `thtvo`라는 별칭을 붙인다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE configuration
	PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
	"https://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
	<typeAliases>
		<typeAlias type="kr.co.ictedu.mvc.dto.TodayHtDTO" alias="thtvo"/>
	</typeAliases>
</configuration>
```

매퍼에는 등록, 목록, 상세, 삭제, 수정 쿼리를 미리 다 만들어 뒀다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="thtvo">
	<insert id="add" parameterType="thtvo">
		insert into todayHotel (tHtNum, tHtName, tHtGrade, tHtPrice, tHtImg, tHtWrtDt)
		values(todayHotel_seq.NEXTVAL, #{tHtName}, #{tHtGrade}, #{tHtPrice}, #{tHtImg}, sysdate)
	</insert>

	<select id="list" resultType="thtvo">
		select * from todayHotel order by 1 desc
	</select>

	<select id="detail" parameterType="int" resultType="thtvo">
		select tHtNum, tHtName, tHtGrade, tHtPrice, tHtImg from todayHotel where tHtNum=#{tHtNum}
	</select>

	<delete id="del" parameterType="int">
		delete from todayHotel where tHtNum=#{tHtNum}
	</delete>

	<update id="up" parameterType="thtvo">
		update todayHotel
		set tHtName=#{tHtName}, tHtGrade=#{tHtGrade}, tHtPrice=#{tHtPrice}, tHtImg=#{tHtImg}, tHtWrtDt=sysdate
		where tHtNum=#{tHtNum}
	</update>
</mapper>
```

## 4. 등록 폼 만들기

파일을 같이 보내야 하니 form에 `enctype="multipart/form-data"`를 꼭 넣는다. 파일을 고르면 `FileReader`로 미리보기 이미지를 바꿔 준다.

```jsp
<article>
<div class="masthead">
<h2 class="">오늘 뜨는 호텔 업로드</h2>
<ul class="list-unstyled">
    <li class="border-top my-3"></li>
</ul>
<%-- UI시작 --%>
<div class="container position-relative">
<div class="row justify-content-center">
<div class="col-xl-6">
<form action="todayHtInsert" method="post" id="todayHtInsert" class="form-subscribe"
    enctype="multipart/form-data">
    <div class="text-left">
        <div class="col">
            <label for="tHtName"><p>호텔이름</p></label> <input type="text"
                class="form-control form-control mb-1"  id="tHtName" placeholder="호텔이름(5-100)"
                name="tHtName" maxlength="100" required="required"
                pattern=".{5,100}">
        </div>
        <div class="col">
            <label for="tHtGrade"><p>호텔별점</p></label> <input type="number"
                class="form-control form-control mb-1"  id="tHtGrade" name="tHtGrade"
                placeholder="0점 ~ 5점" min="0" max="5" required="required">
        </div>
        <div class="col">
            <label for="tHtPrice"><p>호텔가격</p></label> <input type="number"
                class="form-control form-control mb-1"  id="tHtPrice" name="tHtPrice"
                placeholder="1박 가격" required="required">
        </div>
        <div class="col">
            <label for="mfile"><p>이미지</p></label>
            <div class="col-sm-10">
                <input type="file" class="form-control form-control mb-1" id="mfile" name="mfile">
            </div>
            <div class="col-sm-10">
                <%-- 이미지 미리보기 --%>
                <img src="${rPath}/image/noimage.jpg" id="imgx"
                    style="width: 150px; border: dotted 1px; margin: 5px 5px">
            </div>
        </div>
    </div>
    <div class="text-center">
        <div class="form-group">
            <button type="submit" class="btn btn-outline-success">등록</button>
            <button type="button" class="btn btn-outline-secondary"	onclick="location='main'">목록</button>
        </div>
    </div>
</form>
</div>
</div>
</div>
</div>
</article>
<%-- UI끝 --%>
<script>
	function readURL(input) {
		if (input.files && input.files[0]) {
			console.log("파일 업로드 동작!")
			var reader = new FileReader();
			reader.onload = function(e) {
				console.log("이벤트 발생:" + e.target.result);
				$('#imgx').attr('src', e.target.result);
			}
			reader.readAsDataURL(input.files[0]);
		}
	}
	$(function() {
		$('#mfile').change(function() {
			console.log("파일에 변화가 생겼습니다.");
			console.log("객체 this는 file Tag.val()" + $(this).val());
			readURL(this);
		});
	});
</script>
```

## 5. DAO 인터페이스 만들기

```java
public interface TodayHtDaoInter {
	void addTodayHt(TodayHtDTO vo);          // 등록
	List<TodayHtDTO> listTodayHt();          // 목록
	TodayHtDTO detailTodayHt(int tHtNum);    // 상세 보기 및 수정
	void deleteTodayHt(int tHtNum);          // 삭제
	void updateTodayHt(TodayHtDTO vo);       // 수정
}
```

## 6. 인터페이스를 구현한 DAO 만들기

```java
@Repository
public class TodayHt implements TodayHtDaoInter {
	@Autowired
	private SqlSessionTemplate ss;

	@Override
	public void addTodayHt(TodayHtDTO vo) {
		ss.insert("thtvo.add", vo);
	}

	@Override
	public List<TodayHtDTO> listTodayHt() {
		return ss.selectList("thtvo.list");
	}

	@Override
	public TodayHtDTO detailTodayHt(int tHtNum) {
		return ss.selectOne("thtvo.detail", tHtNum);
	}

	@Override
	public void deleteTodayHt(int tHtNum) {
		ss.delete("thtvo.del", tHtNum);
	}

	@Override
	public void updateTodayHt(TodayHtDTO vo) {
		ss.update("thtvo.up", vo);
	}
}
```

## 7. 컨트롤러 만들기

```java
// 세션에 "pageType" 속성을 저장해서 현재 페이지 유형을 유지한다.
@SessionAttributes("pageType")
@Controller
public class AdminController {

	@Autowired
	private TodayHtDaoInter todayHtDaoInter;

	// 메인: 호텔 목록을 가져와 모델에 담는다.
	@GetMapping("/main")
	public String adminDefaultPage(Model model) {
		List<TodayHtDTO> thtlist = todayHtDaoInter.listTodayHt();
		model.addAttribute("thtlist", thtlist);
		for (TodayHtDTO e : thtlist) {
			System.out.println("tHtNum: " + e.gettHtNum());
			System.out.println("thtName: " + e.gettHtName());
			System.out.println("thtGrade: " + e.gettHtGrade());
			System.out.println("thtPrice: " + e.gettHtPrice());
		}
		model.addAttribute("pageType", "todayHtList");
		return "admin/index";
	}

	// 등록 폼 보여 주기
	@GetMapping("/todayHtWrite")
	public String todayHtForm(Model m) {
		return "hotel/admThtWrite";
	}

	@PostMapping("/todayHtInsert")
	public String todayHtInsert(Model m, TodayHtDTO vo, HttpServletRequest request) {
		MultipartFile mf = vo.getMfile();
		String oriFn = mf.getOriginalFilename();
		// 파일 이름이 있으면 파일이 업로드된 것
		if (oriFn != null && oriFn.length() > 0) {
			// 저장할 폴더: 웹 애플리케이션 경로/resources/imgfile
			String rPath = request.getSession().getServletContext().getRealPath("/");
			File dir = new File(rPath, "resources/imgfile");
			if (!dir.exists()) {
				dir.mkdirs(); // 폴더가 없으면 만든다
			}
			File f = new File(dir, oriFn);
			try {
				mf.transferTo(f); // 업로드한 파일을 실제 경로로 복사
			} catch (IllegalStateException | IOException e) {
				e.printStackTrace();
			}
			vo.settHtImg(oriFn); // DB에는 파일 이름만 저장
		}
		todayHtDaoInter.addTodayHt(vo);
		return "redirect:main";
	}
}
```

처음에는 파일 경로 전체에 `mkdirs()`를 호출했는데, 그러면 파일 이름으로 된 **폴더**가 생겨서 `transferTo`가 실패한다. 폴더를 먼저 만들고 그 안에 파일을 만들어야 한다.

### 컨트롤러 동작 과정

1. 클라이언트에서 HTTP 요청이 들어온다.
2. 스프링 MVC가 `@Controller`가 붙은 클래스 중에서 요청을 처리할 컨트롤러를 찾는다.
3. 그 안에서 `@GetMapping`, `@PostMapping` 등으로 요청 경로에 매핑된 메서드를 찾는다.
4. 메서드가 실행돼서 필요한 데이터를 받고, 비즈니스 로직을 수행하고, 결과를 반환한다.
5. 스프링 MVC가 반환된 결과를 뷰로 넘겨서 클라이언트에게 보낼 응답을 만든다.

## 8. 실행 결과

![](/images/posts/spring-hotel-create/02.png)

![](/images/posts/spring-hotel-create/03.png)

## 어노테이션 정리

- `@Repository`: DB나 파일 같은 외부 I/O 작업을 처리하는 클래스에 붙인다. `@Service`와 마찬가지로 해당 클래스를 루트 컨테이너에 빈(Bean)으로 등록한다.
- `@Controller`: 핸들러가 스캔할 수 있는 빈이 되어 서블릿 컨테이너에 생성된다.
- `@Override`: 부모 클래스의 메서드를 재정의했다는 걸 명시적으로 표시한다.

    ```java
    public class AnnotationChild extends AnnotationParent {
        // 부모 클래스의 메서드를 재정의했다고 표시
        @Override
        public int annotationParentMethod(int num1, int num2) {
            System.out.print("num1 + num2 : ");
            return num1 + num2;
        }
    }
    ```

- `@Autowired`: 필요한 의존 객체의 타입에 맞는 빈을 찾아서 주입한다(생성자, setter, 필드).
- `@SessionAttribute`(s 없음): 컨트롤러 밖(인터셉터, 필터 등)에서 만든 세션 데이터에 접근할 때 쓴다. 위 컨트롤러에 붙인 `@SessionAttributes`와는 다르다.

| 어노테이션 | 설명 |
| --- | --- |
| @Controller | 이 클래스가 컨트롤러임을 나타낸다. |
| @RequestMapping | 요청을 어떤 컨트롤러의 어떤 메서드가 처리할지 매핑한다. |
| @RequestParam | 웹 요청 파라미터를 컨트롤러 메서드의 파라미터에 매핑한다. |
| @ModelAttribute | 메서드 파라미터나 반환값을 Model 객체와 바인딩한다. |
| @SessionAttributes | Model 객체를 세션에 저장해서 쓴다. |
| @RequestPart | multipart 요청에서 파트를 파라미터에 매핑한다. (Spring 3.1부터) |
| @ControllerAdvice | 여러 컨트롤러에서 쓰는 공통 기능을 모아서 전역으로 적용한다. (Spring 3.2부터) |
