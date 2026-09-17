import { api } from './api';
import { ApiResponse, PaginationResponse, Task } from '../types';

/**
 * Not implemented on the backend yet (see projectService.ts) - kept here so
 * screens have a stable service boundary to switch to once it lands.
 */
export async function fetchTasks(): Promise<PaginationResponse<Task>> {
  const { data } = await api.get<ApiResponse<PaginationResponse<Task>>>('/tasks');
  return data.data as PaginationResponse<Task>;
}
