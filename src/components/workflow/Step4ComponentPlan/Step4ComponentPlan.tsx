import React, { useState, useEffect, useRef } from 'react';
import { ProjectData, VisualIdentity, Step4Result } from '../../../types/workflow.types';
import { LayoutWireframe } from '../../../services/step3-layout-wireframe.service';
import { Step4ComponentPlanService } from '../../../services/step4-component-plan.service';
import { OpenAIService } from '../../../services/openai.service';

interface Step4ComponentPlanProps {
  initialData?: Step4Result;
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  step3Data: LayoutWireframe;
  apiKey: string;
  onComplete?: (data: Step4Result) => void;
  onDataChange?: (data: Step4Result) => void;
  onBack?: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export const Step4ComponentPlanFC: React.FC<Step4ComponentPlanProps> = ({
  initialData,
  projectData,
  visualIdentity,
  step3Data,
  apiKey,
  onComplete,
  onDataChange,
  onBack,
  onGeneratingChange
}) => {
  const [step4Data, setStep4Data] = useState<Step4Result | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [debugMode, setDebugMode] = useState(false);

  const lastStep4HashRef = useRef<string>('');

  // 생성 상태 변경을 부모로 전달
  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  // initialData가 변경되면 컴포넌트 상태 동기화
  useEffect(() => {
    if (initialData) {
      setStep4Data(initialData);
      setIsDataLoaded(true);

      // 초기 데이터의 해시를 저장하여 불필요한 변경 알림 방지
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
      // 이미 Step4 데이터가 있으면 자동 생성하지 않음
      console.log('✅ Step4: 기존 데이터 발견, 재생성 건너뜀');
      setShouldAutoGenerate(false);
      setIsDataLoaded(true);
    } else if (initialData) {
      // initialData가 있으면 사용하고 자동 생성하지 않음
      console.log('✅ Step4: 초기 데이터 로드됨, 재생성 건너뜀');
      setShouldAutoGenerate(false);
      setIsDataLoaded(true);
    } else {
      // 데이터가 전혀 없으면 자동 생성
      console.log('🔄 Step4: 데이터 없음, 자동 생성 예정');
      setShouldAutoGenerate(true);
    }
  }, [step4Data, initialData]);

  // 자동 생성 실행
  useEffect(() => {
    if (shouldAutoGenerate && !isGenerating && apiKey && step3Data) {
      generateStep4Data();
    }
  }, [shouldAutoGenerate, isGenerating, apiKey, step3Data]);

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

      console.log('🎯 Step4: 컴포넌트 계획 생성 시작');

      const openAIService = new OpenAIService();
      openAIService.initialize(apiKey);
      const step4Service = new Step4ComponentPlanService(openAIService);

      // 모든 페이지를 병렬로 처리
      const pagePromises = step3Data.pages.map(async (page, index) => {
        console.log(`📋 페이지 ${page.pageNumber} 컴포넌트 계획 생성 시작`);

        const result = await step4Service.generateComponentPlan(
          projectData,
          visualIdentity,
          step3Data,
          index
        );

        return {
          pageId: page.pageId,
          pageTitle: page.pageTitle,
          pageNumber: page.pageNumber,
          componentPlan: result.plan,
          rawResponse: result.rawResponse,
          parseError: result.parseError,
          generatedAt: new Date()
        };
      });

      console.log(`⏰ ${step3Data.pages.length}개 페이지 병렬 처리 대기 중...`);
      const pages = await Promise.all(pagePromises);

      // 페이지 번호순으로 정렬
      pages.sort((a, b) => a.pageNumber - b.pageNumber);

      const result: Step4Result = {
        layoutMode: projectData.layoutMode,
        pages,
        generatedAt: new Date()
      };

      setStep4Data(result);
      setIsDataLoaded(true);
      setShouldAutoGenerate(false);

      console.log('✅ Step4: 모든 페이지 컴포넌트 계획 생성 완료', result);

    } catch (error) {
      console.error('❌ Step4 생성 실패:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateAll = () => {
    console.log('🔄 Step4: 전체 재생성 시작');
    setStep4Data(null); // 기존 데이터 제거하여 로딩 화면 표시
    setIsDataLoaded(false);
    setShouldAutoGenerate(true);
  };

  const regeneratePage = async (pageIndex: number) => {
    if (!apiKey || isGenerating || !step4Data) return;

    try {
      setIsGenerating(true);
      setError(null);

      console.log(`🔄 Step4: 페이지 ${pageIndex + 1} 재생성 시작`);

      const openAIService = new OpenAIService();
      openAIService.initialize(apiKey);
      const step4Service = new Step4ComponentPlanService(openAIService);

      const result = await step4Service.generateComponentPlan(
        projectData,
        visualIdentity,
        step3Data,
        pageIndex
      );

      // 해당 페이지만 업데이트
      const updatedPages = [...step4Data.pages];
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        componentPlan: result.plan,
        rawResponse: result.rawResponse,
        parseError: result.parseError,
        generatedAt: new Date()
      };

      const updatedStep4: Step4Result = {
        ...step4Data,
        pages: updatedPages,
        generatedAt: new Date()
      };

      setStep4Data(updatedStep4);

      console.log(`✅ 페이지 ${pageIndex + 1} 재생성 완료`);

    } catch (error) {
      console.error(`❌ 페이지 ${pageIndex + 1} 재생성 실패:`, error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating && !step4Data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-white rounded-lg shadow-sm border">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">컴포넌트 계획 생성 중...</h3>
        <p className="text-sm text-gray-600 text-center">
          Step3의 와이어프레임을 바탕으로 각 페이지의 컴포넌트와 이미지 계획을 생성하고 있습니다.
          <br />
          잠시만 기다려주세요.
        </p>
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

  if (!step4Data) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 없음</h3>
        <p className="text-gray-700 mb-4">컴포넌트 계획 데이터가 없습니다.</p>
        <button
          onClick={regenerateAll}
          disabled={!step3Data || isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          생성하기
        </button>
      </div>
    );
  }

  const selectedPage = step4Data.pages[selectedPageIndex];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Step 4: 컴포넌트 계획</h2>
            <p className="text-gray-600 mt-1">
              각 페이지의 구체적인 컴포넌트와 이미지를 계획합니다
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
              key={page.pageId}
              onClick={() => setSelectedPageIndex(index)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPageIndex === index
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{page.pageNumber}</span>
              {page.pageTitle}
              {page.parseError && (
                <span className="ml-2 w-2 h-2 bg-yellow-500 rounded-full"></span>
              )}
              {!page.componentPlan && (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
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
                  생성 시간: {selectedPage.generatedAt.toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => regeneratePage(selectedPageIndex)}
                disabled={isGenerating}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isGenerating && (
                  <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                <span>{isGenerating ? '생성 중...' : '이 페이지 재생성'}</span>
              </button>
            </div>

            {/* 상태 표시 */}
            {selectedPage.parseError && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm text-yellow-800">
                  <span className="font-medium">경고:</span> {selectedPage.parseError}
                </div>
              </div>
            )}
          </div>

          {/* 컴포넌트 계획 표시 */}
          {selectedPage.componentPlan && (
            <div className="bg-white p-6 rounded-lg shadow-sm border relative">
              {/* 개별 재생성 중 오버레이 */}
              {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-600">페이지 재생성 중...</span>
                  </div>
                </div>
              )}

              <h4 className="text-md font-semibold text-gray-900 mb-4">컴포넌트 계획</h4>

              {/* 컴포넌트 목록 */}
              {selectedPage.componentPlan.comps.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">컴포넌트 ({selectedPage.componentPlan.comps.length}개)</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">ID</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-24">타입</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">섹션</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">역할</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">그리드</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">텍스트</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPage.componentPlan.comps.map((comp) => (
                          <tr key={comp.id} className="border-b border-gray-100 align-top">
                            <td className="py-3 px-3 text-gray-600 text-xs font-mono">{comp.id}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-1 text-xs rounded-md ${
                                comp.type === 'heading' ? 'bg-blue-100 text-blue-800' :
                                comp.type === 'image' ? 'bg-green-100 text-green-800' :
                                comp.type === 'card' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {comp.type}
                              </span>
                              {comp.variant && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {comp.variant}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-gray-600 text-xs">{comp.section}</td>
                            <td className="py-3 px-3 text-gray-600 text-xs">{comp.role}</td>
                            <td className="py-3 px-3 text-gray-600">
                              {comp.gridSpan && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">
                                  {comp.gridSpan}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              <div className="min-w-0 break-words whitespace-pre-wrap">
                                {comp.text || comp.src || '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 이미지 목록 */}
              {selectedPage.componentPlan.images.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">이미지 ({selectedPage.componentPlan.images.length}개)</h5>
                  <div className="space-y-4">
                    {selectedPage.componentPlan.images.map((image) => (
                      <div key={image.filename} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-900 text-lg">{image.filename}</span>
                          <div className="flex space-x-2">
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                              {image.purpose}
                            </span>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
                              {image.style}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">기본 정보:</span>
                              <div className="mt-1 text-gray-600 space-y-1">
                                <div>섹션: {image.section}</div>
                                <div>위치: {image.place}</div>
                                <div>크기: {image.width}×{image.height}px</div>
                              </div>
                            </div>

                            <div className="text-sm">
                              <span className="font-medium text-gray-700">메타데이터:</span>
                              <div className="mt-1 text-gray-600 space-y-1">
                                <div>Alt: {image.alt}</div>
                                <div>캡션: {image.caption}</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">설명:</span>
                              <div className="mt-1 text-gray-600 break-words">
                                {image.description}
                              </div>
                            </div>

                            <div className="text-sm">
                              <span className="font-medium text-gray-700">🤖 AI 이미지 생성 프롬프트:</span>
                              <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded text-gray-700 text-xs break-words whitespace-pre-wrap font-mono">
                                {image.aiPrompt}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPage.componentPlan.comps.length === 0 && selectedPage.componentPlan.images.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  컴포넌트나 이미지가 생성되지 않았습니다.
                </div>
              )}
            </div>
          )}

          {/* 디버그 모드 - AI 원본 응답 */}
          {debugMode && selectedPage.rawResponse && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="text-md font-semibold text-gray-900 mb-3">🐛 AI 원본 응답</h4>
              <pre className="text-xs text-gray-700 bg-white p-4 rounded border overflow-x-auto">
                {selectedPage.rawResponse}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          이전 단계
        </button>

        <button
          onClick={() => onComplete?.(step4Data)}
          disabled={!step4Data || isGenerating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? '생성 중...' : '다음 단계'}
        </button>
      </div>
    </div>
  );
};

// 기본 익스포트
export { Step4ComponentPlanFC as Step4ComponentPlan };