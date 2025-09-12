import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectData, VisualIdentity, LayoutProposal } from '../../../types/workflow.types';
import { LayoutProposalService } from '../../../services/layout.proposal.service';
import { generateDataHash, getChangedFields, isDeepEqual } from '../../../utils/dataComparison.utils';

interface Step3LayoutProposalProps {
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  initialData?: LayoutProposal[] | null;
  onComplete: (proposals: LayoutProposal[]) => void;
  onBack: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  onProposalsGenerated?: (proposals: LayoutProposal[]) => void;
}

export const Step3LayoutProposal: React.FC<Step3LayoutProposalProps> = ({
  projectData,
  visualIdentity,
  initialData,
  onComplete,
  onBack,
  onGeneratingChange,
  onProposalsGenerated
}) => {
  const [proposals, setProposals] = useState<LayoutProposal[] | null>(initialData || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedProposalIndex, setSelectedProposalIndex] = useState(0);
  const [needsRegeneration, setNeedsRegeneration] = useState(false);
  const [regenerationReason, setRegenerationReason] = useState('');
  const [showRegenerationNotice, setShowRegenerationNotice] = useState(false);

  const layoutProposalService = new LayoutProposalService();

  // 해시 기반 변경 감지 시스템
  const [lastGeneratedHash, setLastGeneratedHash] = useState<string>('');
  const [lastGeneratedWith, setLastGeneratedWith] = useState<{projectData: ProjectData, visualIdentity: VisualIdentity} | null>(null);
  
  // 현재 입력 데이터의 해시 계산
  const currentInputHash = React.useMemo(() => {
    return generateDataHash({ projectData, visualIdentity });
  }, [projectData, visualIdentity]);

  // initialData 동기화 - 경합 조건 방지
  useEffect(() => {
    // 재생성이 필요한 상태가 아니고, initialData가 있고, 현재 proposals가 없을 때만 적용
    if (!needsRegeneration && initialData && initialData.length > 0 && (!proposals || proposals.length === 0)) {
      console.log('Step3: initialData를 proposals에 안전하게 적용:', {
        initialDataCount: initialData.length,
        currentProposalsCount: proposals?.length || 0,
        needsRegeneration
      });
      setProposals(initialData);
      
      // initialData가 적용될 때 해시도 업데이트 (이미 생성된 것으로 간주)
      if (!lastGeneratedHash) {
        setLastGeneratedHash(currentInputHash);
      }
    }
  }, [initialData, needsRegeneration, proposals, lastGeneratedHash, currentInputHash]);

  // 자동 생성 시작
  const startGeneration = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    onGeneratingChange?.(true);
    setError(null);
    setGenerationProgress(0);
    setCurrentPageIndex(0);
    setGenerationMessage('페이지별 레이아웃 구조를 분석하고 있습니다...');

    // 진행 상태 시뮬레이션
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8;
      });
    }, 1000);

    const messages = [
      '페이지별 레이아웃 구조를 분석하고 있습니다...',
      `${projectData.layoutMode === 'scrollable' ? '스크롤형' : '고정형'} 레이아웃 최적화를 진행합니다...`,
      '콘텐츠 블록 구조를 설계하고 있습니다...',
      '이미지 배치와 시각적 요소를 계획합니다...',
      '교육 효과를 높이는 레이아웃을 완성합니다...'
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < messages.length - 1) {
        messageIndex++;
        setGenerationMessage(messages[messageIndex]);
        setCurrentPageIndex(Math.min(messageIndex, projectData.pages.length - 1));
      }
    }, 4000);

    try {
      const result = await layoutProposalService.generateLayoutProposals(projectData, visualIdentity);
      
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setGenerationProgress(100);
      setGenerationMessage('레이아웃 설계가 완료되었습니다!');
      
      setTimeout(() => {
        setProposals(result);
        setIsGenerating(false);
        onGeneratingChange?.(false);
        setCurrentPageIndex(0);
        
        // 생성 완료 시 사용한 데이터를 기록 (해시 기반)
        setLastGeneratedHash(currentInputHash);
        setLastGeneratedWith({
          projectData: { ...projectData },
          visualIdentity: { ...visualIdentity }
        });
        
        // 생성된 proposals를 부모 컴포넌트에 알림 (즉시 workflow state에 저장)
        onProposalsGenerated?.(result);
      }, 1000);

    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setError(err instanceof Error ? err.message : '레이아웃 생성에 실패했습니다.');
      setIsGenerating(false);
      onGeneratingChange?.(false);
      setGenerationProgress(0);
    }
  };

  // 해시 기반 변경 감지 및 재생성 필요 여부 체크
  useEffect(() => {
    // proposals가 있고, 이전 생성 해시가 있으면 비교
    if (proposals && proposals.length > 0 && lastGeneratedHash) {
      const hasInputChanged = currentInputHash !== lastGeneratedHash;
      
      console.log('해시 기반 변경 감지:', { 
        currentHash: currentInputHash, 
        lastHash: lastGeneratedHash, 
        hasChanged: hasInputChanged 
      });
      
      if (hasInputChanged && lastGeneratedWith) {
        // 변경된 필드 추적을 위한 상세 분석
        const hasProjectChanged = !isDeepEqual(lastGeneratedWith.projectData, projectData);
        const hasVisualChanged = !isDeepEqual(lastGeneratedWith.visualIdentity, visualIdentity);
        
        const changedFields = [
          ...(hasProjectChanged ? getChangedFields(lastGeneratedWith.projectData, projectData, 'projectData') : []),
          ...(hasVisualChanged ? getChangedFields(lastGeneratedWith.visualIdentity, visualIdentity, 'visualIdentity') : [])
        ];
        
        console.log('이전 단계 데이터 변경 감지:', { changedFields });
        
        setNeedsRegeneration(true);
        setRegenerationReason(`이전 단계에서 변경된 항목: ${changedFields.join(', ')}`);
        setShowRegenerationNotice(true);
      }
    }
  }, [currentInputHash, lastGeneratedHash, proposals, lastGeneratedWith, projectData, visualIdentity]);

  // 컴포넌트 마운트 시 조건부 자동 생성 - 경합 조건 방지
  useEffect(() => {
    // 안전한 자동 생성 조건
    const shouldAutoGenerate = (
      !proposals &&                    // proposals가 없고
      !isGenerating &&               // 생성 중이 아니고
      !needsRegeneration &&          // 재생성 필요 상태가 아니고
      (!initialData || initialData.length === 0) // initialData도 없을 때
    );
    
    console.log('자동 생성 조건 체크:', { 
      hasProposals: !!proposals,
      isGenerating,
      needsRegeneration,
      hasInitialData: !!(initialData && initialData.length > 0),
      shouldAutoGenerate 
    });
    
    if (shouldAutoGenerate) {
      // 약간의 지연을 두어 다른 useEffect와 경합 방지
      const timer = setTimeout(() => {
        console.log('자동 생성 시작');
        startGeneration();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [proposals, isGenerating, needsRegeneration, initialData]);

  // 재생성 처리 함수
  const handleRegenerate = () => {
    console.log('재생성 시작:', { reason: regenerationReason });
    
    // 상태 초기화
    setNeedsRegeneration(false);
    setShowRegenerationNotice(false);
    setRegenerationReason('');
    setProposals(null);
    setError(null);
    
    // 이전 해시 초기화하여 새로운 생성으로 간주
    setLastGeneratedHash('');
    setLastGeneratedWith(null);
    
    // 새로운 생성 시작
    startGeneration();
  };

  // 재생성 건너뛰기 (현재 데이터 유지)
  const handleSkipRegeneration = () => {
    console.log('재생성 건너뛰기 - 현재 데이터 유지');
    
    // 현재 해시로 업데이트하여 변경 감지 초기화
    setLastGeneratedHash(currentInputHash);
    setLastGeneratedWith({
      projectData: { ...projectData },
      visualIdentity: { ...visualIdentity }
    });
    
    setNeedsRegeneration(false);
    setShowRegenerationNotice(false);
    setRegenerationReason('');
  };

  // 완료 처리
  const handleComplete = () => {
    if (!proposals) return;
    
    // 완료 시점에서 최종 해시 업데이트
    setLastGeneratedHash(currentInputHash);
    
    console.log('Step3 완료 처리:', { proposalsCount: proposals.length });
    onComplete(proposals);
  };

  // 중복 제거됨 - 위쪽의 통합된 재생성 함수들 사용

  // 개별 페이지 재생성
  const handleRegenerateePage = async (pageIndex: number) => {
    if (!proposals) return;
    
    console.log(`🔄 페이지 ${pageIndex + 1} 개별 재생성 시작`);
    
    // 재생성 상태 설정
    setIsGenerating(true);
    setError(null);
    setGenerationMessage(`페이지 ${pageIndex + 1} 재생성 중...`);
    setGenerationProgress(0);
    
    // 콜백 알림
    onGeneratingChange?.(true);
    
    try {
      // 해당 페이지 정보 가져오기
      const targetPage = projectData.pages[pageIndex];
      if (!targetPage) {
        throw new Error(`페이지 ${pageIndex + 1}을 찾을 수 없습니다.`);
      }
      
      setGenerationProgress(20);
      
      // 개별 페이지 생성 - private 메서드 직접 호출
      const newPageProposal = await layoutProposalService.generateSinglePageLayoutInternal(
        projectData,
        visualIdentity,
        targetPage,
        proposals.filter((_, i) => i !== pageIndex), // 다른 페이지들을 컨텍스트로 전달
        2 // maxRetries
      );
      
      setGenerationProgress(80);
      
      // 기존 proposals 배열에서 해당 인덱스만 교체
      const updatedProposals = [...proposals];
      updatedProposals[pageIndex] = newPageProposal;
      
      setGenerationProgress(100);
      
      // 상태 업데이트
      setProposals(updatedProposals);
      setGenerationMessage(`페이지 ${pageIndex + 1} 재생성 완료!`);
      
      // 콜백 호출
      onProposalsGenerated?.(updatedProposals);
      
      console.log(`✅ 페이지 ${pageIndex + 1} 개별 재생성 완료`);
      
      // 잠시 후 메시지 초기화
      setTimeout(() => {
        setGenerationMessage('');
        setGenerationProgress(0);
      }, 2000);
      
    } catch (error) {
      console.error(`❌ 페이지 ${pageIndex + 1} 재생성 실패:`, error);
      
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setError(`페이지 ${pageIndex + 1} 재생성 실패: ${errorMessage}`);
      setGenerationMessage('');
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
      {/* 상단 헤더 - 뷰포트 전체 너비, 흰색 배경 */}
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
                <h3 className="font-semibold text-gray-900 mb-2">레이아웃</h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">
                    {projectData.layoutMode === 'scrollable' ? '📜' : '📐'}
                  </span>
                  <p className="text-gray-700 text-sm">
                    {projectData.layoutMode === 'scrollable' ? '스크롤형' : '고정형'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">페이지 수</h3>
                <p className="text-gray-700 text-sm">{projectData.pages.length}개</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">대상</h3>
                <p className="text-gray-700 text-sm">{projectData.targetAudience}</p>
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
                    이전 단계에서 데이터가 변경되었습니다. 레이아웃 제안을 새로 생성하시겠습니까?
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
                    {/* 중앙 아이콘 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-4xl">
                        {projectData.layoutMode === 'scrollable' ? '📜' : '📐'}
                      </div>
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
                {projectData.pages.length > 1 && currentPageIndex < projectData.pages.length && (
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      {projectData.pages.map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index <= currentPageIndex ? 'bg-[#3e88ff]' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      페이지 {currentPageIndex + 1}: {projectData.pages[currentPageIndex]?.topic}
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
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      AI 분석 진행 중
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      {projectData.layoutMode === 'scrollable' ? '스크롤 최적화' : '고정 최적화'}
                    </div>
                  </div>
                </motion.div>

                <p className="text-sm text-gray-500">
                  레이아웃 복잡도에 따라 30-90초 소요됩니다
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
                <h3 className="text-xl font-semibold text-gray-900 mb-3">레이아웃 생성 실패</h3>
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
          {proposals && !isGenerating && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* 페이지 탭 네비게이션 */}
              {proposals.length > 1 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">페이지별 레이아웃</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {proposals.map((proposal, index) => (
                      <button
                        key={proposal.pageId}
                        onClick={() => setSelectedProposalIndex(index)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                          selectedProposalIndex === index
                            ? 'bg-[#3e88ff] text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {index + 1}. {proposal.pageTitle}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 선택된 페이지의 레이아웃 상세 */}
              {proposals[selectedProposalIndex] && (
                <LayoutProposalDetail
                  proposal={proposals[selectedProposalIndex]}
                  projectData={projectData}
                  visualIdentity={visualIdentity}
                  onRegenerate={() => handleRegenerateePage(selectedProposalIndex)}
                />
              )}


            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단 네비게이션 */}
      {proposals && !isGenerating && (
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

// 개별 레이아웃 제안 상세 컴포넌트
interface LayoutProposalDetailProps {
  proposal: LayoutProposal;
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  onRegenerate: () => void;
}

const LayoutProposalDetail: React.FC<LayoutProposalDetailProps> = ({
  proposal,
  projectData,
  visualIdentity,
  onRegenerate
}) => {
  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              페이지 {proposal.metadata.pageNumber}: {proposal.pageTitle || `페이지 ${proposal.metadata.pageNumber}`}
            </h3>
            <p className="text-gray-600">
              줄글 레이아웃 설계
              {proposal.metadata.tokensUsed && ` • ${proposal.metadata.tokensUsed} 토큰`}
              {proposal.metadata.fallback && ' • 폴백 응답'}
            </p>
          </div>
          <button
            onClick={onRegenerate}
            className="px-4 py-2 text-[#3e88ff] border border-[#3e88ff] rounded-full hover:bg-[#3e88ff] hover:text-white transition-all text-sm font-medium"
          >
            재생성
          </button>
        </div>

        {/* 줄글 레이아웃 설명 */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">📝</span>
            레이아웃 설계 내용
          </h4>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {proposal.layoutDescription || '레이아웃 설명이 없습니다.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 및 미디어 */}
      {proposal.images && proposal.images.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-bold">🖼️</span>
            필요한 이미지 ({proposal.images.length}개)
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {proposal.images.map((image, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">
                      {image.filename || `이미지_${index + 1}.png`}
                    </h5>
                    
                    {/* 새로운 JSON 스키마 지원 */}
                    {(image.width || image.height) && (
                      <div className="text-sm text-gray-600 mb-2">
                        크기: {image.width || '?'}×{image.height || '?'}px
                      </div>
                    )}
                    
                    {/* 기존 size 필드 지원 (하위 호환성) */}
                    {image.size && !image.width && !image.height && (
                      <div className="text-sm text-gray-600 mb-2">크기: {image.size}</div>
                    )}
                    
                    {/* purpose 배지 */}
                    {image.purpose && (
                      <div className="text-xs text-green-600 bg-green-50 rounded px-2 py-1 inline-block mb-2">
                        목적: {image.purpose}
                      </div>
                    )}
                    
                    {/* placement 정보 */}
                    {image.placement && (
                      <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 inline-block mb-2">
                        배치: {image.placement}
                      </div>
                    )}
                    
                    {/* 기존 position 필드 지원 (하위 호환성) */}
                    {image.position && !image.placement && (
                      <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 inline-block mb-2">
                        위치: {image.position}
                      </div>
                    )}
                    
                    {image.alt && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>설명:</strong> {image.alt}
                      </div>
                    )}
                    
                    {image.caption && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>캡션:</strong> {image.caption}
                      </div>
                    )}
                    
                    {image.aiPrompt && (
                      <div className="text-xs text-purple-600 bg-purple-50 rounded p-2 font-mono">
                        AI 생성 프롬프트: {image.aiPrompt}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 생성 메타데이터 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold">ℹ️</span>
          생성 정보
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500 mb-1">페이지 번호</div>
            <div className="font-medium text-gray-900">
              {proposal.metadata.pageNumber} / {proposal.metadata.totalPages}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">생성 시간</div>
            <div className="font-medium text-gray-900">
              {proposal.metadata.generatedAt ? new Date(proposal.metadata.generatedAt).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">토큰 사용량</div>
            <div className="font-medium text-gray-900">
              {proposal.metadata.tokensUsed ? proposal.metadata.tokensUsed.toLocaleString() : '-'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">생성 방식</div>
            <div className="font-medium text-gray-900">
              {proposal.metadata.fallback ? '폴백' : '정상'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};