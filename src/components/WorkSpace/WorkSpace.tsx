import React, { useState, useEffect, useRef } from 'react';
import { ApiKeyManager } from '../ApiKeyManager';
import { ResultDisplay } from '../ResultDisplay';
import { WorkflowContainer } from '../workflow';
import { Button } from '../common';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="secondary"
                size="sm"
              >
                ← 홈으로
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentProject.name}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                자동 저장됨
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto">
          {getCurrentView()}
        </main>
      </div>
    </div>
  );
};