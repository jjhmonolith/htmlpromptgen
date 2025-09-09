# Component Specifications & Implementation Examples

## 1. Project Structure

```
promptgen/
├── src/
│   ├── components/
│   │   ├── ApiKeyManager/
│   │   │   ├── ApiKeyManager.tsx
│   │   │   ├── ApiKeyManager.styles.ts
│   │   │   └── index.ts
│   │   ├── CourseForm/
│   │   │   ├── CourseForm.tsx
│   │   │   ├── PageEditor.tsx
│   │   │   ├── CourseForm.styles.ts
│   │   │   └── index.ts
│   │   ├── ResultDisplay/
│   │   │   ├── ResultDisplay.tsx
│   │   │   ├── PromptViewer.tsx
│   │   │   ├── ResultDisplay.styles.ts
│   │   │   └── index.ts
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Card.tsx
│   ├── services/
│   │   ├── openai.service.ts
│   │   ├── storage.service.ts
│   │   └── prompt.generator.ts
│   ├── hooks/
│   │   ├── useApiKey.ts
│   │   ├── useLocalStorage.ts
│   │   └── usePromptGenerator.ts
│   ├── types/
│   │   ├── course.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 2. Core Component Implementations

### 2.1 ApiKeyManager Component

```typescript
// src/components/ApiKeyManager/ApiKeyManager.tsx
import React, { useState, useEffect } from 'react';
import { validateApiKey, saveApiKey, loadApiKey } from '../../services/storage.service';
import { Button, Input, Card } from '../common';

interface ApiKeyManagerProps {
  onKeyValidated: (key: string) => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeyValidated }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const savedKey = loadApiKey();
    if (savedKey) {
      setApiKey(savedKey);
      handleValidation(savedKey);
    }
  }, []);

  const handleValidation = async (key: string) => {
    setIsValidating(true);
    setError(null);
    
    try {
      const isValid = await validateApiKey(key);
      if (isValid) {
        saveApiKey(key);
        onKeyValidated(key);
      } else {
        setError('Invalid API key. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to validate API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      handleValidation(apiKey.trim());
    }
  };

  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">OpenAI API 설정</h2>
      <p className="text-gray-600 mb-6">
        교안 프롬프트 생성을 위해 OpenAI API 키를 입력해주세요.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium mb-2">
            API Key
          </label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              disabled={isValidating}
              className="pr-20"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
        
        <Button
          type="submit"
          disabled={!apiKey.trim() || isValidating}
          className="w-full"
        >
          {isValidating ? '검증 중...' : 'API 키 검증'}
        </Button>
      </form>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>• API 키는 브라우저 로컬 스토리지에 안전하게 저장됩니다.</p>
        <p>• GPT-5 모델을 사용하여 프롬프트를 생성합니다.</p>
      </div>
    </Card>
  );
};
```

### 2.2 CourseForm Component

```typescript
// src/components/CourseForm/CourseForm.tsx
import React, { useState, useCallback } from 'react';
import { CourseFormData, PageContent } from '../../types/course.types';
import { PageEditor } from './PageEditor';
import { Button, Input, Card } from '../common';
import { useDraft } from '../../hooks/useDraft';

interface CourseFormProps {
  onSubmit: (data: CourseFormData) => Promise<void>;
  isLoading: boolean;
}

export const CourseForm: React.FC<CourseFormProps> = ({ onSubmit, isLoading }) => {
  const { draft, updateDraft, clearDraft } = useDraft<CourseFormData>('course-draft');
  
  const [formData, setFormData] = useState<CourseFormData>(
    draft || {
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
  }, [formData, updateDraft]);

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
```

### 2.3 Prompt Generator Service

```typescript
// src/services/prompt.generator.ts
import OpenAI from 'openai';
import { CourseFormData } from '../types/course.types';

export class PromptGeneratorService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async generatePrompt(courseData: CourseFormData): Promise<string> {
    const systemInstructions = `
당신은 교육 콘텐츠 개발 전문가입니다. 
주어진 교안 정보를 바탕으로 Claude Code가 고품질 교육 자료를 개발할 수 있는 
상세하고 구조화된 프롬프트를 작성해주세요.

생성할 프롬프트는 다음 구조를 따라야 합니다:

1. **목표 설정**
   - 교안의 명확한 학습 목표
   - 기대되는 학습 성과
   
2. **대상 학습자 분석**
   - 학습자 수준과 배경
   - 선수 지식 요구사항
   
3. **콘텐츠 구조**
   - 각 페이지별 세부 내용
   - 논리적 흐름과 연결성
   
4. **교수 방법론**
   - 적절한 교수법 제안
   - 상호작용 요소
   
5. **평가 및 피드백**
   - 학습 확인 방법
   - 형성평가 전략

6. **형식 요구사항**
   - 문서 형식 (마크다운, HTML 등)
   - 시각 자료 요구사항
   - 접근성 고려사항

프롬프트는 Claude Code가 즉시 실행할 수 있도록 
명확하고 구체적이어야 합니다.
`;

    const userInput = this.formatCourseData(courseData);

    try {
      const response = await this.openai.responses.create({
        model: 'gpt-5',
        reasoning: { effort: 'medium' },
        instructions: systemInstructions,
        input: userInput
      });

      return this.extractPrompt(response);
    } catch (error) {
      console.error('Prompt generation failed:', error);
      throw new Error('프롬프트 생성에 실패했습니다. 다시 시도해주세요.');
    }
  }

  private formatCourseData(courseData: CourseFormData): string {
    const pagesDescription = courseData.pages
      .map(page => `
페이지 ${page.pageNumber}: ${page.title}
내용: ${page.content}
${page.objectives?.length ? `학습목표: ${page.objectives.join(', ')}` : ''}
${page.activities?.length ? `활동: ${page.activities.join(', ')}` : ''}
      `)
      .join('\n---\n');

    return `
교안 개발 요청 정보:

주제: ${courseData.subject}
대상: ${courseData.targetAudience}

페이지별 구성:
${pagesDescription}

위 정보를 바탕으로 Claude Code용 상세 프롬프트를 생성해주세요.
    `;
  }

  private extractPrompt(response: any): string {
    // GPT-5 response structure handling
    if (response.output_text) {
      return response.output_text;
    }
    
    // Fallback for different response structures
    if (response.output && Array.isArray(response.output)) {
      const messageOutput = response.output.find(item => item.type === 'message');
      if (messageOutput?.content?.[0]?.text) {
        return messageOutput.content[0].text;
      }
    }
    
    throw new Error('Unexpected response format from GPT-5');
  }
}
```

### 2.4 Result Display Component

```typescript
// src/components/ResultDisplay/ResultDisplay.tsx
import React, { useState } from 'react';
import { Card, Button } from '../common';
import { PromptViewer } from './PromptViewer';
import { copyToClipboard, downloadAsFile } from '../../utils/clipboard';

interface ResultDisplayProps {
  prompt: string;
  metadata?: {
    generatedAt: Date;
    subject: string;
  };
  onReset: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  prompt, 
  metadata, 
  onReset 
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(prompt);

  const handleCopy = async () => {
    const success = await copyToClipboard(isEditing ? editedPrompt : prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const content = isEditing ? editedPrompt : prompt;
    const filename = `claude-prompt-${metadata?.subject || 'generated'}-${Date.now()}.txt`;
    downloadAsFile(content, filename);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">생성된 프롬프트</h2>
            {metadata && (
              <p className="text-sm text-gray-600 mt-1">
                주제: {metadata.subject} | 
                생성 시간: {metadata.generatedAt.toLocaleString('ko-KR')}
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
          >
            새 프롬프트 생성
          </Button>
        </div>

        <div className="mb-4 flex gap-2">
          <Button
            onClick={handleCopy}
            variant={copied ? 'success' : 'primary'}
            size="sm"
          >
            {copied ? '복사됨!' : '클립보드 복사'}
          </Button>
          <Button
            onClick={handleDownload}
            variant="secondary"
            size="sm"
          >
            파일 다운로드
          </Button>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="secondary"
            size="sm"
          >
            {isEditing ? '편집 완료' : '프롬프트 편집'}
          </Button>
        </div>

        <PromptViewer
          content={isEditing ? editedPrompt : prompt}
          isEditable={isEditing}
          onChange={setEditedPrompt}
        />
      </Card>

      <Card className="p-4 bg-blue-50">
        <h3 className="font-semibold text-blue-900 mb-2">사용 방법</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. 위 프롬프트를 복사하세요</li>
          <li>2. Claude Code를 열고 새 대화를 시작하세요</li>
          <li>3. 복사한 프롬프트를 붙여넣고 실행하세요</li>
          <li>4. Claude Code가 교안을 자동으로 생성합니다</li>
        </ol>
      </Card>
    </div>
  );
};
```

## 3. Service Layer Implementation

### 3.1 OpenAI Service

```typescript
// src/services/openai.service.ts
import OpenAI from 'openai';

export class OpenAIService {
  private static instance: OpenAIService | null = null;
  private openai: OpenAI | null = null;

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  initialize(apiKey: string): void {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const tempClient = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
      
      // Simple validation call
      await tempClient.responses.create({
        model: 'gpt-5',
        input: 'test',
        reasoning: { effort: 'low' }
      });
      
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  getClient(): OpenAI {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please set API key first.');
    }
    return this.openai;
  }
}
```

### 3.2 Storage Service

```typescript
// src/services/storage.service.ts
import CryptoJS from 'crypto-js';

const STORAGE_KEYS = {
  API_KEY: 'openai_api_key',
  COURSE_DRAFT: 'course_draft',
  PROMPT_HISTORY: 'prompt_history'
} as const;

// Simple encryption for API key storage
const ENCRYPTION_KEY = 'promptgen-local-key';

export const saveApiKey = (apiKey: string): void => {
  const encrypted = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
  localStorage.setItem(STORAGE_KEYS.API_KEY, encrypted);
};

export const loadApiKey = (): string | null => {
  const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEY);
  if (!encrypted) return null;
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
};

export const clearApiKey = (): void => {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  const openaiService = (await import('./openai.service')).OpenAIService.getInstance();
  return openaiService.validateKey(apiKey);
};

export const saveDraft = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const loadDraft = <T>(key: string): T | null => {
  const data = localStorage.getItem(key);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};

export const clearDraft = (key: string): void => {
  localStorage.removeItem(key);
};
```

## 4. Custom Hooks

### 4.1 usePromptGenerator Hook

```typescript
// src/hooks/usePromptGenerator.ts
import { useState, useCallback } from 'react';
import { CourseFormData } from '../types/course.types';
import { PromptGeneratorService } from '../services/prompt.generator';

interface UsePromptGeneratorResult {
  generatePrompt: (courseData: CourseFormData, apiKey: string) => Promise<string>;
  isGenerating: boolean;
  error: string | null;
  clearError: () => void;
}

export const usePromptGenerator = (): UsePromptGeneratorResult => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrompt = useCallback(async (
    courseData: CourseFormData, 
    apiKey: string
  ): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const generator = new PromptGeneratorService(apiKey);
      const prompt = await generator.generatePrompt(courseData);
      return prompt;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프롬프트 생성 실패';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generatePrompt,
    isGenerating,
    error,
    clearError
  };
};
```

### 4.2 useDraft Hook

```typescript
// src/hooks/useDraft.ts
import { useState, useEffect, useCallback } from 'react';
import { saveDraft, loadDraft, clearDraft as clearStoredDraft } from '../services/storage.service';

interface UseDraftResult<T> {
  draft: T | null;
  updateDraft: (data: T) => void;
  clearDraft: () => void;
}

export const useDraft = <T>(key: string): UseDraftResult<T> => {
  const [draft, setDraft] = useState<T | null>(null);

  useEffect(() => {
    const loaded = loadDraft<T>(key);
    if (loaded) {
      setDraft(loaded);
    }
  }, [key]);

  const updateDraft = useCallback((data: T) => {
    setDraft(data);
    saveDraft(key, data);
  }, [key]);

  const clearDraft = useCallback(() => {
    setDraft(null);
    clearStoredDraft(key);
  }, [key]);

  return {
    draft,
    updateDraft,
    clearDraft
  };
};
```

## 5. Type Definitions

```typescript
// src/types/course.types.ts
export interface CourseFormData {
  subject: string;
  targetAudience: string;
  pages: PageContent[];
}

export interface PageContent {
  pageNumber: number;
  title: string;
  content: string;
  objectives?: string[];
  activities?: string[];
}

export interface GeneratedPrompt {
  prompt: string;
  metadata: {
    generatedAt: Date;
    estimatedTokens: number;
    subject: string;
  };
}

// src/types/api.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OpenAIResponse {
  output_text: string;
  output: Array<{
    id: string;
    type: string;
    role: string;
    content: Array<{
      type: string;
      text: string;
      annotations: any[];
    }>;
  }>;
}
```