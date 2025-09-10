import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectData, PageInfo } from '../../../types/workflow.types';

interface Step1BasicInfoProps {
  initialData?: ProjectData | null;
  onComplete: (data: ProjectData) => void;
  onBack?: () => void;
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({ 
  initialData, 
  onComplete,
  onBack
}) => {
  const [projectTitle, setProjectTitle] = useState(initialData?.projectTitle || '');
  const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience || '');
  const [pages, setPages] = useState<PageInfo[]>(initialData?.pages || [
    { id: '1', pageNumber: 1, topic: '', description: '' }
  ]);
  const [layoutMode, setLayoutMode] = useState<'fixed' | 'scrollable'>(
    initialData?.layoutMode || 'scrollable'
  );
  const [contentMode, setContentMode] = useState<'enhanced' | 'restricted'>(
    initialData?.contentMode || 'enhanced'
  );
  const [suggestions, setSuggestions] = useState(initialData?.suggestions || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [scrollPadding, setScrollPadding] = useState<number>(0);
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState(false);
  
  // 페이지가 추가될 때 스크롤 (fallback 케이스용)
  useEffect(() => {
    if (shouldScrollToEnd && addButtonRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        if (addButtonRef.current && scrollContainerRef.current) {
          const buttonRect = addButtonRef.current.getBoundingClientRect();
          const containerRect = scrollContainerRef.current.getBoundingClientRect();
          
          // + 버튼이 화면 밖에 있으면 스크롤
          if (buttonRect.right > containerRect.right) {
            scrollContainerRef.current.scrollTo({
              left: scrollContainerRef.current.scrollLeft + (buttonRect.right - containerRect.right) + 20,
              behavior: 'smooth'
            });
          }
        }
        setShouldScrollToEnd(false);
      }, 300); // 애니메이션이 시작된 후 스크롤
    }
  }, [pages, shouldScrollToEnd]);
  
  // 패딩 계산 및 업데이트
  useEffect(() => {
    const updatePadding = () => {
      const viewportWidth = window.innerWidth;
      const maxWidth = 1280; // 80rem = 1280px
      
      // Tailwind 패딩 반응형 값 매칭: px-4 xl:px-8 2xl:px-12
      let basePadding = 16; // px-4 = 1rem
      if (viewportWidth >= 1536) { // 2xl
        basePadding = 48; // px-12 = 3rem
      } else if (viewportWidth >= 1280) { // xl
        basePadding = 32; // px-8 = 2rem
      }
      
      const marginPadding = Math.max(0, (viewportWidth - maxWidth) / 2);
      setScrollPadding(marginPadding + basePadding);
    };
    
    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);

  // 페이지 추가 시 + 버튼이 보이도록 스크롤
  const scrollToAddButton = () => {
    // 애니메이션이 완료된 후 스크롤
    setTimeout(() => {
      if (addButtonRef.current && scrollContainerRef.current) {
        const buttonRect = addButtonRef.current.getBoundingClientRect();
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        
        // + 버튼이 화면 밖에 있으면 스크롤
        if (buttonRect.right > containerRect.right) {
          scrollContainerRef.current.scrollTo({
            left: scrollContainerRef.current.scrollLeft + (buttonRect.right - containerRect.right) + 20,
            behavior: 'smooth'
          });
        }
      }
    }, 400); // 애니메이션 완료 후 실행
  };

  // 페이지 추가 함수
  const addNewPage = () => {
    const newId = Math.max(...pages.map(p => parseInt(p.id)), 0) + 1;
    
    // + 버튼 위치 확인
    if (addButtonRef.current && scrollContainerRef.current) {
      const buttonRect = addButtonRef.current.getBoundingClientRect();
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      const container = scrollContainerRef.current;
      
      const cardWidth = 480; // 카드 너비
      const cardGap = 24; // gap-6 = 1.5rem = 24px
      const newCardSpace = cardWidth + cardGap;
      
      // + 버튼이 현재 보이는지 확인
      const isButtonVisible = buttonRect.right <= containerRect.right && buttonRect.left >= containerRect.left;
      
      // + 버튼의 우측 여백 계산 (컨테이너 기준)
      const rightSpace = containerRect.right - buttonRect.right;
      
      // Case 1: 버튼이 보이고 우측에 충분한 공간이 있는 경우 - 스크롤 없이 카드만 추가
      if (isButtonVisible && rightSpace >= newCardSpace) {
        setPages([...pages, {
          id: newId.toString(),
          pageNumber: pages.length + 1,
          topic: '',
          description: ''
        }]);
      }
      // Case 2: 버튼이 보이고 우측 끝에 있는 경우 - 기존 카드들을 좌측으로 이동 후 추가
      else if (isButtonVisible && rightSpace < 100) { // 100px 미만이면 끝으로 간주
        // 먼저 스크롤을 왼쪽으로 이동
        container.scrollTo({
          left: container.scrollLeft + newCardSpace,
          behavior: 'smooth'
        });
        
        // 스크롤 애니메이션 후 카드 추가
        setTimeout(() => {
          setPages([...pages, {
            id: newId.toString(),
            pageNumber: pages.length + 1,
            topic: '',
            description: ''
          }]);
        }, 300);
      }
      // Case 3: 버튼이 보이지 않거나 중간 상태 - 버튼을 먼저 보이게 한 후 처리
      else {
        // 버튼이 보이지 않으면 먼저 버튼이 보이도록 스크롤
        if (!isButtonVisible) {
          // 버튼이 우측에 숨어있는 경우
          if (buttonRect.left > containerRect.right) {
            const scrollToButton = buttonRect.right - containerRect.right + 50;
            container.scrollTo({
              left: container.scrollLeft + scrollToButton,
              behavior: 'smooth'
            });
          }
        } else {
          // 버튼은 보이지만 공간이 애매한 경우
          const scrollAmount = newCardSpace - rightSpace + 50; // 50px 여유
          
          container.scrollTo({
            left: container.scrollLeft + scrollAmount,
            behavior: 'smooth'
          });
        }
        
        // 카드 추가
        setTimeout(() => {
          setPages([...pages, {
            id: newId.toString(),
            pageNumber: pages.length + 1,
            topic: '',
            description: ''
          }]);
        }, 50);
      }
    } else {
      // fallback: ref가 없으면 기본 동작
      setPages([...pages, {
        id: newId.toString(),
        pageNumber: pages.length + 1,
        topic: '',
        description: ''
      }]);
      setShouldScrollToEnd(true);
    }
  };

  // 페이지 삭제 함수
  const removePage = (pageId: string) => {
    const newPages = pages.filter(p => p.id !== pageId);
    setPages(newPages);
    
    // 삭제 후 스크롤 위치 조정
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        // 전체 콘텐츠가 화면보다 작으면 스크롤을 원위치로
        if (scrollWidth <= clientWidth) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }
    }, 100);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!projectTitle.trim()) {
      newErrors.projectTitle = '프로젝트 제목을 입력해주세요';
    }
    
    if (!targetAudience.trim()) {
      newErrors.targetAudience = '대상 학습자를 입력해주세요';
    }
    
    const validPages = pages.filter(p => p.topic.trim());
    if (validPages.length === 0) {
      newErrors.pages = '최소 1개 이상의 페이지를 입력해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const validPages = pages.filter(p => p.topic.trim());
    const projectData: ProjectData = {
      id: initialData?.id || `project_${Date.now()}`,
      projectTitle: projectTitle.trim(),
      targetAudience: targetAudience.trim(),
      pages: validPages.map((p, idx) => ({
        ...p,
        pageNumber: idx + 1
      })),
      layoutMode,
      contentMode,
      suggestions: suggestions.trim() || undefined,
      createdAt: initialData?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onComplete(projectData);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
      {/* 상단 흰색 영역 - 뷰포트 전체 너비 */}
      <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-white shadow-sm pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12">
          {/* 상단 영역: 기본 정보 + 프로젝트 설정 (3등분) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* 1/3: 기본 정보 */}
          <div className="pb-6">
            <div className="space-y-10">
              {/* 프로젝트 제목 */}
              <div>
                <label className="block text-xl font-semibold text-gray-900 mb-4">
                  프로젝트 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="예: 초등학교 3학년 과학 - 물의 순환"
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-2 ${
                    errors.projectTitle ? 'border-red-400 bg-red-50' : 'border-transparent'
                  } focus:outline-none focus:bg-white focus:border-[#3e88ff] transition-all text-lg text-gray-900 placeholder-gray-400`}
                />
                {errors.projectTitle && (
                  <p className="text-red-500 text-xs mt-2 ml-1">{errors.projectTitle}</p>
                )}
              </div>

              {/* 대상 학습자 */}
              <div>
                <label className="block text-xl font-semibold text-gray-900 mb-4">
                  대상 학습자 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="예: 초등학교 3학년, 8-9세"
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border-2 ${
                    errors.targetAudience ? 'border-red-400 bg-red-50' : 'border-transparent'
                  } focus:outline-none focus:bg-white focus:border-[#3e88ff] transition-all text-lg text-gray-900 placeholder-gray-400`}
                />
                {errors.targetAudience && (
                  <p className="text-red-500 text-xs mt-2 ml-1">{errors.targetAudience}</p>
                )}
              </div>
            </div>
          </div>

          {/* 2/3: 레이아웃 */}
          <div className="pb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">레이아웃</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  value="scrollable"
                  checked={layoutMode === 'scrollable'}
                  onChange={(e) => setLayoutMode(e.target.value as 'scrollable')}
                  className="sr-only"
                />
                <div 
                  className={`relative overflow-hidden rounded-xl h-48 transition-all duration-300 ${
                    layoutMode === 'scrollable' 
                      ? 'ring-4 shadow-lg transform scale-105' 
                      : 'grayscale hover:grayscale-0 hover:scale-105 hover:shadow-md'
                  }`}
                  style={{
                    backgroundImage: 'url(/scroll.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    ...(layoutMode === 'scrollable' && { 
                      '--tw-ring-color': '#3e88ff'
                    })
                  }}
                >
                  <div className="absolute top-3 left-3">
                    <div className="text-white">
                      <div className="text-base font-bold drop-shadow-lg">스크롤형</div>
                      <div className="text-xs opacity-90 drop-shadow">연속적인 형식</div>
                    </div>
                  </div>
                  {layoutMode === 'scrollable' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor: '#3e88ff'}}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </label>
              <label className="cursor-pointer group relative">
                <input
                  type="radio"
                  value="fixed"
                  checked={layoutMode === 'fixed'}
                  onChange={(e) => setLayoutMode(e.target.value as 'fixed')}
                  className="sr-only"
                />
                <div 
                  className={`relative overflow-hidden rounded-xl h-48 transition-all duration-300 ${
                    layoutMode === 'fixed' 
                      ? 'ring-4 shadow-lg transform scale-105' 
                      : 'grayscale hover:grayscale-0 hover:scale-105 hover:shadow-md'
                  }`}
                  style={{
                    backgroundImage: 'url(/fixed.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    ...(layoutMode === 'fixed' && { 
                      '--tw-ring-color': '#3e88ff'
                    })
                  }}
                >
                  <div className="absolute top-3 left-3">
                    <div className="text-white">
                      <div className="text-base font-bold drop-shadow-lg">고정형</div>
                      <div className="text-xs opacity-90 drop-shadow">슬라이드 형식</div>
                    </div>
                  </div>
                  {layoutMode === 'fixed' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor: '#3e88ff'}}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* 3/3: 생성 모드 */}
          <div className="pb-6 relative">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">생성 모드</h3>
            {/* Warning message when both fixed and enhanced are selected */}
            {layoutMode === 'fixed' && contentMode === 'enhanced' && (
              <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-lg">
                ⚠️ 콘텐츠가 레이아웃을 벗어날 수 있습니다
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer group relative">
                <input
                  type="radio"
                  value="enhanced"
                  checked={contentMode === 'enhanced'}
                  onChange={(e) => setContentMode(e.target.value as 'enhanced')}
                  className="sr-only"
                />
                <div 
                  className={`relative overflow-hidden rounded-xl h-48 transition-all duration-300 ${
                    contentMode === 'enhanced' 
                      ? 'ring-4 shadow-lg transform scale-105' 
                      : 'grayscale hover:grayscale-0 hover:scale-105 hover:shadow-md'
                  }`}
                  style={{
                    backgroundImage: 'url(/aigen.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    ...(contentMode === 'enhanced' && { 
                      '--tw-ring-color': '#3e88ff'
                    })
                  }}
                >
                  <div className="absolute top-3 left-3">
                    <div className="text-white">
                      <div className="text-base font-bold drop-shadow-lg">AI 향상 모드</div>
                      <div className="text-xs opacity-90 drop-shadow">콘텐츠 자동 보강</div>
                    </div>
                  </div>
                  {contentMode === 'enhanced' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor: '#3e88ff'}}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </label>
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  value="restricted"
                  checked={contentMode === 'restricted'}
                  onChange={(e) => setContentMode(e.target.value as 'restricted')}
                  className="sr-only"
                />
                <div 
                  className={`relative overflow-hidden rounded-xl h-48 transition-all duration-300 ${
                    contentMode === 'restricted' 
                      ? 'ring-4 shadow-lg transform scale-105' 
                      : 'grayscale hover:grayscale-0 hover:scale-105 hover:shadow-md'
                  }`}
                  style={{
                    backgroundImage: 'url(/limit.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    ...(contentMode === 'restricted' && { 
                      '--tw-ring-color': '#3e88ff'
                    })
                  }}
                >
                  <div className="absolute top-3 left-3">
                    <div className="text-white">
                      <div className="text-base font-bold drop-shadow-lg">제한 모드</div>
                      <div className="text-xs opacity-90 drop-shadow">입력 내용만 사용</div>
                    </div>
                  </div>
                  {contentMode === 'restricted' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor: '#3e88ff'}}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* 페이지 구성 영역 - 뷰포트 전체 너비, 회색 배경 */}
      <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] py-8" style={{ backgroundColor: '#f5f5f7' }}>
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12">
          {/* 페이지 구성 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                페이지 구성 <span className="text-red-500">*</span>
                <span className="text-sm text-gray-600 ml-2 font-normal">
                  {pages.filter(p => p.topic.trim()).length}개 페이지
                </span>
              </h3>
              {errors.pages && (
                <p className="text-red-500 text-sm mt-1">{errors.pages}</p>
              )}
            </div>
            <button
              onClick={addNewPage}
              className="px-4 py-2 text-white rounded-full transition-all font-medium text-sm"
              style={{
                backgroundColor: '#3e88ff',
                ':hover': {
                  backgroundColor: '#2c6ae6'
                }
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2c6ae6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3e88ff'}
            >
              + 새 페이지
            </button>
          </div>
        </div>

        {/* 페이지 구성 스크롤 영역 - 전체 화면 폭 사용 */}
        <div className="w-full">
          <div className="overflow-x-auto scroll-smooth" ref={scrollContainerRef}>
            <motion.div 
              className="flex gap-6 pb-2" 
              style={{ 
                minWidth: 'max-content',
                paddingLeft: `${scrollPadding}px`,
                paddingRight: `${Math.max(scrollPadding, 100)}px` // 우측 패딩은 최소 100px 보장
              }}
              layout
            >
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
                className="bg-white rounded-xl p-6 hover:shadow-lg h-96 flex flex-col w-[480px] flex-shrink-0 shadow-sm"
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-gray-700">
                    페이지 {index + 1}
                  </span>
                  {pages.length > 1 && (
                    <button
                      onClick={() => removePage(page.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <input
                  type="text"
                  value={page.topic}
                  onChange={(e) => {
                    const updated = [...pages];
                    updated[index] = { ...page, topic: e.target.value };
                    setPages(updated);
                  }}
                  placeholder="페이지 주제"
                  className="w-full px-4 py-3 mb-4 rounded-xl bg-gray-50 border-2 border-transparent text-lg focus:outline-none focus:bg-white focus:border-[#3e88ff] transition-all text-gray-900 placeholder-gray-400"
                />
                
                <textarea
                  value={page.description}
                  onChange={(e) => {
                    const updated = [...pages];
                    updated[index] = { ...page, description: e.target.value };
                    setPages(updated);
                  }}
                  placeholder="페이지 설명 (선택)"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent text-base focus:outline-none focus:bg-white focus:border-[#3e88ff] transition-all resize-none flex-1 text-gray-900 placeholder-gray-400"
                />
              </motion.div>
            ))}
            </AnimatePresence>
            
            {/* 새 페이지 추가 버튼 - 아이콘 형태 */}
            <motion.div 
              className="flex items-center justify-center w-20 flex-shrink-0"
              layout
              transition={{ duration: 0.3 }}
            >
              <motion.button
                ref={addButtonRef}
                onClick={addNewPage}
                className="w-14 h-14 rounded-full bg-white shadow-sm border-2 border-gray-200 hover:border-[#3e88ff] flex items-center justify-center hover:shadow-md group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <svg className="w-7 h-7 text-gray-400 group-hover:text-[#3e88ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </motion.button>
            </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 하단 영역: 추가 제안사항 */}
      <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 pb-8">
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">추가 제안사항</h3>
          <textarea
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            placeholder="특별한 요구사항이나 스타일 지침을 입력하세요. AI가 콘텐츠를 생성할 때 이를 참고합니다."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:outline-none focus:bg-white focus:border-[#3e88ff] transition-all resize-none h-24 text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* 최하단 버튼 */}
        <div className="flex justify-between items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white text-gray-700 rounded-full hover:bg-gray-50 transition-all shadow-sm"
            >
              이전으로
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="ml-auto px-8 py-3 text-white rounded-full transition-all font-medium shadow-sm"
            style={{
              backgroundColor: '#3e88ff'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2c6ae6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3e88ff'}
          >
            다음 단계로 →
          </button>
        </div>
      </div>
    </div>
  );
};