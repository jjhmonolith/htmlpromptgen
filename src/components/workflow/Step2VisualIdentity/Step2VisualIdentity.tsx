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
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
              2
            </div>
            <h1 className="text-3xl font-bold text-gray-900">감성 무드 지휘</h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            🎭 학습자의 감정적 여정에 맞는 색상, 타이포그래피, 무드를 창조하는 감성 오케스트레이터입니다.
          </p>
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-l-4 border-purple-400 p-6 mb-8 rounded-r-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  🎭
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold text-purple-900 mb-2">감성 지휘자 역할 분담</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-sm text-purple-800">
                      <span className="font-semibold">🎨 AI 감성 설계:</span><br/>
                      스토리 배경, 색상 감정, 타이포그래피 성격, 컴포넌트 캐릭터
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-sm text-purple-800">
                      <span className="font-semibold">⭐ 개발자 창작:</span><br/>
                      시각적 완성도, 감성 애니메이션, 사용자와의 감정적 소통
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="p-3 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 rounded-xl mr-4">
                  <div className="text-2xl">🎭</div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">감성 오케스트라 완성</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="bg-purple-100 px-2 py-1 rounded-full text-purple-800 text-xs font-medium mr-2">
                      {projectData.targetAudience}
                    </span>
                    <span className="text-gray-700">{projectData.projectTitle} 전용 감성 무드</span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-lg">🌅</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">감성적 무드 오케스트라</h4>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-xl p-6 mb-4 border border-purple-100">
                      <div className="flex flex-wrap gap-3 mb-6">
                        {step2Data.visualIdentity.moodAndTone.map((mood, index) => (
                          <div key={index} className="group relative">
                            <span className="inline-block px-4 py-3 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 rounded-full text-sm font-semibold shadow-sm border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-105">
                              {mood}
                            </span>
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs">✨</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
                        <p className="text-sm text-purple-800 leading-relaxed font-medium">
                          🎼 <span className="font-semibold">감성 하모니:</span> 이 무드들이 조화롭게 어우러져 학습자에게 몰입감 있는 교육 경험을 선사합니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                        🎨
                      </div>
                      <h4 className="text-lg font-medium text-gray-900">색상 팔레트</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-5 gap-3 mb-4">
                          <div className="text-center">
                            <div
                              className="w-full h-20 rounded-lg mb-2 border shadow-sm"
                              style={{ backgroundColor: step2Data.visualIdentity.colorPalette.primary }}
                            ></div>
                            <p className="text-xs font-medium text-gray-700">Primary</p>
                            <p className="text-xs text-gray-500 font-mono">{step2Data.visualIdentity.colorPalette.primary}</p>
                          </div>
                          <div className="text-center">
                            <div
                              className="w-full h-20 rounded-lg mb-2 border shadow-sm"
                              style={{ backgroundColor: step2Data.visualIdentity.colorPalette.secondary }}
                            ></div>
                            <p className="text-xs font-medium text-gray-700">Secondary</p>
                            <p className="text-xs text-gray-500 font-mono">{step2Data.visualIdentity.colorPalette.secondary}</p>
                          </div>
                          <div className="text-center">
                            <div
                              className="w-full h-20 rounded-lg mb-2 border shadow-sm"
                              style={{ backgroundColor: step2Data.visualIdentity.colorPalette.accent }}
                            ></div>
                            <p className="text-xs font-medium text-gray-700">Accent</p>
                            <p className="text-xs text-gray-500 font-mono">{step2Data.visualIdentity.colorPalette.accent}</p>
                          </div>
                          <div className="text-center">
                            <div
                              className="w-full h-20 rounded-lg mb-2 border shadow-sm"
                              style={{ backgroundColor: step2Data.visualIdentity.colorPalette.text }}
                            ></div>
                            <p className="text-xs font-medium text-gray-700">Text</p>
                            <p className="text-xs text-gray-500 font-mono">{step2Data.visualIdentity.colorPalette.text}</p>
                          </div>
                          <div className="text-center">
                            <div
                              className="w-full h-20 rounded-lg mb-2 border shadow-sm"
                              style={{ backgroundColor: step2Data.visualIdentity.colorPalette.background }}
                            ></div>
                            <p className="text-xs font-medium text-gray-700">Background</p>
                            <p className="text-xs text-gray-500 font-mono">{step2Data.visualIdentity.colorPalette.background}</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-600">
                            💡 <span className="font-medium">개발자 팁:</span> Primary는 주요 요소에, Accent는 중요한 버튼이나 강조 요소에 사용하세요.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        🔠
                      </div>
                      <h4 className="text-lg font-medium text-gray-900">타이포그래피</h4>
                    </div>
                    <div className="bg-gradient-to-b from-green-50 to-blue-50 rounded-lg p-6">
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-green-600 font-medium mb-2">헤딩 폰트</p>
                          <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: step2Data.visualIdentity.typography.headingFont }}>
                            {step2Data.visualIdentity.typography.headingFont}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">제목과 주요 헤딩에 사용</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-blue-600 font-medium mb-2">본문 폰트</p>
                          <p className="text-lg font-medium text-gray-900" style={{ fontFamily: step2Data.visualIdentity.typography.bodyFont }}>
                            {step2Data.visualIdentity.typography.bodyFont}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">본문 텍스트와 설명에 사용</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-purple-600 font-medium mb-2">기본 크기</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {step2Data.visualIdentity.typography.baseSize}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">반응형 디자인의 기준점</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                        ✨
                      </div>
                      <h4 className="text-lg font-medium text-gray-900">시각적 느낌</h4>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {step2Data.visualIdentity.componentStyle}
                        </p>
                        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                          <p className="text-xs text-amber-700">
                            💡 <span className="font-medium">기대 효과:</span> 이 스타일 가이드에 따라 개발하면 학습자가 편안하고 집중할 수 있는 환경이 만들어집니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="bg-gray-50 rounded-xl p-6 mt-8">
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
          </div>
        )}
      </div>
    </div>
  );
};