import React, { useState, useEffect } from 'react';
import { Button, Card } from '../common';
import { ProjectMetadata } from '../../types/project.types';
import { projectService } from '../../services/project.service';

interface ProjectListProps {
  onSelectProject: (id: string) => void;
  onBack: () => void;
}

export const import React, { useState, useEffect } from 'react';
import { AppleGrid, AppleGridItem, AppleCard, AppleButton } from '../apple';
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
    setProjects(projectList);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
      projectService.deleteProject(id);
      loadProjects();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  return (
    <div className="min-h-screen py-8">
      <AppleGrid>
        {/* Header Section */}
        <AppleGridItem span={12}>
          <AppleCard variant="strong" padding="lg" className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <AppleButton
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    }
                  >
                    홈으로
                  </AppleButton>
                  <div className="h-4 w-px bg-apple-gray-4"></div>
                  <span className="text-apple-gray-6 text-sm">
                    {projects.length}개 프로젝트
                  </span>
                </div>
                <h1 className="text-display-medium text-gray-900 mb-2">프로젝트 목록</h1>
                <p className="text-headline-medium text-gray-700">
                  저장된 프로젝트를 선택하여 작업을 계속하세요
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-apple-blue/10 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-apple-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>
          </AppleCard>
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
              <h2 className="text-headline-large text-gray-900 mb-4">
                저장된 프로젝트가 없습니다
              </h2>
              <p className="text-body text-gray-600 mb-8 max-w-md mx-auto">
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
              <AppleCard
                size="medium"
                variant="glass"
                className="group cursor-pointer h-full"
                onClick={() => onSelectProject(project.id)}
                padding="lg"
              >
                {/* Project Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-apple-blue to-apple-purple rounded-xl flex items-center justify-center group-hover:scale-110 transition-apple">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-apple-gray-6 text-sm">
                    {formatTimeAgo(project.updatedAt)}
                  </span>
                </div>

                {/* Project Info */}
                <div className="flex-1 mb-6">
                  <h3 className="text-xl font-medium text-gray-900 mb-2 group-hover:text-apple-blue transition-apple line-clamp-2">
                    {project.name}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-apple-gray-6">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      생성: {formatDate(project.createdAt)}
                    </div>
                    <div className="flex items-center text-sm text-apple-gray-6">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      수정: {formatDate(project.updatedAt)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <AppleButton
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(project.id);
                    }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    }
                  >
                    열기
                  </AppleButton>
                  <AppleButton
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    }
                  >
                    삭제
                  </AppleButton>
                </div>
              </AppleCard>
            </AppleGridItem>
          ))
        )}

        {/* Add New Project Card - if projects exist */}
        {projects.length > 0 && (
          <AppleGridItem span={4}>
            <AppleCard
              size="medium"
              variant="glass"
              className="group cursor-pointer h-full border-dashed hover:border-solid"
              onClick={onBack}
              padding="lg"
            >
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-apple-blue/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-apple-blue/20 transition-apple">
                  <svg className="w-8 h-8 text-apple-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-headline-medium text-gray-900 mb-2">
                  새 프로젝트
                </h3>
                <p className="text-body text-apple-gray-6">
                  새로운 교안을 시작해보세요
                </p>
              </div>
            </AppleCard>
          </AppleGridItem>
        )}
      </AppleGrid>
    </div>
  );
};
            ← 홈으로
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">프로젝트 목록</h1>
          <p className="text-gray-600 mt-2">저장된 프로젝트를 선택하여 계속 작업하세요</p>
        </div>

        {projects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">저장된 프로젝트가 없습니다</h2>
            <p className="text-gray-600 mb-6">새 프로젝트를 시작하여 첫 교안 프롬프트를 만들어보세요</p>
            <Button onClick={onBack}>새 프로젝트 시작</Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onSelectProject(project.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>생성일: {formatDate(project.createdAt)}</p>
                      <p>최종 수정: {formatDate(project.updatedAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(project.id);
                      }}
                    >
                      열기
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};