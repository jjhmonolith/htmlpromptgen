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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

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

  // AI 화가 페르소나 기반 로딩 메시지와 진행률
  const artistMessages = [
    { progress: 15, message: "🎨 빈 캔버스 앞에서 영감을 받고 있어요..." },
    { progress: 30, message: "🖌️ 프로젝트의 감성을 색깔로 번역하고 있어요" },
    { progress: 50, message: "🎪 팔레트에 완벽한 색조합을 만들어가고 있어요" },
    { progress: 70, message: "✨ 무드와 톤에 생명력을 불어넣고 있어요" },
    { progress: 85, message: "🖼️ 마지막 터치로 완성도를 높이고 있어요" },
    { progress: 95, message: "🌟 작품을 세심하게 다듬고 마무리하고 있어요" }
  ];

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError('API 키가 필요합니다.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setLoadingProgress(0);
      setLoadingMessage(artistMessages[0].message);

      console.log('🎨 Step2: 비주얼 아이덴티티 생성 요청');

      // 진행률 애니메이션 시뮬레이션
      let currentMessageIndex = 0;
      const progressInterval = setInterval(() => {
        if (currentMessageIndex < artistMessages.length) {
          const targetProgress = artistMessages[currentMessageIndex].progress;
          setLoadingProgress(prev => {
            const newProgress = Math.min(prev + (Math.random() * 8 + 2), targetProgress);
            if (newProgress >= targetProgress && currentMessageIndex < artistMessages.length) {
              setLoadingMessage(artistMessages[currentMessageIndex].message);
              currentMessageIndex++;
            }
            return newProgress;
          });
        }
      }, 300 + Math.random() * 200); // 300-500ms 간격으로 랜덤하게

      const openAIService = OpenAIService.getInstance();
      openAIService.initialize(apiKey);
      const step2Service = new Step2VisualIdentityService(openAIService);

      const result = await step2Service.generateVisualIdentity(projectData);

      // 완료 시 진행률을 100%로 맞추고 정리
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage("🎉 완벽한 비주얼 아이덴티티가 완성되었어요!");

      // 잠시 완료 메시지를 보여주고 결과 표시
      setTimeout(() => {
        console.log('✅ Step2 생성 완료:', result);
        setStep2Data(result);
        setIsDataLoaded(true);
      }, 800);

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
      <div className="flex flex-col" style={{ backgroundColor: '#f5f5f7', height: 'calc(100vh - 72px)', marginTop: '72px' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-8">
            <div className="text-center">


            {/* 제목과 부제목 */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">AI 화가가 작업 중이에요</h2>
            <p className="text-lg text-gray-600 mb-12">당신의 프로젝트를 위한 완벽한 비주얼 아이덴티티를 그려내고 있어요</p>

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
              보통 10-20초 정도 소요됩니다
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
            {/* 3개 카드 좌우 배치 - Step1 스타일 참고 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

              {/* 1/3: 무드와 톤 카드 */}
              <div className="relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-[1.011] group"
                   onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px 2px rgba(0, 0, 0, 0.08)'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'; }}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                     background: 'linear-gradient(145deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)',
                     border: '1px solid rgba(255, 255, 255, 0.1)',
                     height: '500px'
                   }}>
                {/* 배경 패턴 */}
                <div className="absolute inset-0 opacity-30"
                     style={{
                       backgroundImage: `radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                                        radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.2) 0%, transparent 50%),
                                        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)`
                     }}></div>

                <div className="text-left mb-6 relative z-10 pt-2 pl-2">
                  <p className="text-gray-300 text-sm mb-2">프로젝트의 감성과 분위기</p>
                  <h3 className="text-3xl font-bold text-white">무드 & 톤</h3>
                </div>
                <div className="relative flex-1 grid grid-cols-2 gap-4 p-4 px-8 z-10 mt-8" style={{ minHeight: '200px' }}>
                  {step2Data.visualIdentity.moodAndTone.map((mood, index) => (
                    <div
                      key={index}
                      className="group/item cursor-pointer aspect-square"
                    >
                      <div className="relative w-full h-full rounded-full transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                           style={{
                             backgroundColor: `hsl(${240 + index * 30}, 70%, 65%)`,
                             boxShadow: `
                               0 25px 80px -15px hsla(${240 + index * 30}, 70%, 60%, 0.5),
                               0 15px 40px -10px hsla(${240 + index * 30}, 70%, 60%, 0.4)
                             `
                           }}>
                        <span className="text-white font-semibold text-xl whitespace-nowrap relative z-10 text-center leading-tight px-4"
                              style={{
                                textShadow: '0 3px 12px rgba(0, 0, 0, 0.5)',
                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                                wordBreak: 'keep-all'
                              }}>
                          {mood}
                        </span>

                        {/* 호버 시 빛 효과 */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/25 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"
                             style={{
                               background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 70%)'
                             }}></div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* 2/3: 컬러 팔레트 카드 */}
              <div className="relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-[1.011] group"
                   onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px 2px rgba(0, 0, 0, 0.08)'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'; }}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                     backgroundColor: '#F0F8FF',
                     height: '500px'
                   }}>

                <div className="text-left mb-4 relative z-10 pt-2 pl-2">
                  <p className="text-gray-600 text-sm mb-2">프로젝트 구성 색상 체계</p>
                  <h3 className="text-3xl font-bold text-gray-800">컬러 팔레트</h3>
                </div>

                <div className="relative z-10 flex-1 flex items-center justify-center p-4 mt-1" style={{ minHeight: '200px' }}>
                  <div className="relative mt-0" style={{ width: '340px', height: '340px' }}>
                    {Object.entries(step2Data.visualIdentity.colorPalette).map(([key, color], index) => {
                      const totalItems = Object.entries(step2Data.visualIdentity.colorPalette).length;
                      const angle = (index * 2 * Math.PI) / totalItems - Math.PI / 2; // -90도부터 시작 (맨 위부터)
                      const radius = 120; // 원의 반지름을 더 늘림 (100 → 120)
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;

                      // 색상 키를 짧은 제목으로 매핑
                      const colorLabels: { [key: string]: string } = {
                        'primary': '주요',
                        'secondary': '보조',
                        'accent': '강조',
                        'text': '텍스트',
                        'background': '배경'
                      };

                      return (
                        <div
                          key={key}
                          className="absolute group/color cursor-pointer"
                          style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          {/* 물감 붓터치 모양 */}
                          <div
                            className="relative w-28 h-20 transition-all duration-300"
                            style={{
                              backgroundColor: color,
                              borderRadius: '60% 40% 70% 30% / 60% 30% 70% 40%',
                              boxShadow: `
                                0 12px 35px -5px ${color}50,
                                inset -10px -10px 20px rgba(0, 0, 0, 0.2),
                                inset 10px 10px 20px rgba(255, 255, 255, 0.1)
                              `,
                              transform: `rotate(${index * 15 - 30}deg)`,
                              filter: `drop-shadow(0 6px 12px ${color}30)`,
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = `rotate(${index * 15 - 30}deg) scale(1.1)`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = `rotate(${index * 15 - 30}deg) scale(1)`;
                            }}
                          >
                            {/* 물감 질감 오버레이 */}
                            <div
                              className="absolute inset-0 opacity-30"
                              style={{
                                borderRadius: '60% 40% 70% 30% / 60% 30% 70% 40%',
                                background: `
                                  radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 60%),
                                  radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.2) 0%, transparent 50%),
                                  linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)
                                `
                              }}
                            ></div>

                            {/* 붓자국 텍스처 */}
                            <div
                              className="absolute inset-0 opacity-20"
                              style={{
                                borderRadius: '60% 40% 70% 30% / 60% 30% 70% 40%',
                                background: `
                                  repeating-linear-gradient(
                                    ${45 + index * 20}deg,
                                    transparent,
                                    transparent 2px,
                                    rgba(255, 255, 255, 0.15) 2px,
                                    rgba(255, 255, 255, 0.15) 3px
                                  )
                                `
                              }}
                            ></div>
                          </div>

                          {/* 라벨 */}
                          <div className="absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap transition-all duration-300 group-hover/color:scale-105"
                               style={{
                                 bottom: key === 'primary' ? '-40px' : '-36px' // "메인"만 4px 더 아래로
                               }}>
                            <span className="text-gray-800 text-sm font-medium transition-colors duration-300 group-hover/color:text-gray-900 group-hover/color:font-semibold"
                                  style={{
                                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
                                  }}>
                              {colorLabels[key] || key}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* 3/3: 타이포그래피 카드 */}
              <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.011]"
                   style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
                   onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px 2px rgba(0, 0, 0, 0.08)'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'; }}>
                <div className="text-left mb-6 pt-2 pl-2">
                  <p className="text-gray-600 text-sm mb-2">폰트 시스템과 크기</p>
                  <h3 className="text-3xl font-bold text-gray-900">타이포그래피</h3>
                </div>
                <div className="space-y-8 px-4 mt-12">
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">헤딩 폰트</p>
                    <p className="text-3xl font-bold text-gray-900 leading-tight" style={{ fontFamily: step2Data.visualIdentity.typography.headingFont }}>
                      {step2Data.visualIdentity.typography.headingFont}
                    </p>
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">본문 폰트</p>
                    <p className="text-2xl font-medium text-gray-900 leading-tight" style={{ fontFamily: step2Data.visualIdentity.typography.bodyFont }}>
                      {step2Data.visualIdentity.typography.bodyFont}
                    </p>
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">기본 크기</p>
                    <p className="font-semibold text-gray-900 leading-tight"
                       style={{
                         fontSize: step2Data.visualIdentity.typography.baseSize,
                         fontFamily: step2Data.visualIdentity.typography.bodyFont
                       }}>
                      {step2Data.visualIdentity.typography.baseSize}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 컴포넌트 스타일 가이드 - 하단 전체 폭 */}
            <div className="bg-white rounded-3xl p-6 transition-all duration-300 hover:scale-[1.011]"
                 onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px 2px rgba(0, 0, 0, 0.08)'; }}
                 onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'; }}
                 style={{
                   boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                 }}>
              <div className="text-left mb-6 pt-2 pl-2">
                <p className="text-gray-600 text-sm mb-2">UI 컴포넌트의 디자인 철학과 구체적인 스타일링 방향</p>
                <h3 className="text-3xl font-bold text-gray-900">컴포넌트 스타일 가이드</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-left text-base text-gray-700 leading-relaxed prose prose-lg [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-gray-800 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-gray-700 [&>h3]:mb-2 [&>p]:mb-3 [&>ul]:mb-3 [&>li]:mb-1 [&>strong]:font-semibold [&>strong]:text-gray-900 [&>hr]:hidden max-w-none">
                  <ReactMarkdown>
                    {step2Data.visualIdentity.componentStyle}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

          {/* 네비게이션 버튼들 - Step1 스타일과 일치 */}
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