# 교안 프롬프트 생성기

Claude Code용 교안 개발 프롬프트를 자동으로 생성하는 웹 애플리케이션입니다.

## 🚀 시작하기

### 개발 환경 실행
```bash
npm install
npm run dev
```

앱이 http://localhost:5173 에서 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 📋 주요 기능

1. **OpenAI API 키 관리**
   - 로컬스토리지에 암호화 저장
   - API 키 유효성 검증

2. **교안 정보 입력**
   - 교안 주제 및 학습 대상 설정
   - 페이지별 내용 구성
   - 학습 목표 및 활동 추가

3. **프롬프트 생성**
   - GPT-4를 활용한 자동 프롬프트 생성
   - Claude Code에 최적화된 구조화된 프롬프트

4. **결과 관리**
   - 생성된 프롬프트 표시
   - 원클릭 복사 기능
   - 텍스트 파일 다운로드
   - 프롬프트 편집 기능

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **API**: OpenAI GPT-4
- **Storage**: LocalStorage with CryptoJS

## 📁 프로젝트 구조

```
src/
├── components/       # UI 컴포넌트
│   ├── ApiKeyManager/
│   ├── CourseForm/
│   ├── ResultDisplay/
│   └── common/
├── services/        # 서비스 레이어
├── hooks/          # 커스텀 훅
├── types/          # TypeScript 타입 정의
├── utils/          # 유틸리티 함수
└── App.tsx         # 메인 애플리케이션
```

## 💡 사용 방법

1. OpenAI API 키 입력 및 검증
2. 교안 정보 입력
   - 주제와 학습 대상 설정
   - 페이지별 내용 구성
3. "프롬프트 생성" 버튼 클릭
4. 생성된 프롬프트를 복사하여 Claude Code에서 사용

## 🔐 보안

- API 키는 CryptoJS를 사용하여 암호화
- 브라우저 로컬스토리지에만 저장
- 서버로 전송되지 않음

## 📝 라이센스

MIT
