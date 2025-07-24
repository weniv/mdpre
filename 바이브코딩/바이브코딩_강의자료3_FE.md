
{center}
프론트 엔드
{/center}

---

여러분이 보는 화면, 그것이 프론트 엔드 입니다.

---

# URL과 IP 기초 개념

## URL (Uniform Resource Locator)
* 웹사이트의 주소를 사람이 이해하기 쉽게 표현한 것
* 예: www.google.com, www.naver.com

## IP (Internet Protocol)
* 컴퓨터가 실제로 이해하는 숫자로 된 주소
* 예: 172.217.25.110 (구글의 IP 주소 중 하나)

## 둘의 관계
* URL을 입력하면 > DNS가 IP 주소로 변환 > 해당 서버에 접속
* 사람은 URL 사용, 컴퓨터는 IP 사용

---

Front-end 구성요소

* HTML: 구조/뼈대
* CSS: 디자인/스타일링
* JavaScript: 동작/상호작용

---

![HTML, CSS, JavaScript](https://www.books.weniv.co.kr/images/basecamp-html-css/chapter01/01-5.gif)

---

로또 번호 바꾸기 실습

* 재미로 하는 것 아니고, 실제로 여러분이 쓰셔야 하는 기능입니다.
* HTML, CSS, JavaScript, 개발자 도구에 대한 강의는 강의 쿠폰을 지급이 됩니다.
* 다만 그렇게 심도 있게 배울필요가 있는지는 한 번 고민해주세요.
* elements, console, application, network 탭을 주로 사용합니다.

---

# HTML

```html
<h1>안녕하세요.</h1>
<p>이것은 HTML 문서입니다.</p>
```

---

# CSS

```css
<style>
h1 {
    color: blue;
}
</style>
```

---

# JavaScript

```javascript
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

```html
<img src="경로명" alt="이미지 설명">
```

---

# 바이브 코딩 기술 선택
* (추천) HTML/CSS/JavaScript: 기본기 중요, 모든 프레임워크의 기초
* (추천) Tailwind CSS: 유틸리티 기반 CSS 프레임워크
* (어려운 것은 아님) Bootstrap: 빠른 프로토타이핑, 반응형 디자인 지원
* (초급자가 하기 어려움 난이도 2) React: 컴포넌트 기반, 재사용성 높음
* (초급자가 하기 어려움 난이도 1) Vue.js: 학습 곡선 완만, 한국에서 인기
* (초급자가 하기 매우 어려움) Next.js: React 기반 풀스택 프레임워크
* (초급자가 하기 매우 어려움) TypeScript: JavaScript의 상위 집합, 타입 안정성 제공

---

기술 선택하신 후 프롬프트에서 
"OOOO 주제로 웹 서비스를 제작할거야. HTML, CSS, JavaScript와 Tailwind CSS를 사용해서 만들어줘."라고 입력하면 됩니다.
(물론 주제에 대해서는 더 자세하게 설명해야겠죠.)

---

(여러분이 하는 실습은 아닙니다. 이런 것이구나 하는 정도로 이해해주세요.)
tailwind css 경험해보기

---

(여러분이 하는 실습은 아닙니다. 이런 것이구나 하는 정도로 이해해주세요.)
bootstrap 경험해보기