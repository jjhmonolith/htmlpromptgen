import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ProjectData,
  VisualIdentity,
  DesignTokens,
  FinalPrompt,
  Step4DesignResult,
  Step3IntegratedResult,
  ComponentLine,
  ImageLine
} from '../../../types/workflow.types';
import { Step3LayoutOnlyResult } from '../../../types/step3-layout-only.types';
import { IntegratedStep4And5Service } from '../../../services/integrated-step4-5.service';
import { OpenAIService } from '../../../services/openai.service';
import { copyToClipboard } from '../../../utils/clipboard';

interface Step4IntegratedResultProps {
  initialData?: FinalPrompt;
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  designTokens: DesignTokens;
  step3Result: Step3LayoutOnlyResult;
  step4Result?: Step4DesignResult;
  apiKey: string;
  onComplete?: (data: { step4Result: Step4DesignResult; step5Result: FinalPrompt }) => void;
  onDataChange?: (data: FinalPrompt) => void;
  onBack?: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export const Step4IntegratedResult: React.FC<Step4IntegratedResultProps> = ({
  initialData,
  projectData,
  visualIdentity,
  designTokens,
  step3Result,
  step4Result,
  apiKey,
  onComplete,
  onDataChange,
  onBack,
  onGeneratingChange
}) => {
  const [finalResult, setFinalResult] = useState<{ step4Result: Step4DesignResult; step5Result: FinalPrompt } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // 생성 상태 변경을 부모로 전달
  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  useEffect(() => {
    if (initialData) {
      // 초기 데이터가 있으면 기존 step4Result와 함께 조합
      const combinedResult = {
        step4Result: step4Result || ({} as Step4DesignResult),
        step5Result: initialData
      };
      setFinalResult(combinedResult);
      setIsDataLoaded(true);

      // 초기 데이터의 해시를 저장하여 불필요한 변경 알림 방지
      const initialHash = JSON.stringify(initialData);
      lastResultHashRef.current = initialHash;
    }
  }, [initialData, step4Result]);

  // 이전 데이터 해시 추적용 ref
  const lastResultHashRef = useRef('');

  useEffect(() => {
    if (isDataLoaded && finalResult?.step5Result && onDataChange) {
      const timeoutId = setTimeout(() => {
        // 현재 데이터의 해시 생성 (변경 감지용)
        const currentHash = JSON.stringify(finalResult.step5Result);

        // 실제로 변경된 경우에만 알림
        if (currentHash !== lastResultHashRef.current) {
          lastResultHashRef.current = currentHash;
          onDataChange(finalResult.step5Result);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [finalResult, isDataLoaded, onDataChange]);

  // AI 통합 팀 페르소나 기반 로딩 메시지와 진행률
  const integratedMessages = [
    { progress: 10, message: "🎯 Step4: 디자인 명세 분석을 시작해요..." },
    { progress: 25, message: "🎨 상호작용과 애니메이션을 설계하고 있어요" },
    { progress: 40, message: "⚡ 사용자 경험 최적화를 진행해요" },
    { progress: 55, message: "🔄 Step5: 최종 프롬프트 생성을 시작해요" },
    { progress: 70, message: "📝 모든 단계의 결과를 통합하고 있어요" },
    { progress: 85, message: "🛠️ HTML/CSS 개발 가이드를 작성해요" },
    { progress: 95, message: "🎉 완벽한 창작 브리프를 마무리하고 있어요" }
  ];

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError('API 키가 필요합니다.');
      return;
    }

    if (!step3Result) {
      setError('Step3의 레이아웃 설계 결과가 필요합니다.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setLoadingProgress(0);
      setLoadingMessage(integratedMessages[0].message);

      console.log('🚀 Step4-5 통합 프로세스 시작');

      // 진행률 애니메이션 시뮬레이션
      let currentMessageIndex = 0;
      const progressInterval = setInterval(() => {
        if (currentMessageIndex < integratedMessages.length) {
          const targetProgress = integratedMessages[currentMessageIndex].progress;
          setLoadingProgress(prev => {
            const newProgress = Math.min(prev + (Math.random() * 6 + 2), targetProgress);
            if (newProgress >= targetProgress && currentMessageIndex < integratedMessages.length) {
              setLoadingMessage(integratedMessages[currentMessageIndex].message);
              currentMessageIndex++;
            }
            return newProgress;
          });
        }
      }, 600 + Math.random() * 400); // 600-1000ms 간격으로 랜덤하게

      const openAIService = OpenAIService.getInstance();
      openAIService.initialize(apiKey);
      const integratedService = new IntegratedStep4And5Service(openAIService);

      // Step3 결과를 Step3IntegratedResult 형식으로 변환 (호환성을 위해)
      const convertedStep3Result = convertStep3LayoutToIntegrated(step3Result);

      const result = await integratedService.executeIntegratedProcess(
        projectData,
        visualIdentity,
        designTokens,
        convertedStep3Result
      );

      // 완료 시 진행률을 100%로 맞추고 정리
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage("🎉 Step4-5 통합 프로세스가 완성되었어요!");

      // 잠시 완료 메시지를 보여주고 결과 표시
      setTimeout(() => {
        console.log('✅ Step4-5 통합 완료:', result);
        setFinalResult(result);
        setIsDataLoaded(true);
      }, 800);

    } catch (error) {
      console.error('❌ Step4-5 통합 실패:', error);
      setError(error instanceof Error ? error.message : 'Step4-5 통합 프로세스에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, projectData, visualIdentity, designTokens, step3Result]);

  // Step3에서 넘어온 경우 자동으로 생성 시작
  useEffect(() => {
    if (step3Result && !initialData && !isGenerating && !shouldAutoGenerate && apiKey) {
      setShouldAutoGenerate(true);
      handleGenerate();
    }
  }, [step3Result, initialData, isGenerating, shouldAutoGenerate, apiKey, handleGenerate]);

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handleComplete = () => {
    if (finalResult && onComplete) {
      console.log('✅ Step4-5 통합 완료 - 데이터 전달:', finalResult);
      onComplete(finalResult);
    }
  };

  const handleCopyPrompt = async () => {
    if (!finalResult?.step5Result?.htmlPrompt) return;

    const success = await copyToClipboard(finalResult.step5Result.htmlPrompt);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col" style={{ backgroundColor: '#f5f5f7', height: 'calc(100vh - 72px)', marginTop: '72px' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-8">
            <div className="text-center">

            {/* 제목과 부제목 */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">AI 통합 팀이 최종 작업 중이에요</h2>
            <p className="text-lg text-gray-600 mb-12">디자인 명세를 완성하고 창작 브리프를 생성하고 있어요</p>

            {/* 진행률 바 */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                {/* 배경 바 */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  {/* 진행률 바 */}
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${loadingProgress}%`,
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                      boxShadow: '0 2px 10px rgba(102, 126, 234, 0.3)'
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
      <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 py-12">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!finalResult && !isGenerating && (
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              최종 창작 브리프 준비 중
            </h2>
            <p className="text-gray-600">
              잠시 후 자동으로 생성이 시작됩니다...
            </p>
          </div>
        )}

        {finalResult && (
          <>
            {/* 상단: 성공 메시지와 개요 */}
            <div className="mb-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 창작 브리프 완성!</h2>
                <p className="text-lg text-gray-600">모든 단계의 결과물이 하나의 완벽한 개발 가이드로 통합되었습니다</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.005]"
                     style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-700 font-bold">4</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">디자인 명세</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {finalResult.step4Result.pages?.length || 0}개 페이지의 상호작용과 애니메이션 설계 완료
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.005]"
                     style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-700 font-bold">5</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">최종 프롬프트</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {Math.round((finalResult.step5Result.htmlPrompt?.length || 0) / 1000)}K자의 상세한 개발 가이드
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.005]"
                     style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">개발 준비</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    HTML/CSS/JS 구조와 이미지 명세 포함
                  </p>
                </div>
              </div>
            </div>

            {/* Step4 결과 미리보기 */}
            {finalResult.step4Result && finalResult.step4Result.pages && (
              <div className="mb-12">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">🎨 디자인 명세 미리보기</h2>
                  <p className="text-gray-600">각 페이지별 상호작용과 애니메이션 설계</p>
                </div>

                <div className="space-y-6">
                  {finalResult.step4Result.pages.slice(0, 3).map((page, index) => (
                    <div
                      key={page.pageNumber}
                      className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.002]"
                      style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold">{page.pageNumber}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">페이지 {page.pageNumber}</h3>
                          <p className="text-gray-600 text-sm">상호작용 및 애니메이션 설계</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-blue-50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-blue-800 mb-2">🎬 애니메이션</h4>
                          <p className="text-blue-700 text-sm leading-relaxed">
                            {page.animationDescription || '기본 애니메이션 효과'}
                          </p>
                        </div>

                        <div className="bg-green-50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-green-800 mb-2">⚡ 상호작용</h4>
                          <p className="text-green-700 text-sm leading-relaxed">
                            {page.interactionDescription || '기본 상호작용 효과'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {finalResult.step4Result.pages.length > 3 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">
                        총 {finalResult.step4Result.pages.length}개 페이지의 디자인 명세가 완료되었습니다
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 최종 프롬프트 */}
            <div className="mb-8">
              <div className="bg-white rounded-3xl p-8 transition-all duration-300 hover:scale-[1.002]"
                   style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">📝 최종 창작 브리프</h2>
                    <p className="text-gray-600">완성된 HTML/CSS 개발 가이드</p>
                  </div>
                  <button
                    onClick={handleCopyPrompt}
                    className={`px-6 py-3 rounded-full transition-all font-medium flex items-center gap-2 ${
                      copySuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {copySuccess ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        복사됨!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        전체 복사
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 max-h-96 overflow-y-auto">
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 font-mono">
                    {finalResult.step5Result.htmlPrompt || '프롬프트 생성 중...'}
                  </pre>
                </div>

                <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
                  <span>총 {(finalResult.step5Result.htmlPrompt?.length || 0).toLocaleString()}자</span>
                  <span>
                    {projectData.pages.length}개 페이지 • {projectData.layoutMode === 'fixed' ? '고정형' : '스크롤형'} • {projectData.contentMode === 'enhanced' ? 'AI 보강' : '원본 유지'}
                  </span>
                </div>
              </div>
            </div>

            {/* 네비게이션 버튼들 */}
            <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 mt-8 mb-8">
              <div className="flex justify-between">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-all font-medium"
                  >
                    ← 이전
                  </button>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-all font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    다시 생성
                  </button>
                  <button
                    onClick={handleComplete}
                    className="px-8 py-3 bg-green-600 text-white rounded-full transition-all font-medium shadow-sm hover:bg-green-700"
                  >
                    완료! 🎉
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Step3LayoutOnlyResult를 Step3IntegratedResult로 변환하는 헬퍼 함수
function convertStep3LayoutToIntegrated(step3Layout: Step3LayoutOnlyResult): Step3IntegratedResult {
  const pages = step3Layout.pages.map((page): Step3IntegratedResult['pages'][number] => {
    const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();
    const seen = new Set<string>();

    const script = (page.textContent.fullTextContent || '').trim();
    const layoutStory = (page.layoutNarrative || '').trim();
    const visualGuide = (page.visualGuidelines || '').trim();
    const implementation = (page.implementationNotes || '').trim();

    const sections: Array<{ key: 'script' | 'layout' | 'visual' | 'implementation'; heading: string; text: string }> = [];
    const addSection = (
      key: 'script' | 'layout' | 'visual' | 'implementation',
      heading: string,
      text: string
    ) => {
      if (!text) {
        return false;
      }
      const canonical = normalize(text);
      if (!canonical || seen.has(canonical)) {
        return false;
      }
      seen.add(canonical);
      sections.push({ key, heading, text });
      return true;
    };
    const scriptIncluded = addSection('script', '교안 본문', script);
    const layoutIncluded = addSection('layout', '레이아웃 스토리', layoutStory);
    const visualIncluded = addSection('visual', '비주얼 가이드', visualGuide);
    const implementationIncluded = addSection('implementation', '구현 노트', implementation);

    const descriptionSections = sections.map((section) => `### ${section.heading}\n${section.text}`);

    const fullDescription = descriptionSections.join('\n\n')
      || script
      || `${page.pageTitle} 페이지 구성 개요`;

    const componentLines: ComponentLine[] = [];
    if (scriptIncluded && script) {
      componentLines.push({
        id: `script_${page.pageNumber}`,
        type: 'paragraph',
        section: 'script',
        role: 'content',
        text: script
      });
    }
    if (layoutIncluded && layoutStory) {
      componentLines.push({
        id: `layout_story_${page.pageNumber}`,
        type: 'paragraph',
        section: 'layout',
        role: 'content',
        text: layoutStory
      });
    }
    if (visualIncluded && visualGuide) {
      componentLines.push({
        id: `visual_guide_${page.pageNumber}`,
        type: 'paragraph',
        section: 'visual',
        role: 'content',
        text: visualGuide
      });
    }
    if (implementationIncluded && implementation) {
      componentLines.push({
        id: `implementation_${page.pageNumber}`,
        type: 'paragraph',
        section: 'implementation',
        role: 'content',
        text: implementation
      });
    }

    const imageDescription = (page.textContent.imageDescription || '').trim();
    const baseImage: ImageLine | null = imageDescription
      ? {
          id: `page${page.pageNumber}_image_1`,
          fileName: `page${page.pageNumber}-main.png`,
          path: `./image/page${page.pageNumber}/page${page.pageNumber}-main.png`,
          description: imageDescription,
          purpose: 'illustration',
          sizeGuide: '600x400',
          placement: {
            section: 'visual',
            position: step3Layout.layoutMode === 'fixed' ? 'right column' : 'in-flow',
            size: 'medium'
          },
          accessibility: {
            altText: imageDescription,
            caption: imageDescription
          },
          aiPrompt: imageDescription
        }
      : null;

    return {
      pageId: page.pageId,
      pageTitle: page.pageTitle,
      pageNumber: page.pageNumber,
      fullDescription,
      layoutNarrative: layoutIncluded ? layoutStory : undefined,
      visualGuidelines: visualIncluded ? visualGuide : undefined,
      implementationNotes: implementationIncluded ? implementation : undefined,
      originalScript: scriptIncluded ? script : undefined,
      phase1Complete: true,
      phase2Complete: true,
      isGenerating: false,
      generatedAt: page.generatedAt,
      structure: {
        sections: [],
        flow: layoutIncluded ? layoutStory : script,
        imgBudget: baseImage ? 1 : 0
      },
      content: {
        components: componentLines,
        images: baseImage ? [{ ...baseImage }] : [],
        generatedAt: page.generatedAt
      },
      mediaAssets: baseImage ? [{ ...baseImage }] : []
    };
  });

  return {
    layoutMode: step3Layout.layoutMode,
    pages,
    designTokens: step3Layout.designTokens,
    processingTime: step3Layout.processingTime,
    generatedAt: step3Layout.generatedAt
  };
}
