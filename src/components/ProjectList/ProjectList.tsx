import React, { useState, useEffect } from 'react';
import { AppleGrid, AppleGridItem, AppleCard, AppleButton } from '../apple';
import { GNB } from '../common';
import { ProjectMetadata } from '../../types/project.types';
import { projectService } from '../../services/project.service';

interface ProjectListProps {
  onSelectProject: (id: string) => void;
  onBack: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject, onBack }) => {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const projectList = projectService.getAllProjects();
    // 생성 날짜 기준으로 최신순 정렬
    const sortedProjects = projectList.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setProjects(sortedProjects);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
      projectService.deleteProject(id);
      loadProjects();
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Date 객체가 유효한지 확인
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date:', date);
        return '';
      }
      
      return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Date formatting error:', error, date);
      return '';
    }
  };

  const formatTimeAgo = (date: Date | string | undefined) => {
    if (!date) return '';
    
    try {
      const now = new Date();
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Date 객체가 유효한지 확인
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date for time ago:', date);
        return '';
      }
      
      const diff = now.getTime() - dateObj.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));

      if (days > 0) return `${days}일 전`;
      if (hours > 0) return `${hours}시간 전`;
      if (minutes > 0) return `${minutes}분 전`;
      return '방금 전';
    } catch (error) {
      console.warn('Time ago formatting error:', error, date);
      return '';
    }
  };

  return (
    <>
      <GNB onLogoClick={onBack} />
      <div className="min-h-screen pt-24 pb-8" style={{ 
        backgroundColor: '#f5f5f7'
      }}>
        <AppleGrid>
        {/* Header Section */}
        <AppleGridItem span={12}>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">프로젝트 목록</h1>
            <p className="text-xl font-medium text-gray-700">
              저장된 프로젝트를 선택하여 작업을 계속하세요
            </p>
          </div>
        </AppleGridItem>

        {/* Projects Grid or Empty State */}
        {projects.length === 0 ? (
          // Empty State
          <AppleGridItem span={8} start={3}>
            <AppleCard variant="glass" padding="lg" className="text-center py-16">
              <div className="w-24 h-24 bg-apple-gray-2/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-apple-gray-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                저장된 프로젝트가 없습니다
              </h2>
              <p className="text-base text-gray-600 mb-8 max-w-md mx-auto">
                새 프로젝트를 시작하여 첫 교안 프롬프트를 만들어보세요. 
                AI 기반 워크플로우가 도와드립니다.
              </p>
              <AppleButton 
                variant="primary" 
                size="lg"
                onClick={onBack}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                새 프로젝트 시작
              </AppleButton>
            </AppleCard>
          </AppleGridItem>
        ) : (
          // Projects Grid
          projects.map((project) => (
            <AppleGridItem span={4} key={project.id}>
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group h-64">
              <div onClick={() => onSelectProject(project.id)} className="h-full flex flex-col">
                {/* Project Icon */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {formatTimeAgo(project.updatedAt)}
                  </span>
                </div>

                {/* Project Info */}
                <div className="flex-1 mb-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                    {project.name}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      생성: {formatDate(project.createdAt)}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      수정: {formatDate(project.updatedAt)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(project.id);
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    열기
                  </button>
                  <button
                    className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            </AppleGridItem>
          ))
        )}

        {/* Add New Project Card - if projects exist */}
        {projects.length > 0 && (
          <AppleGridItem span={4}>
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group h-64 border-2 border-dashed border-gray-300 hover:border-blue-400" onClick={onBack}>
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  새 프로젝트
                </h3>
                <p className="text-sm text-gray-500">
                  새로운 교안을 시작해보세요
                </p>
              </div>
            </div>
          </AppleGridItem>
        )}
        </AppleGrid>
      </div>
    </>
  );
};