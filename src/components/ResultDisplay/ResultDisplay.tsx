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