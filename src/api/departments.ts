import apiClient from './client';
import type { Department, PaginatedResponse } from '../types/api';

export const departmentsApi = {
  getDepartments: async (params?: any) => {
    const { data } = await apiClient.get<PaginatedResponse<Department>>('/departments', { params });
    return data;
  },
  getDepartment: async (id: number) => {
    const { data } = await apiClient.get<Department>(`/departments/${id}`);
    return data;
  },
  createDepartment: async (deptData: any) => {
    const { data } = await apiClient.post<Department>('/departments', deptData);
    return data;
  },
  updateDepartment: async (id: number, deptData: any) => {
    const { data } = await apiClient.put<Department>(`/departments/${id}`, deptData);
    return data;
  },
  deleteDepartment: async (id: number) => {
    const { data } = await apiClient.put(`/departments/${id}`, { is_active: false });
    return data;
  },
};
