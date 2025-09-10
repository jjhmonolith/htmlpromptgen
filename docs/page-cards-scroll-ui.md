# 페이지 카드 스크롤 UI 구현 문서

## 개요
Step 1 기본 정보 입력 화면의 페이지 구성 섹션에서 수평 스크롤 가능한 카드 UI를 구현한 내용을 정리합니다.

## 핵심 기능

### 1. 전체 화면 너비 활용 스크롤
- **구현 방식**: 음수 마진과 패딩 복원 조합
- **코드**:
  ```jsx
  <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw]">
    <div style={{ 
      paddingLeft: `calc((100vw - 80rem) / 2 + 3rem)`,
      paddingRight: `${scrollPadding}px`
    }}>
  ```
- **효과**: 중앙 정렬된 콘텐츠 영역을 벗어나 전체 화면 너비에서 스크롤 가능

### 2. 자동 스크롤 동작

#### 2.1 페이지 추가 시 자동 스크롤
- **목적**: 새로 추가된 페이지 카드와 + 버튼이 보이도록 자동 이동
- **구현**:
  ```typescript
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState(false);
  
  useEffect(() => {
    if (shouldScrollToEnd && addButtonRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        const buttonRect = addButtonRef.current.getBoundingClientRect();
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        
        if (buttonRect.right > containerRect.right) {
          scrollContainerRef.current.scrollTo({
            left: scrollContainerRef.current.scrollLeft + (buttonRect.right - containerRect.right) + 20,
            behavior: 'smooth'
          });
        }
        setShouldScrollToEnd(false);
      }, 300); // 애니메이션 시작 후 실행
    }
  }, [pages, shouldScrollToEnd]);
  ```
- **타이밍**: 애니메이션 시작 300ms 후 스크롤 시작

#### 2.2 페이지 삭제 시 스크롤 조정
- **목적**: 콘텐츠 너비가 뷰포트보다 작아지면 스크롤 위치 초기화
- **구현**:
  ```typescript
  const removePage = (pageId: string) => {
    const newPages = pages.filter(p => p.id !== pageId);
    setPages(newPages);
    
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        if (scrollWidth <= clientWidth) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }
    }, 100);
  };
  ```

### 3. 스크롤 패딩 동적 계산
- **목적**: 반응형 디자인에서 적절한 좌우 패딩 유지
- **구현**:
  ```typescript
  useEffect(() => {
    const updatePadding = () => {
      const viewportWidth = window.innerWidth;
      const maxWidth = 1280; // 80rem
      
      let basePadding = 16; // px-4
      if (viewportWidth >= 1536) { // 2xl
        basePadding = 48; // px-12
      } else if (viewportWidth >= 1280) { // xl
        basePadding = 32; // px-8
      }
      
      const marginPadding = Math.max(0, (viewportWidth - maxWidth) / 2);
      setScrollPadding(marginPadding + basePadding);
    };
    
    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);
  ```

## 애니메이션 통합

### Framer Motion 애니메이션
- **진입 애니메이션**: 
  - 투명도: 0 → 1
  - 크기: 0.8 → 1
  - 위치: x: 50 → 0 (오른쪽에서 슬라이드)
- **퇴장 애니메이션**:
  - 투명도: 1 → 0
  - 크기: 1 → 0.8
  - 위치: x: 0 → -50 (왼쪽으로 슬라이드)
- **레이아웃 애니메이션**: 카드 추가/삭제 시 자동 재배치
- **호버 효과**: scale(1.02) 적용

### 애니메이션 설정
```jsx
<AnimatePresence mode="popLayout">
  {pages.map((page, index) => (
    <motion.div
      key={page.id}
      layout
      initial={{ opacity: 0, scale: 0.8, x: 50 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -50 }}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      whileHover={{ scale: 1.02 }}
    >
      {/* 카드 내용 */}
    </motion.div>
  ))}
</AnimatePresence>
```

## 스크롤 동작 규칙

### 규칙 1: 초기 위치 정렬
- 첫 번째 페이지 카드의 좌측 경계가 "추가 제안사항" 섹션의 좌측 경계와 정렬
- CSS calc()를 사용한 정확한 패딩 계산

### 규칙 2: + 버튼 자동 노출
- 새 페이지 추가 시 + 버튼이 뷰포트 내에 보이도록 자동 스크롤
- useEffect와 상태 플래그를 통한 안정적인 스크롤 트리거

### 규칙 3: 삭제 시 스크롤 조정
- 페이지 삭제로 콘텐츠가 뷰포트보다 작아지면 스크롤 위치를 0으로 초기화
- 부드러운 스크롤 애니메이션 적용

## 사용자 경험 개선 사항

1. **입력 중단 방지**: 페이지 추가 애니메이션과 스크롤이 동기화되어 사용자 입력 중단 없음
2. **시각적 피드백**: 애니메이션을 통해 카드 추가/삭제 동작을 명확하게 표시
3. **반응형 디자인**: 화면 크기에 따라 적절한 패딩과 스크롤 영역 자동 조정
4. **부드러운 전환**: 모든 스크롤과 애니메이션에 smooth behavior 적용

## 기술 스택
- **React**: 컴포넌트 상태 관리
- **Framer Motion**: 애니메이션 구현
- **Tailwind CSS**: 스타일링 및 반응형 디자인
- **TypeScript**: 타입 안정성