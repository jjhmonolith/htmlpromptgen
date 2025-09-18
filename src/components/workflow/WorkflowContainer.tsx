import React, { useState, useEffect } from 'react';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2VisualIdentity } from './Step2VisualIdentity/Step2VisualIdentity';
import { Step3IntegratedDesign } from './Step3IntegratedDesign';
import { Step4DesignSpecification } from './Step4DesignSpecification';
import { Step5FinalPrompt } from './Step5FinalPrompt';
import { GNB } from '../common';
import { loadFromStorage, saveToStorage } from '../../services/storage.service';

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

  // 패스트트랙 상태 관리
  const [isFastTrackMode, setIsFastTrackMode] = useState(false);
  const [fastTrackData, setFastTrackData] = useState<any>(null);

  // 앞선 단계 수정 시 뒷 단계 초기화하는 함수
  const resetLaterSteps = (fromStep: number) => {
    const updatedData = { ...workflowData };
    for (let i = fromStep + 1; i <= 5; i++) {
      updatedData[`step${i}` as keyof typeof updatedData] = null;
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
          // 워크플로우 데이터 복원 로그 간소화
          
          const restoredData = {
            step1: savedWorkflowData.step1 || null,
            step2: savedWorkflowData.step2 || null,
            step3: savedWorkflowData.step3 || null,
            step4: savedWorkflowData.step4 || null,
            step5: savedWorkflowData.step5 || null
          };
          
          setWorkflowData(restoredData);
          setCurrentStep(savedWorkflowData.currentStep || 1);
          
          // 부모에게도 복원된 데이터 전달
          onWorkflowDataChange?.({
            ...restoredData,
            currentStep: savedWorkflowData.currentStep || 1
          });
          
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

  // 패스트트랙 시작 핸들러
  const handleFastTrack = async (data: any) => {
    setIsFastTrackMode(true);
    setFastTrackData(data);

    // Step1 데이터 저장
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

    // 패스트트랙 자동 진행 시작
    await runFastTrackSequence(data);
  };

  // 패스트트랙 자동 진행 시퀀스
  const runFastTrackSequence = async (initialData: any) => {
    try {
      let currentData = initialData;

      // Step 2: 비주얼 아이덴티티 자동 생성
      console.log('🚀 Step 2 자동 진행 시작');
      // TODO: Step2 자동 생성 로직 구현
      await new Promise(resolve => setTimeout(resolve, 2000)); // 임시 딜레이

      // Step 3: 교육 콘텐츠 설계 자동 생성
      console.log('🚀 Step 3 자동 진행 시작');
      setCurrentStep(3);
      // TODO: Step3 자동 생성 로직 구현
      await new Promise(resolve => setTimeout(resolve, 2000)); // 임시 딜레이

      // Step 4: 디자인 명세 자동 생성
      console.log('🚀 Step 4 자동 진행 시작');
      setCurrentStep(4);
      // TODO: Step4 자동 생성 로직 구현
      await new Promise(resolve => setTimeout(resolve, 2000)); // 임시 딜레이

      // Step 5: 최종 프롬프트 자동 생성
      console.log('🚀 Step 5 자동 진행 시작');
      setCurrentStep(5);
      // TODO: Step5 자동 생성 로직 구현
      await new Promise(resolve => setTimeout(resolve, 2000)); // 임시 딜레이

      console.log('🎉 패스트트랙 완료!');
      setIsFastTrackMode(false);

    } catch (error) {
      console.error('❌ 패스트트랙 진행 중 오류:', error);
      setIsFastTrackMode(false);
      alert('패스트트랙 진행 중 오류가 발생했습니다. 수동으로 진행해주세요.');
    }
  };

  // Step1 실시간 데이터 변경 처리
  const handleStep1DataChange = (partialData: any) => {
    // 기존 Step1 데이터와 비교하여 실제로 변경되었는지 확인
    const currentStep1Hash = JSON.stringify(workflowData.step1);
    const newStep1Hash = JSON.stringify(partialData);
    
    let updatedWorkflowData;
    
    // 실제로 Step1 데이터가 변경된 경우에만 뒷 단계 초기화
    if (currentStep1Hash !== newStep1Hash && workflowData.step1) {
      console.log('🔄 Step1 데이터 변경 감지 - 뒷 단계 초기화');
      const resetData = resetLaterSteps(1);
      updatedWorkflowData = {
        ...resetData,
        step1: partialData,
        currentStep: currentStep
      };
    } else {
      // 데이터 변경이 없거나 최초 로드인 경우 뒷 단계 유지
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
    
    // 실제로 Step2 데이터가 변경된 경우에만 뒷 단계 초기화
    if (currentStep2Hash !== newStep2Hash && workflowData.step2) {
      console.log('🔄 Step2 데이터 변경 감지 - 뒷 단계 초기화');
      const resetData = resetLaterSteps(2);
      updatedWorkflowData = {
        ...resetData,
        step2: partialData,
        currentStep: currentStep
      };
    } else {
      // 데이터 변경이 없거나 최초 로드인 경우 뒷 단계 유지
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
    const newWorkflowData = {
      ...workflowData,
      step3: data,
      currentStep: 4, // Step 4로 이동
      stepCompletion: {
        ...workflowData.stepCompletion,
        step3: true
      }
    };
    setWorkflowData(newWorkflowData);
    setCurrentStep(4); // Step 4로 이동

    // 부모에게 워크플로우 데이터 변경 알림
    onWorkflowDataChange?.(newWorkflowData);
  };

  // Step3 실시간 데이터 변경 처리
  const handleStep3DataChange = (partialData: any) => {
    // 기존 Step3 데이터와 비교하여 실제로 변경되었는지 확인
    const currentStep3Hash = JSON.stringify(workflowData.step3);
    const newStep3Hash = JSON.stringify(partialData);
    
    let updatedWorkflowData;
    
    // 실제로 Step3 데이터가 변경된 경우에만 뒷 단계 초기화
    if (currentStep3Hash !== newStep3Hash && workflowData.step3) {
      console.log('🔄 Step3 데이터 변경 감지 - 뒷 단계 초기화');
      const resetData = resetLaterSteps(3);
      updatedWorkflowData = {
        ...resetData,
        step3: partialData,
        currentStep: currentStep
      };
    } else {
      // 데이터 변경이 없거나 최초 로드인 경우 뒷 단계 유지
      updatedWorkflowData = {
        ...workflowData,
        step3: partialData,
        currentStep: currentStep
      };
    }
    
    setWorkflowData(updatedWorkflowData);
    onWorkflowDataChange?.(updatedWorkflowData);
  };

  const handleStep4Complete = (data: any) => {
    const newWorkflowData = {
      ...workflowData,
      step4: data,
      currentStep: 5,
      stepCompletion: {
        ...workflowData.stepCompletion,
        step4: true
      }
    };
    setWorkflowData(newWorkflowData);
    setCurrentStep(5);

    // 부모에게 워크플로우 데이터 변경 알림
    onWorkflowDataChange?.(newWorkflowData);
  };

  // Step4 실시간 데이터 변경 처리
  const handleStep4DataChange = (partialData: any) => {
    // 기존 Step4 데이터와 비교하여 실제로 변경되었는지 확인
    const currentStep4Hash = JSON.stringify(workflowData.step4);
    const newStep4Hash = JSON.stringify(partialData);

    let updatedWorkflowData;

    // 실제로 Step4 데이터가 변경된 경우에만 뒷 단계 초기화
    if (currentStep4Hash !== newStep4Hash && workflowData.step4) {
      console.log('🔄 Step4 데이터 변경 감지 - 뒷 단계 초기화');
      const resetData = resetLaterSteps(4);
      updatedWorkflowData = {
        ...resetData,
        step4: partialData,
        currentStep: currentStep
      };
    } else {
      // 데이터 변경이 없거나 최초 로드인 경우 뒷 단계 유지
      updatedWorkflowData = {
        ...workflowData,
        step4: partialData,
        currentStep: currentStep
      };
    }

    setWorkflowData(updatedWorkflowData);
    onWorkflowDataChange?.(updatedWorkflowData);
  };

  const handleStep5Complete = (data: any) => {
    const newWorkflowData = {
      ...workflowData,
      step5: data,
      stepCompletion: {
        ...workflowData.stepCompletion,
        step5: true
      }
    };
    setWorkflowData(newWorkflowData);

    // 부모에게 워크플로우 데이터 변경 알림
    onWorkflowDataChange?.(newWorkflowData);
  };

  // Step5 실시간 데이터 변경 처리
  const handleStep5DataChange = (partialData: any) => {
    const updatedWorkflowData = {
      ...workflowData,
      step5: partialData,
      currentStep: currentStep
    };

    setWorkflowData(updatedWorkflowData);
    onWorkflowDataChange?.(updatedWorkflowData);
  };

  const getWorkflowSteps = () => [
    { num: 1, title: '학습 여정 설계', isCompleted: !!workflowData.step1 },
    { num: 2, title: '감성 무드 지휘', isCompleted: !!workflowData.step2 },
    { num: 3, title: '교육 콘텐츠 설계', isCompleted: !!workflowData.step3 },
    { num: 4, title: '디자인 명세', isCompleted: !!workflowData.step4 },
    { num: 5, title: '창작 브리프 생성', isCompleted: !!workflowData.step5 }
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
            onFastTrack={handleFastTrack}
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
          <Step3IntegratedDesign
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
        if (!workflowData.step1 || !workflowData.step2 || !workflowData.step3) {
          return (
            <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
              <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-12">
                <div className="text-center py-16">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">이전 단계를 완료해주세요</h2>
                  <p className="text-gray-600 mb-8">Step 4를 진행하려면 Step 1, 2, 3을 먼저 완료해야 합니다.</p>
                  <button
                    onClick={() => setCurrentStep(!workflowData.step1 ? 1 : !workflowData.step2 ? 2 : 3)}
                    className="px-8 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                  >
                    {!workflowData.step1 ? 'Step 1로 이동' : !workflowData.step2 ? 'Step 2로 이동' : 'Step 3로 이동'}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <Step4DesignSpecification
            initialData={workflowData.step4}
            projectData={workflowData.step1}
            visualIdentity={workflowData.step2.visualIdentity}
            step3Result={workflowData.step3}
            apiKey={apiKey || ''}
            onComplete={handleStep4Complete}
            onDataChange={handleStep4DataChange}
            onBack={() => setCurrentStep(3)}
            onGeneratingChange={setIsGenerating}
          />
        );

      case 5:
        if (!workflowData.step1 || !workflowData.step2 || !workflowData.step3 || !workflowData.step4) {
          return (
            <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
              <div className="max-w-4xl mx-auto px-4 xl:px-8 2xl:px-12 py-12">
                <div className="text-center py-16">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">이전 단계를 완료해주세요</h2>
                  <p className="text-gray-600 mb-8">Step 5를 진행하려면 Step 1, 2, 3, 4를 먼저 완료해야 합니다.</p>
                  <button
                    onClick={() => setCurrentStep(!workflowData.step1 ? 1 : !workflowData.step2 ? 2 : !workflowData.step3 ? 3 : 4)}
                    className="px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                  >
                    {!workflowData.step1 ? 'Step 1로 이동' :
                     !workflowData.step2 ? 'Step 2로 이동' :
                     !workflowData.step3 ? 'Step 3로 이동' : 'Step 4로 이동'}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <Step5FinalPrompt
            initialData={workflowData.step5}
            projectData={workflowData.step1}
            visualIdentity={workflowData.step2.visualIdentity}
            designTokens={workflowData.step2.designTokens}
            step3Result={workflowData.step3}
            step4Result={workflowData.step4}
            onComplete={handleStep5Complete}
            onDataChange={handleStep5DataChange}
            onBack={() => setCurrentStep(4)} // Step 4로 돌아가기
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
          // 패스트트랙 모드일 때는 스텝 이동 불가
          if (isFastTrackMode) return;

          // 완료된 단계로만 이동 가능 (현재 단계는 이동 불가)
          const targetStepData = workflowData[`step${step}` as keyof typeof workflowData];
          if (targetStepData && step !== currentStep) {
            setCurrentStep(step);
          }
        }}
        isGenerating={isGenerating || isFastTrackMode}
        isFastTrackMode={isFastTrackMode}
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