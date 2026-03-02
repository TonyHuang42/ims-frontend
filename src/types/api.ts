export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  department_id: number | null;
  team_id: number | null;
  department?: Department | null;
  team?: Team | null;
  roles?: Role[];
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  name: string;
  department_id: number;
  description: string | null;
  is_active: boolean;
  department?: Department | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthUser extends User {
  // Add any specific auth user fields if needed
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
