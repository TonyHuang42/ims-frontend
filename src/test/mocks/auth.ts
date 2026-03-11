import type { AuthUser } from '@/types/api';

export const mockUser: AuthUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  is_active: true,
  departments: [],
  teams: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  role: { id: 1, name: 'admin', is_active: true, created_at: '', updated_at: '' },
};
