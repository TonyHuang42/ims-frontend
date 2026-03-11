import apiClient from './client';
import type { Team, PaginatedResponse } from '../types/api';

export const teamsApi = {
  getTeams: async (params?: any) => {
    const { data } = await apiClient.get<PaginatedResponse<Team>>('/teams', { params });
    return data;
  },
  getTeam: async (id: number) => {
    const { data } = await apiClient.get<Team>(`/teams/${id}`);
    return data;
  },
  createTeam: async (teamData: any) => {
    const { data } = await apiClient.post<Team>('/teams', teamData);
    return data;
  },
  updateTeam: async (id: number, teamData: any) => {
    const { data } = await apiClient.put<Team>(`/teams/${id}`, teamData);
    return data;
  },
  deleteTeam: async (id: number) => {
    const { data } = await apiClient.put(`/teams/${id}`, { is_active: false });
    return data;
  },
};
