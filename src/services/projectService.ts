import { api } from './api';
import { ApiResponse, PaginationResponse, Project, ProjectDetails } from '../types';

/**
 * These endpoints are not implemented on the backend yet (project foundation
 * only ships auth + health). Screens fall back to mock data until they land.
 */
export async function fetchProjects(): Promise<PaginationResponse<Project>> {
  const { data } = await api.get<ApiResponse<PaginationResponse<Project>>>('/projects');
  return data.data as PaginationResponse<Project>;
}

export async function fetchProjectById(projectId: string): Promise<ProjectDetails> {
  const { data } = await api.get<ApiResponse<ProjectDetails>>(`/projects/${projectId}`);
  return data.data as ProjectDetails;
}
