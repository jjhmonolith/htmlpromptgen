import React from 'react';
import { AppleGrid, AppleGridItem, AppleCard } from '../apple';
import { GNB } from '../common';

interface HomePageProps {
  onNewProject: () => void;
  onExistingProjects: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNewProject, onExistingProjects }) => {
  return (
    <>
      <GNB />
      <div className="min-h-screen pt-16" style={{ 
        backgroundColor: '#f5f5f7'
      }}>
        <AppleGrid>
          {/* Hero Section - Text directly on background */}
          <AppleGridItem span={12}>
            <div className="flex flex-col items-center justify-center text-center mb-12 py-20">
              <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 bg-clip-text text-transparent">
                AI로 코딩 없이 교안 제작
              </h1>
              <p className="text-2xl font-medium max-w-3xl mt-4" style={{ color: '#86868b' }}>
                PPT 대신 인터랙터블 시각자료를 교안으로 활용해보세요.<br />
                Google AI Studio 또는 Claude Code를 활용해 교안을 자동 생성할 수 있어요.
              </p>
            </div>
          </AppleGridItem>

        {/* Main Action Cards */}
        <AppleGridItem span={6}>
          <div 
            onClick={onNewProject}
            className="group cursor-pointer hover:scale-105 transition-all duration-300 relative overflow-hidden rounded-3xl shadow-2xl h-[500px]"
            style={{
              backgroundImage: 'url(/newproject.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="relative flex flex-col h-full py-8 text-white">
              <div className="pt-4">
                <h2 className="text-[3.5rem] font-bold text-white text-left mb-8 drop-shadow-lg px-8">
                  새 프로젝트
                </h2>
              </div>
            </div>
          </div>
        </AppleGridItem>

        <AppleGridItem span={6}>
          <div 
            onClick={onExistingProjects}
            className="group cursor-pointer hover:scale-105 transition-all duration-300 relative overflow-hidden rounded-3xl shadow-2xl h-[500px]"
            style={{
              backgroundImage: 'url(/list.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="relative flex flex-col h-full py-8 text-white">
              <div className="pt-4">
                <h2 className="text-[3.5rem] font-bold text-white text-left mb-8 drop-shadow-lg px-8">
                  불러오기
                </h2>
              </div>
            </div>
          </div>
        </AppleGridItem>

        </AppleGrid>
      </div>
    </>
  );
};