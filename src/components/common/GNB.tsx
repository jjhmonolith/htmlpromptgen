import React, { useState } from 'react';
import { AppleButton } from '../apple';
import { ApiKeyManager } from '../ApiKeyManager';

interface GNBProps {
  onLogoClick?: () => void;
  projectName?: string;
  progressPercentage?: number;
  lastSaved?: Date;
  currentStep?: number;
  steps?: Array<{ num: number; title: string; isCompleted: boolean }>;
  onStepClick?: (stepNum: number) => void;
  isGenerating?: boolean; // 진행 중 상태 표시용
}

export const GNB: React.FC<GNBProps> = ({ onLogoClick, projectName, lastSaved, currentStep = 1, steps, onStepClick, isGenerating = false }) => {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem('anthropic_api_key')
  );

  const handleApiKeyValidated = (key: string) => {
    setApiKey(key);
    localStorage.setItem('anthropic_api_key', key);
    setShowApiKeyModal(false);
  };

  const handleApiKeyRemove = () => {
    setApiKey(null);
    localStorage.removeItem('anthropic_api_key');
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-gray-200/50" style={{ backgroundColor: '#f5f5f7' }}>
        <div className="max-w-screen-2xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Left Section - Logo and Project Name */}
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center cursor-pointer"
              onClick={onLogoClick}
            >
              <img 
                src="/codle-logo.svg" 
                alt="Codle" 
                className="w-16 h-16"
              />
            </div>
            
            {projectName && (
              <>
                <div className="h-8 w-px bg-gray-300"></div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{projectName}</h2>
                </div>
              </>
            )}
          </div>

          {/* Center Section - Step Indicators */}
          {steps && steps.length > 0 && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-2">
                {steps.map((step, index) => {
                  const isActive = step.num === currentStep;
                  const isCompleted = step.isCompleted;
                  const canAccess = step.num <= currentStep || isCompleted;
                  
                  // 크기와 애니메이션 설정
                  const scale = isActive ? 'scale-125' : 'scale-100'; // 현재 단계를 조금만 크게
                  const pulseAnimation = isActive && isGenerating ? 'animate-pulse' : '';
                  
                  return (
                    <React.Fragment key={step.num}>
                      <div className="relative group">
                        <div 
                          className={`
                            relative transition-all duration-500 flex items-center justify-center cursor-pointer
                            ${scale} ${pulseAnimation}
                            ${canAccess ? 'hover:scale-125' : 'cursor-not-allowed opacity-50'}
                          `}
                          onClick={() => canAccess && onStepClick && onStepClick(step.num)}
                        >
                          {/* 진행 중 애니메이션 효과 - 동그라미 효과 제거 */}
                          
                                  {/* Step Icons - 새로운 색상 로직 */}
                          <div className={`
                            ${isCompleted || isActive ? 'text-blue-500' : 'text-gray-400'}
                            transition-all duration-300
                            ${canAccess ? 'hover:scale-110' : ''}
                            ${isActive ? 'filter drop-shadow-lg' : ''}
                            ${isActive && isGenerating ? 'animate-pulse' : ''}
                          `}>
                            {/* Step Icons */}
                            {step.num === 1 && (
                              <svg className={`w-7 h-7 ${isCompleted || isActive ? 'fill-blue-500' : 'fill-gray-400'}`} viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h2a1 1 0 100-2 2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v11z" clipRule="evenodd"/>
                              </svg>
                            )}
                            {step.num === 2 && (
                              <svg className={`w-7 h-7 ${isCompleted || isActive ? 'fill-blue-500' : 'fill-gray-400'}`} viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                              </svg>
                            )}
                            {step.num === 3 && (
                              <svg className={`w-7 h-7 ${isCompleted || isActive ? 'fill-blue-500' : 'fill-gray-400'}`} viewBox="0 0 20 20">
                                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
                              </svg>
                            )}
                            {step.num === 4 && (
                              <svg className={`w-7 h-7 ${isCompleted || isActive ? 'fill-blue-500' : 'fill-gray-400'}`} viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                              </svg>
                            )}
                            {step.num === 5 && (
                              <svg className={`w-7 h-7 ${isCompleted || isActive ? 'fill-blue-500' : 'fill-gray-400'}`} viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                            {step.title}
                          </div>
                        </div>
                      </div>
                      
                      {/* Connector Line - 완료된 단계들은 파란색 연결선 */}
                      {index < steps.length - 1 && (
                        <div className={`
                          w-8 h-0.5 transition-all duration-500
                          ${step.isCompleted ? 'bg-blue-500' : 'bg-gray-300'}
                          ${isActive && isGenerating ? 'animate-pulse' : ''}
                        `}></div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Save Status */}
            {lastSaved && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                {new Date(lastSaved).toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </div>
            )}
            
            {/* API Key Status Button - Combined with Settings */}
            <button
              onClick={() => setShowApiKeyModal(true)}
              className={`
                w-10 h-10 flex items-center justify-center rounded-lg transition-all
                hover:bg-gray-200/50 hover:scale-110
                ${!apiKey ? 'animate-bounce' : ''}
              `}
              title={apiKey ? "API 키 설정 (연결됨)" : "API 키 설정 필요"}
            >
              {apiKey ? (
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">API 키 설정</h2>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {apiKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">API 키가 연결되어 있습니다</span>
                  </div>
                  <p className="text-sm text-green-700">
                    마스킹된 키: {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 4)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <AppleButton
                    variant="secondary"
                    fullWidth
                    onClick={handleApiKeyRemove}
                  >
                    API 키 삭제
                  </AppleButton>
                  <AppleButton
                    variant="primary"
                    fullWidth
                    onClick={() => setShowApiKeyModal(false)}
                  >
                    닫기
                  </AppleButton>
                </div>
              </div>
            ) : (
              <ApiKeyManager 
                onKeyValidated={handleApiKeyValidated}
                onCancel={() => setShowApiKeyModal(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-18"></div>
    </>
  );
};