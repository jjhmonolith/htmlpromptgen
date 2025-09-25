import { useEffect, useRef, useCallback } from 'react';
import { projectService } from '../services/project.service';
import { Project } from '../types';
import { WorkflowState } from '../types/workflow.types';

interface UseAutoSaveOptions {
  enabled?: boolean;
  interval?: number; // 밀리초 단위 (기본값: 10초)
  immediate?: boolean; // 변경 시 즉시 저장 여부
  onSave?: (project: Project, workflowData?: WorkflowState) => void;
  onError?: (error: Error) => void;
}

export function useAutoSave(
  project: Project,
  workflowData?: WorkflowState | null,
  options: UseAutoSaveOptions = {}
) {
  const {
    enabled = true,
    interval = 10000, // 10초
    immediate = true,
    onSave,
    onError
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');
  const lastStepRef = useRef<number>(0);
  const isVisibleRef = useRef(true);

  // 현재 데이터의 해시 생성 (변경 감지용) - 타임스탬프 제외
  const getDataHash = useCallback((proj: Project, workflow?: WorkflowState | null): string => {
    const dataToHash = {
      project: {
        id: proj.id,
        name: proj.name,
        apiKey: proj.apiKey ? 'HAS_KEY' : 'NO_KEY', // 실제 키 값이 아닌 유무만
        currentStep: proj.currentStep,
        courseData: proj.courseData,
        generatedPrompt: proj.generatedPrompt
        // updatedAt, createdAt 제외 (항상 변경되므로)
      },
      workflow: workflow ? {
        currentStep: workflow.currentStep,
        step1: workflow.step1 ? {
          projectTitle: workflow.step1.projectTitle,
          targetAudience: workflow.step1.targetAudience,
          layoutMode: workflow.step1.layoutMode,
          contentMode: workflow.step1.contentMode,
          pages: workflow.step1.pages?.map(p => ({id: p.id, topic: p.topic, description: p.description})),
          suggestions: workflow.step1.suggestions && workflow.step1.suggestions.length > 0 && workflow.step1.suggestions[0].trim() 
            ? workflow.step1.suggestions 
            : null // 빈 값은 null로 통일
          // createdAt 제외
        } : null,
        step2: workflow.step2,
        step3: workflow.step3,
        step4: workflow.step4,
        step5: workflow.step5
        // lastSaved 제외
      } : null
    };
    return JSON.stringify(dataToHash);
  }, []);

  // 실제 저장 함수
  const performSave = useCallback(async (proj: Project, workflow?: WorkflowState | null) => {
    try {
      // 프로젝트 메타데이터 저장
      projectService.updateProject(proj);
      
      // 워크플로우 데이터 저장
      if (workflow) {
        projectService.saveWorkflowData(proj.id, workflow);
      }
      
      onSave?.(proj, workflow || undefined);
      
      // 저장 완료 로그 간소화 (Step 변경 시에만)
      const currentStep = workflow?.currentStep || 0;
      if (currentStep !== lastStepRef.current) {
        console.log('💾 자동 저장:', proj.name, '- Step', currentStep);
        lastStepRef.current = currentStep;
      }
    } catch (error) {
      console.error('❌ 자동 저장 실패:', error);
      onError?.(error as Error);
    }
  }, [onSave, onError]);

  // 변경 감지 및 저장
  const checkAndSave = useCallback(() => {
    if (!enabled || !isVisibleRef.current) return;

    const currentHash = getDataHash(project, workflowData);
    
    // 데이터가 변경된 경우에만 저장 (해시가 비어있지 않은 경우에만)
    if (currentHash && currentHash !== lastSaveRef.current) {
      const oldHash = lastSaveRef.current;
      lastSaveRef.current = currentHash;
      
      // 첫 번째 저장이 아닌 경우에만 실제 저장 수행
      if (oldHash !== '') {
        performSave(project, workflowData);
      }
    }
  }, [enabled, project, workflowData, getDataHash, performSave]);

  // 브라우저 탭 가시성 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (isVisibleRef.current) {
        // 탭이 활성화될 때 즉시 한 번 확인
        setTimeout(checkAndSave, 1000);
      }
      // 탭 가시성 변경 로그 제거 (불필요)
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkAndSave]);

  // 즉시 저장 (데이터 변경 시)
  useEffect(() => {
    if (!enabled || !immediate) return;

    const currentHash = getDataHash(project, workflowData);
    
    // 해시가 있고, 이전과 다르며, 첫 번째 로딩이 아닌 경우에만 저장
    if (currentHash && currentHash !== lastSaveRef.current && lastSaveRef.current !== '') {
      lastSaveRef.current = currentHash;
      
      // 약간의 디바운스 (연속적인 변경 시 마지막 것만 저장)
      const timeoutId = setTimeout(() => {
        performSave(project, workflowData);
      }, 500); // 0.5초 디바운스

      return () => clearTimeout(timeoutId);
    } else if (currentHash && lastSaveRef.current === '') {
      // 첫 번째 로딩 시에는 해시만 저장하고 실제 저장은 하지 않음
      lastSaveRef.current = currentHash;
    }
  }, [enabled, immediate, project, workflowData, getDataHash, performSave]);

  // 정기 저장 interval 설정
  useEffect(() => {
    if (!enabled) return;

    // 자동 저장 활성화 로그 제거 (한 번만 필요)
    
    intervalRef.current = setInterval(() => {
      checkAndSave();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        // 자동 저장 정리 로그 제거
      }
    };
  }, [enabled, interval, checkAndSave]);

  // 페이지 이탈 시 마지막 저장
  useEffect(() => {
    const handleBeforeUnload = (_event: BeforeUnloadEvent) => {
      const currentHash = getDataHash(project, workflowData);
      if (currentHash !== lastSaveRef.current) {
        // 동기적으로 마지막 저장 시도
        try {
          projectService.updateProject(project);
          if (workflowData) {
            projectService.saveWorkflowData(project.id, workflowData);
          }
          // 페이지 이탈 시 저장 로그 제거
        } catch (error) {
          console.error('❌ 페이지 이탈 시 저장 실패:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [project, workflowData, getDataHash]);

  // 수동 저장 함수 반환
  const forceSave = useCallback(() => {
    performSave(project, workflowData);
    lastSaveRef.current = getDataHash(project, workflowData);
  }, [project, workflowData, performSave, getDataHash]);

  return {
    forceSave,
    lastSaveTime: lastSaveRef.current ? new Date() : null
  };
}