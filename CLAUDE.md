# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 코드 작업을 할 때 가이드를 제공합니다.

## 프로젝트 개요

WENIV Presenter는 Marp의 대안으로 제작된 GitHub Pages 기반 마크다운 프레젠테이션 웹 서비스입니다. 바닐라 JavaScript, Tailwind CSS, 그리고 다양한 외부 라이브러리를 사용하여 마크다운 파일을 프레젠테이션으로 렌더링하는 정적 웹 애플리케이션입니다.

## 개발 명령어

### 로컬 개발
- **개발 서버 시작**: `npm run dev` 또는 `npm start` - localhost:8080에서 Python HTTP 서버 시작
- **빌드**: `npm run build` - 정적 사이트이므로 빌드 과정 불필요
- **배포**: `npm run deploy` - gh-pages를 사용하여 GitHub Pages에 배포

### 대안 개발 방법
- **VSCode Live Server**: Live Server 확장 프로그램을 사용한 개발
- **Python 서버**: `python -m http.server 8080 --bind localhost`
- **Node.js**: 모든 HTTP 서버로 정적 파일 제공 가능

## 아키텍처

### 핵심 컴포넌트
- **GitHubMarkdownPresenter 클래스** (`assets/js/app.js`): 다음 기능을 담당하는 메인 애플리케이션 컨트롤러:
  - 슬라이드 렌더링 및 네비게이션
  - 저장소 콘텐츠를 위한 GitHub API 연동
  - 로컬 파일 업로드 처리
  - 테마 관리 및 설정
  - 키보드 네비게이션 및 전체화면 모드
  - PDF 내보내기 기능

### 주요 기능
- **다중 소스 콘텐츠 로딩**: GitHub 저장소, 로컬 파일, 직접 마크다운 입력
- **커스텀 마크다운 문법**: 프레젠테이션 전용 포맷팅을 위한 확장 문법 (`{center}`, `{xlarge}`, `{highlight}` 등)
- **폰트 관리**: `/font/` 디렉토리에서 커스텀 폰트 로딩을 통한 한글 폰트 지원
- **테마 시스템**: CSS 커스텀 속성을 사용한 라이트/다크 테마
- **반응형 디자인**: 모바일 친화적 프레젠테이션 인터페이스

### 파일 구조
- `/index.html` - 완전한 UI가 포함된 메인 애플리케이션 진입점
- `/assets/js/app.js` - 핵심 애플리케이션 로직 (GitHubMarkdownPresenter 클래스)
- `/assets/css/style.css` - 커스텀 스타일 및 테마 정의
- `/font/` - 한글 폰트 파일들 (배민 폰트, 마루부리)
- `/assets/images/` - 정적 자산 (파비콘, OG 이미지)
- 프레젠테이션 콘텐츠 폴더들 (예: `25_07_계절학기/`, `25_07_전주교육청연수/`)

### 외부 종속성
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크 (CDN)
- **Marked.js**: 마크다운 파싱 (CDN)
- **Prism.js**: 코드 문법 강조 (CDN)
- **KaTeX**: LaTeX 수학 표현식 렌더링 (CDN)
- **GitHub REST API**: 저장소 콘텐츠 접근용

## 개발 가이드라인

### 새로운 기능 추가
- `app.js`의 `GitHubMarkdownPresenter` 클래스 확장
- `bindEvents()` 메서드의 기존 이벤트 바인딩 패턴 따르기
- `style.css`에서 테마용 CSS 커스텀 속성 사용
- Tailwind 유틸리티로 모바일 반응성 유지

### 마크다운 콘텐츠 작업
- 슬라이드는 `---` 또는 `##` 헤더로 구분
- 커스텀 문법은 `processCustomMarkdown()` 메서드에서 처리
- 로고 감지는 `logo.{png,jpg,jpeg,svg,gif}` 파일을 찾음
- 이미지는 마크다운 파일 위치를 기준으로 상대 경로 처리

### 프레젠테이션 폴더
저장소는 다음 패턴을 따르는 날짜별 폴더에 프레젠테이션 콘텐츠를 포함:
- `YY_MM_주제/` (예: `25_07_계절학기/`)
- 폴더명은 일정하지 않을 수 있음
- 각 폴더는 마크다운 파일과 관련 이미지 포함
- 로고 파일은 마크다운 파일과 같은 디렉토리에 배치

### 폰트 관리
- 한글 폰트는 `/font/` 디렉토리에서 로드
- 폰트 선택은 설정 드롭다운을 통해 관리
- 폰트 패밀리는 웹 안전 폰트로 폴백과 함께 CSS에서 정의

### 코드 스타일 및 규칙
- **JavaScript**: ES6+ 클래스 기반 구조
- **CSS**: CSS Grid/Flexbox 레이아웃
- **마크다운 구문**: `---`로 슬라이드 구분
- **커스텀 구문**:
  - `{center}텍스트{/center}` - 중앙 정렬
  - `{large}텍스트{/large}` - 큰 텍스트 (무시됨)
  - `{small}텍스트{/small}` - 작은 텍스트
  - `{xlarge}텍스트{/xlarge}` - 매우 큰 텍스트
  - `{highlight}텍스트{/highlight}` - 하이라이트
  - `{bold}텍스트{/bold}` - 굵은 텍스트
  - `**텍스트**` - 자동 하이라이트 효과
- **LaTeX 구문**:
  - `$수식$` - 인라인 수학 표현식
  - `$$수식$$` - 블록 수학 표현식