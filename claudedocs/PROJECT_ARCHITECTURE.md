# 교육 콘텐츠 프롬프트 생성기 - 프로젝트 아키텍처

## 📋 프로젝트 개요

교육 콘텐츠 프롬프트 생성기는 5단계의 체계적인 워크플로우를 통해 AI를 활용하여 교육용 HTML 콘텐츠 생성을 위한 프롬프트를 만드는 웹 애플리케이션입니다.

### 핵심 기능
- 5단계 순차적 워크플로우 시스템
- AI 기반 비주얼 아이덴티티 생성
- 레이아웃 및 콘텐츠 제안
- 애니메이션/상호작용 설계
- 최종 프롬프트 생성 및 내보내기

## 🏗️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **State Management**: React Hooks + Context API
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI API (GPT-4)
- **Build Tool**: Vite
- **Storage**: LocalStorage (클라이언트 사이드)

## 📦 프로젝트 구조

```
promptgen/
├── src/
│   ├── components/           # UI 컴포넌트
│   │   ├── common/           # 공통 컴포넌트
│   │   ├── workflow/         # 5단계 워크플로우 컴포넌트
│   │   │   ├── Step1BasicInfo/
│   │   │   ├── Step2VisualIdentity/
│   │   │   ├── Step3Layout/
│   │   │   ├── Step4Enhancement/
│   │   │   └── Step5FinalPrompt/
│   │   ├── ApiKeyManager/    # API 키 관리
│   │   ├── ProjectList/      # 프로젝트 목록
│   │   ├── HomePage/         # 홈페이지
│   │   └── WorkSpace/        # 작업 공간
│   ├── types/                # TypeScript 타입 정의
│   │   ├── project.types.ts
│   │   ├── workflow.types.ts
│   │   └── course.types.ts
│   ├── services/             # 비즈니스 로직
│   │   ├── openai.service.ts
│   │   ├── project.service.ts
│   │   ├── workflow.service.ts
│   │   └── storage.service.ts
│   ├── hooks/                # Custom React Hooks
│   │   ├── usePromptGenerator.ts
│   │   └── useWorkflowNavigation.ts
│   ├── utils/                # 유틸리티 함수
│   │   ├── promptTemplates.ts
│   │   ├── batchProcessor.ts
│   │   └── clipboard.ts
│   └── constants/            # 상수 정의
│       └── prompts.ts
├── claudedocs/               # 프로젝트 문서
│   ├── PROJECT_ARCHITECTURE.md
│   ├── WORKFLOW_SPECIFICATION.md
│   └── DEVELOPMENT_LOG.md
└── public/                   # 정적 파일
```

## 🔄 5단계 워크플로우

### Step 1: 기본 정보 입력
- 프로젝트 제목, 대상 학습자 정의
- 페이지 구성 및 주제 설정
- 레이아웃 모드 선택 (고정형/스크롤형)
- 콘텐츠 모드 선택 (향상형/제한형)

### Step 2: 비주얼 아이덴티티 생성
- AI 기반 색상 팔레트 생성
- 타이포그래피 시스템 정의
- 무드보드 및 톤 설정
- 컴포넌트 스타일 가이드

### Step 3: 레이아웃 제안
- 페이지별 레이아웃 구조 생성
- 콘텐츠 블록 배치
- 이미지 사양 정의
- 병렬 처리로 효율성 극대화

### Step 4: 애니메이션/상호작용
- 애니메이션 효과 제안
- 상호작용 패턴 설계
- 게이미피케이션 요소
- 마이크로 인터랙션 정의

### Step 5: 최종 프롬프트 생성
- HTML 생성용 종합 프롬프트
- 이미지 생성 프롬프트
- 메타데이터 포함
- 내보내기 및 복사 기능

## 💾 데이터 관리

### 상태 관리 전략
- **프로젝트 단위 관리**: 각 프로젝트는 독립적인 상태를 가짐
- **자동 저장**: 30초마다 자동 저장
- **체크포인트**: 각 단계 완료 시 체크포인트 생성
- **수정 추적**: 변경사항 실시간 추적

### 영속성
- LocalStorage를 활용한 클라이언트 사이드 저장
- 프로젝트별 독립적인 저장 공간
- 세션 간 작업 내용 유지

## 🔐 보안 고려사항

- API 키는 클라이언트 사이드에만 저장
- 간단한 암호화 적용 (Base64)
- 프로덕션 환경에서는 백엔드 프록시 권장

## 📊 성능 최적화

- **병렬 처리**: Step 3, 4에서 페이지별 병렬 AI 호출
- **배치 처리**: 효율적인 API 호출 관리
- **레이지 로딩**: 필요한 컴포넌트만 로드
- **메모이제이션**: 중복 계산 방지

## 🚀 개발 현황

### 완료된 기능
- [x] 프로젝트 관리 시스템
- [x] API 키 관리
- [x] 기본 워크스페이스
- [x] 자동 저장 기능
- [x] 이전 단계 이동 및 수정 추적

### 개발 중
- [ ] 5단계 워크플로우 구현
- [ ] AI 서비스 통합
- [ ] 프롬프트 템플릿 시스템

### 예정된 기능
- [ ] 프롬프트 버전 관리
- [ ] 협업 기능
- [ ] 프롬프트 템플릿 마켓플레이스

## 📝 업데이트 로그

### 2025-01-09
- 프로젝트 아키텍처 문서 생성
- 5단계 워크플로우 설계 완료
- 타입 시스템 정의

---

*이 문서는 프로젝트 개발 진행에 따라 지속적으로 업데이트됩니다.*