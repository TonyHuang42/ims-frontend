import apiClient from './client';
import type { User, PaginatedResponse } from '../types/api';

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
    const { data } = await apiClient.post<{ data: User }>('/users', userData);
    return data.data;
  },
  updateUser: async (id: number, userData: any) => {
    const { data } = await apiClient.put<{ data: User }>(`/users/${id}`, userData);
    return data.data;
  },
  deleteUser: async (id: number) => {
    const { data } = await apiClient.put(`/users/${id}`, { is_active: false });
    return data;
  },
};
