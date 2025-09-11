import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ProjectData, 
  VisualIdentity, 
  LayoutProposal, 
  PageEnhancement,
  FinalPrompt
} from '../../../types/workflow.types';
import { FinalPromptService } from '../../../services/final.prompt.service';
import { copyToClipboard } from '../../../utils/clipboard';

interface Step5FinalPromptProps {
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  layoutProposals: LayoutProposal[];
  pageEnhancements: PageEnhancement[];
  onComplete: (finalPrompt: FinalPrompt) => void;
  onBack: () => void;
}

export const Step5FinalPrompt: React.FC<Step5FinalPromptProps> = ({
  projectData,
  visualIdentity,
  layoutProposals,
  pageEnhancements,
  onComplete,
  onBack
}) => {
  const [finalPrompt, setFinalPrompt] = useState<FinalPrompt | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'images'>('html');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');

  const finalPromptService = new FinalPromptService();

  // 자동 생성 시작
  const startGeneration = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationMessage('프로젝트 정보를 종합하고 있습니다...');

    // 진행 상태 시뮬레이션
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 800);

    const messages = [
      '프로젝트 정보를 종합하고 있습니다...',
      '비주얼 아이덴티티와 레이아웃을 통합합니다...',
      '애니메이션과 상호작용 요소를 포함합니다...',
      '개발 규칙과 기술적 요구사항을 정리합니다...',
      '최종 개발 프롬프트를 생성하고 있습니다...'
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < messages.length - 1) {
        messageIndex++;
        setGenerationMessage(messages[messageIndex]);
      }
    }, 3000);

    try {
      const result = await finalPromptService.generateFinalPrompt(
        projectData,
        visualIdentity,
        layoutProposals,
        pageEnhancements
      );
      
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setGenerationProgress(100);
      setGenerationMessage('최종 프롬프트 생성이 완료되었습니다!');
      
      setTimeout(() => {
        setFinalPrompt(result);
        setIsGenerating(false);
      }, 1000);

    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setError(err instanceof Error ? err.message : '최종 프롬프트 생성에 실패했습니다.');
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // 컴포넌트 마운트 시 자동 생성
  useEffect(() => {
    if (!finalPrompt && !isGenerating) {
      startGeneration();
    }
  }, []);

  // 클립보드 복사
  const handleCopy = async (content: string) => {
    setCopyStatus('copying');
    
    try {
      await copyToClipboard(content);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // 완료 처리
  const handleComplete = () => {
    if (!finalPrompt) return;
    onComplete(finalPrompt);
  };

  // 재생성
  const handleRegenerate = () => {
    setFinalPrompt(null);
    startGeneration();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
      {/* 상단 헤더 */}
      <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-white pt-14 pb-5">
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12">
          {/* 프로젝트 완료 요약 */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 프로젝트 완료!</h2>
              <p className="text-gray-600">모든 단계가 완료되어 최종 프롬프트를 생성합니다</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-3">
                <div className="text-2xl mb-1">📝</div>
                <div className="text-sm font-medium text-gray-900">기본 정보</div>
                <div className="text-xs text-gray-600">{projectData.pages.length}개 페이지</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-2xl mb-1">🎨</div>
                <div className="text-sm font-medium text-gray-900">비주얼 디자인</div>
                <div className="text-xs text-gray-600">{visualIdentity.moodAndTone.split(',')[0].trim()}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-2xl mb-1">📐</div>
                <div className="text-sm font-medium text-gray-900">레이아웃 설계</div>
                <div className="text-xs text-gray-600">{projectData.layoutMode === 'scrollable' ? '스크롤형' : '고정형'}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-2xl mb-1">🎬</div>
                <div className="text-sm font-medium text-gray-900">애니메이션</div>
                <div className="text-xs text-gray-600">{pageEnhancements.length}개 페이지</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 py-8">
        <AnimatePresence mode="wait">
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
                    {/* 중앙 완성 아이콘 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div 
                        className="text-4xl"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🚀
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* 진행률 */}
                <div className="mb-8">
                  <div className="bg-gray-200 rounded-full h-3 mb-3">
                    <motion.div
                      className="bg-gradient-to-r from-[#3e88ff] to-[#10B981] h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{Math.round(generationProgress)}% 완료</p>
                </div>

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
                      데이터 통합
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      프롬프트 생성
                    </div>
                  </div>
                </motion.div>

                <p className="text-sm text-gray-500">
                  이전 4단계의 데이터를 통합하여 완성된 개발 프롬프트를 생성합니다 (AI 사용 없음)
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
                <h3 className="text-xl font-semibold text-gray-900 mb-3">프롬프트 생성 실패</h3>
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
          {finalPrompt && !isGenerating && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 탭 네비게이션 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">최종 개발 프롬프트</h3>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setActiveTab('html')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'html'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📄 HTML 개발 프롬프트
                  </button>
                  <button
                    onClick={() => setActiveTab('images')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'images'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🖼️ 이미지 생성 프롬프트
                  </button>
                </div>

                {/* 탭 콘텐츠 */}
                <AnimatePresence mode="wait">
                  {activeTab === 'html' && (
                    <motion.div
                      key="html"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">HTML 개발 프롬프트</h4>
                          <button
                            onClick={() => handleCopy(finalPrompt.htmlPrompt)}
                            disabled={copyStatus === 'copying'}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              copyStatus === 'copied'
                                ? 'bg-green-500 text-white'
                                : copyStatus === 'error'
                                ? 'bg-red-500 text-white'
                                : 'bg-[#3e88ff] text-white hover:bg-[#2c6ae6]'
                            }`}
                          >
                            {copyStatus === 'copying' && '복사 중...'}
                            {copyStatus === 'copied' && '✓ 복사됨'}
                            {copyStatus === 'error' && '✗ 실패'}
                            {copyStatus === 'idle' && '📋 복사'}
                          </button>
                        </div>
                        <div className="bg-white rounded border p-4 max-h-96 overflow-y-auto">
                          <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">
                            {finalPrompt.htmlPrompt}
                          </pre>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'images' && (
                    <motion.div
                      key="images"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="space-y-4">
                        {finalPrompt.imagePrompts.map((imagePrompt, index) => {
                          const pageTitle = layoutProposals.find(p => p.pageId === imagePrompt.pageId)?.pageTitle || `페이지 ${index + 1}`;
                          return (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">
                                  {pageTitle} - {imagePrompt.imageName}
                                </h4>
                                <button
                                  onClick={() => handleCopy(imagePrompt.prompt)}
                                  className="px-3 py-1 bg-[#3e88ff] text-white rounded text-sm hover:bg-[#2c6ae6] transition-all"
                                >
                                  복사
                                </button>
                              </div>
                              <div className="bg-white rounded border p-3">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {imagePrompt.prompt}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 메타데이터 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">생성 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">생성 일시:</span>
                    <p className="font-medium">{finalPrompt.metadata.generatedAt.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">버전:</span>
                    <p className="font-medium">{finalPrompt.metadata.version}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">프롬프트 수:</span>
                    <p className="font-medium">HTML 1개 + 이미지 {finalPrompt.imagePrompts.length}개</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단 네비게이션 */}
      {finalPrompt && !isGenerating && (
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
                재생성
              </button>
              <button
                onClick={handleComplete}
                className="px-8 py-3 bg-gradient-to-r from-[#3e88ff] to-[#10B981] text-white rounded-full hover:from-[#2c6ae6] hover:to-[#059669] transition-all font-medium shadow-sm"
              >
                🎉 완료!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};