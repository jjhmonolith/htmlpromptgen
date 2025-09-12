import React, { useState, useEffect, useRef, useCallback } from 'react';
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
        <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-12">
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
      <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-12">
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
              2
            </div>
            <h1 className="text-3xl font-bold text-gray-900">비주얼 아이덴티티</h1>
          </div>
          <p className="text-lg text-gray-600 mb-8">
            프로젝트의 분위기와 색상, 타이포그래피를 정의합니다.
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
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">생성된 비주얼 아이덴티티</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">무드 & 톤</h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {step2Data.visualIdentity.moodAndTone.map((mood, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {mood}
                      </span>
                    ))}
                  </div>

                  <h4 className="text-lg font-medium text-gray-900 mb-4">색상 팔레트</h4>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div 
                        className="w-full h-16 rounded-lg mb-2 border"
                        style={{ backgroundColor: step2Data.visualIdentity.colorPalette.primary }}
                      ></div>
                      <p className="text-sm font-medium text-gray-700">Primary</p>
                      <p className="text-xs text-gray-500">{step2Data.visualIdentity.colorPalette.primary}</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-full h-16 rounded-lg mb-2 border"
                        style={{ backgroundColor: step2Data.visualIdentity.colorPalette.secondary }}
                      ></div>
                      <p className="text-sm font-medium text-gray-700">Secondary</p>
                      <p className="text-xs text-gray-500">{step2Data.visualIdentity.colorPalette.secondary}</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-full h-16 rounded-lg mb-2 border"
                        style={{ backgroundColor: step2Data.visualIdentity.colorPalette.accent }}
                      ></div>
                      <p className="text-sm font-medium text-gray-700">Accent</p>
                      <p className="text-xs text-gray-500">{step2Data.visualIdentity.colorPalette.accent}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">타이포그래피</h4>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">헤딩 폰트</p>
                      <p className="font-semibold text-gray-900">{step2Data.visualIdentity.typography.headingFont}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">본문 폰트</p>
                      <p className="font-medium text-gray-900">{step2Data.visualIdentity.typography.bodyFont}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">기본 크기</p>
                      <p className="font-medium text-gray-900">{step2Data.visualIdentity.typography.baseSize}</p>
                    </div>
                  </div>

                  <h4 className="text-lg font-medium text-gray-900 mb-4">컴포넌트 스타일</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {step2Data.visualIdentity.componentStyle}
                    </p>
                  </div>
                </div>
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
                className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium shadow-sm"
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