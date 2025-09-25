import React, { useState, useEffect } from 'react';
import { ApiKeyManager } from '../ApiKeyManager';
import { ResultDisplay } from '../ResultDisplay';
import { WorkflowContainer } from '../workflow';
import { AppleGrid, AppleGridItem } from '../apple';
import { GNB, ErrorBoundary } from '../common';
import { Project } from '../../types';
import { projectService } from '../../services/project.service';
import { useAutoSave } from '../../hooks/useAutoSave';
import { WorkflowState } from '../../types/workflow.types';

interface WorkSpaceProps {
  project: Project;
  onBack: () => void;
}

export const WorkSpace: React.FC<WorkSpaceProps> = ({ project, onBack }) => {
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [apiKey, setApiKey] = useState<string | null>(project.apiKey || null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(project.generatedPrompt || null);
  const [workflowData, setWorkflowData] = useState<WorkflowState | null>(null);
  
  // 워크플로우 데이터 로드
  useEffect(() => {
    const loadedWorkflowData = projectService.loadWorkflowData(currentProject.id);
    setWorkflowData(loadedWorkflowData);
  }, [currentProject.id]);

  // 개선된 자동 저장 시스템
  const { } = useAutoSave(currentProject, workflowData, {
    enabled: true,
    interval: 10000, // 10초
    immediate: true,
    onSave: (project, workflow) => {
      // 자동 저장 성공 시 로그 간소화 (중요한 변경사항만)
      if (workflow?.currentStep && workflow.currentStep > 1) {
        console.log('💾', project.name, '- Step', workflow.currentStep);
      }
    },
    onError: (error) => {
      console.error('🚨 자동 저장 오류:', error);
      // TODO: 사용자에게 알림 표시
    }
  });

  const handleKeyValidated = (key: string) => {
    setApiKey(key);
    setCurrentProject(prev => ({
      ...prev,
      apiKey: key,
      currentStep: 'course-input'
    }));
  };

  const handleReset = () => {
    setGeneratedPrompt(null);
    setCurrentProject(prev => ({
      ...prev,
      generatedPrompt: undefined,
      currentStep: 'course-input',
      hasModifications: false
    }));
  };

  const handleWorkflowComplete = (finalPrompt: any) => {
    setGeneratedPrompt(finalPrompt);
    setCurrentProject(prev => ({
      ...prev,
      generatedPrompt: finalPrompt,
      currentStep: 'result'
    }));
  };

  // 워크플로우 데이터 변경 처리 (제목 동기화 포함)
  const handleWorkflowDataChange = (newWorkflowData: WorkflowState) => {
    setWorkflowData(newWorkflowData);
    
    // Step1에서 프로젝트 제목이 변경된 경우 프로젝트 제목 동기화
    if (newWorkflowData.step1?.projectTitle) {
      const newTitle = newWorkflowData.step1.projectTitle.trim();
      if (newTitle && newTitle !== currentProject.name) {
        // 프로젝트 제목 동기화 로그 제거
        setCurrentProject(prev => ({
          ...prev,
          name: newTitle
        }));
      }
    }
  };

  const getCurrentView = () => {
    if (!apiKey || currentProject.currentStep === 'api-key') {
      return <ApiKeyManager onKeyValidated={handleKeyValidated} />;
    }
    
    if (generatedPrompt || currentProject.currentStep === 'result') {
      return (
        <ResultDisplay 
          prompt={generatedPrompt || currentProject.generatedPrompt || ''}
          metadata={{
            generatedAt: new Date(),
            subject: currentProject.courseData.subject
          }}
          onReset={handleReset}
        />
      );
    }
    
    // 단순화된 워크플로우
    return (
      <ErrorBoundary 
        enableRecovery={true}
        onError={(error, errorInfo) => {
          console.error('Workflow error:', error, errorInfo);
        }}
      >
        <WorkflowContainer
          projectId={currentProject.id}
          projectName={currentProject.name}
          apiKey={apiKey}
          onComplete={handleWorkflowComplete}
          onBack={onBack}
          onWorkflowDataChange={handleWorkflowDataChange}
        />
      </ErrorBoundary>
    );
  };


  // Get workflow steps for GNB
  const getWorkflowSteps = () => {
    const workflowSteps = [
      { num: 1, title: '기본 정보', isCompleted: false },
      { num: 2, title: '비주얼 아이덴티티', isCompleted: false },
      { num: 3, title: '레이아웃 제안', isCompleted: false },
      { num: 4, title: '애니메이션/상호작용', isCompleted: false },
      { num: 5, title: '최종 프롬프트', isCompleted: false }
    ];

    // This is a simplified version - in real implementation, 
    // you'd get the actual completion status from workflowState
    return workflowSteps;
  };

  const isWorkflowView = currentProject.currentStep === 'course-input' && !generatedPrompt;

  return (
    <>
      {/* Only show GNB when not in workflow view (WorkflowContainer handles its own GNB) */}
      {!isWorkflowView && (
        <GNB 
          onLogoClick={onBack} 
          projectName={currentProject.name || '새 프로젝트'}
          lastSaved={currentProject.updatedAt}
          currentStep={1}  // This should be from actual workflow state
          steps={getWorkflowSteps()}
        />
      )}
      <div className="min-h-screen py-6" style={{ 
        backgroundColor: '#f5f5f7'
      }}>
        <AppleGrid>

        {/* Main Content Area */}
        <AppleGridItem span={12}>
          <div className="transition-all duration-300 ease-in-out">
            {getCurrentView()}
          </div>
        </AppleGridItem>
        </AppleGrid>
      </div>
    </>
  );
};