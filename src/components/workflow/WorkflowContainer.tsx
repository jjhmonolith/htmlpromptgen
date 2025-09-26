import React, { useState, useEffect } from 'react';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2VisualIdentity } from './Step2VisualIdentity/Step2VisualIdentity';
import { Step3EducationalDesign } from './Step3EducationalDesign';
import { Step5FinalPrompt } from './Step5FinalPrompt';
import { GNB } from '../common';
// import { loadFromStorage, saveToStorage } from '../../services/storage.service';

interface WorkflowContainerProps {
  projectId: string;
  projectName?: string;
  apiKey?: string;
  onComplete?: (finalPrompt: any) => void;
  onBack?: () => void;
  onWorkflowDataChange?: (workflowData: any) => void;
}

export const WorkflowContainer: React.FC<WorkflowContainerProps> = ({
  projectId,
  projectName,
  apiKey,
  onBack,
  onWorkflowDataChange
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowData, setWorkflowData] = useState<any>({
    step1: null,
    step2: null,
    step3: null,
    step4: null,
    step5: null,
    currentStep: 1,
    stepCompletion: {
      step1: false,
      step2: false,
      step3: false,
      step4: false,
      step5: false
    }
  });


  // 앞선 단계 수정 시 뒷 단계 초기화하는 함수 (4단계 기준으로 수정)
  const resetLaterSteps = (fromStep: number) => {
    const updatedData = { ...workflowData };
    const resetSteps: string[] = [];

    // 4단계까지만 초기화 (Step4-5가 통합되어 실질적으로 4단계)
    for (let i = fromStep + 1; i <= 4; i++) {
      if (i === 4) {
        // Step4가 통합된 최종 단계이므로 step4와 step5 모두 초기화
        if (updatedData.step4 || updatedData.step5) {
          updatedData.step4 = null;
          updatedData.step5 = null;
          resetSteps.push('Step4', 'Step5');
          // stepCompletion도 함께 초기화
          updatedData.stepCompletion = {
            ...updatedData.stepCompletion,
            step4: false,
            step5: false
          };
        }
      } else {
        // Step 2, 3 초기화
        const stepKey = `step${i}` as keyof typeof updatedData;
        if (updatedData[stepKey]) {
          updatedData[stepKey] = null;
          resetSteps.push(`Step${i}`);
          // stepCompletion도 함께 초기화
          updatedData.stepCompletion = {
            ...updatedData.stepCompletion,
            [`step${i}`]: false
          };
        }
      }
    }

    if (resetSteps.length > 0) {
      console.log(`🗑️ Step${fromStep} 수정으로 ${resetSteps.join(', ')} 데이터 초기화됨`);
    } else {
      console.log(`✅ Step${fromStep} 수정 - 초기화할 뒷 단계 없음`);
    }

    return updatedData;
  };

  // 프로젝트의 워크플로우 데이터 로드 (무한루프 방지)
  useEffect(() => {
    const loadWorkflowData = async () => {
      try {
        // 워크플로우 데이터 로딩 로그 제거 (불필요)
        const { projectService } = await import('../../services/project.service');
        const savedWorkflowData = projectService.loadWorkflowData(projectId);
        
        if (savedWorkflowData) {
          // 워크플로우 데이터 복원 시 stepCompletion도 함께 복원
          const restoredData = {
            step1: savedWorkflowData.step1 || null,
            step2: savedWorkflowData.step2 || null,
            step3: savedWorkflowData.step3 || null,
            step4: savedWorkflowData.step4 || null,
            step5: savedWorkflowData.step5 || null,
            currentStep: savedWorkflowData.currentStep || 1,
            stepCompletion: {
              step1: !!savedWorkflowData.step1,
              step2: !!savedWorkflowData.step2,
              step3: !!savedWorkflowData.step3,
              step4: !!savedWorkflowData.step4,
              step5: !!savedWorkflowData.step5
            }
          };

          console.log('📂 워크플로우 데이터 복원:', {
            currentStep: restoredData.currentStep,
            completedSteps: Object.entries(restoredData.stepCompletion)
              .filter(([_, isCompleted]) => isCompleted)
              .map(([step, _]) => step)
          });

          setWorkflowData(restoredData);
          setCurrentStep(savedWorkflowData.currentStep || 1);

          // 부모에게도 복원된 데이터 전달
          onWorkflowDataChange?.(restoredData);
          
          // Step1 초기 데이터 로그 제거
        } else {
          // 새로운 워크플로우 시작 로그 제거
        }
      } catch (error) {
        console.error('❌ 워크플로우 데이터 로딩 실패:', error);
      }
    };

    loadWorkflowData();
  }, [projectId]); // onWorkflowDataChange 제거로 무한루프 방지

  const handleStep1Complete = (data: any) => {
    const newWorkflowData = { 
      ...workflowData, 
      step1: data, 
      currentStep: 2,
      stepCompletion: {
        ...workflowData.stepCompletion,
        step1: true
      }
    };
    setWorkflowData(newWorkflowData);
    setCurrentStep(2);
    
    // 부모에게 워크플로우 데이터 변경 알림
    onWorkflowDataChange?.(newWorkflowData);
  };


  // Step1 실시간 데이터 변경 처리
  const handleStep1DataChange = (partialData: any) => {
    // 기존 Step1 데이터와 비교하여 실제로 변경되었는지 확인
    const currentStep1Hash = JSON.stringify(workflowData.step1);
    const newStep1Hash = JSON.stringify(partialData);

    let updatedWorkflowData;

    // Step1이 이미 존재하고 실제로 변경된 경우에만 뒷 단계 초기화
    if (currentStep1Hash !== newStep1Hash && workflowData.step1 &&
        (workflowData.step2 || workflowData.step3 || workflowData.step4 || workflowData.step5)) {
      console.log('🔄 Step1 데이터 변경 감지 - 뒷 단계 초기화');
      const resetData = resetLaterSteps(1);
      updatedWorkflowData = {
        ...resetData,
        step1: partialData,
        currentStep: currentStep
      };
    } else {
      // 데이터 변경이 없거나 최초 로드인 경우, 또는 뒷 단계가 없는 경우 뒷 단계 유지
      updatedWorkflowData = {
        ...workflowData,
        step1: partialData,
        currentStep: currentStep
      };
    }

    setWorkflowData(updatedWorkflowData);

    // 부모에게 실시간 변경 알림
    onWorkflowDataChange?.(updatedWorkflowData);
  };

  const handleStep2Complete = (data: any) => {
    const newWorkflowData = { 
      ...workflowData, 
      step2: data, 
      currentStep: 3,
      stepCompletion: {
        ...workflowData.stepCompletion,
        step2: true
      }
    };
    setWorkflowData(newWorkflowData);
    setCurrentStep(3);
    
    // 부모에게 워크플로우 데이터 변경 알림
    onWorkflowDataChange?.(newWorkflowData);
  };

  // Step2 실시간 데이터 변경 처리
  const handleStep2DataChange = (partialData: any) => {
    // 기존 Step2 데이터와 비교하여 실제로 변경되었는지 확인
    const currentStep2Hash = JSON.stringify(workflowData.step2);
    const newStep2Hash = JSON.stringify(partialData);

    let updatedWorkflowData;

    // Step2가 이미 존재하고 실제로 변경된 경우에만 뒷 단계 초기화
    if (currentStep2Hash !== newStep2Hash && workflowData.step2 &&
        (workflowData.step3 || workflowData.step4 || workflowData.step5)) {
      console.log('🔄 Step2 데이터 변경 감지 - 뒷 단계 초기화');
      const resetData = resetLaterSteps(2);
      updatedWorkflowData = {
        ...resetData,
        step2: partialData,
        currentStep: currentStep
      };
    } else {
      // 데이터 변경이 없거나 최초 로드인 경우, 또는 뒷 단계가 없는 경우 뒷 단계 유지
      updatedWorkflowData = {
        ...workflowData,
        step2: partialData,
        currentStep: currentStep
      };
    }

    setWorkflowData(updatedWorkflowData);
    onWorkflowDataChange?.(updatedWorkflowData);
  };

  const handleStep3Complete = (data: any) => {
    console.log('🎯 Step3 완료 처리 시작:', {
      step3데이터: !!data,
      step3페이지수: data?.pages?.length,
      현재단계: currentStep,
      기존step4: !!workflowData.step4,
      기존step5: !!workflowData.step5
    });

    // Step3 완료 시 Step4/5 강제 초기화하고 Step4로 이동
    const newWorkflowData = {
      ...workflowData,
      step3: data,
      step4: null, // 강제 초기화
      step5: null, // 강제 초기화
      currentStep: 4, // 통합된 Step4로 이동 (실제로는 Step4-5 통합 실행)
      stepCompletion: {
        ...workflowData.stepCompletion,
        step3: true,
        step4: false, // 초기화
        step5: false  // 초기화
      }
    };
    setWorkflowData(newWorkflowData);
    setCurrentStep(4);

    console.log('✅ Step3 완료 → Step4 전환 완료 (Step4/5 강제 초기화):', {
      새로운단계: 4,
      step3완료상태: true,
      step4초기화: true,
      step5초기화: true,
      워크플로우데이터업데이트: '완료'
    });

    // 부모에게 워크플로우 데이터 변경 알림
    onWorkflowDataChange?.(newWorkflowData);
  };

  // Step3 실시간 데이터 변경 처리
  const handleStep3DataChange = (partialData: any) => {
    // 기존 Step3 데이터와 비교하여 실제로 변경되었는지 확인
    const currentStep3Hash = JSON.stringify(workflowData.step3);
    const newStep3Hash = JSON.stringify(partialData);

    let updatedWorkflowData;

    // Step3이 이미 존재하고 실제로 변경된 경우에만 뒷 단계 초기화
    if (currentStep3Hash !== newStep3Hash && workflowData.step3 &&
        (workflowData.step4 || workflowData.step5)) {
      console.log('🔄 Step3 데이터 변경 감지 - 뒷 단계 초기화');
      const resetData = resetLaterSteps(3);
      updatedWorkflowData = {
        ...resetData,
        step3: partialData,
        currentStep: currentStep
      };
    } else {
      // 데이터 변경이 없거나 최초 로드인 경우, 또는 뒷 단계가 없는 경우 뒷 단계 유지
      updatedWorkflowData = {
        ...workflowData,
        step3: partialData,
        currentStep: currentStep
      };
    }

    setWorkflowData(updatedWorkflowData);
    onWorkflowDataChange?.(updatedWorkflowData);
  };

  // Step5 실시간 데이터 변경 처리 (마지막 스텝이므로 뒷 단계 초기화 불필요)
  const handleStep5DataChange = (partialData: any) => {
    console.log('🔄 Step5 데이터 변경:', { partialData });

    const updatedWorkflowData = {
      ...workflowData,
      step5: partialData,
      currentStep: currentStep
    };

    setWorkflowData(updatedWorkflowData);
    onWorkflowDataChange?.(updatedWorkflowData);
  };

  // 통합된 Step4 완료 핸들러 (기존 Step4+Step5 데이터 모두 처리)
  const handleIntegratedStep4Complete = (data: any) => {
    console.log('🎉 Step4-5 통합 완료 데이터:', data);

    // 통합 서비스에서 step4Result와 step5Result 모두 반환
    const { step4Result, step5Result } = data;

    const newWorkflowData = {
      ...workflowData,
      step4: step4Result,
      step5: step5Result,
      stepCompletion: {
        ...workflowData.stepCompletion,
        step4: true,
        step5: true
      }
    };
    setWorkflowData(newWorkflowData);

    // 부모에게 워크플로우 데이터 변경 알림
    onWorkflowDataChange?.(newWorkflowData);
  };


  const getWorkflowSteps = () => [
    { num: 1, title: '학습 여정 설계', isCompleted: !!workflowData.step1 },
    { num: 2, title: '감성 무드 지휘', isCompleted: !!workflowData.step2 },
    { num: 3, title: '교육 콘텐츠 설계', isCompleted: !!workflowData.step3 },
    { num: 4, title: '창작 브리프 생성', isCompleted: !!workflowData.step5 }
  ];

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            initialData={workflowData.step1}
            onComplete={handleStep1Complete}
            onBack={onBack}
            onDataChange={handleStep1DataChange}
          />
        );
      
      case 2:
        return (
          <Step2VisualIdentity
            initialData={workflowData.step2}
            projectData={workflowData.step1}
            apiKey={apiKey || ''}
            onComplete={handleStep2Complete}
            onDataChange={handleStep2DataChange}
            onBack={() => setCurrentStep(1)}
            onGeneratingChange={setIsGenerating}
          />
        );
      
      case 3:
        if (!workflowData.step1 || !workflowData.step2) {
          return (
            <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
              <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-12">
                <div className="text-center py-16">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">이전 단계를 완료해주세요</h2>
                  <p className="text-gray-600 mb-8">Step 3을 진행하려면 Step 1과 Step 2를 먼저 완료해야 합니다.</p>
                  <button
                    onClick={() => setCurrentStep(workflowData.step1 ? 2 : 1)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    {workflowData.step1 ? 'Step 2로 이동' : 'Step 1로 이동'}
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <Step3EducationalDesign
            initialData={workflowData.step3}
            projectData={workflowData.step1}
            visualIdentity={workflowData.step2.visualIdentity}
            apiKey={apiKey || ''}
            onComplete={handleStep3Complete}
            onDataChange={handleStep3DataChange}
            onBack={() => setCurrentStep(2)}
            onGeneratingChange={setIsGenerating}
          />
        );

      case 4:
        // 통합된 Step4 (기존 Step4+Step5 로직 통합 실행)
        if (!workflowData.step1 || !workflowData.step2 || !workflowData.step3) {
          return (
            <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
              <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-12">
                <div className="text-center py-16">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">이전 단계를 완료해주세요</h2>
                  <p className="text-gray-600 mb-8">최종 단계를 진행하려면 Step 1, 2, 3을 먼저 완료해야 합니다.</p>
                  <button
                    onClick={() => setCurrentStep(!workflowData.step1 ? 1 : !workflowData.step2 ? 2 : 3)}
                    className="px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                  >
                    {!workflowData.step1 ? 'Step 1로 이동' : !workflowData.step2 ? 'Step 2로 이동' : 'Step 3로 이동'}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // 통합된 Step5 컴포넌트를 사용하되, 내부적으로는 Step4-5 로직이 모두 실행됨
        return (
          <Step5FinalPrompt
            initialData={workflowData.step5}
            projectData={workflowData.step1}
            visualIdentity={workflowData.step2.visualIdentity}
            designTokens={workflowData.step2.designTokens}
            step3Result={workflowData.step3}
            step4Result={workflowData.step4} // 통합 서비스에서 생성된 Step4 결과
            onComplete={handleIntegratedStep4Complete}
            onDataChange={handleStep5DataChange}
            onBack={() => setCurrentStep(3)} // Step 3으로 돌아가기 (Step 4는 더 이상 없음)
            onGeneratingChange={setIsGenerating} // GNB 애니메이션 상태 전달
          />
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">알 수 없는 단계</h2>
            <p className="text-gray-600">현재 단계: {currentStep}</p>
          </div>
        );
    }
  };

  return (
    <>
      <GNB
        onLogoClick={onBack}
        projectName={projectName || '새 프로젝트'}
        lastSaved={new Date()}
        currentStep={currentStep}
        steps={getWorkflowSteps()}
        onStepClick={(step) => {
          // 완료된 단계로만 이동 가능 (현재 단계는 이동 불가)
          const targetStepData = workflowData[`step${step}` as keyof typeof workflowData];
          if (targetStepData && step !== currentStep) {
            setCurrentStep(step);
          }
        }}
        isGenerating={isGenerating}
      />
      <div className="min-h-screen py-6" style={{ 
        backgroundColor: '#f5f5f7'
      }}>
        <div className="apple-grid">
          <div className="col-span-12">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </>
  );
};