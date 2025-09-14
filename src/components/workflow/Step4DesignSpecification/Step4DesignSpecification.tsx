import React, { useState, useEffect, useRef } from 'react';
import { ProjectData, VisualIdentity, Step3IntegratedResult } from '../../../types/workflow.types';
import { Step4DesignResult, ValidationResult } from '../../../types/step4.types';
import { Step4DesignSpecificationService } from '../../../services/step4-design-specification.service';
import { ValidationEngine } from '../../../services/engines/ValidationEngine';
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
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);

  const lastStep4HashRef = useRef<string>('');
  const validationEngine = useRef(new ValidationEngine());

  // 생성 상태 변경을 부모로 전달
  useEffect(() => {
    const overallGenerating = step4Data?.pages.some(page => page.isGenerating) || isGenerating;
    onGeneratingChange?.(overallGenerating);
  }, [step4Data, isGenerating, onGeneratingChange]);

  // initialData가 변경되면 컴포넌트 상태 동기화
  useEffect(() => {
    if (initialData) {
      setStep4Data(initialData);
      setIsDataLoaded(true);

      // 검증 실행
      validateAllPages(initialData);

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

  // 자동 생성 실행
  useEffect(() => {
    if (shouldAutoGenerate && !isGenerating && apiKey) {
      generateStep4Data();
    }
  }, [shouldAutoGenerate, isGenerating, apiKey]);

  const validateAllPages = (data: Step4DesignResult) => {
    const results = data.pages.map(page =>
      validationEngine.current.validatePage(page, data.layoutMode)
    );
    setValidationResults(results);
  };

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

      console.log('🎯 Step4: 디자인 명세 생성 시작');

      const openAIService = new OpenAIService();
      openAIService.initialize(apiKey);
      const step4Service = new Step4DesignSpecificationService(openAIService);

      const result = await step4Service.generateDesignSpecification(
        projectData,
        visualIdentity,
        step3Result
      );

      setStep4Data(result);
      setIsDataLoaded(true);
      setShouldAutoGenerate(false);
      validateAllPages(result);

      console.log('✅ Step4: 디자인 명세 생성 완료', result);

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

      // 결과 업데이트 및 검증
      setStep4Data({ ...updatedStep4 });
      validateAllPages(updatedStep4);

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
      <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-white rounded-lg shadow-sm border">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">정밀한 디자인 명세 생성 중...</h3>
        <p className="text-sm text-gray-600 text-center">
          Step3의 콘텐츠 계획을 구현 가능한 정밀 명세로 변환하고 있습니다.
          <br />
          레이아웃 정밀화, 스타일 구체화, 상호작용 설계가 진행됩니다.
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

  const selectedPage = step4Data.pages[selectedPageIndex];
  const selectedValidation = validationResults[selectedPageIndex];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Step 4: 정밀한 디자인 명세</h2>
            <p className="text-gray-600 mt-1">
              구현 가능한 상세한 디자인 명세서를 확인하세요
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

                {/* 검증 결과 표시 */}
                {selectedValidation && (
                  <div className="flex items-center space-x-4 mt-2">
                    <div className={`px-2 py-1 text-xs rounded-md ${
                      selectedValidation.isValid
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedValidation.isValid ? '✅ 검증 통과' : '❌ 검증 실패'}
                      {selectedValidation.score !== undefined && ` (${selectedValidation.score}점)`}
                    </div>

                    {selectedValidation.errors.length > 0 && (
                      <span className="text-xs text-red-600">
                        오류 {selectedValidation.errors.length}개
                      </span>
                    )}

                    {selectedValidation.warnings.length > 0 && (
                      <span className="text-xs text-yellow-600">
                        경고 {selectedValidation.warnings.length}개
                      </span>
                    )}
                  </div>
                )}

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

            {/* 검증 세부 정보 */}
            {selectedValidation && (selectedValidation.errors.length > 0 || selectedValidation.warnings.length > 0) && (
              <div className="mt-3 space-y-2">
                {selectedValidation.errors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm text-red-800 font-medium">오류:</div>
                    {selectedValidation.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-700">• {error}</div>
                    ))}
                  </div>
                )}

                {selectedValidation.warnings.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="text-sm text-yellow-800 font-medium">경고:</div>
                    {selectedValidation.warnings.map((warning, idx) => (
                      <div key={idx} className="text-sm text-yellow-700">• {warning}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
          ) : selectedPage.layout && selectedPage.componentStyles ? (
            <div className="space-y-4">
              {/* 레이아웃 정보 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-md font-semibold text-gray-900 mb-4">📐 레이아웃 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">페이지 크기:</span>
                    <div className="text-gray-600">
                      {selectedPage.layout.pageWidth} × {
                        selectedPage.layout.pageHeight === 'auto'
                          ? 'auto'
                          : `${selectedPage.layout.pageHeight}px`
                      }
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">섹션 수:</span>
                    <div className="text-gray-600">{selectedPage.layout.sections?.length || 0}개</div>
                  </div>
                </div>
              </div>

              {/* 컴포넌트 스타일 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-md font-semibold text-gray-900 mb-4">🎨 컴포넌트 스타일 ({selectedPage.componentStyles.length}개)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-700">ID</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">타입</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">위치</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">크기</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">색상</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">폰트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPage.componentStyles.map((comp, compIndex) => (
                        <tr key={`step4-comp-${comp.id}-${compIndex}`} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-600 font-mono text-xs">{comp.id}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 text-xs rounded-md ${
                              comp.type === 'heading' ? 'bg-blue-100 text-blue-800' :
                              comp.type === 'image' ? 'bg-green-100 text-green-800' :
                              comp.type === 'card' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {comp.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-xs">
                            {comp.position.x}, {comp.position.y}
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-xs">
                            {comp.dimensions.width} × {
                              comp.dimensions.height === 'auto' ? 'auto' : comp.dimensions.height
                            }
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-xs">
                            {comp.colors.text && (
                              <div className="flex items-center space-x-1">
                                <div
                                  className="w-3 h-3 border rounded"
                                  style={{ backgroundColor: comp.colors.text }}
                                ></div>
                                <span>{comp.colors.text}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-xs">
                            {comp.font && (
                              <div className="space-y-1">
                                <div className="font-semibold">{comp.font.family}</div>
                                <div className="text-xs text-gray-500">
                                  {comp.font.size} / {comp.font.weight} / {comp.font.lineHeight}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 이미지 배치 */}
              {selectedPage.imagePlacements && selectedPage.imagePlacements.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">🖼️ 이미지 배치 ({selectedPage.imagePlacements.length}개)</h4>
                  <div className="grid gap-4">
                    {selectedPage.imagePlacements.map((img, idx) => (
                      <div key={`step4-img-${selectedPage.pageId}-${idx}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{img.filename || `이미지 ${idx + 1}`}</div>
                            <div className="text-sm text-gray-600 mt-1">{img.alt}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              위치: {img.position.x}, {img.position.y} | 크기: {img.dimensions.width} × {img.dimensions.height}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 인터랙션 및 애니메이션 */}
              {selectedPage.interactions && selectedPage.interactions.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">⚡ 인터랙션 & 애니메이션 ({selectedPage.interactions.length}개)</h4>
                  <div className="grid gap-3">
                    {selectedPage.interactions.map((interaction, idx) => (
                      <div key={`step4-interaction-${selectedPage.pageId}-${idx}`} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-blue-900">{interaction.id}</div>
                            <div className="text-sm text-blue-700 mt-1">
                              대상: {interaction.target} | 트리거: {interaction.trigger} | 효과: {interaction.effect}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              지속시간: {interaction.duration}
                              {interaction.delay && ` | 지연: ${interaction.delay}`}
                              {interaction.easing && ` | 이징: ${interaction.easing}`}
                            </div>
                            {interaction.parameters && (
                              <div className="text-xs text-blue-500 mt-1">
                                파라미터: {JSON.stringify(interaction.parameters)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 교육적 기능 */}
              {selectedPage.educationalFeatures && selectedPage.educationalFeatures.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">🎯 교육적 기능 ({selectedPage.educationalFeatures.length}개)</h4>
                  <div className="grid gap-3">
                    {selectedPage.educationalFeatures.map((feature, idx) => (
                      <div key={`step4-edu-${selectedPage.pageId}-${idx}`} className="border border-green-200 rounded-lg p-3 bg-green-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-green-900">{feature.id}</div>
                            <div className="text-sm text-green-700 mt-1">
                              타입: {feature.type} | 위치: {feature.position}
                            </div>
                            {feature.dimensions && (
                              <div className="text-xs text-green-600 mt-1">
                                크기: {feature.dimensions.width} × {feature.dimensions.height}
                              </div>
                            )}
                            <div className="text-xs text-green-500 mt-1">
                              자동업데이트: {feature.behavior.autoUpdate ? '예' : '아니오'} |
                              사용자제어: {feature.behavior.userControl ? '예' : '아니오'} |
                              지속성: {feature.behavior.persistence ? '예' : '아니오'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
          disabled={!step4Data || step4Data.pages.every(page => !page.isComplete)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={
            !step4Data ? '데이터를 불러오는 중입니다...' :
            step4Data.pages.every(page => !page.isComplete)
              ? `다음 페이지를 재생성해주세요: ${step4Data.pages.filter(p => !p.isComplete).map(p => `페이지 ${p.pageNumber}(${p.pageTitle})`).join(', ')}`
              : ''
          }
        >
          {step4Data?.pages.some(page => page.isGenerating)
            ? `다음 단계 (${step4Data.pages.filter(p => p.isGenerating).length}개 페이지 생성 중)`
            : '다음 단계'
          }
        </button>
      </div>
    </div>
  );
};

// 기본 익스포트
export { Step4DesignSpecificationFC as Step4DesignSpecification };