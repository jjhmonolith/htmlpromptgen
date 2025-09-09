import React, { useState } from 'react';
import { ProjectData, PageInfo } from '../../../types/workflow.types';
import { PageListEditor } from './PageListEditor';

interface Step1BasicInfoProps {
  initialData?: ProjectData | null;
  onComplete: (data: ProjectData) => void;
  onBack?: () => void;
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({ 
  initialData, 
  onComplete,
  onBack
}) => {
  const [projectTitle, setProjectTitle] = useState(initialData?.projectTitle || '');
  const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience || '');
  const [pages, setPages] = useState<PageInfo[]>(initialData?.pages || [
    { id: '1', pageNumber: 1, topic: '', description: '' }
  ]);
  const [layoutMode, setLayoutMode] = useState<'fixed' | 'scrollable'>(
    initialData?.layoutMode || 'fixed'
  );
  const [contentMode, setContentMode] = useState<'enhanced' | 'restricted'>(
    initialData?.contentMode || 'enhanced'
  );
  const [suggestions, setSuggestions] = useState(initialData?.suggestions || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!projectTitle.trim()) {
      newErrors.projectTitle = '프로젝트 제목을 입력해주세요';
    }
    
    if (!targetAudience.trim()) {
      newErrors.targetAudience = '대상 학습자를 입력해주세요';
    }
    
    const validPages = pages.filter(p => p.topic.trim());
    if (validPages.length === 0) {
      newErrors.pages = '최소 1개 이상의 페이지를 입력해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const validPages = pages.filter(p => p.topic.trim());
    const projectData: ProjectData = {
      id: initialData?.id || `project_${Date.now()}`,
      projectTitle: projectTitle.trim(),
      targetAudience: targetAudience.trim(),
      pages: validPages.map((p, idx) => ({
        ...p,
        pageNumber: idx + 1
      })),
      layoutMode,
      contentMode,
      suggestions: suggestions.trim() || undefined,
      createdAt: initialData?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onComplete(projectData);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* 모드 선택 섹션 - 최상단 배치 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 설정</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 레이아웃 모드 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">레이아웃 모드</h4>
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  value="fixed"
                  checked={layoutMode === 'fixed'}
                  onChange={(e) => setLayoutMode(e.target.value as 'fixed')}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900 group-hover:text-blue-600">
                    고정형 레이아웃
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    슬라이드 형식의 프레젠테이션 스타일
                  </div>
                </div>
              </label>
              <label className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  value="scrollable"
                  checked={layoutMode === 'scrollable'}
                  onChange={(e) => setLayoutMode(e.target.value as 'scrollable')}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900 group-hover:text-blue-600">
                    스크롤형 레이아웃
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    연속적인 웹페이지 스타일
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 콘텐츠 모드 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">콘텐츠 생성 모드</h4>
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  value="enhanced"
                  checked={contentMode === 'enhanced'}
                  onChange={(e) => setContentMode(e.target.value as 'enhanced')}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900 group-hover:text-blue-600">
                    AI 향상 모드
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    AI가 콘텐츠를 자동으로 보강합니다
                  </div>
                </div>
              </label>
              <label className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  value="restricted"
                  checked={contentMode === 'restricted'}
                  onChange={(e) => setContentMode(e.target.value as 'restricted')}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900 group-hover:text-blue-600">
                    제한 모드
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    입력한 내용만 사용합니다
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 기본 정보 입력 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">기본 정보</h3>
        
        <div className="space-y-6">
          {/* 프로젝트 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프로젝트 제목
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="예: 초등학교 3학년 과학 - 물의 순환"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.projectTitle 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`}
            />
            {errors.projectTitle && (
              <p className="text-red-600 text-sm mt-2">{errors.projectTitle}</p>
            )}
          </div>

          {/* 대상 학습자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              대상 학습자
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="예: 초등학교 3학년, 8-9세"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.targetAudience
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`}
            />
            {errors.targetAudience && (
              <p className="text-red-600 text-sm mt-2">{errors.targetAudience}</p>
            )}
          </div>

          {/* 추가 제안사항 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              추가 제안사항
              <span className="text-gray-400 ml-2 text-xs font-normal">(선택)</span>
            </label>
            <textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="특별한 요구사항이나 스타일 지침을 입력하세요"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* 페이지 구성 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            페이지 구성
            <span className="text-red-500 ml-1">*</span>
          </h3>
          <span className="text-sm text-gray-500">
            {pages.filter(p => p.topic.trim()).length}개 페이지
          </span>
        </div>
        <PageListEditor
          pages={pages}
          onChange={setPages}
        />
        {errors.pages && (
          <p className="text-red-600 text-sm mt-2">{errors.pages}</p>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-between items-center">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
          >
            이전으로
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="ml-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors font-medium"
        >
          다음 단계로 →
        </button>
      </div>
    </div>
  );
};