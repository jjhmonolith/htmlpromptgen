import React, { useState, useEffect } from 'react';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2VisualIdentity } from './Step2VisualIdentity';
import { Button, GNB } from '../common';
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
  projectName?: string;
  onComplete?: (finalPrompt: FinalPrompt) => void;
  onBack?: () => void;
}

export const WorkflowContainer: React.FC<WorkflowContainerProps> = ({
  projectId,
  projectName,
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

  // GNB용 워크플로우 스텝 생성
  const getWorkflowSteps = () => {
    return [
      { num: 1, title: '기본 정보', isCompleted: workflowState.stepCompletion.step1 },
      { num: 2, title: '비주얼 아이덴티티', isCompleted: workflowState.stepCompletion.step2 },
      { num: 3, title: '레이아웃 제안', isCompleted: workflowState.stepCompletion.step3 },
      { num: 4, title: '애니메이션/상호작용', isCompleted: workflowState.stepCompletion.step4 },
      { num: 5, title: '최종 프롬프트', isCompleted: workflowState.stepCompletion.step5 }
    ];
  };

  // GNB에서 스텝 클릭 처리
  const handleStepClick = (stepNum: number) => {
    // 완료된 스텝이나 현재 스텝으로만 이동 가능
    if (stepNum <= workflowState.currentStep || workflowState.stepCompletion[`step${stepNum}` as keyof typeof workflowState.stepCompletion]) {
      goToStep(stepNum as 1 | 2 | 3 | 4 | 5);
    }
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
    <>
      <GNB 
        onLogoClick={onBack} 
        projectName={projectName || '새 프로젝트'}
        lastSaved={new Date()}
        currentStep={workflowState.currentStep}
        steps={getWorkflowSteps()}
        onStepClick={handleStepClick}
      />
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
    </>
  );
};