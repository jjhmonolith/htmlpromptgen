import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProjectData, VisualIdentity, Step3IntegratedResult } from '../../../types/workflow.types';
import { Step4DesignResult } from '../../../types/step4.types';
import { Step4DesignSpecificationService } from '../../../services/step4-design-specification.service';
import { OpenAIService } from '../../../services/openai.service';

interface Step4DesignSpecificationProps {
  initialData?: Step4DesignResult;
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  step3Result: Step3IntegratedResult;
  apiKey: string;
  onComplete?: (data: Step4DesignResult) => void;
  onDataChange?: (data: Step4DesignResult) => void;
  onBack?: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export const Step4DesignSpecificationFC: React.FC<Step4DesignSpecificationProps> = ({
  initialData,
  projectData,
  visualIdentity,
  step3Result,
  apiKey,
  onComplete,
  onDataChange,
  onBack,
  onGeneratingChange
}) => {
  const [step4Data, setStep4Data] = useState<Step4DesignResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const lastStep4HashRef = useRef<string>('');

  // 생성 상태 변경을 부모로 전달
  useEffect(() => {
    const overallGenerating = (step4Data?.pages && Array.isArray(step4Data.pages) ? step4Data.pages.some(page => page.isGenerating) : false) || isGenerating;
    onGeneratingChange?.(overallGenerating);
  }, [step4Data, isGenerating, onGeneratingChange]);

  // initialData가 변경되면 컴포넌트 상태 동기화
  useEffect(() => {
    if (initialData) {
      setStep4Data(initialData);
      setIsDataLoaded(true);


      const initialHash = JSON.stringify(initialData);
      lastStep4HashRef.current = initialHash;
    }
  }, [initialData]);

  // step4Data가 변경될 때마다 onDataChange 호출 (해시 비교로 중복 방지)
  useEffect(() => {
    if (step4Data && isDataLoaded) {
      const currentHash = JSON.stringify(step4Data);
      if (currentHash !== lastStep4HashRef.current) {
        lastStep4HashRef.current = currentHash;
        onDataChange?.(step4Data);
      }
    }
  }, [step4Data, onDataChange, isDataLoaded]);

  // 컴포넌트 마운트 시 자동 생성 여부 결정
  useEffect(() => {
    if (step4Data) {
      console.log('✅ Step4: 기존 데이터 발견, 재생성 건너뜀');
      setShouldAutoGenerate(false);
      setIsDataLoaded(true);
    } else if (initialData) {
      console.log('✅ Step4: 초기 데이터 로드됨, 재생성 건너뜀');
      setShouldAutoGenerate(false);
      setIsDataLoaded(true);
    } else {
      console.log('🔄 Step4: 데이터 없음, 자동 생성 예정');
      setShouldAutoGenerate(true);
    }
  }, [step4Data, initialData]);

  // AI 디자이너 페르소나 기반 로딩 메시지와 진행률
  const designerMessages = [
    { progress: 12, message: "🎨 프로젝트 요구사항을 분석하고 디자인 방향을 잡고 있어요..." },
    { progress: 25, message: "📐 레이아웃 구조를 설계하고 비례를 맞추고 있어요" },
    { progress: 40, message: "🎯 사용자 경험을 고려한 인터페이스를 그려내고 있어요" },
    { progress: 55, message: "🖌️ 브랜드 아이덴티티를 반영한 스타일을 적용하고 있어요" },
    { progress: 70, message: "⚡ 상호작용 요소와 동적 효과를 설계하고 있어요" },
    { progress: 85, message: "🔍 세부사항을 점검하고 디자인을 최적화하고 있어요" },
    { progress: 95, message: "✨ 최종 디자인 명세를 정리하고 완성하고 있어요" }
  ];

  // 자동 생성 실행
  useEffect(() => {
    if (shouldAutoGenerate && !isGenerating && apiKey) {
      generateStep4Data();
    }
  }, [shouldAutoGenerate, isGenerating, apiKey]);

  const generateStep4Data = async () => {
    if (!apiKey || isGenerating) {
      if (!apiKey) {
        setError('API 키가 설정되지 않았습니다. 상단 우측의 설정 버튼을 클릭하여 API 키를 설정해주세요.');
      }
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setLoadingProgress(0);
      setLoadingMessage(designerMessages[0].message);

      console.log('🎯 Step4: 디자인 명세 생성 시작');

      // 진행률 애니메이션 시뮬레이션
      let currentMessageIndex = 0;
      const progressInterval = setInterval(() => {
        if (currentMessageIndex < designerMessages.length) {
          const targetProgress = designerMessages[currentMessageIndex].progress;
          setLoadingProgress(prev => {
            const newProgress = Math.min(prev + (Math.random() * 6 + 3), targetProgress);
            if (newProgress >= targetProgress && currentMessageIndex < designerMessages.length) {
              setLoadingMessage(designerMessages[currentMessageIndex].message);
              currentMessageIndex++;
            }
            return newProgress;
          });
        }
      }, 600 + Math.random() * 400); // 600-1000ms 간격으로 랜덤하게

      const openAIService = new OpenAIService();
      openAIService.initialize(apiKey);
      const step4Service = new Step4DesignSpecificationService(openAIService);

      const result = await step4Service.generateDesignSpecification(
        projectData,
        visualIdentity,
        step3Result
      );

      // 완료 시 진행률을 100%로 맞추고 정리
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage("🎉 완벽한 디자인 명세가 완성되었어요!");

      // 잠시 완료 메시지를 보여주고 결과 표시
      setTimeout(() => {
        setStep4Data(result);
        setIsDataLoaded(true);
        setShouldAutoGenerate(false);
        console.log('✅ Step4: 디자인 명세 생성 완료', result);
      }, 800);

    } catch (error) {
      console.error('❌ Step4 생성 실패:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateAll = () => {
    console.log('🔄 Step4: 전체 재생성 시작');
    setStep4Data(null);
    setIsDataLoaded(false);
    setShouldAutoGenerate(true);
  };

  const regeneratePage = async (pageIndex: number) => {
    if (!apiKey || !step4Data || step4Data.pages[pageIndex].isGenerating) return;

    try {
      console.log(`🔄 Step4: 페이지 ${pageIndex + 1} 재생성 시작`);

      const openAIService = new OpenAIService();
      openAIService.initialize(apiKey);
      const step4Service = new Step4DesignSpecificationService(openAIService);

      // 페이지 생성 중 표시
      const updatedStep4 = { ...step4Data };
      updatedStep4.pages[pageIndex].isGenerating = true;
      setStep4Data(updatedStep4);

      // Step3 페이지 데이터 찾기
      const step3PageData = step3Result.pages[pageIndex];

      await step4Service.regeneratePage(
        updatedStep4,
        pageIndex,
        projectData,
        visualIdentity,
        step3PageData
      );

      // 결과 업데이트
      setStep4Data({ ...updatedStep4 });

      console.log(`✅ 페이지 ${pageIndex + 1} 재생성 완료`);

    } catch (error) {
      console.error(`❌ 페이지 ${pageIndex + 1} 재생성 실패:`, error);
    }
  };

  // 로딩 상태: 초기 생성 중일 때만 전체 화면 로딩
  const isInitialLoading = isGenerating && !step4Data;

  // 초기 로딩 중일 때만 전체 화면 로딩 표시
  if (isInitialLoading) {
    return (
      <div className="flex flex-col" style={{ backgroundColor: '#f5f5f7', height: 'calc(100vh - 72px)', marginTop: '72px' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-8">
            <div className="text-center">

            {/* 제목과 부제목 */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">AI 디자이너가 설계 중이에요</h2>
            <p className="text-lg text-gray-600 mb-12">정밀한 디자인 명세와 구현 가능한 설계 문서를 작성하고 있어요</p>

            {/* 진행률 바 */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                {/* 배경 바 */}
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  {/* 진행률 바 */}
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${loadingProgress}%`,
                      background: 'linear-gradient(90deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)',
                      boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    {/* 반짝이는 효과 */}
                    <div className="h-full w-full relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -skew-x-12 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* 퍼센테이지 표시 */}
                <div className="text-center mt-3">
                  <span className="text-2xl font-bold text-gray-800">{Math.round(loadingProgress)}%</span>
                </div>
              </div>
            </div>

            {/* 현재 작업 메시지 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-lg mx-auto">
              <p className="text-gray-700 text-lg leading-relaxed font-medium">
                {loadingMessage}
              </p>
            </div>

            {/* 예상 소요 시간 */}
            <p className="text-sm text-gray-500 mt-6">
              보통 30-60초 정도 소요됩니다
            </p>

            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-900 mb-2">생성 실패</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={regenerateAll}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!step4Data || !step4Data.pages || !Array.isArray(step4Data.pages) || step4Data.pages.length === 0) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 없음</h3>
        <p className="text-gray-700 mb-4">디자인 명세 데이터가 없습니다.</p>
        <button
          onClick={regenerateAll}
          disabled={!apiKey || isGenerating}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          생성하기
        </button>
      </div>
    );
  }

  const selectedPage = step4Data.pages[selectedPageIndex] || step4Data.pages[0];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🎨 창의적 레이아웃 정밀화</h2>
            <p className="text-gray-600 mt-1">
              🌟 교육 콘텐츠의 시각적 완성도를 극대화하는 창의적 레이아웃 마법사
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                debugMode
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              {debugMode ? 'Debug ON' : 'Debug OFF'}
            </button>
            <button
              onClick={regenerateAll}
              disabled={isGenerating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isGenerating && (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              )}
              <span>{isGenerating ? '생성 중...' : '전체 재생성'}</span>
            </button>
          </div>
        </div>

        {/* 페이지 선택 탭 */}
        <div className="flex space-x-2 overflow-x-auto">
          {step4Data.pages.map((page, index) => (
            <button
              key={`step4-page-${page.pageId}-${index}`}
              onClick={() => setSelectedPageIndex(index)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPageIndex === index
                  ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{page.pageNumber}</span>
              {page.pageTitle}
              {page.isGenerating && (
                <div className="ml-2 animate-spin w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              )}
              {page.error && !page.isGenerating && (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full" title="오류"></span>
              )}
              {page.isComplete && !page.error && (
                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full" title="완료"></span>
              )}
              {!page.isComplete && !page.isGenerating && !page.error && (
                <span className="ml-2 w-2 h-2 bg-yellow-500 rounded-full" title="처리 중"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 페이지 내용 */}
      {selectedPage && (
        <div className="space-y-4">
          {/* 페이지 헤더 */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  페이지 {selectedPage.pageNumber}: {selectedPage.pageTitle}
                </h3>
                <div className="text-sm text-gray-500 mt-1">
                  생성 시간: {selectedPage.generatedAt?.toLocaleString() || 'N/A'}
                </div>


                {selectedPage.isGenerating && (
                  <div className="text-sm text-purple-600 mt-1 flex items-center">
                    <div className="animate-spin w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full mr-2"></div>
                    디자인 명세 생성 중...
                  </div>
                )}
              </div>
              <button
                onClick={() => regeneratePage(selectedPageIndex)}
                disabled={selectedPage.isGenerating}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {selectedPage.isGenerating && (
                  <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                <span>{selectedPage.isGenerating ? '생성 중...' : '이 페이지 재생성'}</span>
              </button>
            </div>


            {/* 상태 표시 */}
            {selectedPage.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm text-red-800">
                  <span className="font-medium">오류:</span> {selectedPage.error}
                </div>
              </div>
            )}
          </div>

          {/* 콘텐츠 표시 */}
          {selectedPage.isGenerating ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                <h4 className="text-lg font-semibold text-gray-900">페이지 재생성 중...</h4>
                <p className="text-sm text-gray-600 text-center">
                  이 페이지의 디자인 명세를 다시 생성하고 있습니다.
                  <br />
                  다른 페이지를 선택하여 내용을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          ) : selectedPage.animationDescription || selectedPage.interactionDescription ? (
            <div className="space-y-6">
              {/* 애니메이션 설계 */}
              {selectedPage.animationDescription && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🎬</span>
                    애니메이션 설계
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedPage.animationDescription}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* 상호작용 설계 */}
              {selectedPage.interactionDescription && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">⚡</span>
                    상호작용 설계
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedPage.interactionDescription}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Debug Mode에서 기본 정보만 표시 */}
              {debugMode && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">🔧 기본 정보 (Debug Mode)</h4>
                  <div className="text-sm text-gray-600">
                    <p><strong>페이지:</strong> {selectedPage.pageNumber} - {selectedPage.pageTitle}</p>
                    <p><strong>레이아웃:</strong> 1600×{selectedPage.layout?.pageHeight === 'auto' ? '가변' : '1000px'}</p>
                    <p><strong>생성 시간:</strong> {selectedPage.generatedAt?.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-center py-8 text-gray-500">
                디자인 명세가 아직 생성되지 않았습니다.
              </div>
            </div>
          )}

          {/* 디버그 모드 */}
          {debugMode && selectedPage.debugInfo && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-md font-semibold text-blue-900 mb-3">🔧 디버그 정보</h4>
              <div className="space-y-3">
                {selectedPage.debugInfo.prompt && (
                  <div>
                    <h5 className="text-sm font-medium text-blue-800 mb-2">📝 전달된 프롬프트:</h5>
                    <pre className="text-xs text-blue-700 bg-white p-3 rounded border overflow-x-auto max-h-40 whitespace-pre-wrap">
                      {selectedPage.debugInfo.prompt}
                    </pre>
                  </div>
                )}

                {selectedPage.debugInfo.response && (
                  <div>
                    <h5 className="text-sm font-medium text-blue-800 mb-2">🤖 AI 원본 응답:</h5>
                    <pre className="text-xs text-blue-700 bg-white p-3 rounded border overflow-x-auto max-h-40 whitespace-pre-wrap">
                      {selectedPage.debugInfo.response}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 네비게이션 버튼들 - Step1 스타일과 일치 */}
      <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 mt-8 mb-8">
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-all font-medium"
          >
            ← 이전
          </button>
          <button
            onClick={() => onComplete?.(step4Data)}
            disabled={!step4Data || step4Data.pages.every(page => !page.isComplete)}
            className="px-8 py-3 text-white rounded-full transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: !step4Data || step4Data.pages.every(page => !page.isComplete) ? '#9CA3AF' : '#3e88ff'
            }}
            onMouseEnter={(e) => {
              if (!(!step4Data || step4Data.pages.every(page => !page.isComplete))) {
                (e.target as HTMLButtonElement).style.backgroundColor = '#2c6ae6';
              }
            }}
            onMouseLeave={(e) => {
              if (!(!step4Data || step4Data.pages.every(page => !page.isComplete))) {
                (e.target as HTMLButtonElement).style.backgroundColor = '#3e88ff';
              }
            }}
            title={
              !step4Data ? '데이터를 불러오는 중입니다...' :
              step4Data.pages.every(page => !page.isComplete)
                ? `다음 페이지를 재생성해주세요: ${step4Data.pages.filter(p => !p.isComplete).map(p => `페이지 ${p.pageNumber}(${p.pageTitle})`).join(', ')}`
                : ''
            }
          >
            {step4Data?.pages.some(page => page.isGenerating)
              ? `생성 중 (${step4Data.pages.filter(p => p.isGenerating).length}개)`
              : '다음 단계로 →'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// 기본 익스포트
export { Step4DesignSpecificationFC as Step4DesignSpecification };