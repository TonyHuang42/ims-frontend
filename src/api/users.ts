import apiClient from './client';
import type { User, PaginatedResponse, Role } from '../types/api';

export const usersApi = {
  getUsers: async (params?: any) => {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return data;
  },
  getUser: async (id: number) => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },
  createUser: async (userData: any) => {
    const { data } = await apiClient.post<User>('/users', userData);
    return data;
  },
  updateUser: async (id: number, userData: any) => {
    const { data } = await apiClient.put<User>(`/users/${id}`, userData);
    return data;
  },
  deleteUser: async (id: number) => {
    const { data } = await apiClient.delete(`/users/${id}`);
    return data;
  },
  syncUserRoles: async (id: number, roleIds: number[]) => {
    const { data } = await apiClient.post(`/users/${id}/roles`, { role_ids: roleIds });
    return data;
  },
  getUserRoles: async (id: number) => {
    const { data } = await apiClient.get<Role[]>(`/users/${id}/roles`);
    return data;
  },
};
