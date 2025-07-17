# WENIV Presenter

[WENIV](http://www.weniv.co.kr/)에서 개발한 GitHub Pages, Notion 기반의 마크다운 프레젠테이션 웹 서비스입니다. 해당 서비스는 Claude Code와 함께 개발되었습니다.

## 배포

URL: https://weniv.github.io/mdpre/

## 주요 기능

- **GitHub API 연동**: 리포지토리의 마크다운 파일을 자동으로 탐지하고 슬라이드로 변환
- **실시간 프레젠테이션**: 부드러운 슬라이드 전환과 키보드 단축키 지원
- **커스텀 텍스트 문법**: 텍스트 중앙정렬, 크기 조정, 강조 등 특별한 마크다운 문법 지원
- **LaTeX 수학 표현식**: KaTeX를 사용한 수학 공식 렌더링 지원
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 환경에서 최적화
- **다중 테마**: 기본, 다크, 학술용 테마 지원
- **향상된 전체화면 모드**: 완벽한 키보드 지원과 올바른 중앙 정렬
- **최적화된 뷰포트**: 스크롤 문제 해결 및 정확한 화면 맞춤
- **히스토리 기능**: 최근 사용한 리포지토리 자동 저장 및 빠른 접근
- **폰트 관리**: 한글 폰트 지원으로 프레젠테이션 품질 향상
- **마크다운 표준 강조**: `**텍스트**` 문법에 하이라이트 효과 추가

## 시작하기

### 로컬 개발 환경

이 프로젝트는 바닐라 JavaScript와 Tailwind CSS로 작성되었습니다. 따라서 라이브 서버나 Node.js 환경에서 쉽게 실행할 수 있습니다.

1. 리포지토리 클론
```bash
git clone https://github.com/weniv/mdpre.git
cd github-markdown-presenter
```

2. 로컬 서버 실행
```bash
# 1. VSCode Live Server 확장 사용

# 2. Python을 사용한 방법
python -m http.server 8080

# 3. Node.js가 설치된 경우
npm run dev
```

### GitHub Pages 배포

1. GitHub에 리포지토리 생성 및 코드 푸시
2. Repository Settings > Pages에서 Source를 "Deploy from a branch" 선택
3. Branch를 "main" 선택 후 Save
4. 배포된 URL로 접속

## 사용 방법

### 마크다운 슬라이드 작성

슬라이드는 `---`로 구분합니다.

```markdown
# 첫 번째 슬라이드
이것은 첫 번째 슬라이드입니다.

---

# 두 번째 슬라이드
- 리스트 아이템 1
- 리스트 아이템 2

---
```

코드 블록은 백틱 3개로 감싸고, 언어를 지정할 수 있습니다. 마크다운 문법과 같습니다.<br>
\`\`\`js<br>
console.log("Hello, World!");<br>
\`\`\`

### 커스텀 텍스트 문법

프레젠테이션에서 텍스트를 강조하고 스타일링하기 위한 특별한 문법을 지원합니다.

#### 텍스트 정렬 및 크기

```markdown
# 중앙 정렬
{center}이 텍스트는 중앙에 정렬됩니다{/center}

# 작은 텍스트 (필요시 사용)
{small}이 텍스트는 작게 표시됩니다 (2.5rem){/small}

# 매우 큰 텍스트  
{xlarge}이 텍스트는 매우 크게 표시됩니다 (4rem){/xlarge}

# 조합 사용
{center}
{xlarge}중앙 정렬된 큰 제목{/xlarge}
{/center}

# 마크다운 표준 강조 문법
**이 텍스트는 굵기와 함께 하이라이트됩니다**
```

#### 텍스트 강조

```markdown
# 마크다운 표준 강조 (권장)
**이 텍스트는 굵기와 하이라이트 효과가 함께 적용됩니다**

# 커스텀 강조 문법
{highlight}이 텍스트는 하이라이트됩니다{/highlight}

# 굵은 텍스트
{bold}이 텍스트는 굵게 표시됩니다{/bold}

# 인라인 조합
일반 텍스트 중에서 **마크다운 표준 강조** 또는 {highlight}커스텀 강조{/highlight}를 사용할 수 있습니다.
```

#### 실제 사용 예시

```markdown
---
{center}
# 프레젠테이션 시작
{xlarge}환영합니다!{/xlarge}
{/center}

---

## 주요 내용

**오늘 다룰 내용:**

- **중요한 개념 설명**
- **핵심 포인트 강조**
- 실제 예제 시연

---

{center}
{highlight}감사합니다!{/highlight}
질문이 있으시면 언제든 말씀해 주세요.
{/center}

---
```

#### 지원되는 커스텀 문법 목록

| 문법 | 설명 | 결과 |
|------|------|------|
| `{center}텍스트{/center}` | 텍스트/목록 중앙 정렬 | 중앙 정렬된 텍스트 |
| `**텍스트**` | 마크다운 강조 (권장) | **굵기 + 하이라이트** |
| `{small}텍스트{/small}` | 작은 텍스트 (2.5rem) | 작은 텍스트 |
| `{xlarge}텍스트{/xlarge}` | 매우 큰 텍스트 (4rem) | **매우 큰 텍스트** |
| `{highlight}텍스트{/highlight}` | 커스텀 하이라이트 | 🟢 강조된 텍스트 |
| `{bold}텍스트{/bold}` | 커스텀 굵은 텍스트 | **굵은 텍스트** |

### 🔢 LaTeX 수학 표현식

프레젠테이션에서 LaTeX 문법을 사용하여 수학 표현식을 렌더링할 수 있습니다:

#### 인라인 수학 표현식

```markdown
이것은 인라인 수학 표현식입니다: $E = mc^2$
```

#### 블록 수학 표현식

```markdown
이것은 블록 수학 표현식입니다:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

#### 수학 표현식 예시

```markdown
---
# 수학 공식 예제

인라인 수학: $ax^2 + bx + c = 0$의 해는 다음과 같습니다:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

분수와 극한:
$$
\lim_{n \to \infty} \frac{1}{n} = 0
$$

행렬:
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

---
```

#### 지원되는 LaTeX 문법

- **기본 연산**: `+`, `-`, `*`, `/`, `=`
- **분수**: `\frac{분자}{분모}`
- **첨자**: `x^2`, `x_i`
- **그리스 문자**: `\alpha`, `\beta`, `\gamma`, `\pi`, `\sigma` 등
- **함수**: `\sin`, `\cos`, `\tan`, `\log`, `\ln`, `\exp` 등
- **적분**: `\int`, `\sum`, `\prod`
- **극한**: `\lim`, `\infty`
- **행렬**: `\begin{matrix}...\end{matrix}`, `\begin{pmatrix}...\end{pmatrix}`
- **루트**: `\sqrt{x}`, `\sqrt[n]{x}`
- **기타**: `\pm`, `\mp`, `\cdot`, `\times`, `\div` 등

#### 주의사항

- 수학 표현식이 올바르게 렌더링되지 않는 경우 LaTeX 문법을 확인해주세요
- 복잡한 수학 표현식은 블록 형태(`$$...$$`)로 사용하는 것을 권장합니다
- PDF 내보내기 시에도 수학 표현식이 정상적으로 렌더링됩니다


### 로고 추가


프레젠테이션에 로고를 추가하려면 다음 이름 중 하나로 이미지 파일을 업로드하세요:

- `logo.png`
- `logo.jpg` 
- `logo.jpeg`
- `logo.svg`
- `logo.gif`

**GitHub 리포지토리 사용 시:**
- 마크다운 파일과 같은 폴더에 로고 파일을 배치
- 폴더를 지정하지 않은 경우 리포지토리 루트에 배치

**로컬 파일 사용 시:**
- 마크다운 파일과 함께 로고 파일을 선택하여 업로드

로고는 슬라이드 왼쪽 상단에 표시되며, 클릭하면 첫 번째 슬라이드로 이동합니다. 최대 크기는 64x64px로 제한되며, 비율을 유지하면서 자동으로 조정됩니다.

### 프레젠테이션 로드

1. GitHub 리포지토리 URL 입력
2. 폴더 접두사 지정 (선택사항)
   - 예: `slides`, `presentation`, `docs`
3. "프레젠테이션 로드" 버튼 클릭

### 키보드 단축키

프레젠테이션 모드에서 다음 키보드 단축키를 사용할 수 있습니다.

#### 슬라이드 네비게이션
- `←` (왼쪽 화살표): 이전 슬라이드로
- `→` (오른쪽 화살표): 다음 슬라이드로  
- `Space` (스페이스바): 다음 슬라이드로
- `Home`: 첫 번째 슬라이드로
- `End`: 마지막 슬라이드로

#### 스크롤 제어
- `↑` (위쪽 화살표): 페이지 위로 스크롤
- `↓` (아래쪽 화살표): 페이지 아래로 스크롤
  - **참고**: 전체 화면 모드에서도 정상 작동합니다

#### 전체 화면 제어
- `F11`: 전체화면 모드 토글
- `ESC`: 전체화면 모드 종료

> **팁**: 키보드 단축키를 사용하면 화면 하단에 잠깐 도움말이 표시됩니다.

## 테마

### 기본 테마
- 깔끔한 흰색 배경
- 블루 액센트 컬러
- 읽기 쉬운 타이포그래피

### 다크 테마
- 어두운 배경으로 눈의 피로 감소
- 높은 대비로 가독성 향상

### 학술용 테마
- 논문 발표에 적합한 디자인
- 보수적인 색상 조합
- 정돈된 레이아웃

## 기술 스택

- **프론트엔드**: Vanilla JavaScript + Tailwind CSS
- **마크다운 파서**: Marked.js
- **코드 하이라이팅**: Prism.js
- **수학 표현식**: KaTeX
- **API**: GitHub REST API
- **배포**: GitHub Pages

## 프로젝트 구조

```
github-markdown-presenter/
├── index.html              # 메인 HTML 파일
├── assets/
│   ├── css/
│   │   └── style.css       # 커스텀 CSS 스타일
│   └── js/
│       └── app.js          # 메인 JavaScript 애플리케이션
├── themes/                 # 테마 파일들 (향후 확장용)
├── components/             # 재사용 가능한 컴포넌트 (향후 확장용)
├── package.json           # 프로젝트 설정
└── README.md              # 프로젝트 문서
```

## 커스터마이징

### 테마 커스터마이징

`assets/css/style.css` 파일에서 CSS 변수를 수정하여 커스텀 테마를 만들 수 있습니다.

```css
.theme-custom {
    --bg-primary: #your-color;
    --bg-secondary: #your-color;
    --text-primary: #your-color;
    --text-secondary: #your-color;
    --border-color: #your-color;
    --accent-color: #your-color;
}
```

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 버전 히스토리

### v3.0 주요 업데이트
- **기본 폰트 크기 확대**: 프레젠테이션에 적합하도록 기본 폰트를 3rem으로 확대
- **마크다운 표준 강조**: `**텍스트**` 문법에 하이라이트 효과 추가 (형광펜 효과)
- **{large} 문법 제거**: 기본 폰트가 커져서 더 이상 필요 없음
- **{center} 목록 중앙정렬**: `{center}` 블록 내 목록(ul, ol)도 완벽하게 중앙정렬
- **{small} 문법 추가**: 필요시 작은 폰트(2.5rem) 사용 가능

### v2.0 주요 업데이트
- **전체 화면 모드 키보드 이벤트 수정**: 전체 화면에서 화살표 위/아래 키가 정상적으로 작동
- **커스텀 텍스트 문법 추가**: `{center}`, `{xlarge}`, `{highlight}`, `{bold}` 문법 지원
- **페이지 스크롤 문제 해결**: 뷰포트에 맞는 정확한 레이아웃 구현
- **콘텐츠 중앙 정렬 개선**: 네비게이션 바를 고려한 완벽한 중앙 정렬
- **성능 최적화**: 불필요한 스크롤 제거 및 키보드 네비게이션 안정성 개선

## 문제해결

### 키보드 단축키가 작동하지 않는 경우
1. 프레젠테이션이 로드되었는지 확인
2. 브라우저 포커스가 페이지에 있는지 확인
3. F5를 눌러 페이지를 새로고침

### 전체 화면 모드에서 스크롤이 안 되는 경우
- 화살표 위/아래 키(`↑` `↓`)를 사용하세요
- 마우스 휠로도 스크롤 가능합니다

### 커스텀 문법이 적용되지 않는 경우
- 문법이 올바른지 확인: `{center}텍스트{/center}`
- 여는 태그와 닫는 태그가 모두 있는지 확인
- 대소문자를 정확히 입력했는지 확인

## 이슈 및 피드백

버그 리포트나 기능 요청은 다음 채널을 이용해 주세요.

- 이메일: paul-lab@naver.com
- 디스코드: https://discord.gg/MASRTmyu8a

## 감사의 말

- [Marked.js](https://marked.js.org/) - 마크다운 파싱
- [Prism.js](https://prismjs.com/) - 코드 문법 강조
- [KaTeX](https://katex.org/) - 수학 표현식 렌더링
- [Tailwind CSS](https://tailwindcss.com/) - 유틸리티 CSS 프레임워크
- [GitHub API](https://docs.github.com/en/rest) - 리포지토리 데이터 접근