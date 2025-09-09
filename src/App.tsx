import { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { ProjectList } from './components/ProjectList';
import { WorkSpace } from './components/WorkSpace';
import { Project } from './types/project.types';
import { projectService } from './services/project.service';

type ViewType = 'home' | 'project-list' | 'workspace';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Check if there's a current project on load
  useEffect(() => {
    const projectId = projectService.getCurrentProjectId();
    if (projectId) {
      const project = projectService.getProject(projectId);
      if (project) {
        setCurrentProject(project);
        setCurrentView('workspace');
      }
    }
  }, []);

  const handleNewProject = () => {
    const projectName = `프로젝트 ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    const newProject = projectService.createProject(projectName);
    projectService.setCurrentProjectId(newProject.id);
    setCurrentProject(newProject);
    setCurrentView('workspace');
  };

  const handleExistingProjects = () => {
    setCurrentView('project-list');
  };

  const handleSelectProject = (projectId: string) => {
    const project = projectService.getProject(projectId);
    if (project) {
      projectService.setCurrentProjectId(project.id);
      setCurrentProject(project);
      setCurrentView('workspace');
    }
  };

  const handleBackToHome = () => {
    projectService.clearCurrentProject();
    setCurrentProject(null);
    setCurrentView('home');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomePage
            onNewProject={handleNewProject}
            onExistingProjects={handleExistingProjects}
          />
        );
      case 'project-list':
        return (
          <ProjectList
            onSelectProject={handleSelectProject}
            onBack={handleBackToHome}
          />
        );
      case 'workspace':
        return currentProject ? (
          <WorkSpace
            project={currentProject}
            onBack={handleBackToHome}
          />
        ) : null;
      default:
        return null;
    }
  };

  return <>{renderView()}</>;
}

export default App
