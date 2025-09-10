import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectData, VisualIdentity } from '../../../types/workflow.types';
import { VisualIdentityService } from '../../../services/visual.identity.service';

interface Step2VisualIdentityProps {
  projectData: ProjectData;
  initialData?: VisualIdentity | null;
  onComplete: (visualIdentity: VisualIdentity) => void;
  onBack: () => void;
  onNext?: () => void; // 이미 완료된 경우 단순 이동
}

export const Step2VisualIdentity: React.FC<Step2VisualIdentityProps> = ({
  projectData,
  initialData,
  onComplete,
  onBack,
  onNext
}) => {
  const [visualIdentity, setVisualIdentity] = useState<VisualIdentity | null>(initialData || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [customizations, setCustomizations] = useState<Partial<VisualIdentity>>({});
  const [hasModifications, setHasModifications] = useState(false); // 실제 수정 여부 추적

  const visualIdentityService = new VisualIdentityService();

  // 자동 생성 시작
  const startGeneration = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationMessage('AI가 프로젝트 정보를 분석하고 있습니다...');

    // 진행 상태 시뮬레이션
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    const messages = [
      'AI가 프로젝트 정보를 분석하고 있습니다...',
      '대상 학습자에 맞는 색상을 선택하고 있습니다...',
      '교육 효과를 높이는 타이포그래피를 설계하고 있습니다...',
      '컴포넌트 스타일 가이드라인을 작성하고 있습니다...',
      '접근성 기준을 확인하고 있습니다...'
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < messages.length - 1) {
        messageIndex++;
        setGenerationMessage(messages[messageIndex]);
      }
    }, 3000);

    try {
      const result = await visualIdentityService.generateVisualIdentity(projectData);
      
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setGenerationProgress(100);
      setGenerationMessage('비주얼 아이덴티티 생성이 완료되었습니다!');
      
      setTimeout(() => {
        setVisualIdentity(result);
        setIsGenerating(false);
        // 첫 생성도 수정으로 간주 (기존 데이터가 있었던 경우에만)
        if (initialData) {
          setHasModifications(true);
        }
      }, 1000);

    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setError(err instanceof Error ? err.message : '비주얼 아이덴티티 생성에 실패했습니다.');
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // 컴포넌트 마운트 시 자동 생성 (기존 데이터가 없는 경우)
  useEffect(() => {
    if (!visualIdentity && !isGenerating) {
      startGeneration();
    }
  }, []);

  // 색상 커스터마이징
  const updateColor = (colorType: keyof VisualIdentity['colorPalette'], newColor: string) => {
    if (!visualIdentity) return;

    const updated = {
      ...visualIdentity,
      colorPalette: {
        ...visualIdentity.colorPalette,
        [colorType]: newColor
      }
    };

    setVisualIdentity(updated);
    setCustomizations(prev => ({ ...prev, colorPalette: updated.colorPalette }));
    setHasModifications(true); // 수정 플래그 설정
  };

  // 프리셋 적용
  const applyPreset = (preset: any) => {
    if (!visualIdentity) return;

    const updated = {
      ...visualIdentity,
      colorPalette: preset.colorPalette
    };

    setVisualIdentity(updated);
    setCustomizations(prev => ({ ...prev, colorPalette: preset.colorPalette }));
    setHasModifications(true); // 수정 플래그 설정
  };

  // 완료 처리
  const handleComplete = () => {
    if (!visualIdentity) return;
    
    const finalVisualIdentity = {
      ...visualIdentity,
      ...customizations
    };

    // 실제 수정이 있었다면 onComplete 호출 (데이터 변경으로 처리)
    if (hasModifications) {
      console.log('Step2: 수정사항 있음, onComplete 호출');
      onComplete(finalVisualIdentity);
      setHasModifications(false); // 수정 플래그 초기화
    } else if (initialData && onNext) {
      // 수정 없이 단순 이동
      console.log('Step2: 수정사항 없음, onNext 호출');
      onNext();
    } else {
      // 처음 완료하는 경우
      console.log('Step2: 처음 완료, onComplete 호출');
      onComplete(finalVisualIdentity);
    }
  };

  // 재생성
  const handleRegenerate = () => {
    setVisualIdentity(null);
    setCustomizations({});
    setHasModifications(true); // 재생성도 수정으로 간주
    startGeneration();
  };

  const presets = visualIdentityService.getPresetColorPalettes();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
      {/* 상단 헤더 */}
      <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-white pt-14 pb-5">
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12">
          {/* 프로젝트 정보 요약 */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">프로젝트</h3>
                <p className="text-gray-700">{projectData.projectTitle}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">대상 학습자</h3>
                <p className="text-gray-700">{projectData.targetAudience}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">페이지 수</h3>
                <p className="text-gray-700">{projectData.pages.length}개 페이지</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 py-8">
        <AnimatePresence mode="wait">
          {/* 로딩 상태 */}
          {isGenerating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="max-w-md mx-auto">
                {/* 로딩 애니메이션 */}
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-[#3e88ff] border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    ></motion.div>
                  </div>
                </div>

                {/* 진행률 */}
                <div className="mb-6">
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <motion.div
                      className="bg-[#3e88ff] h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{Math.round(generationProgress)}% 완료</p>
                </div>

                {/* 메시지 */}
                <motion.p
                  key={generationMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg text-gray-700 mb-4"
                >
                  {generationMessage}
                </motion.p>

                <p className="text-sm text-gray-500">
                  일반적으로 30-90초 정도 소요됩니다
                </p>
              </div>
            </motion.div>
          )}

          {/* 에러 상태 */}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">생성 실패</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={handleRegenerate}
                  className="px-6 py-3 bg-[#3e88ff] text-white rounded-full hover:bg-[#2c6ae6] transition-all font-medium"
                >
                  다시 시도
                </button>
              </div>
            </motion.div>
          )}

          {/* 생성 완료 상태 */}
          {visualIdentity && !isGenerating && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >

              {/* 메인 미리보기 영역 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                
                {/* 좌측: 색상 팔레트 및 타이포그래피 */}
                <div className="flex flex-col h-full">
                  <div className="space-y-6 flex-1">
                  {/* 분위기 & 톤 */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">분위기 & 톤</h3>
                    <div className="flex flex-wrap gap-2">
                      {visualIdentity.moodAndTone.split(',').map((mood, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: `${visualIdentity.colorPalette.primary}20`,
                            color: visualIdentity.colorPalette.primary
                          }}
                        >
                          {mood.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 색상 팔레트 */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">색상 팔레트</h3>
                    <div className="space-y-4">
                      {Object.entries(visualIdentity.colorPalette).map(([key, color]) => (
                        <div key={key} className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'color';
                              input.value = color;
                              input.onchange = (e) => updateColor(key as keyof VisualIdentity['colorPalette'], (e.target as HTMLInputElement).value);
                              input.click();
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 capitalize">{key}</span>
                              <span className="text-sm text-gray-500 uppercase">{color}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 프리셋 색상 조합 */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">프리셋 색상 조합</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {presets.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => applyPreset(preset)}
                            className="flex items-center gap-1 p-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                            title={preset.name}
                          >
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.colorPalette.primary }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.colorPalette.secondary }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.colorPalette.accent }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 타이포그래피 */}
                  <div className="bg-white rounded-2xl p-8 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">타이포그래피</h3>
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">제목 폰트</p>
                        <p 
                          className="text-2xl font-bold"
                          style={{ 
                            fontFamily: visualIdentity.typography.headingFont,
                            color: visualIdentity.colorPalette.text
                          }}
                        >
                          교육 콘텐츠 제목
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{visualIdentity.typography.headingFont}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">본문 폰트</p>
                        <p 
                          className="text-base"
                          style={{ 
                            fontFamily: visualIdentity.typography.bodyFont,
                            color: visualIdentity.colorPalette.text,
                            fontSize: visualIdentity.typography.baseSize
                          }}
                        >
                          본문 텍스트입니다. 가독성과 접근성을 고려하여 선택된 폰트입니다.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{visualIdentity.typography.bodyFont} · {visualIdentity.typography.baseSize}</p>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

                {/* 우측: 실제 적용 미리보기 */}
                <div className="flex flex-col h-full">
                  <div className="space-y-6 flex-1">
                  {/* 컴포넌트 미리보기 */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">컴포넌트 미리보기</h3>
                    
                    {/* 버튼 미리보기 */}
                    <div className="mb-8">
                      <p className="text-sm text-gray-600 mb-3">버튼</p>
                      <div className="flex gap-3">
                        <button
                          className="px-6 py-3 rounded-full font-medium transition-all shadow-sm"
                          style={{
                            backgroundColor: visualIdentity.colorPalette.primary,
                            color: '#ffffff'
                          }}
                        >
                          기본 버튼
                        </button>
                        <button
                          className="px-6 py-3 rounded-full font-medium transition-all border-2"
                          style={{
                            backgroundColor: 'transparent',
                            color: visualIdentity.colorPalette.primary,
                            borderColor: visualIdentity.colorPalette.primary
                          }}
                        >
                          테두리 버튼
                        </button>
                      </div>
                    </div>

                    {/* 타임라인 컴포넌트 */}
                    <div className="mb-8">
                      <p className="text-sm text-gray-600 mb-3">타임라인</p>
                      <div className="space-y-4">
                        {[
                          { title: "1단계: 기본 개념 학습", completed: true },
                          { title: "2단계: 실습 진행", completed: true },
                          { title: "3단계: 응용 문제 해결", completed: false },
                          { title: "4단계: 최종 평가", completed: false }
                        ].map((step, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div 
                                className={`w-4 h-4 rounded-full flex items-center justify-center ${step.completed ? '' : 'border-2'}`}
                                style={{
                                  backgroundColor: step.completed ? visualIdentity.colorPalette.primary : 'transparent',
                                  borderColor: step.completed ? visualIdentity.colorPalette.primary : '#D1D5DB'
                                }}
                              >
                                {step.completed && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              {index < 3 && (
                                <div 
                                  className="w-px h-6 mt-1"
                                  style={{ backgroundColor: step.completed ? visualIdentity.colorPalette.primary : '#E5E7EB' }}
                                />
                              )}
                            </div>
                            <div className="flex-1 pb-2">
                              <p 
                                className={`text-sm font-medium ${step.completed ? '' : 'text-gray-500'}`}
                                style={{ 
                                  color: step.completed ? visualIdentity.colorPalette.text : '#9CA3AF',
                                  fontFamily: visualIdentity.typography.bodyFont
                                }}
                              >
                                {step.title}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 카드 미리보기 */}
                    <div className="mb-8">
                      <p className="text-sm text-gray-600 mb-3">카드</p>
                      <div 
                        className="p-4 rounded-xl border"
                        style={{ 
                          backgroundColor: visualIdentity.colorPalette.background,
                          borderColor: `${visualIdentity.colorPalette.primary}20`
                        }}
                      >
                        <h4 
                          className="font-semibold mb-2"
                          style={{ 
                            color: visualIdentity.colorPalette.primary,
                            fontFamily: visualIdentity.typography.headingFont
                          }}
                        >
                          학습 카드 제목
                        </h4>
                        <p 
                          className="text-sm"
                          style={{ 
                            color: visualIdentity.colorPalette.text,
                            fontFamily: visualIdentity.typography.bodyFont
                          }}
                        >
                          카드 내용입니다. 교육 콘텐츠가 표시되는 영역입니다.
                        </p>
                      </div>
                    </div>

                    {/* 강조 요소 */}
                    <div>
                      <p className="text-sm text-gray-600 mb-3">강조 요소</p>
                      <div 
                        className="p-4 rounded-xl"
                        style={{ backgroundColor: `${visualIdentity.colorPalette.accent}20` }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: visualIdentity.colorPalette.accent }}
                          />
                          <span 
                            className="font-medium"
                            style={{ color: visualIdentity.colorPalette.accent }}
                          >
                            중요 포인트
                          </span>
                        </div>
                        <p 
                          className="text-sm"
                          style={{ color: visualIdentity.colorPalette.text }}
                        >
                          학습자가 꼭 알아야 할 핵심 내용입니다.
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* 컴포넌트 스타일 가이드 */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">스타일 가이드</h3>
                    <div 
                      className="p-4 bg-gray-50 rounded-lg text-sm"
                      style={{ color: visualIdentity.colorPalette.text }}
                    >
                      {visualIdentity.componentStyle}
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단 네비게이션 */}
      {visualIdentity && !isGenerating && (
        <div className="max-w-7xl mx-auto px-4 xl:px-8 2xl:px-12 pb-8">
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white text-gray-700 rounded-full hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
            >
              ← 이전 단계
            </button>
            
            <div className="flex gap-4 items-center">
              <button
                onClick={handleRegenerate}
                className="px-6 py-3 bg-white text-gray-700 rounded-full hover:bg-gray-50 transition-all font-medium shadow-sm border border-gray-200"
              >
                재생성
              </button>
              <button
                onClick={handleComplete}
                className="px-8 py-3 bg-[#3e88ff] text-white rounded-full hover:bg-[#2c6ae6] transition-all font-medium shadow-sm"
              >
                다음 단계로 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};