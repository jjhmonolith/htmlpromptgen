import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectData, PageInfo } from '../../../types/workflow.types';
import { LearningJourneyGeneratorService } from '../../../services/learning-journey-generator.service';
import { OpenAIService } from '../../../services/openai.service';
import { loadApiKey } from '../../../services/storage.service';
import { ApiKeyManager } from '../../ApiKeyManager/ApiKeyManager';

interface Step1BasicInfoProps {
  initialData?: ProjectData | null;
  onComplete: (data: ProjectData) => void;
  onBack?: () => void;
  onDataChange?: (data: Partial<ProjectData>) => void; // 실시간 데이터 변경 알림
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
  initialData,
  onComplete,
  onBack,
  onDataChange
}) => {
  const [projectTitle, setProjectTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [pages, setPages] = useState<PageInfo[]>([
    { id: '1', pageNumber: 1, topic: '', description: '' }
  ]);
  const [layoutMode, setLayoutMode] = useState<'fixed' | 'scrollable'>('scrollable');
  const [contentMode, setContentMode] = useState<'enhanced' | 'restricted'>('enhanced');
  const [suggestions, setSuggestions] = useState('');

  // Learning Journey Designer 상태 추가
  const [isLearningJourneyExpanded, setIsLearningJourneyExpanded] = useState(false);
  const [emotionalArc, setEmotionalArc] = useState('');
  const [learnerPersona, setLearnerPersona] = useState('');
  const [ahaMoments, setAhaMoments] = useState<Record<string, string>>({});
  const [isGeneratingJourney, setIsGeneratingJourney] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);

  
  // 초기 데이터 로딩 (한 번만 실행)
  const hasLoadedInitialData = useRef(false);
  
  useEffect(() => {
    // 초기 데이터가 있고, 아직 로드하지 않은 경우에만 실행
    if (initialData && !hasLoadedInitialData.current) {
      setProjectTitle(initialData.projectTitle || '');
      setTargetAudience(initialData.targetAudience || '');
      setPages(initialData.pages || [{ id: '1', pageNumber: 1, topic: '', description: '' }]);
      setLayoutMode(initialData.layoutMode || 'scrollable');
      setContentMode(initialData.contentMode || 'enhanced');
      setSuggestions(
        typeof initialData.suggestions === 'string'
          ? initialData.suggestions
          : Array.isArray(initialData.suggestions)
            ? initialData.suggestions[0] || ''
            : ''
      );

      // Learning Journey 초기 데이터 로드
      // Learning Journey 데이터가 있으면 확장 상태로 설정하고 생성 완료 표시
      if (initialData.emotionalArc || initialData.learnerPersona || initialData.ahaMoments) {
        setIsLearningJourneyExpanded(true);
      }
      if (initialData.emotionalArc) setEmotionalArc(initialData.emotionalArc);
      if (initialData.learnerPersona) setLearnerPersona(initialData.learnerPersona);
      if (initialData.ahaMoments && Array.isArray(initialData.ahaMoments)) {
        const momentsObj: Record<string, string> = {};
        initialData.ahaMoments.forEach((moment, index) => {
          momentsObj[index.toString()] = moment;
        });
        setAhaMoments(momentsObj);
      }
      
      hasLoadedInitialData.current = true;
      setIsDataLoaded(true);
    }
  }, [initialData]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 현재 폼 데이터를 ProjectData 형태로 변환하는 함수
  const getCurrentFormData = (): Partial<ProjectData> => ({
    id: initialData?.id || `project_${Date.now()}`,
    projectTitle: projectTitle.trim(),
    targetAudience: targetAudience.trim(),
    pages: pages.filter(p => p.topic.trim()).map((p, idx) => ({
      id: p.id,
      pageNumber: idx + 1,
      topic: p.topic,
      description: p.description
    })),
    layoutMode,
    contentMode,
    suggestions: suggestions.trim() ? [suggestions.trim()] : undefined,
    emotionalArc: emotionalArc.trim() || undefined,
    learnerPersona: learnerPersona.trim() || undefined,
    ahaMoments: Object.values(ahaMoments).filter(moment => moment.trim()).length > 0 ? Object.values(ahaMoments).filter(moment => moment.trim()) : undefined,
    createdAt: initialData?.createdAt || new Date()
  });

  // 이전 데이터 해시 추적용 ref
  const lastDataHashRef = useRef('');

  // 실시간 데이터 변경 알림 (디바운스 적용)
  useEffect(() => {
    // 데이터가 로드되지 않았으면 스킵
    if (!isDataLoaded) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      if (onDataChange) {
        const currentData = getCurrentFormData();
        
        // 현재 데이터의 해시 생성 (변경 감지용)
        const currentHash = JSON.stringify({
          projectTitle: projectTitle.trim(),
          targetAudience: targetAudience.trim(),
          pages: pages.filter(p => p.topic.trim()),
          layoutMode,
          contentMode,
          suggestions: suggestions.trim() || null, // 빈 문자열은 null로 통일
          emotionalArc: emotionalArc.trim() || null,
          learnerPersona: learnerPersona.trim() || null,
          ahaMoments: Object.values(ahaMoments).filter(moment => moment.trim())
        });
        
        // 실제로 변경된 경우에만 알림 및 로그
        if (currentHash !== lastDataHashRef.current) {
          lastDataHashRef.current = currentHash;
          onDataChange(currentData);
        }
      }
    }, 500); // 0.5초 디바운스

    return () => clearTimeout(timeoutId);
  }, [projectTitle, targetAudience, pages, layoutMode, contentMode, suggestions, emotionalArc, learnerPersona, ahaMoments, onDataChange]);
  
  // 테스트 모드용 목업 데이터
  const mockData = {
    projectTitle: '초등학교 3학년 과학 - 물의 순환',
    targetAudience: '초등학교 3학년, 8-9세',
    layoutMode: 'scrollable' as const,
    contentMode: 'enhanced' as const,
    pages: [
      {
        id: '1',
        pageNumber: 1,
        topic: '물의 순환이란 무엇일까?',
        description: '물의 순환의 개념과 중요성에 대해 학습합니다. 일상생활에서 볼 수 있는 물의 변화를 관찰하고 이해합니다.'
      },
      {
        id: '2', 
        pageNumber: 2,
        topic: '증발과 응결 과정',
        description: '태양 에너지에 의한 물의 증발과 구름 형성 과정을 시각적 자료와 함께 학습합니다.'
      },
      {
        id: '3',
        pageNumber: 3,
        topic: '강수와 지표수의 흐름',
        description: '비와 눈이 내리는 과정, 강과 바다로 흘러가는 물의 흐름을 이해하고 물의 순환 사이클을 완성합니다.'
      }
    ],
    suggestions: '시각적 애니메이션과 실험 활동을 포함해 주세요. 아이들이 직접 관찰할 수 있는 예시를 많이 넣어주시고, 퀴즈나 상호작용 요소도 추가해 주세요.',
    emotionalArc: '호기심 → 놀라움 → 이해 → 성취감',
    learnerPersona: '초등학교 3학년 민수와 지영이. 과학을 어려워하지만 실험과 관찰을 좋아하고, 물에 대한 기본적인 호기심이 있어요.',
    ahaMoments: [
      '물이 사라진다고 생각했는데 하늘로 올라간다는 사실!',
      '구름이 물방울로 이루어져 있다는 발견!',
      '비가 내려서 바다로 돌아가는 순환 과정의 이해!'
    ]
  };
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [scrollPadding, setScrollPadding] = useState<number>(0);
  
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

  // 마우스 휠로 가로 스크롤 - 정확한 픽셀 정규화와 네이티브 감각
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Shift나 이미 가로 휠이면 그대로 둠
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // 가로 스크롤 여지가 없으면 반환
      if (el.scrollWidth <= el.clientWidth) return;

      // 끝단에서 반대 방향으로는 상위로 넘겨 세로 스크롤 허용
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      const tryingLeft = e.deltaY < 0;
      const tryingRight = e.deltaY > 0;
      if ((tryingLeft && atStart) || (tryingRight && atEnd)) return;

      // 상하 스크롤을 좌우 스크롤로 1:1 변환
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);



  // 페이지 추가 함수
  const addNewPage = () => {
    const newId = Math.max(...pages.map(p => parseInt(p.id)), 0) + 1;
    const newPage = {
      id: newId.toString(),
      pageNumber: pages.length + 1,
      topic: '',
      description: ''
    };
    
    if (addButtonRef.current && scrollContainerRef.current) {
      const buttonRect = addButtonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      const cardWidth = 480;
      const cardGap = 24; 
      const newCardSpace = cardWidth + cardGap;
      const buttonWidth = buttonRect.width || 80; // 실제 버튼 너비 사용
      
      // + 버튼의 우측 여백 계산 (화면 기준)
      const rightSpace = viewportWidth - buttonRect.right;
      
      console.log('Debug - rightSpace:', rightSpace, 'buttonWidth:', buttonWidth, 'newCardSpace:', newCardSpace);
      
      // Case 1: + 버튼이 새 카드를 추가해도 화면 안에 있는 경우 - 스크롤 없음
      if (rightSpace >= newCardSpace + buttonWidth) {
        console.log('Case 1: No scroll needed');
        setPages([...pages, newPage]);
      }
      // Case 2: + 버튼이 이미 화면 우측 끝 근처에 있는 경우 - 기존 카드들을 좌측으로 이동
      else if (rightSpace <= buttonWidth + cardGap * 2) { // 버튼 너비 + 여유 공간
        console.log('Case 2: Scroll to max after adding card');
        // 먼저 카드 추가 (오른쪽에 새 카드가 생김)
        setPages([...pages, newPage]);
        
        // 스크롤을 최대 한도까지
        setTimeout(() => {
          if (scrollContainerRef.current) {
            const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
            scrollContainerRef.current.scrollTo({
              left: maxScroll,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
      // Case 3: 중간 상태 - 스크롤을 끝까지
      else {
        console.log('Case 3: Scroll to max after adding card');
        // 먼저 카드 추가
        setPages([...pages, newPage]);
        
        // 스크롤을 최대 한도까지
        setTimeout(() => {
          if (scrollContainerRef.current) {
            const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
            scrollContainerRef.current.scrollTo({
              left: maxScroll,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    } else {
      // fallback
      setPages([...pages, newPage]);
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


  // AI로 Learning Journey 생성
  const generateLearningJourney = async () => {
    if (!projectTitle.trim() || !targetAudience.trim() || pages.filter(p => p.topic.trim()).length === 0) {
      alert('프로젝트 제목, 대상, 페이지를 먼저 입력해주세요.');
      return;
    }

    // API 키 체크
    const apiKey = loadApiKey();
    if (!apiKey) {
      setShowApiKeyManager(true);
      return;
    }

    setIsGeneratingJourney(true);
    try {
      const openAIService = OpenAIService.getInstance();
      openAIService.reloadApiKey(); // API 키 재로드
      const journeyService = new LearningJourneyGeneratorService(openAIService);

      const validPages = pages.filter(p => p.topic.trim());
      const result = await journeyService.generateLearningJourney(
        projectTitle,
        targetAudience,
        validPages
      );

      setEmotionalArc(result.emotionalArc);
      setLearnerPersona(result.learnerPersona);
      const momentsObj: Record<string, string> = {};
      result.ahaMoments.forEach((moment, index) => {
        momentsObj[index.toString()] = moment;
      });
      setAhaMoments(momentsObj);
      setIsLearningJourneyExpanded(true);
    } catch (error) {
      console.error('Learning Journey 생성 실패:', error);
      alert('Learning Journey 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingJourney(false);
    }
  };

  // API 키 매니저 콜백 함수들
  const handleApiKeyValidated = (_key: string) => {
    setShowApiKeyManager(false);
    // API 키 설정 후 자동으로 Learning Journey 생성 시도
    setTimeout(() => {
      generateLearningJourney();
    }, 500);
  };

  const handleApiKeyCancel = () => {
    setShowApiKeyManager(false);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const projectData = createProjectData();
    onComplete(projectData);
  };

  // 공통 프로젝트 데이터 생성 함수
  const createProjectData = (): ProjectData => {
    const validPages = pages.filter(p => p.topic.trim());
    return {
      id: initialData?.id || `project_${Date.now()}`,
      projectTitle: projectTitle.trim(),
      targetAudience: targetAudience.trim(),
      pages: validPages.map((p, idx) => ({
        id: p.id,
        pageNumber: idx + 1,
        topic: p.topic,
        description: p.description
      })),
      layoutMode,
      contentMode,
      suggestions: suggestions.trim() ? [suggestions.trim()] : undefined,
      emotionalArc: emotionalArc.trim() || undefined,
      learnerPersona: learnerPersona.trim() || undefined,
      ahaMoments: Object.values(ahaMoments).filter(moment => moment.trim()).length > 0 ? Object.values(ahaMoments).filter(moment => moment.trim()) : undefined,
      createdAt: initialData?.createdAt || new Date()
    };
  };


  // API 키 매니저 표시 중이면 해당 컴포넌트만 렌더링
  if (showApiKeyManager) {
    return (
      <ApiKeyManager
        onKeyValidated={handleApiKeyValidated}
        onCancel={handleApiKeyCancel}
      />
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f7' }}>

      {/* 상단 흰색 영역 - 뷰포트 전체 너비 */}
      <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-white shadow-sm pt-10 pb-5">
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12">
          {/* 상단 영역: 기본 정보 + 프로젝트 설정 (3등분) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1/3: 기본 정보 */}
          <div className="pb-2">
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
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.projectTitle ? 'border-red-400 bg-red-50' : 'border-[#f5f5f7] bg-white hover:border-gray-300'
                  } focus:outline-none focus:border-[#3e88ff] focus:border-2 transition-all text-lg text-gray-900 placeholder-gray-400`}
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
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.targetAudience ? 'border-red-400 bg-red-50' : 'border-[#f5f5f7] bg-white hover:border-gray-300'
                  } focus:outline-none focus:border-[#3e88ff] focus:border-2 transition-all text-lg text-gray-900 placeholder-gray-400`}
                />
                {errors.targetAudience && (
                  <p className="text-red-500 text-xs mt-2 ml-1">{errors.targetAudience}</p>
                )}
              </div>
            </div>
          </div>

          {/* 2/3: 레이아웃 */}
          <div className="pb-2">
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

      {/* 페이지 구성 영역 - 뷰포트 전체 너비, 회색 배경 */}
      <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] pt-8 pb-6" style={{ backgroundColor: '#f5f5f7' }}>
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
                backgroundColor: '#3e88ff'
              }}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2c6ae6'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3e88ff'}
            >
              + 새 페이지
            </button>
          </div>
        </div>

        {/* 페이지 구성 스크롤 영역 - 전체 화면 폭 사용 */}
        <div className="w-full">
          <div className="scroll-container" ref={scrollContainerRef}>
            <motion.div
              className="flex gap-6 pb-4 pt-2"
              style={{
                minWidth: 'max-content',
                paddingLeft: `${scrollPadding}px`,
                paddingRight: '24px' // 카드 간 간격과 동일하게 설정 (gap-6 = 24px)
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
        
        {/* Learning Journey Designer 영역 */}
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 mt-6">
          {/* Learning Journey 모드 선택 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-6 mb-6 transition-all duration-300 hover:scale-[1.011]"
               onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px 2px rgba(0, 0, 0, 0.08)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'; }}
               style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Learning Journey Designer</h2>
                <p className="text-sm text-gray-500">학습자의 감정적 여정과 페르소나를 설계하여 더욱 효과적인 교육 경험을 만들어보세요.</p>
              </div>

              {/* AI 생성 버튼 */}
              <button
                onClick={generateLearningJourney}
                disabled={isGeneratingJourney || !projectTitle.trim() || !targetAudience.trim() || pages.filter(p => p.topic.trim()).length === 0}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  isGeneratingJourney || !projectTitle.trim() || !targetAudience.trim() || pages.filter(p => p.topic.trim()).length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl'
                }`}
              >
                {isGeneratingJourney ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    생성 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI로 생성하기
                  </>
                )}
              </button>
            </div>

            {/* 확장된 상태 - Learning Journey 생성 후 또는 기존 데이터가 있을 때 */}
            {isLearningJourneyExpanded && (
              <div className="mt-6 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 감정적 여정 */}
                  <div className="bg-white rounded-3xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">감정적 여정</h3>
                    <textarea
                      value={emotionalArc}
                      onChange={(e) => setEmotionalArc(e.target.value)}
                      placeholder="예: 호기심 → 놀라움 → 이해 → 성취감"
                      className="w-full px-4 py-3 rounded-xl border border-[#f5f5f7] bg-white hover:border-gray-300 focus:outline-none focus:border-[#3e88ff] focus:border-2 transition-all resize-none h-20 text-base text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* 학습자 페르소나 */}
                  <div className="bg-white rounded-3xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">학습자 페르소나</h3>
                    <textarea
                      value={learnerPersona}
                      onChange={(e) => setLearnerPersona(e.target.value)}
                      placeholder="예: 초등학교 3학년 민수와 지영이. 과학을 어려워하지만 실험과 관찰을 좋아하고..."
                      className="w-full px-4 py-3 rounded-xl border border-[#f5f5f7] bg-white hover:border-gray-300 focus:outline-none focus:border-[#3e88ff] focus:border-2 transition-all resize-none h-20 text-base text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* 아하! 순간들 */}
                <div className="bg-white rounded-3xl p-6">
                  <div className="flex items-center mb-3">
                    <h3 className="font-semibold text-gray-900">각 페이지별 아하! 순간</h3>
                    <span className="text-xs text-gray-600 ml-2">({pages.filter(p => p.topic.trim()).length}개 페이지)</span>
                  </div>
                  <div className="space-y-2">
                    {pages.filter(p => p.topic.trim()).map((_, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 min-w-[20px]">
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          value={ahaMoments[index.toString()] || ''}
                          onChange={(e) => {
                            setAhaMoments(prev => ({
                              ...prev,
                              [index.toString()]: e.target.value
                            }));
                          }}
                          placeholder={`페이지 ${index + 1}의 아하! 순간을 작성하세요`}
                          className="flex-1 px-4 py-3 rounded-xl border border-[#f5f5f7] bg-white hover:border-gray-300 focus:outline-none focus:border-[#3e88ff] focus:border-2 transition-all text-base text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 추가 제안사항 */}
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12">
          <div className="bg-white rounded-3xl px-6 py-4 mb-3 transition-all duration-300 hover:scale-[1.011]"
               onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px 2px rgba(0, 0, 0, 0.08)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'; }}
               style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">추가 제안사항</h3>
            <textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="특별한 요구사항이나 스타일 지침을 입력하세요. AI가 콘텐츠를 생성할 때 이를 참고합니다."
              className="w-full px-4 py-3 rounded-xl border border-[#f5f5f7] bg-white hover:border-gray-300 focus:outline-none focus:border-[#3e88ff] focus:border-2 transition-all resize-none h-24 text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>


        {/* 네비게이션 버튼들 */}
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 mt-8">
          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-all font-medium"
            >
              ← 이전
            </button>

            <div className="flex gap-3">
              {/* 다음 버튼 */}
              <button
                onClick={handleSubmit}
                className="px-8 py-3 text-white rounded-full transition-all font-medium shadow-sm"
                style={{
                  backgroundColor: '#3e88ff'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2c6ae6'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3e88ff'}
              >
                다음 단계로 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Step1BasicInfo;
