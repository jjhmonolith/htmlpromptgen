# 개발 명령어 가이드

## 기본 개발 명령어

### 프로젝트 시작
```bash
npm install        # 의존성 설치
npm run dev        # 개발 서버 시작 (Vite)
```

### 빌드 및 배포
```bash
npm run build      # 프로덕션 빌드 (TypeScript 컴파일 + Vite 빌드)
npm run preview    # 빌드된 결과 미리보기
```

### 코드 품질
```bash
npm run lint       # ESLint 실행 (코드 린팅)
```

## 개발 서버 정보
- **개발 서버**: http://localhost:5173/ (기본값)
- **포트 충돌시**: 자동으로 다른 포트 할당 (5174, 5175...)
- **핫 리로드**: 파일 변경시 자동 새로고침

## 시스템 명령어 (macOS)

### 파일 시스템
```bash
ls -la            # 파일/폴더 목록 (숨김 파일 포함)
find . -name "*.tsx"  # TypeScript 파일 검색
grep -r "pattern" src/  # 소스코드에서 패턴 검색
```

### Git 명령어
```bash
git status        # 현재 상태 확인
git add .         # 모든 변경사항 스테이징
git commit -m "message"  # 커밋
git log --oneline  # 커밋 히스토리 (한 줄)
```

### 프로세스 관리
```bash
lsof -ti:5173     # 포트 사용 프로세스 확인
kill -9 $(lsof -ti:5173)  # 포트 사용 프로세스 종료
```

## 유용한 개발 팁

### 디버깅
- **브라우저 개발자 도구**: React DevTools 사용 가능
- **콘솔 로그**: console.log로 디버깅
- **네트워크 탭**: OpenAI API 호출 확인

### 코드 에디터 설정
- **VS Code 확장**: ES7+ React/Redux/React-Native snippets
- **TypeScript**: 타입 체크 활성화
- **Prettier**: 코드 자동 포맷팅 (설정 파일 있음)

### 성능 최적화
- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 값/함수 메모이제이션
- **코드 분할**: React.lazy로 지연 로딩