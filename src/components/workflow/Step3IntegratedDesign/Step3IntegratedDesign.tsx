import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ProjectData, VisualIdentity } from '../../../types/workflow.types';
import { EducationalDesignService } from '../../../services/educational-design.service';
import { Step3IntegratedResult } from '../../../types/workflow.types';
import { EducationalDesignResult } from '../../../types/educational-design.types';
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

// DetailCard 컴포넌트 - 8가지 구조화된 이미지 메타데이터 표시용
interface DetailCardProps {
  icon: string;
  title: string;
  content: string;
  className?: string;
}

const DetailCard: React.FC<DetailCardProps> = ({ icon, title, content, className = '' }) => {
  return (
    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200 ${className}`}>
      <div className="flex items-center mb-2">
        <span className="text-lg mr-2">{icon}</span>
        <h6 className="text-sm font-semibold text-gray-800">{title}</h6>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">
        {content || `${title} 정보가 없습니다.`}
      </p>
    </div>
  );
};

// 품질 배지 컴포넌트
interface QualityBadgeProps {
  label: string;
  score: number;
  threshold: number;
}

const QualityBadge: React.FC<QualityBadgeProps> = ({ label, score, threshold }) => {
  const getColorClass = (score: number, threshold: number) => {
    if (score >= threshold) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= threshold * 0.7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getColorClass(score, threshold)}`}>
      {label}: {score}%
    </div>
  );
};

// 품질 지표 표시 컴포넌트
interface QualityIndicatorProps {
  quality: any; // QualityMetrics 타입 (any로 임시 처리)
}

const QualityIndicator: React.FC<QualityIndicatorProps> = ({ quality }) => {
  if (!quality) return null;

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-semibold text-gray-900">🎯 설계 품질 지표</h5>
        <div className="flex space-x-2">
          <QualityBadge
            label="이미지 상세도"
            score={quality.imageDetailScore || 0}
            threshold={80}
          />
          <QualityBadge
            label="레이아웃 다양성"
            score={quality.layoutDiversityScore || 0}
            threshold={75}
          />
          <QualityBadge
            label="제약 준수"
            score={quality.constraintComplianceScore || 0}
            threshold={90}
          />
        </div>
      </div>

      {/* 전체 품질 점수 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">전체 품질 점수</span>
          <span className="text-lg font-bold text-blue-600">{quality.overallQualityScore || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${quality.overallQualityScore || 0}%` }}
          ></div>
        </div>
      </div>

      {/* 개선 제안 */}
      {quality.suggestions && quality.suggestions.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r">
          <h6 className="font-medium text-yellow-800 mb-2">💡 개선 제안</h6>
          <ul className="text-sm text-yellow-700 space-y-1">
            {quality.suggestions.map((suggestion: string, idx: number) => (
              <li key={idx} className="flex items-start">
                <span className="mr-2">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 경고 */}
      {quality.warnings && quality.warnings.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r mt-2">
          <h6 className="font-medium text-red-800 mb-2">⚠️ 주의사항</h6>
          <ul className="text-sm text-red-700 space-y-1">
            {quality.warnings.map((warning: string, idx: number) => (
              <li key={idx} className="flex items-start">
                <span className="mr-2">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Phase 2 단순화: Educational Design Result를 Step3 "2개 큰 덩어리" 형태로 변환
const convertEducationalDesignToStep3 = (educationalResult: EducationalDesignResult): Step3IntegratedResult => {
  const layoutMode = educationalResult.projectOverview.layoutMode;
  const isFixedMode = layoutMode === 'fixed';

  return {
    layoutMode,
    pages: educationalResult.pageDesigns.map(pageDesign => ({
      pageId: pageDesign.pageId,
      pageTitle: pageDesign.pageTitle,
      pageNumber: pageDesign.pageNumber,

      // Phase 2: 간소화된 구조 정보
      structure: {
        sections: [
          { id: 'main-content', description: '메인 콘텐츠', sizeGuide: '80%', purpose: '핵심 내용' },
          { id: 'interaction', description: '상호작용 영역', sizeGuide: '20%', purpose: '참여 유도' }
        ] as any,
        flow: '단계별 학습 접근법',
        imgBudget: 1 // 항상 1개 보장
      },

      // Phase 2: 덩어리 2 - 기본 보장 구조 (복잡한 파싱 제거)
      content: {
        components: [
          { id: 'title', type: 'heading', section: '상단', role: '주제 제시', text: pageDesign.pageTitle, gridSpan: '전체' },
          { id: 'content', type: 'text', section: '메인', role: '내용 전달', text: '핵심 학습 내용', gridSpan: '메인 영역' },
          { id: 'interaction', type: 'interactive', section: '하단', role: '참여 유도', text: '상호작용 요소', gridSpan: '적절한 크기' }
        ] as any,
        images: (pageDesign.mediaAssets || []).map(media => ({
          filename: media.fileName || `page${pageDesign.pageNumber}_main.png`,
          purpose: media.purpose || '교육 시각화',
          style: media.type || 'image',
          section: media.placement?.section || '메인 영역',
          place: media.placement?.position || '중앙',
          width: parseInt((media.sizeGuide || '400×300px').match(/\d+/)?.[0] || '400'),
          height: parseInt((media.sizeGuide || '400×300px').match(/×(\d+)/)?.[1] || '300'),
          alt: media.accessibility?.altText || `${pageDesign.pageTitle} 관련 교육 이미지`,
          caption: media.accessibility?.caption || `${pageDesign.pageTitle} 시각 자료`,
          description: media.description || `${pageDesign.pageTitle}의 핵심 개념을 시각적으로 표현한 교육용 자료`,
          aiPrompt: media.aiPrompt || `${pageDesign.pageTitle}에 대한 교육용 시각 자료. 명확하고 이해하기 쉬운 일러스트.`
        })) as any,
        generatedAt: pageDesign.generatedAt
      },

      // 상태 관리 - Phase 2는 항상 성공
      isGenerating: false,
      phase2Complete: true, // Phase 2는 항상 완료 보장
      parseError: undefined, // Phase 2는 파싱 실패 없음
      generatedAt: pageDesign.generatedAt,

      // 덩어리 1: 전체 AI 설계 문서 (모든 정보 보존)
      fullDescription: pageDesign.fullDescription || '교육 콘텐츠 설계 완료',
      debugInfo: {
        originalPrompt: pageDesign.debugInfo?.originalPrompt || 'Phase 2 simplified prompt',
        originalResponse: pageDesign.debugInfo?.originalResponse || 'Phase 2 guaranteed response',
        parsedSections: { simplified: 'Phase 2: 2개 큰 덩어리 시스템' }
      }
    })),
    designTokens: {
      viewport: {
        width: 1600,
        height: isFixedMode ? 1000 : undefined
      },
      safeArea: { top: 40, right: 40, bottom: 40, left: 40 },
      grid: { columns: 12, gap: 20 },
      spacing: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48 },
      radius: { sm: 8, md: 12, lg: 16 },
      elevation: {
        low: '0 2px 4px rgba(0,0,0,0.1)',
        medium: '0 4px 8px rgba(0,0,0,0.15)',
        high: '0 8px 16px rgba(0,0,0,0.2)'
      },
      zIndex: { base: 1, image: 2, card: 3, text: 4 }
    },
    generatedAt: educationalResult.generatedAt,
    processingTime: educationalResult.processingTime
  };
};

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

      console.log('🎓 Step3: 교육 콘텐츠 설계 생성 시작');

      const openAIService = new OpenAIService();
      openAIService.initialize(apiKey);
      const educationalService = new EducationalDesignService(openAIService);

      const educationalResult = await educationalService.generateEducationalDesign(projectData, visualIdentity);
      const step3Result = convertEducationalDesignToStep3(educationalResult);

      setStep3Data(step3Result);
      setIsDataLoaded(true);
      setShouldAutoGenerate(false);

      console.log('✅ Step3: 교육 콘텐츠 설계 완료', step3Result);

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
      const educationalService = new EducationalDesignService(openAIService);

      // 페이지 생성 중 표시
      const updatedStep3 = { ...step3Data };
      updatedStep3.pages[pageIndex].isGenerating = true;
      setStep3Data(updatedStep3);

      // 해당 페이지만 재생성
      const targetPage = projectData.pages[pageIndex];
      const singlePageProject = {
        ...projectData,
        pages: [targetPage]
      };

      const educationalResult = await educationalService.generateEducationalDesign(singlePageProject, visualIdentity);
      const regeneratedStep3Page = convertEducationalDesignToStep3(educationalResult).pages[0];

      // 해당 페이지 업데이트
      updatedStep3.pages[pageIndex] = {
        ...regeneratedStep3Page,
        isGenerating: false
      };

      setStep3Data({ ...updatedStep3 });

      console.log(`✅ 페이지 ${pageIndex + 1} 재생성 완료`);

    } catch (error) {
      console.error(`❌ 페이지 ${pageIndex + 1} 재생성 실패:`, error);

      // 에러 발생 시 생성 중 상태 해제
      const errorStep3 = { ...step3Data };
      errorStep3.pages[pageIndex].isGenerating = false;
      errorStep3.pages[pageIndex].parseError = error instanceof Error ? error.message : String(error);
      setStep3Data(errorStep3);
    }
  };

  // 로딩 상태: 초기 생성 중일 때만 전체 화면 로딩
  const isInitialLoading = isGenerating && !step3Data;

  // 초기 로딩 중일 때만 전체 화면 로딩 표시
  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-white rounded-lg shadow-sm border">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">🎓 교육 콘텐츠 설계 중...</h3>
        <p className="text-sm text-gray-600 text-center">
          교육 효과를 극대화하는 구체적이고 실용적인 콘텐츠를 설계하고 있습니다.
          <br />
          개발자가 바로 구현할 수 있는 명확한 설계를 제공합니다.
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
        <p className="text-gray-700 mb-4">교육 콘텐츠 설계 데이터가 없습니다.</p>
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
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg mr-4">
                🎓
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Step 3: 교육 콘텐츠 설계</h2>
                <p className="text-gray-600 mt-1">
                  구체적이고 실용적인 교육 콘텐츠 설계를 확인하세요
                </p>
              </div>
            </div>
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <span className="font-medium">AI가 제공:</span> 구체적 레이아웃, 실제 콘텐츠, 명확한 상호작용 로직<br/>
                    <span className="font-medium">개발자가 창의적 구현:</span> 시각적 완성도, UX 세부사항, 애니메이션
                  </p>
                </div>
              </div>
            </div>
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

        {/* 페이지 선택 탭 - 개선된 디자인 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="text-sm font-medium text-gray-700">페이지 선택</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {step3Data.pages.map((page, index) => (
              <button
                key={page.pageId}
                onClick={() => setSelectedPageIndex(index)}
                className={`relative p-4 rounded-lg text-left transition-all duration-200 ${
                  selectedPageIndex === index
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                      selectedPageIndex === index ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {page.pageNumber}
                    </div>
                    <span className="font-medium text-sm truncate">{page.pageTitle}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {page.isGenerating && (
                      <div className={`animate-spin w-3 h-3 border-2 border-t-transparent rounded-full ${
                        selectedPageIndex === index ? 'border-white' : 'border-blue-500'
                      }`}></div>
                    )}
                    {page.parseError && !page.isGenerating && (
                      <div className="w-3 h-3 bg-red-500 rounded-full" title="오류 발생"></div>
                    )}
                    {page.phase2Complete && !page.parseError && (
                      <div className="w-3 h-3 bg-green-500 rounded-full" title="완료"></div>
                    )}
                    {!page.phase2Complete && !page.isGenerating && !page.parseError && (
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" title="대기 중"></div>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-xs opacity-75">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(page.generatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
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
                  생성 시간: {new Date(selectedPage.generatedAt).toLocaleString()}
                </div>
                {selectedPage.isGenerating && (
                  <div className="text-sm text-blue-600 mt-1 flex items-center">
                    <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    교육 콘텐츠 생성 중...
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
          {selectedPage.isGenerating ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <h4 className="text-lg font-semibold text-gray-900">페이지 재생성 중...</h4>
                <p className="text-sm text-gray-600 text-center">
                  이 페이지의 콘텐츠를 다시 생성하고 있습니다.
                  <br />
                  다른 페이지를 선택하여 내용을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          ) : selectedPage.content ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 border-b border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm mr-4">
                    📋
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">페이지 {selectedPage.pageNumber}: {selectedPage.pageTitle}</h4>
                    <p className="text-sm text-gray-600 mt-1">교육적 효과를 극대화하는 구체적 설계</p>
                  </div>
                </div>
                <div className="bg-white/80 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    📝 <span className="font-medium">생성 완료:</span> {new Date(selectedPage.generatedAt).toLocaleString()}
                    {selectedPage.content && selectedPage.content.components && (
                      <span className="ml-4">🧩 <span className="font-medium">컴포넌트:</span> {selectedPage.content.components.length}개</span>
                    )}
                    {selectedPage.content && selectedPage.content.images && (
                      <span className="ml-4">🖼️ <span className="font-medium">이미지:</span> {selectedPage.content.images.length}개</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="p-6">

                {/* Phase 2 단순화: 2개 큰 덩어리 시스템 */}

                {/* 덩어리 1: 전체 AI 교육 설계 문서 */}
                {selectedPage.fullDescription && (
                  <div className="mb-8">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center mr-4">
                        📋
                      </div>
                      <div>
                        <h5 className="text-xl font-semibold text-gray-900">📋 완전한 교육 설계 문서</h5>
                        <p className="text-sm text-gray-600 mt-1">AI가 생성한 전체 교육 콘텐츠 설계 - 모든 정보 포함</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                      <div className="prose prose-sm max-w-none markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                        >
                          {selectedPage.fullDescription}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* 품질 지표 섹션 */}
                {selectedPage.debugInfo && selectedPage.debugInfo.qualityMetrics && (
                  <QualityIndicator quality={selectedPage.debugInfo.qualityMetrics} />
                )}

                {/* 이미지 섹션 - 개선된 파싱 구조 */}
                {selectedPage.content && selectedPage.content.images && selectedPage.content.images.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center mr-4">
                        🖼️
                      </div>
                      <div>
                        <h5 className="text-xl font-semibold text-gray-900">🖼️ 교육 시각 자료</h5>
                        <p className="text-sm text-gray-600 mt-1">상세한 AI 프롬프트와 함께 제공되는 이미지</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {selectedPage.content.images.map((image, imgIndex) => (
                        <div key={`${selectedPage.pageId}-img-${imgIndex}`} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl text-green-600">
                                {getCircledNumber(image.filename)}
                              </span>
                              <div>
                                <h6 className="font-semibold text-gray-900 text-lg">{image.filename}</h6>
                                <p className="text-xs text-gray-500 font-mono mt-1">
                                  ~/image/page{selectedPage.pageNumber}/{image.filename}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md font-medium">
                                {image.purpose}
                              </span>
                              <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md font-medium">
                                {image.width}×{image.height}px
                              </span>
                            </div>
                          </div>

                          {/* 8가지 구조화된 이미지 메타데이터 표시 */}
                          {(image as any).structuredMetadata ? (
                            <div className="mb-4">
                              <h6 className="text-sm font-semibold text-gray-900 mb-3">🎨 8가지 이미지 메타데이터</h6>
                              <div className="grid grid-cols-2 gap-3">
                                <DetailCard icon="🎨" title="시각 요소" content={(image as any).structuredMetadata.visualElements || '기본 시각 요소'} />
                                <DetailCard icon="🌈" title="색상 구성" content={(image as any).structuredMetadata.colorScheme || '기본 색상 구성'} />
                                <DetailCard icon="🔗" title="페이지 맥락" content={(image as any).structuredMetadata.pageContext || '기본 맥락'} />
                                <DetailCard icon="🎭" title="스타일" content={(image as any).structuredMetadata.styleTexture || '기본 스타일'} />
                                <DetailCard icon="👥" title="학습자 관점" content={(image as any).structuredMetadata.learnerPerspective || '기본 관점'} />
                                <DetailCard icon="🔄" title="교육 기능" content={(image as any).structuredMetadata.educationalFunction || '기본 기능'} />
                                <DetailCard icon="⚡" title="시각 역동성" content={(image as any).structuredMetadata.visualDynamics || '기본 역동성'} className="col-span-2" />
                              </div>
                            </div>
                          ) : (
                            /* 기존 이미지 상세 정보 */
                            <div className="bg-white rounded-lg p-4 mb-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h6 className="text-sm font-semibold text-gray-900 mb-2">📍 배치 정보</h6>
                                  <div className="space-y-1 text-xs text-gray-600">
                                    <div><span className="font-medium">섹션:</span> {image.section}</div>
                                    <div><span className="font-medium">위치:</span> {image.place}</div>
                                    <div><span className="font-medium">스타일:</span> {image.style}</div>
                                  </div>
                                </div>
                                <div>
                                  <h6 className="text-sm font-semibold text-gray-900 mb-2">🔍 접근성</h6>
                                  <div className="space-y-1 text-xs text-gray-600">
                                    <div><span className="font-medium">대체텍스트:</span> {image.alt}</div>
                                    <div><span className="font-medium">캡션:</span> {image.caption}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* AI 생성 프롬프트 (영문만) */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h6 className="text-sm font-semibold text-blue-900 mb-2">🤖 AI 생성 프롬프트</h6>
                            <div className="text-sm text-blue-800 leading-relaxed bg-white rounded p-3 border font-mono">
                              {image.aiPrompt || image.prompt || 'AI 프롬프트를 생성 중입니다...'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 빈 상태 제거 - Phase 2에서는 항상 콘텐츠 존재 */}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-center py-8 text-gray-500">
                콘텐츠가 아직 생성되지 않았습니다.
              </div>
            </div>
          )}

          {/* 디버그 모드 - Phase별 프롬프트와 응답 */}
          {debugMode && (
            <div className="space-y-4">
              {/* 교육 설계 디버그 정보 */}
              {selectedPage.debugInfo && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-md font-semibold text-blue-900 mb-3">🔧 교육 콘텐츠 설계</h4>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-blue-800 mb-2">📝 AI 프롬프트:</h5>
                      <pre className="text-xs text-blue-700 bg-white p-3 rounded border overflow-x-auto max-h-40 whitespace-pre-wrap">
                        {selectedPage.debugInfo.originalPrompt}
                      </pre>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-blue-800 mb-2">🤖 AI 원본 응답:</h5>
                      <pre className="text-xs text-blue-700 bg-white p-3 rounded border overflow-x-auto max-h-40 whitespace-pre-wrap">
                        {selectedPage.debugInfo.originalResponse}
                      </pre>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-blue-800 mb-2">📋 파싱된 섹션:</h5>
                      <div className="text-xs text-blue-700 bg-white p-3 rounded border">
                        {selectedPage.debugInfo.parsedSections
                          ? typeof selectedPage.debugInfo.parsedSections === 'string'
                            ? selectedPage.debugInfo.parsedSections
                            : JSON.stringify(selectedPage.debugInfo.parsedSections, null, 2)
                          : '파싱된 섹션이 없습니다'}
                      </div>
                    </div>

                    {/* 레이아웃 제약 검증 결과 */}
                    {selectedPage.debugInfo.layoutValidation && (
                      <div>
                        <h5 className="text-sm font-medium text-blue-800 mb-2">🔍 레이아웃 제약 검증:</h5>
                        <div className="text-xs text-blue-700 bg-white p-3 rounded border">
                          <div className={`p-2 rounded mb-2 ${
                            selectedPage.debugInfo.layoutValidation.isValid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <span className="font-medium">상태:</span> {selectedPage.debugInfo.layoutValidation.isValid ? '✅ 제약 준수' : '❌ 제약 위반'}
                            {selectedPage.debugInfo.layoutValidation.errorType && (
                              <span className="ml-2">({selectedPage.debugInfo.layoutValidation.errorType})</span>
                            )}
                          </div>
                          {selectedPage.debugInfo.layoutValidation.areaCount && (
                            <div className="mb-2">
                              <span className="font-medium">영역 개수:</span> {selectedPage.debugInfo.layoutValidation.areaCount} / {selectedPage.debugInfo.layoutValidation.maxAllowed}
                            </div>
                          )}
                          {selectedPage.debugInfo.layoutValidation.suggestions.length > 0 && (
                            <div className="mb-2">
                              <span className="font-medium">제안:</span>
                              <ul className="mt-1 ml-4">
                                {selectedPage.debugInfo.layoutValidation.suggestions.map((suggestion, idx) => (
                                  <li key={idx} className="list-disc">{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {selectedPage.debugInfo.layoutValidation.warnings && selectedPage.debugInfo.layoutValidation.warnings.length > 0 && (
                            <div>
                              <span className="font-medium">주의사항:</span>
                              <ul className="mt-1 ml-4">
                                {selectedPage.debugInfo.layoutValidation.warnings.map((warning, idx) => (
                                  <li key={idx} className="list-disc">{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 디버그 정보가 없는 경우 */}
              {!selectedPage.debugInfo && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">🔍 이 페이지는 아직 생성되지 않았거나 디버그 정보가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼 - 향상된 디자인 */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mt-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 font-medium shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              이전 단계
            </button>
          </div>

          <div className="flex items-center gap-6">
            {step3Data && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1">
                    {step3Data.pages.map((page, index) => (
                      <div
                        key={page.pageId}
                        className={`w-2 h-2 rounded-full ${
                          page.phase2Complete && !page.parseError
                            ? 'bg-green-500'
                            : page.isGenerating
                            ? 'bg-blue-500 animate-pulse'
                            : page.parseError
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                        title={`페이지 ${page.pageNumber}: ${page.pageTitle}`}
                      ></div>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {step3Data.pages.filter(p => p.phase2Complete && !p.parseError).length} / {step3Data.pages.length} 완료
                  </span>
                </div>
                <p className="text-xs text-gray-600">다음: 디자인 시스템 생성</p>
              </div>
            )}

            <button
              onClick={() => onComplete?.(step3Data)}
              disabled={!step3Data || step3Data.pages.every(page => !page.phase2Complete)}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg transform hover:scale-105 flex items-center gap-2"
              title={
                !step3Data ? '데이터를 불러오는 중입니다...' :
                step3Data.pages.every(page => !page.phase2Complete)
                  ? `다음 페이지를 재생성해주세요: ${step3Data.pages.filter(p => !p.phase2Complete).map(p => `페이지 ${p.pageNumber}(${p.pageTitle})`).join(', ')}`
                  : '교육 콘텐츠 설계 완료!'
              }
            >
              {step3Data?.pages.some(page => page.isGenerating) ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  생성 대기 ({step3Data.pages.filter(p => p.isGenerating).length}개)
                </>
              ) : (
                <>
                  다음 단계
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 기본 익스포트
export { Step3IntegratedDesignFC as Step3IntegratedDesign };