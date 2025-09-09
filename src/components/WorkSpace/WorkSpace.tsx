import React, { useState, useEffect, useRef } from 'react';
import { ApiKeyManager } from '../ApiKeyManager';
import { ResultDisplay } from '../ResultDisplay';
import { WorkflowContainer } from '../workflow';
import { AppleGrid, AppleGridItem, AppleCard, AppleButton } from '../apple';
import { GNB } from '../common';
import { Project } from '../../types';
import { FinalPrompt } from '../../types/workflow.types';
import { projectService } from '../../services/project.service';

interface WorkSpaceProps {
  project: Project;
  onBack: () => void;
}

export const WorkSpace: React.FC<WorkSpaceProps> = ({ project, onBack }) => {
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [apiKey, setApiKey] = useState<string | null>(project.apiKey || null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(project.generatedPrompt || null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  useEffect(() => {
    const saveProject = () => {
      projectService.updateProject(currentProject);
    };

    // Save immediately when project changes
    saveProject();

    // Set up auto-save every 30 seconds
    autoSaveIntervalRef.current = setInterval(() => {
      saveProject();
    }, 30000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [currentProject]);

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
      generatedPrompt: null,
      currentStep: 'course-input',
      hasModifications: false
    }));
  };

  const handleWorkflowComplete = (finalPrompt: FinalPrompt) => {
    setGeneratedPrompt(finalPrompt.htmlPrompt);
    setCurrentProject(prev => ({
      ...prev,
      generatedPrompt: finalPrompt.htmlPrompt,
      currentStep: 'result'
    }));
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
    
    // 5단계 워크플로우 사용
    return (
      <WorkflowContainer
        projectId={currentProject.id}
        onComplete={handleWorkflowComplete}
        onBack={onBack}
      />
    );
  };

  const getProgressPercentage = () => {
    const steps = ['api-key', 'course-input', 'workflow', 'result'];
    const currentIndex = steps.indexOf(currentProject.currentStep);
    return Math.max(0, (currentIndex / (steps.length - 1)) * 100);
  };

  const getStepName = () => {
    switch (currentProject.currentStep) {
      case 'api-key': return 'API 키 설정';
      case 'course-input': return '워크플로우 진행';
      case 'workflow': return '프롬프트 생성';
      case 'result': return '결과 확인';
      default: return '준비 중';
    }
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

  return (
    <>
      <GNB 
        onLogoClick={onBack} 
        projectName={currentProject.name || '새 프로젝트'}
        lastSaved={currentProject.updatedAt}
        currentStep={1}  // This should be from actual workflow state
        steps={getWorkflowSteps()}
      />
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