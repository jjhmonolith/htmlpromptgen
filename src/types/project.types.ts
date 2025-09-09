import { CourseFormData } from './course.types';

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  apiKey?: string;
  courseData: CourseFormData;
  generatedPrompt?: string;
  currentStep: 'api-key' | 'course-input' | 'result';
  previousStepData?: {
    courseData: CourseFormData;
    generatedPrompt?: string;
  };
  hasModifications?: boolean;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}