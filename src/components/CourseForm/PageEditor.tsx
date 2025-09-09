import React from 'react';
import { PageContent } from '../../types/course.types';
import { Button, Input, Card } from '../common';

interface PageEditorProps {
  page: PageContent;
  onChange: (page: PageContent) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
}

export const PageEditor: React.FC<PageEditorProps> = ({
  page,
  onChange,
  onRemove,
  canRemove,
  disabled
}) => {
  const handleFieldChange = (field: keyof PageContent, value: any) => {
    onChange({ ...page, [field]: value });
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">페이지 {page.pageNumber}</h3>
        {canRemove && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
          >
            삭제
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            페이지 제목 <span className="text-red-500">*</span>
          </label>
          <Input
            value={page.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="예: 파이썬 기초 - 변수와 자료형"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            페이지 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={page.content}
            onChange={(e) => handleFieldChange('content', e.target.value)}
            placeholder="이 페이지에서 다룰 주요 내용을 입력하세요..."
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={4}
          />
        </div>
      </div>
    </Card>
  );
};