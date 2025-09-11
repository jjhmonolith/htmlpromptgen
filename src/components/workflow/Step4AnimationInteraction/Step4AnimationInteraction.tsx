import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectData, VisualIdentity, LayoutProposal, PageEnhancement } from '../../../types/workflow.types';
import { AnimationInteractionService } from '../../../services/animation.interaction.service';
import { generateDataHash, getChangedFields, isDeepEqual } from '../../../utils/dataComparison.utils';

interface Step4AnimationInteractionProps {
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  layoutProposals: LayoutProposal[];
  initialData?: PageEnhancement[] | null;
  onComplete: (pageEnhancements: PageEnhancement[]) => void;
  onBack: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  onEnhancementsGenerated?: (enhancements: PageEnhancement[]) => void;
}

export const Step4AnimationInteraction: React.FC<Step4AnimationInteractionProps> = ({
  projectData,
  visualIdentity,
  layoutProposals,
  initialData,
  onComplete,
  onBack,
  onGeneratingChange,
  onEnhancementsGenerated
}) => {
  const [pageEnhancements, setPageEnhancements] = useState<PageEnhancement[] | null>(initialData || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [needsRegeneration, setNeedsRegeneration] = useState(false);
  const [regenerationReason, setRegenerationReason] = useState('');
  const [showRegenerationNotice, setShowRegenerationNotice] = useState(false);

  const animationService = new AnimationInteractionService();

  // 해시 기반 변경 감지 시스템
  const [lastGeneratedHash, setLastGeneratedHash] = useState<string>('');
  const [lastGeneratedWith, setLastGeneratedWith] = useState<{
    projectData: ProjectData;
    visualIdentity: VisualIdentity;
    layoutProposals: LayoutProposal[];
  } | null>(null);
  
  // 현재 입력 데이터의 해시 계산
  const currentInputHash = React.useMemo(() => {
    return generateDataHash({ projectData, visualIdentity, layoutProposals });
  }, [projectData, visualIdentity, layoutProposals]);

  // initialData 동기화 - 경합 조건 방지
  useEffect(() => {
    if (!needsRegeneration && initialData && initialData.length > 0 && (!pageEnhancements || pageEnhancements.length === 0)) {
      console.log('Step4: initialData를 pageEnhancements에 안전하게 적용:', {
        initialDataCount: initialData.length,
        currentEnhancementsCount: pageEnhancements?.length || 0,
        needsRegeneration
      });
      setPageEnhancements(initialData);
      
      if (!lastGeneratedHash) {
        setLastGeneratedHash(currentInputHash);
      }
    }
  }, [initialData, needsRegeneration, pageEnhancements, lastGeneratedHash, currentInputHash]);

  // 자동 생성 시작
  const startGeneration = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    onGeneratingChange?.(true);
    setError(null);
    setGenerationProgress(0);
    setCurrentPageIndex(0);
    setGenerationMessage('페이지별 애니메이션과 상호작용을 설계하고 있습니다...');

    // 진행 상태 시뮬레이션
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8;
      });
    }, 1000);

    const messages = [
      '페이지별 애니메이션과 상호작용을 설계하고 있습니다...',
      '로딩 시퀀스와 진입 애니메이션을 계획합니다...',
      '스크롤 트리거 애니메이션을 최적화합니다...',
      '마이크로 인터랙션과 피드백을 설계합니다...',
      '접근성과 성능을 고려한 애니메이션을 완성합니다...'
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < messages.length - 1) {
        messageIndex++;
        setGenerationMessage(messages[messageIndex]);
        setCurrentPageIndex(Math.min(messageIndex, layoutProposals.length - 1));
      }
    }, 4000);

    try {
      const result = await animationService.generatePageEnhancements(projectData, visualIdentity, layoutProposals);
      
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setGenerationProgress(100);
      setGenerationMessage('애니메이션 및 상호작용 설계가 완료되었습니다!');
      
      setTimeout(() => {
        setPageEnhancements(result);
        setIsGenerating(false);
        onGeneratingChange?.(false);
        setCurrentPageIndex(0);
        
        // 생성 완료 시 사용한 데이터를 기록
        setLastGeneratedHash(currentInputHash);
        setLastGeneratedWith({
          projectData: { ...projectData },
          visualIdentity: { ...visualIdentity },
          layoutProposals: [...layoutProposals]
        });
        
        // 생성된 enhancements를 부모 컴포넌트에 알림
        onEnhancementsGenerated?.(result);
      }, 1000);

    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setError(err instanceof Error ? err.message : '애니메이션 설계에 실패했습니다.');
      setIsGenerating(false);
      onGeneratingChange?.(false);
      setGenerationProgress(0);
    }
  };

  // 해시 기반 변경 감지 및 재생성 필요 여부 체크
  useEffect(() => {
    if (pageEnhancements && pageEnhancements.length > 0 && lastGeneratedHash) {
      const hasInputChanged = currentInputHash !== lastGeneratedHash;
      
      console.log('Step4 해시 기반 변경 감지:', { 
        currentHash: currentInputHash, 
        lastHash: lastGeneratedHash, 
        hasChanged: hasInputChanged 
      });
      
      if (hasInputChanged && lastGeneratedWith) {
        const hasProjectChanged = !isDeepEqual(lastGeneratedWith.projectData, projectData);
        const hasVisualChanged = !isDeepEqual(lastGeneratedWith.visualIdentity, visualIdentity);
        const hasLayoutChanged = !isDeepEqual(lastGeneratedWith.layoutProposals, layoutProposals);
        
        const changedFields = [
          ...(hasProjectChanged ? getChangedFields(lastGeneratedWith.projectData, projectData, 'projectData') : []),
          ...(hasVisualChanged ? getChangedFields(lastGeneratedWith.visualIdentity, visualIdentity, 'visualIdentity') : []),
          ...(hasLayoutChanged ? getChangedFields(lastGeneratedWith.layoutProposals, layoutProposals, 'layoutProposals') : [])
        ];
        
        console.log('Step4 이전 단계 데이터 변경 감지:', { changedFields });
        
        setNeedsRegeneration(true);
        setRegenerationReason(`이전 단계에서 변경된 항목: ${changedFields.join(', ')}`);
        setShowRegenerationNotice(true);
      }
    }
  }, [currentInputHash, lastGeneratedHash, pageEnhancements, lastGeneratedWith, projectData, visualIdentity, layoutProposals]);

  // 컴포넌트 마운트 시 조건부 자동 생성
  useEffect(() => {
    const shouldAutoGenerate = (
      !pageEnhancements &&
      !isGenerating &&
      !needsRegeneration &&
      (!initialData || initialData.length === 0)
    );
    
    console.log('Step4 자동 생성 조건 체크:', { 
      hasEnhancements: !!pageEnhancements,
      isGenerating,
      needsRegeneration,
      hasInitialData: !!(initialData && initialData.length > 0),
      shouldAutoGenerate 
    });
    
    if (shouldAutoGenerate) {
      const timer = setTimeout(() => {
        console.log('Step4 자동 생성 시작');
        startGeneration();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [pageEnhancements, isGenerating, needsRegeneration, initialData]);

  // 재생성 처리 함수
  const handleRegenerate = () => {
    console.log('Step4 재생성 시작:', { reason: regenerationReason });
    
    setNeedsRegeneration(false);
    setShowRegenerationNotice(false);
    setRegenerationReason('');
    setPageEnhancements(null);
    setError(null);
    
    setLastGeneratedHash('');
    setLastGeneratedWith(null);
    
    startGeneration();
  };

  // 재생성 건너뛰기
  const handleSkipRegeneration = () => {
    console.log('Step4 재생성 건너뛰기 - 현재 데이터 유지');
    
    setLastGeneratedHash(currentInputHash);
    setLastGeneratedWith({
      projectData: { ...projectData },
      visualIdentity: { ...visualIdentity },
      layoutProposals: [...layoutProposals]
    });
    
    setNeedsRegeneration(false);
    setShowRegenerationNotice(false);
    setRegenerationReason('');
  };

  // 완료 처리
  const handleComplete = () => {
    if (!pageEnhancements) return;
    
    setLastGeneratedHash(currentInputHash);
    
    console.log('Step4 완료 처리:', { enhancementsCount: pageEnhancements.length });
    onComplete(pageEnhancements);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
      {/* 상단 헤더 */}
      <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-white pt-14 pb-5">
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12">
          {/* 프로젝트 정보 요약 */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">프로젝트</h3>
                <p className="text-gray-700 text-sm">{projectData.projectTitle}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">분위기</h3>
                <p className="text-gray-700 text-sm">{visualIdentity.moodAndTone.split(',')[0].trim()}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">레이아웃</h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">
                    {projectData.layoutMode === 'scrollable' ? '🎬' : '⚡'}
                  </span>
                  <p className="text-gray-700 text-sm">
                    {projectData.layoutMode === 'scrollable' ? '스크롤 애니메이션' : '트랜지션 중심'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">페이지 수</h3>
                <p className="text-gray-700 text-sm">{layoutProposals.length}개</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 py-8">
        <AnimatePresence mode="wait">
          {/* 재생성 안내 모달 */}
          {showRegenerationNotice && (
            <motion.div
              key="regeneration-notice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl p-8 max-w-2xl mx-4 shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">이전 단계 데이터 변경 감지</h3>
                  <p className="text-gray-600 leading-relaxed">
                    이전 단계에서 데이터가 변경되었습니다. 애니메이션과 상호작용을 새로 생성하시겠습니까?
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">변경된 항목:</h4>
                  <p className="text-sm text-gray-700">{regenerationReason}</p>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleSkipRegeneration}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all font-medium"
                  >
                    기존 결과 유지
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="px-6 py-3 bg-[#3e88ff] text-white rounded-full hover:bg-[#2c6ae6] transition-all font-medium"
                  >
                    새로 생성하기
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  기존 결과를 유지하면 변경된 데이터와 일치하지 않을 수 있습니다
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* 로딩 상태 */}
          {isGenerating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="max-w-2xl mx-auto">
                {/* 로딩 애니메이션 */}
                <div className="mb-8">
                  <div className="w-32 h-32 mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-[#3e88ff] border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    ></motion.div>
                    {/* 중앙 애니메이션 아이콘 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div 
                        className="text-4xl"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🎬
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* 진행률 */}
                <div className="mb-8">
                  <div className="bg-gray-200 rounded-full h-3 mb-3">
                    <motion.div
                      className="bg-[#3e88ff] h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{Math.round(generationProgress)}% 완료</p>
                </div>

                {/* 현재 처리 중인 페이지 */}
                {layoutProposals.length > 1 && currentPageIndex < layoutProposals.length && (
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      {layoutProposals.map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index <= currentPageIndex ? 'bg-[#3e88ff]' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      페이지 {currentPageIndex + 1}: {layoutProposals[currentPageIndex]?.pageTitle}
                    </p>
                  </div>
                )}

                {/* 메시지 */}
                <motion.div
                  key={generationMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <p className="text-lg text-gray-700 font-medium mb-2">
                    {generationMessage}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      애니메이션 설계
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      상호작용 계획
                    </div>
                  </div>
                </motion.div>

                <p className="text-sm text-gray-500">
                  복잡도에 따라 30-90초 소요됩니다
                </p>
              </div>
            </motion.div>
          )}

          {/* 에러 상태 */}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">애니메이션 설계 실패</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
                <button
                  onClick={handleRegenerate}
                  className="px-8 py-3 bg-[#3e88ff] text-white rounded-full hover:bg-[#2c6ae6] transition-all font-medium shadow-sm"
                >
                  다시 시도
                </button>
              </div>
            </motion.div>
          )}

          {/* 생성 완료 상태 */}
          {pageEnhancements && !isGenerating && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* 페이지 탭 네비게이션 */}
              {pageEnhancements.length > 1 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">페이지별 애니메이션 & 상호작용</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {pageEnhancements.map((enhancement, index) => {
                      const pageTitle = layoutProposals.find(p => p.pageId === enhancement.pageId)?.pageTitle || `페이지 ${index + 1}`;
                      return (
                        <button
                          key={enhancement.pageId}
                          onClick={() => setSelectedPageIndex(index)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                            selectedPageIndex === index
                              ? 'bg-[#3e88ff] text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {index + 1}. {pageTitle}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 선택된 페이지의 애니메이션 상세 */}
              {pageEnhancements[selectedPageIndex] && (
                <PageEnhancementDetail
                  enhancement={pageEnhancements[selectedPageIndex]}
                  projectData={projectData}
                  visualIdentity={visualIdentity}
                  layoutProposal={layoutProposals.find(p => p.pageId === pageEnhancements[selectedPageIndex].pageId)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단 네비게이션 */}
      {pageEnhancements && !isGenerating && (
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 pb-8">
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white text-gray-700 rounded-full hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
            >
              ← 이전 단계
            </button>
            
            <div className="flex gap-4 items-center">
              <button
                onClick={handleRegenerate}
                className="px-6 py-3 bg-white text-gray-700 rounded-full hover:bg-gray-50 transition-all font-medium shadow-sm border border-gray-200"
              >
                전체 재생성
              </button>
              <button
                onClick={handleComplete}
                className="px-8 py-3 bg-[#3e88ff] text-white rounded-full hover:bg-[#2c6ae6] transition-all font-medium shadow-sm"
              >
                다음 단계로 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 개별 페이지 애니메이션 상세 컴포넌트
interface PageEnhancementDetailProps {
  enhancement: PageEnhancement;
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  layoutProposal?: LayoutProposal;
}

const PageEnhancementDetail: React.FC<PageEnhancementDetailProps> = ({
  enhancement,
  projectData,
  visualIdentity,
  layoutProposal
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string>('');

  // Step3 요소와 Step4 인터랙션 매핑 확인
  const step3Elements = layoutProposal?.detailedElements || [];
  const step4Interactions = enhancement.elementInteractions || [];

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {enhancement.pageTitle}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>✅ Step3 요소: {step3Elements.length}개</span>
              <span>🎬 Step4 인터랙션: {step4Interactions.length}개</span>
              <span>🔗 매핑률: {Math.round((step4Interactions.length / Math.max(step3Elements.length, 1)) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* 요소 선택 탭 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedElementId('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedElementId === ''
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🏠 전체 개요
          </button>
          {step4Interactions.map((interaction, index) => {
            const step3Element = step3Elements.find(el => el.elementName === interaction.elementId);
            return (
              <button
                key={index}
                onClick={() => setSelectedElementId(interaction.elementId)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedElementId === interaction.elementId
                    ? 'bg-green-100 text-green-700 border-2 border-green-200'
                    : step3Element
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {step3Element ? 
                  `${step3Element.elementType === 'header' ? '🏠' :
                    step3Element.elementType === 'content' ? '📄' :
                    step3Element.elementType === 'sidebar' ? '📋' :
                    step3Element.elementType === 'footer' ? '👇' :
                    step3Element.elementType === 'media' ? '🖼️' : '⚡'} ${interaction.elementId}` 
                  : `❌ ${interaction.elementId}`
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 콘텐츠 */}
      <AnimatePresence mode="wait">
        {selectedElementId === '' ? (
          // 전체 개요
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 페이지 전환 시퀀스 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🎬 페이지 로드 시퀀스
              </h4>
              <div className="space-y-3">
                {enhancement.pageTransitions?.pageLoad?.sequence?.map((step, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{step.description}</div>
                      <div className="text-sm text-gray-600">
                        요소들: {step.elements.join(', ')} • 지연: {step.delay}
                      </div>
                    </div>
                  </div>
                )) || <p className="text-gray-500">페이지 전환 시퀀스 정보가 없습니다.</p>}
              </div>
            </div>

            {/* 글로벌 애니메이션 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🌐 글로벌 애니메이션 설정
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900 mb-2">스크롤 동작</div>
                  <div className="text-sm text-gray-700">
                    {enhancement.globalAnimations?.scrollBehavior || '설정 없음'}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900 mb-2">반응형 애니메이션</div>
                  <div className="text-sm text-gray-700">
                    {enhancement.globalAnimations?.responsiveAnimations || '설정 없음'}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg lg:col-span-2">
                  <div className="font-medium text-gray-900 mb-2">성능 최적화</div>
                  <div className="text-sm text-gray-700">
                    {enhancement.globalAnimations?.performanceOptimizations || '설정 없음'}
                  </div>
                </div>
              </div>
            </div>

            {/* 요소별 매핑 상태 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🔗 Step3 ↔ Step4 요소 매핑 현황
              </h4>
              <div className="space-y-3">
                {step3Elements.map((step3Element, index) => {
                  const matchedInteraction = step4Interactions.find(
                    interaction => interaction.elementId === step3Element.elementName
                  );
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${matchedInteraction ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{step3Element.elementName}</div>
                        <div className="text-sm text-gray-600">
                          {step3Element.elementType} • {step3Element.interactionPlaceholder || '인터랙션 없음'}
                        </div>
                      </div>
                      <div className={`text-sm px-3 py-1 rounded ${
                        matchedInteraction 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {matchedInteraction ? '✅ 매핑됨' : '❌ 누락'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          // 개별 요소 상세
          <motion.div
            key={selectedElementId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {(() => {
              const interaction = step4Interactions.find(i => i.elementId === selectedElementId);
              const step3Element = step3Elements.find(el => el.elementName === selectedElementId);
              
              if (!interaction) {
                return (
                  <div className="bg-red-50 rounded-2xl p-6 text-center">
                    <p className="text-red-600">선택된 요소의 인터랙션 데이터를 찾을 수 없습니다.</p>
                  </div>
                );
              }

              return (
                <>
                  {/* Step3 요소 정보 */}
                  {step3Element && (
                    <div className="bg-blue-50 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        📐 Step3 정적 레이아웃 정보
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-2">위치 & 크기</div>
                          <div className="text-sm text-gray-700 font-mono bg-white rounded p-2">
                            {step3Element.position.width} × {step3Element.position.height}<br/>
                            top: {step3Element.position.top}, left: {step3Element.position.left}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-2">교육적 목적</div>
                          <div className="text-sm text-blue-700 bg-white rounded p-2">
                            {step3Element.purpose}
                          </div>
                        </div>
                        <div className="lg:col-span-2">
                          <div className="text-sm font-medium text-gray-900 mb-2">콘텐츠</div>
                          <div className="text-sm text-gray-700 bg-white rounded p-2 max-h-20 overflow-y-auto">
                            {step3Element.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 정적 상태 */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      🎨 정적 상태 정의
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-700 mb-3">{interaction.staticState?.description}</div>
                      <div className="font-mono text-xs bg-white rounded p-3">
                        {JSON.stringify(interaction.staticState?.initialStyling, null, 2)}
                      </div>
                    </div>
                  </div>

                  {/* 로드 애니메이션 */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      🎬 로드 애니메이션
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">타입:</span>
                          <span className="text-sm text-gray-700">{interaction.loadAnimation?.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">지속시간:</span>
                          <span className="text-sm text-gray-700">{interaction.loadAnimation?.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">지연:</span>
                          <span className="text-sm text-gray-700">{interaction.loadAnimation?.delay}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">타이밍:</span>
                          <span className="text-sm text-gray-700">{interaction.loadAnimation?.timing}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-2">교육적 목적:</div>
                        <div className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                          {interaction.loadAnimation?.educationalPurpose}
                        </div>
                      </div>
                      <div className="lg:col-span-2">
                        <div className="text-sm font-medium text-gray-900 mb-2">키프레임:</div>
                        <div className="text-sm text-gray-700 font-mono bg-gray-50 rounded p-2">
                          {interaction.loadAnimation?.keyframes}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 인터랙션 상태들 */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      ⚡ 인터랙션 상태들
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {Object.entries(interaction.interactionStates || {}).map(([state, stateData]) => (
                        <div key={state} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`w-3 h-3 rounded-full ${
                              state === 'hover' ? 'bg-blue-500' :
                              state === 'focus' ? 'bg-green-500' :
                              state === 'active' ? 'bg-orange-500' : 'bg-gray-500'
                            }`}></span>
                            <span className="font-medium text-gray-900 capitalize">{state}</span>
                          </div>
                          <div className="text-sm text-gray-700 mb-2">{stateData.description}</div>
                          <div className="text-xs font-mono bg-gray-50 rounded p-2 mb-2">
                            {JSON.stringify(stateData.styling, null, 2)}
                          </div>
                          {stateData.additionalEffects && (
                            <div className="text-xs text-purple-600 bg-purple-50 rounded p-2">
                              추가 효과: {stateData.additionalEffects}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 피드백 애니메이션 */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      🎯 피드백 애니메이션
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {Object.entries(interaction.feedbackAnimations || {}).map(([type, feedback]) => (
                        <div key={type} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-lg ${
                              type === 'success' ? '✅' :
                              type === 'error' ? '❌' : '⏳'
                            }`}></span>
                            <span className="font-medium text-gray-900 capitalize">{type}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs text-gray-600">
                              <strong>트리거:</strong> {feedback.trigger}
                            </div>
                            <div className="text-xs text-gray-600">
                              <strong>애니메이션:</strong> {feedback.animation}
                            </div>
                            <div className="text-xs text-gray-600">
                              <strong>지속시간:</strong> {feedback.duration}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 교육적 강화 */}
                  <div className="bg-green-50 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      📚 교육적 강화 요소
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium text-gray-900 mb-2">학습 지원 방식:</div>
                        <div className="text-sm text-green-700 bg-white rounded p-3">
                          {interaction.educationalEnhancements?.learningSupport}
                        </div>
                      </div>
                      {interaction.educationalEnhancements?.specialInteractions?.length > 0 && (
                        <div>
                          <div className="font-medium text-gray-900 mb-2">특별 인터랙션:</div>
                          <div className="space-y-2">
                            {interaction.educationalEnhancements.specialInteractions.map((special, index) => (
                              <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                                <div className="font-medium text-green-800 mb-1">{special.name}</div>
                                <div className="text-sm text-gray-700 mb-2">{special.description}</div>
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span><strong>트리거:</strong> {special.trigger}</span>
                                  <span><strong>효과:</strong> {special.effect}</span>
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                  <strong>목적:</strong> {special.purpose}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 기술 명세 */}
                  <div className="bg-gray-50 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      ⚙️ 기술 구현 명세
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium text-gray-900 mb-2">CSS 클래스:</div>
                        <div className="text-sm font-mono bg-white rounded p-2">
                          {interaction.technicalSpecs?.cssClasses?.join(', ') || '없음'}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 mb-2">JavaScript 이벤트:</div>
                        <div className="text-sm font-mono bg-white rounded p-2">
                          {interaction.technicalSpecs?.jsEvents?.join(', ') || '없음'}
                        </div>
                      </div>
                      <div className="lg:col-span-2">
                        <div className="font-medium text-gray-900 mb-2">접근성:</div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                          <div className="text-xs bg-white rounded p-2">
                            <strong>ARIA:</strong> {interaction.technicalSpecs?.accessibility?.ariaLabels || '없음'}
                          </div>
                          <div className="text-xs bg-white rounded p-2">
                            <strong>키보드:</strong> {interaction.technicalSpecs?.accessibility?.keyboardSupport || '없음'}
                          </div>
                          <div className="text-xs bg-white rounded p-2">
                            <strong>스크린리더:</strong> {interaction.technicalSpecs?.accessibility?.screenReader || '없음'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}