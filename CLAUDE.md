# CLAUDE.md - 프로젝트 가이드

## 프로젝트 개요
- **이름**: GitHub Pages 기반 마크다운 프레젠테이션 웹 서비스 (WENIV Presenter)
- **타입**: 정적 웹사이트 (Static Site)
- **목적**: 마크다운 파일을 슬라이드 프레젠테이션으로 변환하여 보여주는 웹 서비스

## 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: TailwindCSS (CDN)
- **Markdown Parser**: Marked.js
- **Syntax Highlighting**: Prism.js
- **Hosting**: GitHub Pages
- **Dependencies**: 없음 (모든 라이브러리 CDN 사용)

## 프로젝트 구조
```
/
├── assets/
│   ├── css/
│   │   └── style.css          # 메인 스타일시트
│   ├── images/
│   │   └── fav.svg           # 파비콘
│   └── js/
│       └── app.js            # 메인 JavaScript 애플리케이션
├── font/                     # 웹폰트 파일들
│   ├── BMJUA_ttf.ttf
│   ├── BMHANNAAir_ttf.ttf
│   └── ... (기타 폰트 파일들)
├── 25_07_계절학기/           # 샘플 프레젠테이션 폴더
├── 25_07_전주교육청연수/     # 샘플 프레젠테이션 폴더
├── dev/                      # 개발 관련 문서
├── index.html               # 메인 HTML 페이지
├── package.json            # 프로젝트 설정
├── README.md               # 프로젝트 문서
└── LICENSE                 # 라이센스 파일
```

## 명령어
```bash
# 개발 서버 시작
npm run dev
# 또는
npm start

# 빌드 (정적 사이트이므로 별도 빌드 없음)
npm run build

# GitHub Pages 배포
npm run deploy
```

## 핵심 기능
1. **프레젠테이션 소스 선택**
   - 현재 repo에서 찾기
   - 다른 GitHub repo에서 찾기
   - 로컬 파일 업로드
   - 마크다운 직접 입력

2. **슬라이드 기능**
   - 키보드 내비게이션 (←/→, 스페이스바)
   - 전체화면 모드 (F11)
   - PDF 내보내기
   - 다크모드 지원

3. **사용자 설정**
   - 폰트 선택 (배민 폰트 계열 + 마루부리)
   - 테마 전환 (라이트/다크)
   - 프레젠테이션 히스토리

## 코드 스타일 및 규칙
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

## 저장소 에티켓
- 새로운 기능 추가 시 기존 스타일 유지
- 반응형 디자인 고려 (모바일/태블릿)
- 접근성 지원 (키보드 내비게이션)
- 다크모드 지원 필수

## 핵심 파일 및 유틸리티
- **index.html**: 메인 페이지, UI 구조 정의
- **app.js**: 
  - `GitHubMarkdownPresenter` 클래스 - 메인 애플리케이션 로직
  - GitHub API 연동 로직
  - 마크다운 파싱 및 슬라이드 변환
  - 키보드 내비게이션 처리
- **style.css**: 
  - 반응형 디자인
  - 프린트 스타일 정의
  - 폰트 페이스 정의
  - 커스텀 텍스트 스타일

## 건드리면 안 되는 것
- **기존 마크다운 파일 구조**: 25_07_계절학기/, 25_07_전주교육청연수/ 폴더의 내용
- **폰트 파일**: font/ 폴더의 모든 TTF 파일
- **GitHub Pages 배포 설정**: package.json의 deploy 스크립트
- **기존 커스텀 구문**: 호환성을 위해 기존 구문 유지

## 주의사항
- 모든 외부 라이브러리는 CDN 사용
- 크로스 브라우저 호환성 고려
- GitHub API 호출 시 rate limit 고려
- 로컬 파일 업로드 시 보안 고려

## 개발 팁
- 슬라이드 테스트 시 다양한 마크다운 구문 확인
- 프린트 스타일 테스트 필수
- 모바일 환경에서 터치 제스처 고려
- 전체화면 모드에서 UI 위치 확인

## 디버깅
- 브라우저 개발자 도구 콘솔 확인
- GitHub API 오류 시 네트워크 탭 확인
- 폰트 로딩 실패 시 경로 확인
- 마크다운 파싱 오류 시 특수 문자 확인