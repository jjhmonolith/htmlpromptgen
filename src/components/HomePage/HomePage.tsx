import React from 'react';
import { Button, Card } from '../common';

interface HomePageProps {
  onNewProject: () => void;
  onExistingProjects: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNewProject, onExistingProjects }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="max-w-2xl w-full px-4">
        <div className="text-center mb-8">
          <img src="/codle-logo.svg" alt="Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">
            교안 프롬프트 생성기
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div 
            className="backdrop-blur-md bg-white/70 border border-white/30 rounded-xl p-6 hover:bg-white/80 transition-all cursor-pointer shadow-lg"
            onClick={onNewProject}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">새 프로젝트</h2>
              <button className="w-full px-4 py-2 bg-blue-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-blue-600/80 transition-colors">
                시작
              </button>
            </div>
          </div>

          <div 
            className="backdrop-blur-md bg-white/70 border border-white/30 rounded-xl p-6 hover:bg-white/80 transition-all cursor-pointer shadow-lg"
            onClick={onExistingProjects}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">기존 프로젝트</h2>
              <button className="w-full px-4 py-2 bg-gray-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-gray-600/80 transition-colors">
                목록 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};