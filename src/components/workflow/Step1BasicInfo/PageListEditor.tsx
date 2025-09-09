import React from 'react';
import { PageInfo } from '../../../types/workflow.types';

interface PageListEditorProps {
  pages: PageInfo[];
  onChange: (pages: PageInfo[]) => void;
}

export const PageListEditor: React.FC<PageListEditorProps> = ({ pages, onChange }) => {
  const addPage = () => {
    const newPage: PageInfo = {
      id: `page_${Date.now()}`,
      pageNumber: pages.length + 1,
      topic: '',
      description: ''
    };
    onChange([...pages, newPage]);
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== index);
    onChange(newPages.map((p, i) => ({ ...p, pageNumber: i + 1 })));
  };

  const updatePage = (index: number, field: keyof PageInfo, value: string) => {
    const newPages = [...pages];
    newPages[index] = { ...newPages[index], [field]: value };
    onChange(newPages);
  };

  return (
    <div className="space-y-6">
      {/* 2열 그리드 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((page, index) => (
          <div key={page.id} className="group relative bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200">
            {/* 카드 헤더 */}
            <div className="flex items-center justify-between p-4 pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                </div>
                <span className="text-sm font-medium text-gray-500">페이지 {index + 1}</span>
              </div>
              <button
                onClick={() => removePage(index)}
                disabled={pages.length <= 1}
                className={`p-1.5 rounded-lg transition-colors ${
                  pages.length <= 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                }`}
                title="페이지 삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 카드 바디 */}
            <div className="p-4 space-y-3">
              {/* 주제 입력 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">주제</label>
                <input
                  type="text"
                  value={page.topic}
                  onChange={(e) => updatePage(index, 'topic', e.target.value)}
                  placeholder="예: 물의 상태 변화"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-all"
                />
              </div>
              
              {/* 설명 입력 - 높이 증가 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
                <textarea
                  value={page.description || ''}
                  onChange={(e) => updatePage(index, 'description', e.target.value)}
                  placeholder="이 페이지에서 다룰 내용을 자세히 설명해주세요.\n\n예시:\n- 학습 목표\n- 주요 개념\n- 활동 내용\n- 예시나 실습\n- 평가 방법"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-all resize-none text-sm leading-relaxed"
                  rows={7}
                />
              </div>
            </div>
          </div>
        ))}
        
        {/* 페이지 추가 버튼 - 그리드 내에 위치 */}
        <button
          onClick={addPage}
          className="min-h-[320px] border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center gap-3"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="font-medium">새 페이지 추가</span>
        </button>
      </div>
      
      <p className="text-sm text-gray-500 text-center">
        최소 1개, 최대 20개의 페이지를 구성할 수 있습니다
      </p>
    </div>
  );
};