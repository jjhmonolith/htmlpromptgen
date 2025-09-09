import React from 'react';

interface PromptViewerProps {
  content: string;
  isEditable: boolean;
  onChange?: (value: string) => void;
}

export const PromptViewer: React.FC<PromptViewerProps> = ({
  content,
  isEditable,
  onChange
}) => {
  if (isEditable && onChange) {
    return (
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows={20}
      />
    );
  }

  return (
    <div className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 overflow-auto">
      <pre className="font-mono text-sm whitespace-pre-wrap">{content}</pre>
    </div>
  );
};