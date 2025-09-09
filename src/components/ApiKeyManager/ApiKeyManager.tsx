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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
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
        <p>• GPT-4 모델을 사용하여 프롬프트를 생성합니다.</p>
      </div>
    </Card>
  );
};