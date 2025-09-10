# 페이지 카드 스크롤 UI 구현 문서

## 개요
Step 1 기본 정보 입력 화면의 페이지 구성 섹션에서 수평 스크롤 가능한 카드 UI 시스템입니다.

## 핵심 구조

### 1. 스크롤 컨테이너 구조
```jsx
<div className="w-full">
  <div className="overflow-x-auto scroll-smooth" ref={scrollContainerRef}>
    <motion.div 
      className="flex gap-6 pb-2" 
      style={{ 
        minWidth: 'max-content',
        paddingLeft: `${scrollPadding}px`,
        paddingRight: '24px' // 우측 패딩 고정
      }}
    >
      {/* 페이지 카드들 */}
      {/* + 버튼 */}
    </motion.div>
  </div>
</div>
```

### 2. 카드 사양
- **너비**: 480px (고정)
- **높이**: 384px (h-96)
- **간격**: 24px (gap-6)
- **새 카드 공간**: 504px (카드 너비 + 간격)

## 페이지 추가 동작 로직

### Case 1: 충분한 공간이 있는 경우
**조건**: `rightSpace >= newCardSpace + buttonWidth`
- + 버튼 우측에 새 카드와 버튼이 들어갈 충분한 공간이 있음
- **동작**: 스크롤 없이 카드만 추가
- **결과**: 기존 카드 위치 유지, + 버튼만 우측으로 이동

### Case 2: + 버튼이 화면 우측 끝에 있는 경우
**조건**: `rightSpace <= buttonWidth + cardGap * 2`
- + 버튼이 화면 우측 끝 근처에 위치 (약 128px 이내)
- **동작**: 
  1. 새 카드 추가
  2. 스크롤을 최대 위치로 이동
- **결과**: 기존 카드들이 좌측으로 밀리고 새 카드가 보임

### Case 3: 중간 상태
**조건**: Case 1과 Case 2 사이
- + 버튼이 화면 중간쯤에 위치
- **동작**: 
  1. 새 카드 추가
  2. 스크롤을 최대 위치로 이동
- **결과**: + 버튼이 화면 우측 끝(24px 여백)에 위치

### 스크롤 계산
```javascript
const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
scrollContainerRef.current.scrollTo({
  left: maxScroll,
  behavior: 'smooth'
});
```

## 페이지 삭제 동작

```javascript
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

- 카드 삭제 후 전체 콘텐츠가 화면보다 작아지면 스크롤을 0으로 초기화

## 스크롤 패딩 시스템

### 좌측 패딩 (동적 계산)
```javascript
const updatePadding = () => {
  const viewportWidth = window.innerWidth;
  const maxWidth = 1280; // max-w-7xl
  
  let basePadding = 16; // px-4
  if (viewportWidth >= 1536) { // 2xl
    basePadding = 48; // px-12
  } else if (viewportWidth >= 1280) { // xl
    basePadding = 32; // px-8
  }
  
  const marginPadding = Math.max(0, (viewportWidth - maxWidth) / 2);
  setScrollPadding(marginPadding + basePadding);
};
```

### 우측 패딩
- 고정값: 24px (카드 간격과 동일)
- 스크롤 끝에서 + 버튼과 화면 우측 사이의 최소 간격 보장

## 애니메이션 시스템 (Framer Motion)

### 카드 애니메이션
```jsx
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
```

### + 버튼 애니메이션
```jsx
<motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
```

## 스크롤 정책

### 한도 정책
- **좌측 한도**: 첫 페이지 카드가 중앙 콘텐츠 영역과 정렬
- **우측 한도**: + 버튼 우측에 24px 여백만 남김
- **최대 스크롤**: `scrollWidth - clientWidth`

### 자동 스크롤 타이밍
- 카드 추가/삭제 후: 100ms 지연
- 부드러운 스크롤: `behavior: 'smooth'`

## 반응형 디자인

### 브레이크포인트
- 기본: `px-4` (16px 패딩)
- xl (1280px~): `px-8` (32px 패딩)
- 2xl (1536px~): `px-12` (48px 패딩)

### 중앙 콘텐츠 영역
- 최대 너비: 1280px (80rem)
- 화면이 1280px보다 클 때 추가 여백 자동 계산

## 기술 스택
- **React**: 상태 관리 및 컴포넌트 구조
- **Framer Motion**: 애니메이션 및 레이아웃 전환
- **Tailwind CSS**: 스타일링 및 반응형 디자인
- **TypeScript**: 타입 안정성