import React, { useState, useEffect } from 'react';
import { Button, Card } from '../common';
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Button
            onClick={onBack}
            variant="secondary"
            size="sm"
            className="mb-4"
          >
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