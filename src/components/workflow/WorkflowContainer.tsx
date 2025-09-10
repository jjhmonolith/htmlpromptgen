import React, { useState, useEffect } from 'react';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2VisualIdentity } from './Step2VisualIdentity';
import { Button } from '../common';
import { projectService } from '../../services/project.service';
import { 
  WorkflowState, 
  ProjectData, 
  VisualIdentity,
  LayoutProposal,
  PageEnhancement,
  FinalPrompt
} from '../../types/workflow.types';

interface WorkflowContainerProps {
  projectId: string;
  onComplete?: (finalPrompt: FinalPrompt) => void;
  onBack?: () => void;
}

export const WorkflowContainer: React.FC<WorkflowContainerProps> = ({
  projectId,
  onComplete,
  onBack
}) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStep: 1,
    projectData: null,
    visualIdentity: null,
    layoutProposals: [],
    pageEnhancements: [],
    finalPrompt: null,
    stepCompletion: {
      step1: false,
      step2: false,
      step3: false,
      step4: false,
      step5: false
    },
    modifications: {},
    previousStates: {}
  });

  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);

  // 워크플로우 데이터 저장 함수
  const saveWorkflowData = React.useCallback((state: WorkflowState) => {
    try {
      setSaveStatus('saving');
      projectService.saveWorkflowData(projectId, state);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to save workflow:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [projectId]);

  // 컴포넌트 마운트 시 워크플로우 데이터 로드
  useEffect(() => {
    const loadWorkflowData = async () => {
      setIsLoading(true);
      try {
        const savedWorkflow = projectService.loadWorkflowData(projectId);
        if (savedWorkflow) {
          setWorkflowState(savedWorkflow);
        }
      } catch (error) {
        console.error('Failed to load workflow state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflowData();
  }, [projectId]);

  // 워크플로우 상태 변경 시 자동 저장 (디바운싱 적용)
  useEffect(() => {
    if (isLoading) return; // 초기 로딩 중에는 저장하지 않음

    const timeoutId = setTimeout(() => {
      saveWorkflowData(workflowState);
    }, 1000); // 1초 디바운싱

    return () => clearTimeout(timeoutId);
  }, [workflowState, isLoading, saveWorkflowData]);

  // 페이지 언로드 시 즉시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isLoading) {
        projectService.saveWorkflowData(projectId, workflowState);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, workflowState, isLoading]);

  const handleStep1Complete = (data: ProjectData) => {
    setWorkflowState(prev => ({
      ...prev,
      projectData: data,
      stepCompletion: { ...prev.stepCompletion, step1: true },
      currentStep: 2
    }));
  };

  const handleStep2Complete = (data: VisualIdentity) => {
    setWorkflowState(prev => ({
      ...prev,
      visualIdentity: data,
      stepCompletion: { ...prev.stepCompletion, step2: true },
      currentStep: 3
    }));
  };

  // TODO: Step 3-5 구현 시 활성화 예정
  // const handleStep3Complete = (data: LayoutProposal[]) => {
  //   setWorkflowState(prev => ({
  //     ...prev,
  //     layoutProposals: data,
  //     stepCompletion: { ...prev.stepCompletion, step3: true },
  //     currentStep: 4
  //   }));
  // };

  // const handleStep4Complete = (data: PageEnhancement[]) => {
  //   setWorkflowState(prev => ({
  //     ...prev,
  //     pageEnhancements: data,
  //     stepCompletion: { ...prev.stepCompletion, step4: true },
  //     currentStep: 5
  //   }));
  // };

  // const handleStep5Complete = (data: FinalPrompt) => {
  //   const finalState = {
  //     ...workflowState,
  //     finalPrompt: data,
  //     stepCompletion: { ...workflowState.stepCompletion, step5: true }
  //   };
    
  //   setWorkflowState(finalState);
    
  //   // 즉시 저장
  //   projectService.saveWorkflowData(projectId, finalState);
    
  //   if (onComplete) {
  //     onComplete(data);
  //   }
  // };

  const goToStep = (step: 1 | 2 | 3 | 4 | 5) => {
    // 수정사항이 있으면 이전 상태 저장
    if (workflowState.modifications[`step${workflowState.currentStep}`]) {
      setWorkflowState(prev => ({
        ...prev,
        previousStates: {
          ...prev.previousStates,
          [prev.currentStep]: getStepData(prev.currentStep)
        }
      }));
    }
    
    setWorkflowState(prev => ({
      ...prev,
      currentStep: step
    }));
  };

  const getStepData = (step: number) => {
    switch (step) {
      case 1: return workflowState.projectData;
      case 2: return workflowState.visualIdentity;
      case 3: return workflowState.layoutProposals;
      case 4: return workflowState.pageEnhancements;
      case 5: return workflowState.finalPrompt;
      default: return null;
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, name: '기본 정보' },
      { num: 2, name: '비주얼 아이덴티티' },
      { num: 3, name: '레이아웃' },
      { num: 4, name: '애니메이션' },
      { num: 5, name: '최종 프롬프트' }
    ];

    return (
      <div className="apple-card p-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          {steps.map((step, index) => (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => goToStep(step.num as any)}
                  disabled={step.num > workflowState.currentStep && !workflowState.stepCompletion[`step${step.num - 1}` as keyof typeof workflowState.stepCompletion]}
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold transition-apple
                    ${workflowState.currentStep === step.num 
                      ? 'bg-apple-blue text-white shadow-apple-lg border-2 border-apple-blue/30' 
                      : workflowState.stepCompletion[`step${step.num}` as keyof typeof workflowState.stepCompletion]
                        ? 'bg-apple-green text-white cursor-pointer hover:bg-apple-green/90 shadow-apple-md'
                        : 'bg-apple-gray-2 text-apple-gray-5 cursor-not-allowed'
                    }
                  `}
                >
                  {workflowState.stepCompletion[`step${step.num}` as keyof typeof workflowState.stepCompletion] ? (
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </button>
                <span className="mt-3 text-sm font-medium text-gray-900 text-center">
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  hidden sm:block h-1 w-20 mx-6 rounded-full
                  ${workflowState.stepCompletion[`step${step.num}` as keyof typeof workflowState.stepCompletion]
                    ? 'bg-apple-green'
                    : 'bg-apple-gray-3'
                  }
                `} />
              )}
            </div>
          ))}
        </div>

        {/* 저장 상태 표시 */}
        <div className="mt-4 text-center">
          {saveStatus === 'saving' && (
            <div className="text-sm text-gray-600 flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              저장 중...
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="text-sm text-green-600 flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              자동 저장됨
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="text-sm text-red-600 flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              저장 실패
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e88ff] mx-auto mb-4"></div>
          <p className="text-gray-600">워크플로우 데이터를 불러오는 중...</p>
        </div>
      );
    }

    switch (workflowState.currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            initialData={workflowState.projectData}
            onComplete={handleStep1Complete}
            onBack={onBack}
          />
        );
      
      case 2:
        return workflowState.projectData ? (
          <Step2VisualIdentity
            projectData={workflowState.projectData}
            initialData={workflowState.visualIdentity}
            onComplete={handleStep2Complete}
            onBack={() => goToStep(1)}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">데이터 오류</h2>
            <p className="text-gray-600 mb-8">프로젝트 데이터가 없습니다. 1단계부터 다시 시작해주세요.</p>
            <Button onClick={() => goToStep(1)}>1단계로 돌아가기</Button>
          </div>
        );
      
      case 3:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Step 3: 레이아웃 제안</h2>
            <p className="text-gray-600 mb-8">개발 진행 중...</p>
            <Button onClick={() => goToStep(2)}>이전 단계로</Button>
          </div>
        );
      
      case 4:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Step 4: 애니메이션/상호작용</h2>
            <p className="text-gray-600 mb-8">개발 진행 중...</p>
            <Button onClick={() => goToStep(3)}>이전 단계로</Button>
          </div>
        );
      
      case 5:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Step 5: 최종 프롬프트 생성</h2>
            <p className="text-gray-600 mb-8">개발 진행 중...</p>
            <Button onClick={() => goToStep(4)}>이전 단계로</Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-6" style={{ 
      backgroundColor: '#f5f5f7'
    }}>
      <div className="apple-grid">
        {/* Step Indicator - 2단계 이상일 때만 표시 */}
        {workflowState.currentStep > 1 && !isLoading && (
          <div className="col-span-12 mb-8">
            {renderStepIndicator()}
          </div>
        )}

        {/* Current Step Content */}
        <div className="col-span-12">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};