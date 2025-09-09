# 코드 스타일 및 컨벤션

## TypeScript 컨벤션
- **파일명**: PascalCase for components (`HomePage.tsx`), camelCase for utilities (`clipboard.ts`)
- **인터페이스**: PascalCase with Props suffix (`HomePageProps`, `ButtonProps`)
- **타입 정의**: 별도 types 폴더로 분리, domain별 파일 구성
- **Export**: Named exports 사용 (`export const HomePage: React.FC<HomePageProps>`)

## React 컴포넌트 패턴
- **함수형 컴포넌트**: React.FC 타입 사용
- **Props 인터페이스**: 컴포넌트별로 별도 인터페이스 정의
- **State 관리**: useState 훅 사용, 복잡한 상태는 타입 정의
- **이벤트 핸들러**: handle* 접두사 사용 (`handleSubmit`, `handleKeyValidated`)

## CSS/스타일링 컨벤션
- **Tailwind CSS**: 유틸리티 클래스 우선 사용
- **조건부 스타일**: clsx 라이브러리 활용
- **글래스모피즘**: 커스텀 CSS 클래스 정의 (index.css)
- **반응형**: 모바일 우선, md: 브레이크포인트 활용

## 디렉토리 구조 컨벤션
- **컴포넌트**: 폴더별 index.ts로 export 정리
- **서비스**: *.service.ts 네이밍 패턴
- **타입**: domain별 *.types.ts 파일 분리
- **훅**: use* 접두사, *.ts 확장자

## 네이밍 컨벤션
- **변수/함수**: camelCase
- **상수**: UPPER_SNAKE_CASE (필요시)
- **컴포넌트**: PascalCase
- **파일**: PascalCase (컴포넌트), camelCase (기타)

## 주석 및 문서화
- **TypeScript**: 타입으로 대부분의 문서화 대체
- **복잡한 로직**: 주석 추가 (`// 배경 오버레이`, `// 자동 저장`)
- **TODO**: 개발 진행 중 표시 (`개발 진행 중...`)

## 에러 처리 패턴
- **Form 유효성**: errors 객체로 관리
- **API 호출**: try-catch 블록 사용
- **조건부 렌더링**: 에러 상태별 UI 표시

## 상태 관리 패턴
- **Local State**: useState 훅
- **Props Drilling**: 필요에 따라 props로 상태 전달
- **Local Storage**: 프로젝트 데이터, API 키 등 저장
- **Auto Save**: 30초 간격 자동 저장 구현