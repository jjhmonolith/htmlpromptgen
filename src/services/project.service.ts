import { Project, ProjectMetadata } from '../types/project.types';
import { WorkflowState } from '../types/workflow.types';

const PROJECTS_KEY = 'promptgen_projects';
const CURRENT_PROJECT_KEY = 'promptgen_current_project';
const WORKFLOWS_KEY = 'promptgen_workflows';
const WORKFLOWS_V2_KEY = 'promptgen_workflows_v2';

export class ProjectService {
  private static instance: ProjectService | null = null;

  static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  // 안전한 날짜 파싱 헬퍼 함수
  private parseDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    
    try {
      const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      
      // Date 객체가 유효한지 확인
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date value, using current date:', dateValue);
        return new Date();
      }
      
      return dateObj;
    } catch (error) {
      console.warn('Date parsing error, using current date:', error, dateValue);
      return new Date();
    }
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
        createdAt: this.parseDate(p.createdAt),
        updatedAt: this.parseDate(p.updatedAt)
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
          createdAt: this.parseDate(project.createdAt),
          updatedAt: this.parseDate(project.updatedAt)
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

    // Delete workflow data (both v1 and v2)
    this.deleteWorkflowData(id);
    this.deleteWorkflowV2Data(id);
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

  // Workflow data management
  saveWorkflowData(projectId: string, workflowState: WorkflowState): void {
    try {
      const workflowsData = localStorage.getItem(WORKFLOWS_KEY);
      const workflows = workflowsData ? JSON.parse(workflowsData) : {};
      
      workflows[projectId] = {
        ...workflowState,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
      
      // Update project's updatedAt
      const project = this.getProject(projectId);
      if (project) {
        this.updateProject(project);
      }
      
    } catch (error) {
      console.error('Failed to save workflow data:', error);
    }
  }

  loadWorkflowData(projectId: string): WorkflowState | null {
    try {
      const workflowsData = localStorage.getItem(WORKFLOWS_KEY);
      if (!workflowsData) return null;
      
      const workflows = JSON.parse(workflowsData);
      const workflowData = workflows[projectId];
      
      if (!workflowData) return null;
      
      // Remove lastSaved field and return workflow state
      const { lastSaved, ...workflowState } = workflowData;
      
      // Convert date strings back to Date objects if needed
      if (workflowState.projectData) {
        if (workflowState.projectData.createdAt) {
          workflowState.projectData.createdAt = this.parseDate(workflowState.projectData.createdAt);
        }
        if (workflowState.projectData.updatedAt) {
          workflowState.projectData.updatedAt = this.parseDate(workflowState.projectData.updatedAt);
        }
      }
      
      return workflowState as WorkflowState;
    } catch (error) {
      console.error('Failed to load workflow data:', error);
      return null;
    }
  }

  deleteWorkflowData(projectId: string): void {
    try {
      const workflowsData = localStorage.getItem(WORKFLOWS_KEY);
      if (!workflowsData) return;
      
      const workflows = JSON.parse(workflowsData);
      delete workflows[projectId];
      
      localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
    } catch (error) {
      console.error('Failed to delete workflow data:', error);
    }
  }

  // Check if workflow data exists
  hasWorkflowData(projectId: string): boolean {
    try {
      const workflowsData = localStorage.getItem(WORKFLOWS_KEY);
      if (!workflowsData) return false;
      
      const workflows = JSON.parse(workflowsData);
      return !!workflows[projectId];
    } catch {
      return false;
    }
  }

  // Get workflow progress summary
  getWorkflowProgress(projectId: string): { currentStep: number; completedSteps: number } {
    const workflowData = this.loadWorkflowData(projectId);
    if (!workflowData) {
      return { currentStep: 1, completedSteps: 0 };
    }
    
    const completedSteps = workflowData.stepCompletion ? Object.values(workflowData.stepCompletion).filter(Boolean).length : 0;
    return {
      currentStep: workflowData.currentStep,
      completedSteps
    };
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

  // v2 Workflow data management
  saveWorkflowV2Data(projectId: string, workflowState: any): void {
    try {
      const workflowsData = localStorage.getItem(WORKFLOWS_V2_KEY);
      const workflows = workflowsData ? JSON.parse(workflowsData) : {};
      
      workflows[projectId] = {
        ...workflowState,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(WORKFLOWS_V2_KEY, JSON.stringify(workflows));
      
      // Update project's updatedAt
      const project = this.getProject(projectId);
      if (project) {
        this.updateProject(project);
      }
      
    } catch (error) {
      console.error('Failed to save workflow v2 data:', error);
    }
  }

  getWorkflowV2Data(projectId: string): any | null {
    return this.loadWorkflowV2Data(projectId);
  }

  loadWorkflowV2Data(projectId: string): any | null {
    try {
      const workflowsData = localStorage.getItem(WORKFLOWS_V2_KEY);
      if (!workflowsData) return null;
      
      const workflows = JSON.parse(workflowsData);
      const workflowData = workflows[projectId];
      
      if (!workflowData) return null;
      
      // Remove lastSaved field and return workflow state
      const { lastSaved, ...workflowState } = workflowData;
      
      return workflowState;
    } catch (error) {
      console.error('Failed to load workflow v2 data:', error);
      return null;
    }
  }

  deleteWorkflowV2Data(projectId: string): void {
    try {
      const workflowsData = localStorage.getItem(WORKFLOWS_V2_KEY);
      if (!workflowsData) return;
      
      const workflows = JSON.parse(workflowsData);
      delete workflows[projectId];
      
      localStorage.setItem(WORKFLOWS_V2_KEY, JSON.stringify(workflows));
    } catch (error) {
      console.error('Failed to delete workflow v2 data:', error);
    }
  }

  // Check if workflow v2 data exists
  hasWorkflowV2Data(projectId: string): boolean {
    try {
      const workflowsData = localStorage.getItem(WORKFLOWS_V2_KEY);
      if (!workflowsData) return false;
      
      const workflows = JSON.parse(workflowsData);
      return !!workflows[projectId];
    } catch {
      return false;
    }
  }

  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const projectService = ProjectService.getInstance();