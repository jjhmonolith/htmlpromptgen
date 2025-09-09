import { Project, ProjectMetadata } from '../types/project.types';

const PROJECTS_KEY = 'promptgen_projects';
const CURRENT_PROJECT_KEY = 'promptgen_current_project';

export class ProjectService {
  private static instance: ProjectService | null = null;

  static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  // Get all projects metadata
  getAllProjects(): ProjectMetadata[] {
    const projectsData = localStorage.getItem(PROJECTS_KEY);
    if (!projectsData) return [];
    
    try {
      const projects: Project[] = JSON.parse(projectsData);
      return projects.map(p => ({
        id: p.id,
        name: p.name,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  // Get a specific project
  getProject(id: string): Project | null {
    const projectsData = localStorage.getItem(PROJECTS_KEY);
    if (!projectsData) return null;
    
    try {
      const projects: Project[] = JSON.parse(projectsData);
      const project = projects.find(p => p.id === id);
      if (project) {
        return {
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  // Create new project
  createProject(name: string): Project {
    const newProject: Project = {
      id: this.generateId(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      courseData: {
        subject: '',
        targetAudience: '',
        pages: [{ 
          pageNumber: 1, 
          title: '', 
          content: ''
        }]
      },
      currentStep: 'api-key'
    };

    const projects = this.getAllProjectsRaw();
    projects.push(newProject);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    
    return newProject;
  }

  // Update project
  updateProject(project: Project): void {
    const projects = this.getAllProjectsRaw();
    const index = projects.findIndex(p => p.id === project.id);
    
    if (index !== -1) {
      projects[index] = {
        ...project,
        updatedAt: new Date()
      };
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
  }

  // Delete project
  deleteProject(id: string): void {
    const projects = this.getAllProjectsRaw();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
    
    // Clear current project if it was deleted
    const currentId = this.getCurrentProjectId();
    if (currentId === id) {
      this.clearCurrentProject();
    }
  }

  // Get current project ID
  getCurrentProjectId(): string | null {
    return localStorage.getItem(CURRENT_PROJECT_KEY);
  }

  // Set current project ID
  setCurrentProjectId(id: string): void {
    localStorage.setItem(CURRENT_PROJECT_KEY, id);
  }

  // Clear current project
  clearCurrentProject(): void {
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  }

  // Private helper methods
  private getAllProjectsRaw(): Project[] {
    const projectsData = localStorage.getItem(PROJECTS_KEY);
    if (!projectsData) return [];
    
    try {
      return JSON.parse(projectsData);
    } catch {
      return [];
    }
  }

  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const projectService = ProjectService.getInstance();