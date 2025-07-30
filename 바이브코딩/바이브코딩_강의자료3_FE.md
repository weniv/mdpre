
{center}
프론트엔드
{/center}

---

여러분이 웹 서비스에서 보는 화면, 그것이 프론트엔드 입니다.

---

바이브 코딩에서 기술 선택 없이 웹 페이지를 그냥 만들어달라고 하면 여러분이 수정도 할 수 없는 어려운 기술을 가져와서 만들 수도 있습니다. 따라서 여러분이 어떠한 기술을 선택했는지 명확히 알려주셔야 합니다.

---

그렇기에 가볍게 여러 기술에 대해 맛을 보는 과정으로 설계 되어 있습니다.

---

로또 번호 바꾸기 실습

* 재미로 하는 것 아니고, 실제로 여러분이 쓰셔야 하는 기능입니다.
* HTML, CSS, JavaScript, 개발자 도구에 대한 강의는 강의 쿠폰이 지급 됩니다.
* 가볍게 2배속으로 한 번 보는 것만으로도 큰 도움이 되실 겁니다. 심도있게 하지 않으셔도 됩니다.

---

Front-end 구성요소

* HTML: 구조
* CSS: 디자인
* JavaScript: 동작

![HTML, CSS, JavaScript](https://www.books.weniv.co.kr/images/basecamp-html-css/chapter01/01-5.gif)

---

# HTML

```html
<!-- 이 글자는 문서에 나타나지 않습니다. 주석이라 합니다. -->
<h1>안녕하세요.</h1>
<p>이것은 HTML 문서입니다.</p>
```

---

# CSS

```html
<style>
h1 {
    color: blue;
}
</style>
```

---

# JavaScript

```html
<script>
alert("안녕하세요!!");
</script>
```

---

# HTML 구조

* .html 문서를 만드신 후 !키를 입력하고 tap키를 누르면 기본 구조가 자동으로 생성됩니다.

```html
<!DOCTYPE html>
<html>
<head>
    <title>문서 제목</title>
    <style>
        h1 {
            color: blue;
        }
    </style>
</head>
<body>
    <h1>문서 제목</h1>
    <p>문서 내용</p>
    <script>
        alert("안녕하세요!!");
    </script>
</body>
</html>
```

---

# 이미지 추가

* 요구사항 명세 작성할 때에도 필요한 이미지는 여러분이 수집을 하셔야 합니다. 그렇지 않으면 AI로 랜덤한 이미지 넣을 예정입니다.

```html
<img src="경로명" alt="이미지 설명">
```

---

# 영상 추가

* 유튜브 영상은 가져오고 싶은 유튜브 영상에서 마우스 오른쪽 클릭해서 `소스코드복사`를 선택합니다. 그러면 아래와 같은 코드가 복사됩니다. 원하시는 곳에 붙여넣기 하시면 됩니다.

```md
<iframe width="560" ...생략... allowfullscreen></iframe>
```

---

# 바이브 코딩 Front-end기술 선택 - 1

* 선택을 하셔야 프롬프트로 '이런 기술로 만들어줘'라고 요청할 수 있습니다.

---

# 바이브 코딩 Front-end기술 선택 - 2

아래 기술을 익히실 필요는 없고, 'OO를 사용해서 만들어줘' 또는 'OO스타일로 만들어줘.'라고 하시면 됩니다. 어떤 UI들인지는 뒤에서 잠시 살펴봅니다. 마음에 드시는 것 메모해두세요.

* HTML/CSS/JavaScript: 기본입니다. 여러분이 명령하지 않으셔도 기본으로 사용됩니다.
* (추천) Tailwind CSS: 유틸리티 기반 CSS 프레임워크
* (권하진 않습니다) Bootstrap: 빠른 프로토타이핑, 반응형 디자인 지원
* (기술은 어려우니 스타일만 배낍니다) Chadcn UI: React 기반 컴포넌트 라이브러리


---

잘 모르시겠다면 "애플과 같은 스타일로 만들어줘", "인스타그램과 같은 스타일로 만들어줘", "에어비엔비와 같은 스타일로 만들어줘"라고 하시면 됩니다. 이미 유명한 서비스의 코드는 AI에게 학습되어 있습니다.

---

# 바이브 코딩 Front-end기술 선택 - 3

* 초급자가 하기 어려운 기술
    * React: 컴포넌트 기반, 재사용성 높음
    * Vue.js: 학습 곡선이 다른 것보다는 완만
    * Next.js: React 기반 풀스택 프레임워크
    * TypeScript: JavaScript의 상위 집합, 타입 안정성 제공

---

tailwind css 스타일 보기

* 링크: https://tailwindcss.com/plus/templates?ref=sidebar

---

bootstrap css 스타일 보기

* 링크: https://themes.getbootstrap.com/

---

chadcn ui 스타일 보기
* 주의: Chadcn UI는 React 기반입니다. 하지만 React는 초급자가 하기 어려우니 'HTML, CSS, Vanilla JavaScript로 chadcn ui 스타일로 만들어줘'라고 하시면 됩니다. 유명한 UI 라이브러리라서 이미 Claude나 Gemini에 학습이 되어 있습니다.

* 링크: https://ui.shadcn.com/