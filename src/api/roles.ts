import apiClient from './client';
import type { Role, PaginatedResponse } from '../types/api';

export const rolesApi = {
  getRoles: async (params?: any) => {
    const { data } = await apiClient.get<PaginatedResponse<Role>>('/roles', { params });
    return data;
  },
  getRole: async (id: number) => {
    const { data } = await apiClient.get<Role>(`/roles/${id}`);
    return data;
  },
  createRole: async (roleData: any) => {
    const { data } = await apiClient.post<Role>('/roles', roleData);
    return data;
  },
  updateRole: async (id: number, roleData: any) => {
    const { data } = await apiClient.put<Role>(`/roles/${id}`, roleData);
    return data;
  },
  deleteRole: async (id: number) => {
    const { data } = await apiClient.delete(`/roles/${id}`);
    return data;
  },
};
