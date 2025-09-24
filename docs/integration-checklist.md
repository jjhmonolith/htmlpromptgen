# Step4-5 통합 구현 체크리스트

## 🎯 Phase 1: 서비스 레이어 통합

### **1.1 IntegratedStep4Service 생성**
- [ ] `src/services/integrated-step4.service.ts` 파일 생성
- [ ] 기본 클래스 구조 정의
- [ ] 타입 정의 생성 (`IntegratedStep4Result`)
- [ ] 에러 핸들링 클래스 추가

### **1.2 애니메이션 생성 로직 이식**
- [ ] Step4의 `createStep4Prompt` 함수 이식
- [ ] `parseJsonResponse` 함수 이식
- [ ] 페이지별 애니메이션/인터랙션 생성 로직 구현
- [ ] AI 호출 로직 통합

### **1.3 프롬프트 컴파일 로직 이식**
- [ ] Step5의 `compileHTMLPrompt` 함수 이식
- [ ] 모든 helper 함수들 이식:
  - [ ] `generateCoreRequirements`
  - [ ] `generateContentRules`
  - [ ] `generatePageByPageSpecification`
  - [ ] `generateCSSSpecification`
  - [ ] `generateImagePromptSection`
- [ ] 애니메이션 데이터 통합 로직 추가

### **1.4 통합 서비스 테스트**
- [ ] 단위 테스트 작성
- [ ] Mock 데이터로 전체 플로우 테스트
- [ ] 에러 시나리오 테스트

---

## 🎯 Phase 2: 컴포넌트 통합

### **2.1 새로운 Step4 컴포넌트 생성**
- [ ] `src/components/workflow/Step4IntegratedResult/` 폴더 생성
- [ ] `Step4IntegratedResult.tsx` 파일 생성
- [ ] `index.ts` 익스포트 파일 생성
- [ ] Props 인터페이스 정의

### **2.2 UI 로직 통합**
- [ ] Step5의 UI 레이아웃 이식
- [ ] 로딩 상태 관리 (2단계: 애니메이션 → 프롬프트)
- [ ] 프롬프트 미리보기 기능
- [ ] 복사 기능
- [ ] 섹션 토글 (개발/이미지 프롬프트)

### **2.3 상태 관리 통합**
- [ ] `useState` 훅들 통합
- [ ] `useEffect` 로직 통합
- [ ] 자동저장 시스템 연동
- [ ] 에러 상태 처리

### **2.4 애니메이션 표시 기능**
- [ ] 생성된 애니메이션/인터랙션 텍스트 표시 (옵션)
- [ ] Debug 모드에서 중간 단계 표시
- [ ] 페이지별 애니메이션 미리보기

---

## 🎯 Phase 3: 워크플로우 업데이트

### **3.1 WorkflowContainer 수정**
- [ ] `step4` 상태 제거
- [ ] `step5` → `step4` 상태 이름 변경
- [ ] 핸들러 함수들 업데이트:
  - [ ] `handleStep3Complete` → 새로운 Step4로 바로 이동
  - [ ] `handleStep4Complete` → 워크플로우 완료
  - [ ] `handleStep4DataChange` 추가
- [ ] 자동저장 로직 업데이트

### **3.2 GNB 네비게이션 업데이트**
- [ ] `steps` 배열을 5개 → 4개로 수정
- [ ] Step 5 아이콘 제거
- [ ] Step 4 아이콘을 최종 단계 아이콘으로 변경
- [ ] 연결선 위치 조정
- [ ] 툴팁 텍스트 업데이트

### **3.3 라우팅 및 네비게이션**
- [ ] `onStepClick` 로직 업데이트
- [ ] Step 4 완료 후 워크플로우 종료 처리
- [ ] 뒤로가기/앞으로가기 네비게이션 테스트

---

## 🎯 Phase 4: 타입 및 데이터 구조 업데이트

### **4.1 타입 정의 수정**
- [ ] `workflow.types.ts` 업데이트:
  - [ ] `Step4DesignResult` 제거
  - [ ] `IntegratedStep4Result` 추가
  - [ ] `WorkflowState` 수정
  - [ ] `FinalPrompt` 타입 확장/변경
- [ ] Import 문들 전체 수정

### **4.2 자동저장 시스템 호환성**
- [ ] 저장 데이터 구조 변경
- [ ] 기존 데이터 마이그레이션 로직
- [ ] `storage.service.ts` 업데이트
- [ ] `project.service.ts` 업데이트

### **4.3 데이터 흐름 검증**
- [ ] Step3 → Step4 데이터 전달 테스트
- [ ] Step4 결과 저장/로드 테스트
- [ ] 새로고침 시 데이터 복원 테스트

---

## 🎯 Phase 5: 정리 및 테스트

### **5.1 구 파일들 제거**
- [ ] `src/components/workflow/Step4DesignSpecification/` 폴더 삭제
- [ ] `src/services/step4-design-specification.service.ts` 삭제
- [ ] `src/types/step4.types.ts` 삭제
- [ ] `src/components/workflow/Step5FinalPrompt/` 폴더 삭제
- [ ] 불필요한 import 문들 정리

### **5.2 전체 플로우 테스트**
- [ ] 새로운 프로젝트 생성 → 완료까지 전체 테스트
- [ ] 기존 프로젝트 로드 → 새로운 Step4 실행 테스트
- [ ] Step3에서 Step4로 자동 이동 테스트
- [ ] Step4 완료 후 최종 결과 확인

### **5.3 에러 시나리오 테스트**
- [ ] API 키 없을 때 에러 처리
- [ ] 네트워크 오류 시 에러 처리
- [ ] Step3 데이터 없을 때 처리
- [ ] 중간에 새로고침 했을 때 복원

### **5.4 성능 및 사용성 테스트**
- [ ] 로딩 시간 측정 (기존 대비)
- [ ] 메모리 사용량 확인
- [ ] UI 반응성 테스트
- [ ] 모바일/태블릿 호환성

---

## 🎯 Phase 6: 문서 및 마무리

### **6.1 문서 업데이트**
- [ ] `CLAUDE.md` 프로젝트 가이드 업데이트
- [ ] 자동저장 시스템 문서 업데이트 (필요시)
- [ ] GNB 정책 문서 업데이트
- [ ] README.md 업데이트 (필요시)

### **6.2 코드 품질 확인**
- [ ] TypeScript 에러 0개 확인
- [ ] ESLint 경고 해결
- [ ] 콘솔 로그 정리
- [ ] 주석 및 문서화 완료

### **6.3 최종 검증**
- [ ] 모든 기능 정상 작동 확인
- [ ] 성능 벤치마크 기록
- [ ] 사용자 플로우 녹화/문서화
- [ ] 롤백 계획 수립

---

## ⚠️ 주의사항 체크리스트

### **데이터 마이그레이션**
- [ ] 기존 `step4` 데이터 구조 파악
- [ ] 마이그레이션 스크립트 작성
- [ ] 백업 및 복원 절차 수립

### **의존성 확인**
- [ ] Step4 타입을 import하는 모든 파일 찾기
- [ ] Step4 컴포넌트를 사용하는 모든 곳 수정
- [ ] 서비스 의존성 그래프 확인

### **사용자 영향도**
- [ ] 기존 사용자 워크플로우 영향 분석
- [ ] 변경사항 안내 메시지 필요 여부
- [ ] 사용자 피드백 수집 계획

---

## 📋 구현 순서 요약

1. **우선 순위 높음 (필수)**
   - Phase 1: 서비스 레이어 통합
   - Phase 2: 컴포넌트 통합
   - Phase 3: 워크플로우 업데이트

2. **우선 순위 중간 (중요)**
   - Phase 4: 타입 및 데이터 구조
   - Phase 5.1-5.3: 정리 및 테스트

3. **우선 순위 낮음 (선택적)**
   - Phase 5.4: 성능 테스트
   - Phase 6: 문서화

각 Phase는 순차적으로 진행하되, 각 Phase 완료 시마다 기능 테스트를 진행하여 안정성을 확보합니다.