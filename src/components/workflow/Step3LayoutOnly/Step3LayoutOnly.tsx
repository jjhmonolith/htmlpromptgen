import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Step2NewResult } from '../../../types/step2-new.types';
import { Step3LayoutOnlyResult, PageLayoutResult } from '../../../types/step3-layout-only.types';
import { Step3LayoutOnlyService } from '../../../services/step3-layout-only.service';
import { OpenAIService } from '../../../services/openai.service';

interface Step3LayoutOnlyProps {
  initialData?: Step3LayoutOnlyResult;
  step2Result: Step2NewResult;
  layoutMode?: 'fixed' | 'scrollable';
  apiKey: string;
  onComplete?: (data: Step3LayoutOnlyResult) => void;
  onDataChange?: (data: Step3LayoutOnlyResult) => void;
  onBack?: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export const Step3LayoutOnly: React.FC<Step3LayoutOnlyProps> = ({
  initialData,
  step2Result,
  layoutMode = 'scrollable',
  apiKey,
  onComplete,
  onDataChange,
  onBack,
  onGeneratingChange
}) => {
  const [step3Data, setStep3Data] = useState<Step3LayoutOnlyResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // 생성 상태 변경을 부모로 전달
  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  useEffect(() => {
    if (initialData) {
      setStep3Data(initialData);
      setIsDataLoaded(true);

      // 초기 데이터의 해시를 저장하여 불필요한 변경 알림 방지
      const initialHash = JSON.stringify(initialData);
      lastStep3HashRef.current = initialHash;
    }
  }, [initialData]);

  // 이전 데이터 해시 추적용 ref
  const lastStep3HashRef = useRef('');

  useEffect(() => {
    if (isDataLoaded && step3Data && onDataChange) {
      const timeoutId = setTimeout(() => {
        // 현재 데이터의 해시 생성 (변경 감지용)
        const currentHash = JSON.stringify(step3Data);

        // 실제로 변경된 경우에만 알림
        if (currentHash !== lastStep3HashRef.current) {
          lastStep3HashRef.current = currentHash;
          onDataChange(step3Data);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [step3Data, isDataLoaded, onDataChange]);

  // AI 레이아웃 디자이너 페르소나 기반 로딩 메시지와 진행률
  const layoutMessages = [
    { progress: 15, message: "📐 Step2의 교안 내용을 분석하고 있어요..." },
    { progress: 30, message: "🎨 비주얼 아이덴티티를 레이아웃에 적용하고 있어요" },
    { progress: 45, message: "📱 화면 구성과 그리드 시스템을 설계하고 있어요" },
    { progress: 60, message: "🖼️ 이미지와 텍스트의 최적 배치를 찾고 있어요" },
    { progress: 75, message: "✨ 사용자 경험을 고려한 인터랙션을 설계하고 있어요" },
    { progress: 90, message: "🎯 반응형 디자인과 접근성을 검토하고 있어요" },
    { progress: 95, message: "🌟 모든 페이지의 레이아웃을 마무리하고 있어요" }
  ];

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError('API 키가 필요합니다.');
      return;
    }

    if (!step2Result?.pageContents?.length) {
      setError('Step2의 교안 콘텐츠가 필요합니다.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setLoadingProgress(0);
      setCurrentPageIndex(0);
      setLoadingMessage(layoutMessages[0].message);

      console.log('🎨 Step3 레이아웃: 모든 페이지 레이아웃 설계 시작');

      // 진행률 애니메이션 시뮬레이션
      let currentMessageIndex = 0;
      const progressInterval = setInterval(() => {
        if (currentMessageIndex < layoutMessages.length) {
          const targetProgress = layoutMessages[currentMessageIndex].progress;
          setLoadingProgress(prev => {
            const newProgress = Math.min(prev + (Math.random() * 6 + 2), targetProgress);
            if (newProgress >= targetProgress && currentMessageIndex < layoutMessages.length) {
              setLoadingMessage(layoutMessages[currentMessageIndex].message);
              currentMessageIndex++;
            }
            return newProgress;
          });
        }
      }, 500 + Math.random() * 300); // 500-800ms 간격으로 랜덤하게

      const openAIService = OpenAIService.getInstance();
      openAIService.initialize(apiKey);
      const step3Service = new Step3LayoutOnlyService(openAIService);

      // 페이지별 진행 상황 업데이트를 위한 추가 로직
      const totalPages = step2Result.pageContents.length;

      const result = await step3Service.generateAllPagesLayout(
        step2Result,
        layoutMode
      );

      // 완료 시 진행률을 100%로 맞추고 정리
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage("🎉 모든 페이지의 레이아웃 설계가 완성되었어요!");

      // 잠시 완료 메시지를 보여주고 결과 표시
      setTimeout(() => {
        console.log('✅ Step3 레이아웃 설계 완료:', result);
        setStep3Data(result);
        setIsDataLoaded(true);
      }, 800);

    } catch (error) {
      console.error('❌ Step3 레이아웃 설계 실패:', error);
      setError(error instanceof Error ? error.message : '레이아웃 설계에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, step2Result]);

  // Step2에서 넘어온 경우 자동으로 생성 시작
  useEffect(() => {
    if (step2Result && !initialData && !isGenerating && !shouldAutoGenerate && apiKey) {
      setShouldAutoGenerate(true);
      handleGenerate();
    }
  }, [step2Result, initialData, isGenerating, shouldAutoGenerate, apiKey, handleGenerate]);

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handleComplete = () => {
    if (step3Data && onComplete) {
      console.log('✅ Step3 레이아웃 완료 - 데이터 전달:', step3Data);
      onComplete(step3Data);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col" style={{ backgroundColor: '#f5f5f7', height: 'calc(100vh - 72px)', marginTop: '72px' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-8">
            <div className="text-center">

            {/* 제목과 부제목 */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">AI 레이아웃 디자이너가 작업 중이에요</h2>
            <p className="text-lg text-gray-600 mb-12">교안 내용과 비주얼 아이덴티티를 바탕으로 최적의 레이아웃을 설계하고 있어요</p>

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

            {/* 페이지 진행 상황 */}
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                {step2Result?.pageContents?.length ? `총 ${step2Result.pageContents.length}개 페이지 레이아웃 설계 중` : '레이아웃 설계 진행 중'}
              </p>
            </div>

            {/* 예상 소요 시간 */}
            <p className="text-sm text-gray-500 mt-4">
              보통 20-40초 정도 소요됩니다
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

        {!step3Data && !isGenerating && (
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              레이아웃 설계 준비 중
            </h2>
            <p className="text-gray-600">
              잠시 후 자동으로 생성이 시작됩니다...
            </p>
          </div>
        )}

        {step3Data && (
          <>
            {/* 상단: 전체 개요 */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">레이아웃 설계 결과</h2>
                <p className="text-gray-600">각 페이지별 최적화된 레이아웃과 디자인 가이드</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.005]"
                     style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">레이아웃 모드</h3>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-3 ${step3Data.layoutMode === 'fixed' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    <span className="text-gray-700 font-medium">
                      {step3Data.layoutMode === 'fixed' ? '1600×1000px 고정 슬라이드' : '1600px 너비 스크롤형'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.005]"
                     style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">총 페이지 수</h3>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-blue-600 mr-2">{step3Data.pages.length}</span>
                    <span className="text-gray-600">개 페이지</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.005]"
                     style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">그리드 시스템</h3>
                  <div className="flex items-center">
                    <span className="text-gray-700 font-medium">
                      {step3Data.designTokens.grid.columns}컬럼 그리드 ({step3Data.designTokens.grid.gap}px 간격)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 페이지별 레이아웃 설계 결과 */}
            <div className="space-y-12">
              {step3Data.pages.map((page, index) => (
                <div
                  key={page.pageId}
                  className="bg-white rounded-3xl p-8 transition-all duration-300 hover:scale-[1.002]"
                  style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px 2px rgba(0, 0, 0, 0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'; }}
                >
                  {/* 페이지 헤더 */}
                  <div className="flex items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-6">
                      <span className="text-white font-bold text-xl">{page.pageNumber}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{page.pageTitle}</h3>
                      <p className="text-gray-600">페이지 {page.pageNumber} 레이아웃 설계</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* 좌측: Step2 교안 콘텐츠 (수정 없이 표시) */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4">📚 교안 콘텐츠 (Step2에서 가져옴)</h4>

                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-blue-800 mb-2">학습 목표</h5>
                          <p className="text-blue-700 text-sm">{page.textContent.learningGoal}</p>
                        </div>

                        <div className="bg-green-50 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-green-800 mb-2">핵심 메시지</h5>
                          <p className="text-green-700 text-sm font-medium">{page.textContent.keyMessage}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-gray-800 mb-2">교안 본문</h5>
                          <div className="text-gray-700 text-sm leading-relaxed max-h-32 overflow-y-auto">
                            {page.textContent.fullTextContent}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">{page.textContent.fullTextContent.length}자</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-purple-50 rounded-xl p-3">
                            <h5 className="text-sm font-semibold text-purple-800 mb-1">필요한 이미지</h5>
                            <p className="text-purple-700 text-xs">{page.textContent.imageDescription}</p>
                          </div>

                          <div className="bg-orange-50 rounded-xl p-3">
                            <h5 className="text-sm font-semibold text-orange-800 mb-1">상호작용 아이디어</h5>
                            <p className="text-orange-700 text-xs">{page.textContent.interactionHint}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 우측: 레이아웃 설계 */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4">🎨 레이아웃 설계</h4>

                      <div className="space-y-6">
                        {/* 레이아웃 컨셉 */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-indigo-800 mb-2">전체 레이아웃 컨셉</h5>
                          <p className="text-indigo-700 text-sm leading-relaxed">{page.layoutStructure.concept}</p>
                        </div>

                        {/* 섹션 구성 */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-gray-800 mb-3">섹션별 구성</h5>
                          <div className="space-y-2">
                            {page.layoutStructure.sections.map((section, sectionIndex) => (
                              <div key={section.id} className="flex items-center text-xs">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                <span className="font-medium text-gray-700 mr-2">{section.name}</span>
                                <span className="text-gray-500">({section.gridSpan})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 이미지 배치 */}
                        <div className="bg-green-50 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-green-800 mb-2">이미지 배치 전략</h5>
                          <div className="space-y-2 text-xs">
                            <p><span className="font-medium">위치:</span> {page.imageLayout.placement}</p>
                            <p><span className="font-medium">크기:</span> {page.imageLayout.sizing}</p>
                            <p><span className="font-medium">통합:</span> {page.imageLayout.integration}</p>
                          </div>
                        </div>

                        {/* 디자인 가이드 */}
                        <div className="bg-yellow-50 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-yellow-800 mb-2">디자인 가이드</h5>
                          <div className="space-y-1 text-xs">
                            <p><span className="font-medium">타이포그래피:</span> {page.designGuide.typography}</p>
                            <p><span className="font-medium">색상 적용:</span> {page.designGuide.colorApplication}</p>
                          </div>
                        </div>

                        {/* 구현 가이드 */}
                        <div className="bg-red-50 rounded-xl p-4">
                          <h5 className="text-sm font-semibold text-red-800 mb-2">구현 가이드라인</h5>
                          <div className="space-y-1 text-xs">
                            <p><span className="font-medium">CSS 구조:</span> {page.implementationGuide.cssStructure}</p>
                            <p><span className="font-medium">반응형:</span> {page.implementationGuide.responsiveStrategy}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 전체 디자인 토큰 정보 */}
            <div className="mt-12 mb-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">디자인 토큰 시스템</h2>
                <p className="text-gray-600">레이아웃에 적용된 디자인 시스템과 토큰</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.005]"
                     style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">타이포그래피 스케일</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(step3Data.designTokens.typography.scale).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.005]"
                     style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">간격 시스템</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">섹션 간격:</span>
                      <span className="font-medium text-gray-900">{step3Data.designTokens.spacing.section}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">컴포넌트 간격:</span>
                      <span className="font-medium text-gray-900">{step3Data.designTokens.spacing.component}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">기본 간격:</span>
                      <span className="font-medium text-gray-900">{step3Data.designTokens.spacing.md}px</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.005]"
                     style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">레이아웃 제약</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">최대 콘텐츠 너비:</span>
                      <span className="font-medium text-gray-900">{step3Data.designTokens.layout.maxContentWidth}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">뷰포트 너비:</span>
                      <span className="font-medium text-gray-900">{step3Data.designTokens.viewport.width}px</span>
                    </div>
                    {step3Data.designTokens.viewport.height && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">뷰포트 높이:</span>
                        <span className="font-medium text-gray-900">{step3Data.designTokens.viewport.height}px</span>
                      </div>
                    )}
                  </div>
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
          </>
        )}
      </div>
    </div>
  );
};