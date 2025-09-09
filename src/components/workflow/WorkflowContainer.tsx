import React, { useState, useEffect } from 'react';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Button } from '../common';
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

  // 자동 저장
  useEffect(() => {
    const saveWorkflow = () => {
      localStorage.setItem(`workflow_${projectId}`, JSON.stringify(workflowState));
    };
    
    const interval = setInterval(saveWorkflow, 30000); // 30초마다 저장
    saveWorkflow(); // 즉시 저장
    
    return () => clearInterval(interval);
  }, [workflowState, projectId]);

  // 불러오기
  useEffect(() => {
    const savedWorkflow = localStorage.getItem(`workflow_${projectId}`);
    if (savedWorkflow) {
      try {
        const parsed = JSON.parse(savedWorkflow);
        setWorkflowState(parsed);
      } catch (error) {
        console.error('Failed to load workflow state:', error);
      }
    }
  }, [projectId]);

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

  const handleStep3Complete = (data: LayoutProposal[]) => {
    setWorkflowState(prev => ({
      ...prev,
      layoutProposals: data,
      stepCompletion: { ...prev.stepCompletion, step3: true },
      currentStep: 4
    }));
  };

  const handleStep4Complete = (data: PageEnhancement[]) => {
    setWorkflowState(prev => ({
      ...prev,
      pageEnhancements: data,
      stepCompletion: { ...prev.stepCompletion, step4: true },
      currentStep: 5
    }));
  };

  const handleStep5Complete = (data: FinalPrompt) => {
    setWorkflowState(prev => ({
      ...prev,
      finalPrompt: data,
      stepCompletion: { ...prev.stepCompletion, step5: true }
    }));
    
    if (onComplete) {
      onComplete(data);
    }
  };

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
      </div>
    );
  };

  const renderCurrentStep = () => {
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
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Step 2: 비주얼 아이덴티티</h2>
            <p className="text-gray-600 mb-8">개발 진행 중...</p>
            <Button onClick={() => goToStep(1)}>이전 단계로</Button>
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
        {/* Current Step Content */}
        <div className="col-span-12">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};