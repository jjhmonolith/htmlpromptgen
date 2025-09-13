import React, { useState, useEffect, useRef } from 'react';
import { ProjectData, VisualIdentity } from '../../../types/workflow.types';
import { Step3IntegratedDesignService } from '../../../services/step3-integrated-design.service';
import { Step3IntegratedResult } from '../../../types/workflow.types';
import { OpenAIService } from '../../../services/openai.service';

interface Step3IntegratedDesignProps {
  initialData?: Step3IntegratedResult;
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  apiKey: string;
  onComplete?: (data: Step3IntegratedResult) => void;
  onDataChange?: (data: Step3IntegratedResult) => void;
  onBack?: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

// 이미지 인덱스를 원형 숫자 기호로 변환하는 유틸리티 함수
const getCircledNumber = (filename?: string): string => {
  const num = parseInt(filename?.replace('.png', '') || '0');
  const circledNumbers = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
  return circledNumbers[num] || '❓';
};

export const Step3IntegratedDesignFC: React.FC<Step3IntegratedDesignProps> = ({
  initialData,
  projectData,
  visualIdentity,
  apiKey,
  onComplete,
  onDataChange,
  onBack,
  onGeneratingChange
}) => {
  const [step3Data, setStep3Data] = useState<Step3IntegratedResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [debugMode, setDebugMode] = useState(false);

  const lastStep3HashRef = useRef<string>('');

  // 생성 상태 변경을 부모로 전달
  useEffect(() => {
    // 전체적인 생성 상태 확인
    const overallGenerating = step3Data?.pages.some(page => page.isGenerating) || isGenerating;
    onGeneratingChange?.(overallGenerating);
  }, [step3Data, isGenerating, onGeneratingChange]);

  // initialData가 변경되면 컴포넌트 상태 동기화
  useEffect(() => {
    if (initialData) {
      setStep3Data(initialData);
      setIsDataLoaded(true);

      // 초기 데이터의 해시를 저장하여 불필요한 변경 알림 방지
      const initialHash = JSON.stringify(initialData);
      lastStep3HashRef.current = initialHash;
    }
  }, [initialData]);

  // step3Data가 변경될 때마다 onDataChange 호출 (해시 비교로 중복 방지)
  useEffect(() => {
    if (step3Data && isDataLoaded) {
      const currentHash = JSON.stringify(step3Data);
      if (currentHash !== lastStep3HashRef.current) {
        lastStep3HashRef.current = currentHash;
        onDataChange?.(step3Data);
      }
    }
  }, [step3Data, onDataChange, isDataLoaded]);

  // 컴포넌트 마운트 시 자동 생성 여부 결정
  useEffect(() => {
    if (step3Data) {
      // 이미 Step3 데이터가 있으면 자동 생성하지 않음
      console.log('✅ Step3: 기존 데이터 발견, 재생성 건너뜀');
      setShouldAutoGenerate(false);
      setIsDataLoaded(true);
    } else if (initialData) {
      // initialData가 있으면 사용하고 자동 생성하지 않음
      console.log('✅ Step3: 초기 데이터 로드됨, 재생성 건너뜀');
      setShouldAutoGenerate(false);
      setIsDataLoaded(true);
    } else {
      // 데이터가 전혀 없으면 자동 생성
      console.log('🔄 Step3: 데이터 없음, 자동 생성 예정');
      setShouldAutoGenerate(true);
    }
  }, [step3Data, initialData]);

  // 자동 생성 실행
  useEffect(() => {
    if (shouldAutoGenerate && !isGenerating && apiKey) {
      generateStep3Data();
    }
  }, [shouldAutoGenerate, isGenerating, apiKey]);

  const generateStep3Data = async () => {
    if (!apiKey || isGenerating) {
      if (!apiKey) {
        setError('API 키가 설정되지 않았습니다. 상단 우측의 설정 버튼을 클릭하여 API 키를 설정해주세요.');
      }
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      console.log('🎯 Step3: 통합 디자인 생성 시작');

      const openAIService = new OpenAIService();
      openAIService.initialize(apiKey);
      const step3Service = new Step3IntegratedDesignService(openAIService);

      const result = await step3Service.generateIntegratedDesign(projectData, visualIdentity);

      setStep3Data(result);
      setIsDataLoaded(true);
      setShouldAutoGenerate(false);

      console.log('✅ Step3: 통합 디자인 생성 완료', result);

    } catch (error) {
      console.error('❌ Step3 생성 실패:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateAll = () => {
    console.log('🔄 Step3: 전체 재생성 시작');
    setStep3Data(null);
    setIsDataLoaded(false);
    setShouldAutoGenerate(true);
  };

  const regeneratePage = async (pageIndex: number) => {
    if (!apiKey || !step3Data || step3Data.pages[pageIndex].isGenerating) return;

    try {
      console.log(`🔄 Step3: 페이지 ${pageIndex + 1} 재생성 시작`);

      const openAIService = new OpenAIService();
      openAIService.initialize(apiKey);
      const step3Service = new Step3IntegratedDesignService(openAIService);

      // 페이지 생성 중 표시
      const updatedStep3 = { ...step3Data };
      updatedStep3.pages[pageIndex].isGenerating = true;
      setStep3Data(updatedStep3);

      await step3Service.regeneratePage(updatedStep3, pageIndex, projectData, visualIdentity);

      // 결과 업데이트
      setStep3Data({ ...updatedStep3 });

      console.log(`✅ 페이지 ${pageIndex + 1} 재생성 완료`);

    } catch (error) {
      console.error(`❌ 페이지 ${pageIndex + 1} 재생성 실패:`, error);
    }
  };

  if (isGenerating && !step3Data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-white rounded-lg shadow-sm border">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">페이지별 콘텐츠 설계 중...</h3>
        <p className="text-sm text-gray-600 text-center">
          각 페이지의 구조와 콘텐츠를 단계별로 생성하고 있습니다.
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

  if (!step3Data) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 없음</h3>
        <p className="text-gray-700 mb-4">페이지 콘텐츠 설계 데이터가 없습니다.</p>
        <button
          onClick={regenerateAll}
          disabled={!apiKey || isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          생성하기
        </button>
      </div>
    );
  }

  const selectedPage = step3Data.pages[selectedPageIndex];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Step 3: 페이지별 콘텐츠 설계</h2>
            <p className="text-gray-600 mt-1">
              각 페이지의 완전한 콘텐츠와 이미지 계획을 확인하세요
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
          {step3Data.pages.map((page, index) => (
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
              {page.isGenerating && (
                <div className="ml-2 animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              )}
              {page.parseError && (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
              {!page.phase2Complete && !page.isGenerating && (
                <span className="ml-2 w-2 h-2 bg-yellow-500 rounded-full"></span>
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
                {/* Phase별 완료 상태 표시 */}
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-xs">
                    <span className={`w-2 h-2 rounded-full mr-1 ${
                      selectedPage.phase1Complete ? 'bg-green-500' :
                      selectedPage.isGenerating && !selectedPage.phase1Complete ? 'bg-blue-500 animate-pulse' :
                      'bg-gray-300'
                    }`}></span>
                    Phase 1: 구조설계
                  </div>
                  <div className="flex items-center text-xs">
                    <span className={`w-2 h-2 rounded-full mr-1 ${
                      selectedPage.phase2Complete ? 'bg-green-500' :
                      selectedPage.isGenerating && selectedPage.phase1Complete && !selectedPage.phase2Complete ? 'bg-blue-500 animate-pulse' :
                      'bg-gray-300'
                    }`}></span>
                    Phase 2: 콘텐츠생성
                  </div>
                </div>
                {selectedPage.isGenerating && (
                  <div className="text-sm text-blue-600 mt-1 flex items-center">
                    <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    {!selectedPage.phase1Complete ? 'Phase 1: 구조 설계 중...' :
                     !selectedPage.phase2Complete ? 'Phase 2: 콘텐츠 생성 중...' :
                     '마무리 중...'}
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
            {selectedPage.parseError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm text-red-800">
                  <span className="font-medium">오류:</span> {selectedPage.parseError}
                </div>
              </div>
            )}
          </div>

          {/* 콘텐츠 표시 */}
          {selectedPage.content && (
            <div className="bg-white p-6 rounded-lg shadow-sm border relative">
              {/* 개별 재생성 중 오버레이 */}
              {selectedPage.isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-600">페이지 재생성 중...</span>
                  </div>
                </div>
              )}

              <h4 className="text-md font-semibold text-gray-900 mb-4">페이지 콘텐츠</h4>

              {/* 컴포넌트 목록 */}
              {selectedPage.content.components.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">컴포넌트 ({selectedPage.content.components.length}개)</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">ID</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-24">타입</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">섹션</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">역할</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">그리드</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">이미지</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">텍스트 내용</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPage.content.components.map((comp) => (
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
                            <td className="py-3 px-3 text-gray-600 text-center">
                              {comp.type === 'image' ? (
                                <div className="flex items-center justify-center">
                                  <span className="text-xl text-green-600">
                                    {getCircledNumber(comp.src)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              {comp.type !== 'image' ? (
                                <div className="min-w-0 break-words whitespace-pre-wrap">
                                  {comp.text || '-'}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 이미지 목록 */}
              {selectedPage.content.images.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">이미지 ({selectedPage.content.images.length}개)</h5>
                  <div className="space-y-4">
                    {selectedPage.content.images.map((image) => (
                      <div key={image.filename} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl text-green-600">
                              {getCircledNumber(image.filename)}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 text-lg">{image.filename}</span>
                              <span className="text-xs text-gray-500 font-mono mt-1">
                                ~/image/page{selectedPage.pageNumber}/{image.filename}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                              {image.purpose}
                            </span>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
                              {image.style}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">배치 정보:</span>
                              <div className="mt-1 text-gray-600 space-y-1">
                                <div>섹션: <span className="font-mono text-xs bg-gray-100 px-1 rounded">{image.section}</span></div>
                                <div>위치: <span className="font-semibold">{image.place}</span></div>
                                <div>크기: <span className="font-mono">{image.width}×{image.height}px</span></div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">접근성 정보:</span>
                              <div className="mt-1 text-gray-600 space-y-1">
                                <div className="text-xs">
                                  <span className="text-gray-500">대체텍스트:</span>
                                  <div className="mt-0.5 text-gray-700 font-medium">{image.alt}</div>
                                </div>
                                <div className="text-xs">
                                  <span className="text-gray-500">캡션:</span>
                                  <div className="mt-0.5 text-gray-700 font-medium">{image.caption}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">🤖 AI 생성 프롬프트:</span>
                              <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-700 text-xs break-words whitespace-pre-wrap leading-relaxed">
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

              {selectedPage.content.components.length === 0 && selectedPage.content.images.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  콘텐츠가 아직 생성되지 않았습니다.
                </div>
              )}
            </div>
          )}

          {/* 디버그 모드 - Phase별 프롬프트와 응답 */}
          {debugMode && (
            <div className="space-y-4">
              {/* Phase 1 디버그 정보 */}
              {selectedPage.debugInfo?.phase1 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-md font-semibold text-blue-900 mb-3">🔧 Phase 1: 구조 설계</h4>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-blue-800 mb-2">📝 전달된 프롬프트:</h5>
                      <pre className="text-xs text-blue-700 bg-white p-3 rounded border overflow-x-auto max-h-40 whitespace-pre-wrap">
                        {selectedPage.debugInfo.phase1.prompt}
                      </pre>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-blue-800 mb-2">🤖 AI 원본 응답:</h5>
                      <pre className="text-xs text-blue-700 bg-white p-3 rounded border overflow-x-auto max-h-40 whitespace-pre-wrap">
                        {selectedPage.debugInfo.phase1.response}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 2 디버그 정보 */}
              {selectedPage.debugInfo?.phase2 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-md font-semibold text-green-900 mb-3">🎨 Phase 2: 콘텐츠 생성</h4>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-green-800 mb-2">📝 전달된 프롬프트:</h5>
                      <pre className="text-xs text-green-700 bg-white p-3 rounded border overflow-x-auto max-h-40 whitespace-pre-wrap">
                        {selectedPage.debugInfo.phase2.prompt}
                      </pre>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-green-800 mb-2">🤖 AI 원본 응답:</h5>
                      <pre className="text-xs text-green-700 bg-white p-3 rounded border overflow-x-auto max-h-40 whitespace-pre-wrap">
                        {selectedPage.debugInfo.phase2.response}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* 디버그 정보가 없는 경우 */}
              {(!selectedPage.debugInfo || (!selectedPage.debugInfo?.phase1 && !selectedPage.debugInfo?.phase2)) && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">🔍 이 페이지는 아직 생성되지 않았거나 디버그 정보가 없습니다.</p>
                </div>
              )}
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
          onClick={() => onComplete?.(step3Data)}
          disabled={!step3Data || step3Data.pages.some(page => page.isGenerating || !page.phase2Complete)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {step3Data?.pages.some(page => page.isGenerating) ? '생성 중...' : '다음 단계'}
        </button>
      </div>
    </div>
  );
};

// 기본 익스포트
export { Step3IntegratedDesignFC as Step3IntegratedDesign };