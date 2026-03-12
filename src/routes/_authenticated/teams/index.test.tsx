import { screen, userEvent, waitFor } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { teamsApi } from '@/api/teams';
import { departmentsApi } from '@/api/departments';
import type { AuthUser } from '@/types/api';

vi.mock('@/api/teams');
vi.mock('@/api/departments');
vi.mock('@/hooks/use-debounce', () => ({ useDebounce: (value: unknown) => value }));

const adminUser: AuthUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@example.com',
  is_active: true,
  created_at: '',
  updated_at: '',
  role: { id: 1, name: 'admin', is_active: true, created_at: '', updated_at: '' },
};

const mockDepartments = {
  data: [{ id: 1, name: 'Engineering', is_active: true, created_at: '', updated_at: '' }],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, links: [], path: '', per_page: 100, to: 1, total: 1 },
};

const mockTeamsList = {
  data: [
    {
      id: 1,
      name: 'Backend Alpha',
      department_id: 1,
      is_active: true,
      department: { id: 1, name: 'Engineering', is_active: true, created_at: '', updated_at: '' },
      created_at: '',
      updated_at: '',
    },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, links: [], path: '', per_page: 10, to: 1, total: 1 },
};

describe('Teams page', () => {
  beforeEach(() => {
    vi.mocked(teamsApi.getTeams).mockResolvedValue(mockTeamsList);
    vi.mocked(departmentsApi.getDepartments).mockResolvedValue(mockDepartments);
  });

  it('renders page title and description when authenticated', async () => {
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Teams' })).toBeInTheDocument();
    });
    expect(screen.getByText("Manage your organization's teams")).toBeInTheDocument();
  });

  it('lists teams when API returns data', async () => {
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Backend Alpha')).toBeInTheDocument();
    });
    expect(teamsApi.getTeams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10, search: '' })
    );
  });

  it('calls getTeams with search param when user types in search', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search teams...')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('Search teams...'), 'Backend');
    await waitFor(() => {
      expect(teamsApi.getTeams).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Backend' })
      );
    });
  });

  it('admin sees Add Team button enabled', async () => {
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Team/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Add Team/i })).not.toBeDisabled();
  });

  it('opens Add Team dialog and shows validation error for short name', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Team/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Add Team/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Add Team/i })).toBeInTheDocument();
    });
    const nameInput = screen.getByPlaceholderText('Frontend Team');
    await user.type(nameInput, 'A');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
    expect(teamsApi.createTeam).not.toHaveBeenCalled();
  });

  it('shows table headers Name, Status, Edit', async () => {
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('shows validation error when department is not selected', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/teams', user: adminUser });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Team/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Add Team/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Add Team/i })).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Frontend Team');
    await user.type(nameInput, 'Backend Beta');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Department is required')).toBeInTheDocument();
    });
    expect(teamsApi.createTeam).not.toHaveBeenCalled();
  });

});
