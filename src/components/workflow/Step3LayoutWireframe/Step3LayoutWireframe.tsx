import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectData, VisualIdentity, DesignTokens } from '../../../types/workflow.types';
import { Step3LayoutWireframeService, LayoutWireframe } from '../../../services/step3-layout-wireframe.service';
import { OpenAIService } from '../../../services/openai.service';

interface Step3LayoutWireframeProps {
  initialData?: LayoutWireframe;
  projectData: ProjectData;
  visualIdentity: VisualIdentity;
  designTokens: DesignTokens;
  apiKey: string;
  onComplete?: (data: LayoutWireframe) => void;
  onDataChange?: (data: LayoutWireframe) => void;
  onBack?: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export const Step3LayoutWireframe: React.FC<Step3LayoutWireframeProps> = ({ 
  initialData,
  projectData,
  visualIdentity,
  designTokens,
  apiKey,
  onComplete, 
  onDataChange,
  onBack,
  onGeneratingChange
}) => {
  const [step3Data, setStep3Data] = useState<LayoutWireframe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);

  // 생성 상태 변경을 부모로 전달
  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

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

  // 이전 데이터 해시 추적용 ref
  const lastStep3HashRef = useRef('');

  // 데이터 변경 시 실시간으로 부모에게 알림 (자동저장)
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

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError('API 키가 필요합니다.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      console.log('📐 Step3: 레이아웃 와이어프레임 생성 요청');
      
      const openAIService = OpenAIService.getInstance();
      openAIService.initialize(apiKey);
      const step3Service = new Step3LayoutWireframeService(openAIService);
      
      const result = await step3Service.generateLayoutWireframe(projectData, visualIdentity, designTokens);
      
      console.log('✅ Step3 생성 완료:', result);
      setStep3Data(result);
      setIsDataLoaded(true);
      
    } catch (error) {
      console.error('❌ Step3 생성 실패:', error);
      setError(error instanceof Error ? error.message : '레이아웃 와이어프레임 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, projectData, visualIdentity, designTokens]);

  // Step2에서 넘어온 경우 자동으로 생성 시작
  useEffect(() => {
    if (projectData && visualIdentity && designTokens && !initialData && !isGenerating && !shouldAutoGenerate && apiKey) {
      setShouldAutoGenerate(true);
      handleGenerate();
    }
  }, [projectData, visualIdentity, designTokens, initialData, isGenerating, shouldAutoGenerate, apiKey, handleGenerate]);

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handleComplete = () => {
    if (step3Data && onComplete) {
      console.log('✅ Step3 완료 - 데이터 전달:', step3Data);
      onComplete(step3Data);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Date 객체가 유효한지 확인
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date:', date);
        return '';
      }
      
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.warn('Date formatting error:', error, date);
      return '';
    }
  };

  if (isGenerating) {
    const totalPages = projectData?.pages?.length || 0;
    
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
        <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-12">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">레이아웃 와이어프레임 생성 중</h2>
            <p className="text-gray-600 mb-6">
              {totalPages > 1 
                ? `${totalPages}개 페이지를 병렬로 처리하여 빠르게 생성하고 있습니다...`
                : '페이지 구조와 섹션을 설계하고 있습니다...'
              }
            </p>
            
            {totalPages > 1 && (
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">병렬 처리로 속도 향상</span>
                  </div>
                  <div className="text-xs text-gray-500 text-left space-y-1">
                    <p>• 모든 페이지가 동시에 생성됩니다</p>
                    <p>• 전체 학습 흐름을 고려한 설계</p>
                    <p>• 페이지 간 연결성 최적화</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
      <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-12">
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
              3
            </div>
            <h1 className="text-3xl font-bold text-gray-900">레이아웃 와이어프레임</h1>
          </div>
          <p className="text-lg text-gray-600 mb-8">
            페이지의 구조와 섹션 배치를 정의합니다.
          </p>
        </div>

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              레이아웃 와이어프레임 준비 중
            </h2>
            <p className="text-gray-600">
              잠시 후 자동으로 생성이 시작됩니다...
            </p>
          </div>
        )}
        
        {step3Data && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">페이지별 레이아웃 제안</h3>
                <div className="text-sm text-gray-500">
                  {step3Data.generatedAt ? formatDate(step3Data.generatedAt) : ''}
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">레이아웃 모드:</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                    {step3Data.layoutMode}
                  </span>
                  <div className="flex items-center gap-4 ml-auto">
                    {(step3Data.pages?.length || 0) > 1 && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm font-medium text-green-700">병렬 생성</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">총 {step3Data.pages?.length || 0}개 페이지</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {step3Data.pages && step3Data.pages.length > 0 ? (
                  step3Data.pages.map((page, index) => (
                    <div key={page.pageId} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {page.pageNumber}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="mb-3">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">
                              {page.pageTitle}
                            </h4>
                            <div className="text-sm text-gray-500">
                              페이지 {page.pageNumber} • {page.generatedAt ? formatDate(page.generatedAt) : ''}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {/* 레이아웃 설명 */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">레이아웃 설명 (AI 응답)</h5>
                              <div
                                className="text-sm text-gray-800 leading-relaxed max-h-96 overflow-y-auto prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: page.layoutDescription
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                    .replace(/\n/g, '<br />')
                                }}
                              />
                            </div>

                            {/* 파싱된 와이어프레임 데이터 */}
                            {page.wireframe && (
                              <details className="bg-blue-50 rounded-lg">
                                <summary className="cursor-pointer p-4 hover:bg-blue-100 rounded-lg">
                                  <span className="text-sm font-medium text-blue-700">파싱된 와이어프레임 데이터 (클릭하여 펼치기)</span>
                                </summary>
                                <div className="px-4 pb-4 space-y-3">

                                  {/* 페이지 스타일 */}
                                  {page.wireframe.pageStyle && Object.keys(page.wireframe.pageStyle).length > 0 && (
                                    <div>
                                      <div className="font-medium text-blue-600 text-xs mb-1">Page Style:</div>
                                      <div className="text-xs text-blue-800 bg-blue-100 rounded p-2">
                                        {Object.entries(page.wireframe.pageStyle).map(([key, value]) => (
                                          <span key={key} className="mr-3">
                                            {key}: {value as string}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* 섹션 정보 */}
                                  {page.wireframe.sections && page.wireframe.sections.length > 0 && (
                                    <div>
                                      <div className="font-medium text-blue-600 text-xs mb-2">Sections ({page.wireframe.sections.length}):</div>
                                      <div className="space-y-2">
                                        {page.wireframe.sections.map((section: any, index: number) => (
                                          <div key={index} className="text-xs bg-blue-100 rounded p-2">
                                            <div className="grid grid-cols-2 gap-2">
                                              <div><span className="font-medium">ID:</span> {section.id}</div>
                                              <div><span className="font-medium">Role:</span> {section.role}</div>
                                              <div><span className="font-medium">Grid:</span> {section.grid}</div>
                                              <div><span className="font-medium">Gap:</span> {section.gapBelow}px</div>
                                            </div>
                                            {section.hint && (
                                              <div className="mt-1 text-blue-700">
                                                <span className="font-medium">Hint:</span> {section.hint}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* 슬롯 정보 */}
                                  {page.wireframe.slots && page.wireframe.slots.length > 0 && (
                                    <div>
                                      <div className="font-medium text-blue-600 text-xs mb-2">Slots ({page.wireframe.slots.length}):</div>
                                      <div className="space-y-1">
                                        {page.wireframe.slots.map((slot: any, index: number) => (
                                          <div key={index} className="text-xs bg-blue-100 rounded p-2">
                                            <div className="grid grid-cols-3 gap-2">
                                              <div><span className="font-medium">ID:</span> {slot.id}</div>
                                              <div><span className="font-medium">Section:</span> {slot.section}</div>
                                              <div><span className="font-medium">Type:</span> {slot.type}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                              {slot.variant && <div><span className="font-medium">Variant:</span> {slot.variant}</div>}
                                              {slot.gridSpan && <div><span className="font-medium">Grid Span:</span> {slot.gridSpan}</div>}
                                              {slot.slotRef && <div><span className="font-medium">Slot Ref:</span> {slot.slotRef}</div>}
                                              {slot.width && <div><span className="font-medium">Size:</span> {slot.width}×{slot.height}</div>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* 요약 정보 */}
                                  {page.wireframe.summary && (
                                    <div>
                                      <div className="font-medium text-blue-600 text-xs mb-1">Summary:</div>
                                      <div className="text-xs text-blue-800 bg-blue-100 rounded p-2">
                                        Sections: {page.wireframe.summary.sections} |
                                        Slots: {page.wireframe.summary.slots} |
                                        Image Slots: {page.wireframe.summary.imageSlots}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </details>
                            )}

                            {/* 파싱 실패 시 표시 */}
                            {!page.wireframe && (
                              <div className="bg-yellow-50 rounded-lg p-4">
                                <h5 className="text-sm font-medium text-yellow-700 mb-2">파싱 상태</h5>
                                <div className="text-xs text-yellow-800">
                                  구조화된 와이어프레임 데이터 파싱에 실패했습니다. AI 원본 응답만 표시됩니다.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>레이아웃 제안이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="px-6 py-3 bg-white text-gray-700 rounded-full hover:bg-gray-50 transition-colors shadow-sm border border-gray-300"
                  >
                    ← 이전 단계
                  </button>
                )}
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  🔄 다시 생성
                </button>
              </div>
              
              <button
                onClick={handleComplete}
                className="px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors font-medium shadow-sm"
              >
                다음 단계 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};