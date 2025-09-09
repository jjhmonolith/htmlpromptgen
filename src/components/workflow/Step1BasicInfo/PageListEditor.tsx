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
          <div key={page.id} className="group relative glass-card rounded-xl hover:bg-white/20 transition-all duration-200">
            {/* 카드 헤더 */}
            <div className="flex items-center justify-between p-4 pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-blue-300/30">
                  <span className="text-sm font-bold text-gray-900">{index + 1}</span>
                </div>
                <span className="text-sm font-medium text-gray-900/90">페이지 {index + 1}</span>
              </div>
              <button
                onClick={() => removePage(index)}
                disabled={pages.length <= 1}
                className={`p-1.5 rounded-lg backdrop-blur-sm transition-all ${
                  pages.length <= 1
                    ? 'text-gray-900/30 cursor-not-allowed'
                    : 'text-gray-900/60 hover:text-red-400 hover:bg-red-500/20'
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
                <label className="block text-xs font-medium text-gray-900/80 mb-1">주제</label>
                <input
                  type="text"
                  value={page.topic}
                  onChange={(e) => updatePage(index, 'topic', e.target.value)}
                  placeholder="예: 물의 상태 변화"
                  className="w-full px-3 py-2 glass-input rounded-lg focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all text-gray-900 placeholder:text-gray-500"
                />
              </div>
              
              {/* 설명 입력 - 높이 증가 */}
              <div>
                <label className="block text-xs font-medium text-gray-900/80 mb-1">설명</label>
                <textarea
                  value={page.description || ''}
                  onChange={(e) => updatePage(index, 'description', e.target.value)}
                  placeholder="이 페이지에서 다룰 내용을 자세히 설명해주세요.\n\n예시:\n- 학습 목표\n- 주요 개념\n- 활동 내용\n- 예시나 실습\n- 평가 방법"
                  className="w-full px-3 py-2 glass-input rounded-lg focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all resize-none text-sm leading-relaxed text-gray-900 placeholder:text-gray-500"
                  rows={7}
                />
              </div>
            </div>
          </div>
        ))}
        
        {/* 페이지 추가 버튼 - 그리드 내에 위치 */}
        <button
          onClick={addPage}
          className="min-h-[320px] glass border-2 border-dashed border-white/30 rounded-xl text-gray-900/70 hover:border-blue-400/50 hover:text-gray-900 hover:bg-white/10 transition-all duration-200 flex flex-col items-center justify-center gap-3"
        >
          <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="font-medium">새 페이지 추가</span>
        </button>
      </div>
      
      <p className="text-sm text-gray-900/60 text-center">
        최소 1개, 최대 20개의 페이지를 구성할 수 있습니다
      </p>
    </div>
  );
};