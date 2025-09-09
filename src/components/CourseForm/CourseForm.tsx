import React, { useState, useCallback } from 'react';
import { CourseFormData, PageContent } from '../../types/course.types';
import { PageEditor } from './PageEditor';
import { Button, Input, Card } from '../common';
import { useDraft } from '../../hooks/useDraft';

interface CourseFormProps {
  onSubmit: (data: CourseFormData) => Promise<void>;
  isLoading: boolean;
  initialData?: CourseFormData;
  onDataChange?: (data: CourseFormData) => void;
}

export const CourseForm: React.FC<CourseFormProps> = ({ onSubmit, isLoading, initialData, onDataChange }) => {
  const { draft, updateDraft, clearDraft } = useDraft<CourseFormData>('course-draft');
  
  const [formData, setFormData] = useState<CourseFormData>(
    initialData || draft || {
      subject: '',
      targetAudience: '',
      pages: [{ 
        pageNumber: 1, 
        title: '', 
        content: '', 
        objectives: [], 
        activities: [] 
      }]
    }
  );

  const handleInputChange = useCallback((field: keyof CourseFormData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateDraft(newData);
    if (onDataChange) {
      onDataChange(newData);
    }
  }, [formData, updateDraft, onDataChange]);

  const addPage = useCallback(() => {
    const newPage: PageContent = {
      pageNumber: formData.pages.length + 1,
      title: '',
      content: '',
      objectives: [],
      activities: []
    };
    handleInputChange('pages', [...formData.pages, newPage]);
  }, [formData.pages, handleInputChange]);

  const updatePage = useCallback((index: number, page: PageContent) => {
    const newPages = [...formData.pages];
    newPages[index] = page;
    handleInputChange('pages', newPages);
  }, [formData.pages, handleInputChange]);

  const removePage = useCallback((index: number) => {
    if (formData.pages.length > 1) {
      const newPages = formData.pages.filter((_, i) => i !== index);
      newPages.forEach((page, i) => {
        page.pageNumber = i + 1;
      });
      handleInputChange('pages', newPages);
    }
  }, [formData.pages, handleInputChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    clearDraft();
  };

  const isValid = formData.subject && formData.targetAudience && 
    formData.pages.every(p => p.title && p.content);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">교안 정보 입력</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              교안 주제 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="예: 파이썬 기초 프로그래밍"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              학습 대상 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              placeholder="예: 프로그래밍 입문자, 대학생"
              disabled={isLoading}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">페이지별 내용</h3>
          <Button
            type="button"
            onClick={addPage}
            disabled={isLoading}
            variant="secondary"
          >
            페이지 추가
          </Button>
        </div>
        
        {formData.pages.map((page, index) => (
          <PageEditor
            key={index}
            page={page}
            onChange={(updatedPage) => updatePage(index, updatedPage)}
            onRemove={() => removePage(index)}
            canRemove={formData.pages.length > 1}
            disabled={isLoading}
          />
        ))}
      </div>

      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={clearDraft}
          disabled={isLoading}
        >
          초기화
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isLoading}
        >
          {isLoading ? '프롬프트 생성 중...' : '프롬프트 생성'}
        </Button>
      </div>
    </form>
  );
};