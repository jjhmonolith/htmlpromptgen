# 코드베이스 구조

## 프로젝트 디렉토리 구조
```
src/
├── components/           # React 컴포넌트
│   ├── ApiKeyManager/   # API 키 관리 컴포넌트
│   ├── HomePage/        # 홈페이지 컴포넌트
│   ├── WorkSpace/       # 작업공간 컴포넌트
│   ├── ProjectList/     # 프로젝트 목록 컴포넌트
│   ├── ResultDisplay/   # 결과 표시 컴포넌트
│   ├── CourseForm/      # 교안 폼 컴포넌트
│   ├── workflow/        # 5단계 워크플로우 컴포넌트
│   │   └── Step1BasicInfo/ # 1단계 기본 정보 입력
│   └── common/          # 공통 컴포넌트 (Button, Card, Input)
├── services/            # 서비스 레이어
│   ├── openai.service.ts    # OpenAI API 서비스
│   ├── storage.service.ts   # 로컬스토리지 서비스
│   ├── project.service.ts   # 프로젝트 관리 서비스
│   └── prompt.generator.ts  # 프롬프트 생성 서비스
├── hooks/               # 커스텀 훅
│   ├── usePromptGenerator.ts
│   └── useDraft.ts
├── types/               # TypeScript 타입 정의
│   ├── index.ts
│   ├── api.types.ts
│   ├── course.types.ts
│   ├── project.types.ts
│   └── workflow.types.ts
├── utils/               # 유틸리티 함수
│   └── clipboard.ts
├── assets/              # 정적 자산
└── App.tsx              # 메인 애플리케이션
```

## 주요 컴포넌트 구조

### App.tsx
- 메인 애플리케이션 라우터
- 상태: `currentView` ('home' | 'project-list' | 'workspace')
- 프로젝트 관리 및 네비게이션 로직

### WorkSpace
- 프로젝트별 작업 공간
- API 키 관리 → 워크플로우 → 결과 표시 순서
- 자동 저장 기능 (30초마다)

### WorkflowContainer
- 5단계 워크플로우 관리
- 단계별 진행 상태 추적
- 로컬스토리지 기반 상태 저장

### HomePage
- 새 프로젝트 / 기존 프로젝트 선택
- 글래스모피즘 디자인 적용

### ProjectList
- 저장된 프로젝트 목록 표시
- 프로젝트 삭제 및 선택 기능