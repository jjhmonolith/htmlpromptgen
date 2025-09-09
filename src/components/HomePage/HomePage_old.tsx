import React from 'react';
import { Button, Card } from '../common';

interface HomePageProps {
  onNewProject: () => void;
  onExistingProjects: () => void;
}

export const import React from 'react';
import { AppleGrid, AppleGridItem, AppleCard, AppleButton } from '../apple';

interface HomePageProps {
  onNewProject: () => void;
  onExistingProjects: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNewProject, onExistingProjects }) => {
  return (
    <div className="min-h-screen py-12">
      <AppleGrid>
        {/* Hero Section */}
        <AppleGridItem span={12}>
          <AppleCard
            size="hero"
            variant="strong"
            className="mb-16"
            padding="lg"
          >
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="mb-8">
                <img 
                  src="/codle-logo.svg" 
                  alt="Logo" 
                  className="w-24 h-24 mx-auto mb-6 opacity-90" 
                />
                <h1 className="text-display-large text-gray-900 mb-4">
                  교안 프롬프트 생성기
                </h1>
                <p className="text-xl font-medium text-gray-700 max-w-2xl">
                  Claude Code와 AI 기술을 활용하여 맞춤형 교육 콘텐츠 프롬프트를 
                  자동으로 생성하는 혁신적인 플랫폼
                </p>
              </div>
            </div>
          </AppleCard>
        </AppleGridItem>

        {/* Main Action Cards */}
        <AppleGridItem span={6}>
          <AppleCard
            size="large"
            variant="glass"
            title="새 프로젝트 시작"
            description="AI 기반 5단계 워크플로우로 전문적인 교안 프롬프트를 생성하세요"
            onClick={onNewProject}
            className="group"
            padding="lg"
          >
            <div className="absolute top-8 right-8">
              <div className="w-16 h-16 bg-apple-blue/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-apple-blue/30 transition-apple">
                <svg className="w-8 h-8 text-apple-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            
            <div className="mt-auto">
              <AppleButton 
                variant="glass" 
                fullWidth
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                }
                iconPosition="right"
              >
                시작하기
              </AppleButton>
            </div>
          </AppleCard>
        </AppleGridItem>

        <AppleGridItem span={6}>
          <AppleCard
            size="large"
            variant="glass"
            title="기존 프로젝트"
            description="저장된 프로젝트를 불러와서 작업을 계속하거나 새로운 버전을 생성하세요"
            onClick={onExistingProjects}
            className="group"
            padding="lg"
          >
            <div className="absolute top-8 right-8">
              <div className="w-16 h-16 bg-apple-green/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-apple-green/30 transition-apple">
                <svg className="w-8 h-8 text-apple-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
            
            <div className="mt-auto">
              <AppleButton 
                variant="secondary" 
                fullWidth
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                iconPosition="right"
              >
                목록 보기
              </AppleButton>
            </div>
          </AppleCard>
        </AppleGridItem>

        {/* Feature Highlight Cards */}
        <AppleGridItem span={4}>
          <AppleCard
            size="medium"
            variant="glass"
            title="AI 기반 생성"
            description="GPT-4를 활용한 지능형 프롬프트 자동 생성"
            className="group"
            padding="md"
          >
            <div className="absolute top-6 right-6">
              <div className="w-12 h-12 bg-apple-purple/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-apple-purple/30 transition-apple">
                <svg className="w-6 h-6 text-apple-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
          </AppleCard>
        </AppleGridItem>

        <AppleGridItem span={4}>
          <AppleCard
            size="medium"
            variant="glass"
            title="5단계 워크플로우"
            description="체계적인 단계별 프로세스로 완벽한 교안 설계"
            className="group"
            padding="md"
          >
            <div className="absolute top-6 right-6">
              <div className="w-12 h-12 bg-apple-orange/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-apple-orange/30 transition-apple">
                <svg className="w-6 h-6 text-apple-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </AppleCard>
        </AppleGridItem>

        <AppleGridItem span={4}>
          <AppleCard
            size="medium"
            variant="glass"
            title="즉시 활용 가능"
            description="생성된 프롬프트를 Claude Code에서 바로 실행"
            className="group"
            padding="md"
          >
            <div className="absolute top-6 right-6">
              <div className="w-12 h-12 bg-apple-green/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-apple-green/30 transition-apple">
                <svg className="w-6 h-6 text-apple-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </AppleCard>
        </AppleGridItem>

        {/* Bottom CTA Section */}
        <AppleGridItem span={8} start={3}>
          <AppleCard
            variant="strong"
            className="mt-12"
            padding="lg"
          >
            <div className="text-center">
              <h2 className="text-headline-large text-gray-900 mb-4">
                지금 시작해보세요
              </h2>
              <p className="text-body text-gray-700 mb-8 max-w-2xl mx-auto">
                몇 번의 클릭만으로 전문적인 교육 콘텐츠를 생성할 수 있습니다. 
                AI의 힘을 활용하여 더 효과적인 학습 경험을 만들어보세요.
              </p>
              <div className="flex gap-4 justify-center">
                <AppleButton 
                  variant="primary" 
                  size="lg"
                  onClick={onNewProject}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                >
                  새 프로젝트 시작
                </AppleButton>
                <AppleButton 
                  variant="secondary" 
                  size="lg"
                  onClick={onExistingProjects}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  }
                >
                  프로젝트 관리
                </AppleButton>
              </div>
            </div>
          </AppleCard>
        </AppleGridItem>
      </AppleGrid>
    </div>
  );
};
  );
};