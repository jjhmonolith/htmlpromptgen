import React, { useState, useEffect } from 'react';
import { validateApiKey, saveApiKey, loadApiKey, clearApiKey } from '../../services/storage.service';
import { Button, Input, Card } from '../common';

interface ApiKeyManagerProps {
  onKeyValidated: (key: string) => void;
  onCancel?: () => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeyValidated, onCancel }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    const savedKey = loadApiKey();
    if (savedKey) {
      setApiKey(savedKey);
      setHasExistingKey(true);
      // 기존 키가 있으면 자동 검증하지 않고 사용자가 선택하도록
    }
  }, []);

  const handleValidation = async (key: string) => {
    setIsValidating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const isValid = await validateApiKey(key);
      if (isValid) {
        saveApiKey(key);
        setSuccess('API 키가 성공적으로 검증되었습니다.');
        setHasExistingKey(true);
        
        // 1초 후 자동으로 완료 처리
        setTimeout(() => {
          onKeyValidated(key);
        }, 1000);
      } else {
        setError('유효하지 않은 API 키입니다. 다시 확인해주세요.');
      }
    } catch (err) {
      console.error('API key validation error:', err);
      setError('API 키 검증에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
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

  const handleUseExistingKey = () => {
    if (apiKey) {
      onKeyValidated(apiKey);
    }
  };

  const handleDeleteKey = () => {
    if (confirm('저장된 API 키를 삭제하시겠습니까?')) {
      clearApiKey();
      setApiKey('');
      setHasExistingKey(false);
      setSuccess(null);
      setError(null);
    }
  };

  const handleNewKey = () => {
    setApiKey('');
    setHasExistingKey(false);
    setSuccess(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full p-8 bg-white shadow-xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#3e88ff] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">OpenAI API 설정</h2>
          <p className="text-gray-600">
            AI 프롬프트 생성을 위해 OpenAI API 키가 필요합니다.
          </p>
        </div>

        {hasExistingKey && !success ? (
          // 기존 키가 있을 때
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">저장된 API 키 발견</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                이전에 저장된 API 키가 있습니다. 계속 사용하시겠습니까?
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleUseExistingKey}
                className="flex-1"
              >
                기존 키 사용
              </Button>
              <Button
                onClick={handleNewKey}
                variant="secondary"
                className="flex-1"
              >
                새 키 입력
              </Button>
            </div>
            
            <button
              onClick={handleDeleteKey}
              className="w-full text-sm text-red-600 hover:text-red-800 mt-2"
            >
              저장된 키 삭제
            </button>
          </div>
        ) : (
          // 새 키 입력
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
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
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#3e88ff] hover:text-[#2c6ae6] font-medium"
                >
                  {showKey ? '숨기기' : '보기'}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800 text-sm">{success}</span>
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={!apiKey.trim() || isValidating}
              className="w-full"
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  검증 중...
                </>
              ) : (
                'API 키 검증 및 저장'
              )}
            </Button>

            {hasExistingKey && (
              <button
                type="button"
                onClick={handleDeleteKey}
                className="w-full text-sm text-red-600 hover:text-red-800 mt-3"
              >
                저장된 키 삭제
              </button>
            )}
          </form>
        )}
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• API 키는 브라우저 로컬 스토리지에 암호화되어 저장됩니다</p>
            <p>• GPT-3.5-turbo 모델을 사용하여 프롬프트를 생성합니다</p>
            <p>• <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#3e88ff] hover:underline">OpenAI에서 API 키 발급받기</a></p>
          </div>
        </div>

        {onCancel && (
          <div className="mt-4 text-center">
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};