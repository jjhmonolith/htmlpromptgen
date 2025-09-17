import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { ProjectData, VisualIdentity, DesignTokens } from '../../../types/workflow.types';
import { Step2VisualIdentityService } from '../../../services/step2-visual-identity.service';
import { OpenAIService } from '../../../services/openai.service';

interface Step2VisualIdentityProps {
  initialData?: { visualIdentity: VisualIdentity; designTokens: DesignTokens };
  projectData: ProjectData;
  apiKey: string;
  onComplete?: (data: { visualIdentity: VisualIdentity; designTokens: DesignTokens }) => void;
  onDataChange?: (data: { visualIdentity: VisualIdentity; designTokens: DesignTokens }) => void;
  onBack?: () => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export const Step2VisualIdentity: React.FC<Step2VisualIdentityProps> = ({ 
  initialData,
  projectData,
  apiKey,
  onComplete, 
  onDataChange,
  onBack,
  onGeneratingChange
}) => {
  const [step2Data, setStep2Data] = useState<{ visualIdentity: VisualIdentity; designTokens: DesignTokens } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);

  // 생성 상태 변경을 부모로 전달
  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  useEffect(() => {
    if (initialData) {
      setStep2Data(initialData);
      setIsDataLoaded(true);
      
      // 초기 데이터의 해시를 저장하여 불필요한 변경 알림 방지
      const initialHash = JSON.stringify(initialData);
      lastStep2HashRef.current = initialHash;
    }
  }, [initialData]);

  // 이전 데이터 해시 추적용 ref
  const lastStep2HashRef = useRef('');

  useEffect(() => {
    if (isDataLoaded && step2Data && onDataChange) {
      const timeoutId = setTimeout(() => {
        // 현재 데이터의 해시 생성 (변경 감지용)
        const currentHash = JSON.stringify(step2Data);
        
        // 실제로 변경된 경우에만 알림
        if (currentHash !== lastStep2HashRef.current) {
          lastStep2HashRef.current = currentHash;
          onDataChange(step2Data);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [step2Data, isDataLoaded, onDataChange]);

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError('API 키가 필요합니다.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      console.log('🎨 Step2: 비주얼 아이덴티티 생성 요청');
      
      const openAIService = OpenAIService.getInstance();
      openAIService.initialize(apiKey);
      const step2Service = new Step2VisualIdentityService(openAIService);
      
      const result = await step2Service.generateVisualIdentity(projectData);
      
      console.log('✅ Step2 생성 완료:', result);
      setStep2Data(result);
      setIsDataLoaded(true);
      
    } catch (error) {
      console.error('❌ Step2 생성 실패:', error);
      setError(error instanceof Error ? error.message : '비주얼 아이덴티티 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, projectData]);

  // Step1에서 넘어온 경우 자동으로 생성 시작
  useEffect(() => {
    if (projectData && !initialData && !isGenerating && !shouldAutoGenerate && apiKey) {
      setShouldAutoGenerate(true);
      handleGenerate();
    }
  }, [projectData, initialData, isGenerating, shouldAutoGenerate, apiKey, handleGenerate]);

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handleComplete = () => {
    if (step2Data && onComplete) {
      console.log('✅ Step2 완료 - 데이터 전달:', step2Data);
      onComplete(step2Data);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 py-12">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-full">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">비주얼 아이덴티티 생성 중</h2>
            <p className="text-gray-600">프로젝트에 맞는 색상과 스타일을 생성하고 있습니다...</p>
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

        {!step2Data && !isGenerating && (
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              비주얼 아이덴티티 준비 중
            </h2>
            <p className="text-gray-600">
              잠시 후 자동으로 생성이 시작됩니다...
            </p>
          </div>
        )}
        
        {step2Data && (
          <>
            <div className="space-y-4">
              {/* 무드와 톤 키워드들 - 가로 배치 */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex flex-wrap justify-center gap-3 mb-6">
                    {step2Data.visualIdentity.moodAndTone.map((mood, index) => (
                      <div key={index} className="group relative">
                        <span className="inline-block px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 rounded-full text-base font-semibold shadow-sm border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-105">
                          {mood}
                        </span>
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs">✨</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200 text-center">
                    <p className="text-sm text-purple-800 leading-relaxed font-medium">
                      🎼 <span className="font-semibold">감성 하모니:</span> 이 무드들이 조화롭게 어우러져 학습자에게 몰입감 있는 교육 경험을 선사합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 컬러 팔레트 - 가로 넓은 배치 */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="grid grid-cols-5 gap-6 mb-6">
                    <div className="text-center">
                      <div
                        className="w-full h-24 rounded-xl mb-3 border shadow-sm"
                        style={{ backgroundColor: step2Data.visualIdentity.colorPalette.primary }}
                      ></div>
                      <p className="text-base font-semibold text-gray-700 mb-1">Primary</p>
                      <p className="text-sm text-gray-500 font-mono">{step2Data.visualIdentity.colorPalette.primary}</p>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-full h-24 rounded-xl mb-3 border shadow-sm"
                        style={{ backgroundColor: step2Data.visualIdentity.colorPalette.secondary }}
                      ></div>
                      <p className="text-base font-semibold text-gray-700 mb-1">Secondary</p>
                      <p className="text-sm text-gray-500 font-mono">{step2Data.visualIdentity.colorPalette.secondary}</p>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-full h-24 rounded-xl mb-3 border shadow-sm"
                        style={{ backgroundColor: step2Data.visualIdentity.colorPalette.accent }}
                      ></div>
                      <p className="text-base font-semibold text-gray-700 mb-1">Accent</p>
                      <p className="text-sm text-gray-500 font-mono">{step2Data.visualIdentity.colorPalette.accent}</p>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-full h-24 rounded-xl mb-3 border shadow-sm"
                        style={{ backgroundColor: step2Data.visualIdentity.colorPalette.text }}
                      ></div>
                      <p className="text-base font-semibold text-gray-700 mb-1">Text</p>
                      <p className="text-sm text-gray-500 font-mono">{step2Data.visualIdentity.colorPalette.text}</p>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-full h-24 rounded-xl mb-3 border shadow-sm"
                        style={{ backgroundColor: step2Data.visualIdentity.colorPalette.background }}
                      ></div>
                      <p className="text-base font-semibold text-gray-700 mb-1">Background</p>
                      <p className="text-sm text-gray-500 font-mono">{step2Data.visualIdentity.colorPalette.background}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-base text-gray-600">
                      💡 <span className="font-semibold">개발자 팁:</span> Primary는 주요 요소에, Accent는 중요한 버튼이나 강조 요소에 사용하세요.
                    </p>
                  </div>
                </div>
              </div>

              {/* 타이포그래피 정보 - 1줄 가로 배치 */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="bg-white rounded-lg p-5 shadow-sm text-center">
                      <p className="text-sm text-green-600 font-semibold mb-3">헤딩 폰트</p>
                      <p className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: step2Data.visualIdentity.typography.headingFont }}>
                        {step2Data.visualIdentity.typography.headingFont}
                      </p>
                      <p className="text-sm text-gray-500">제목과 주요 헤딩에 사용</p>
                    </div>

                    <div className="bg-white rounded-lg p-5 shadow-sm text-center">
                      <p className="text-sm text-blue-600 font-semibold mb-3">본문 폰트</p>
                      <p className="text-2xl font-medium text-gray-900 mb-3" style={{ fontFamily: step2Data.visualIdentity.typography.bodyFont }}>
                        {step2Data.visualIdentity.typography.bodyFont}
                      </p>
                      <p className="text-sm text-gray-500">본문 텍스트와 설명에 사용</p>
                    </div>

                    <div className="bg-white rounded-lg p-5 shadow-sm text-center">
                      <p className="text-sm text-purple-600 font-semibold mb-3">기본 크기</p>
                      <p className="text-2xl font-semibold text-gray-900 mb-3">
                        {step2Data.visualIdentity.typography.baseSize}
                      </p>
                      <p className="text-sm text-gray-500">반응형 디자인의 기준점</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 컴포넌트 스타일 설명 - 전체 너비 */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-left text-base text-gray-700 leading-relaxed prose prose-lg [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-gray-800 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-gray-700 [&>h3]:mb-2 [&>p]:mb-3 [&>ul]:mb-3 [&>li]:mb-1 [&>strong]:font-semibold [&>strong]:text-gray-900 max-w-none">
                  <ReactMarkdown>
                    {step2Data.visualIdentity.componentStyle}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

          {/* 액션 버튼 */}
          <div className="bg-gray-50 rounded-xl p-6 mt-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  {onBack && (
                    <button
                      onClick={onBack}
                      className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 font-medium"
                    >
                      ← 이전 단계
                    </button>
                  )}
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    다시 생성
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">감성 가이드 완성</p>
                    <p className="text-xs text-gray-600">다음: 교육 콘텐츠 설계</p>
                  </div>
                  <button
                    onClick={handleComplete}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg transform hover:scale-105"
                  >
                    다음 단계 →
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