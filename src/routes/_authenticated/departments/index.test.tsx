import { screen, userEvent, waitFor, within } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { departmentsApi } from '@/api/departments';
import type { AuthUser } from '@/types/api';

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

const mockDepartmentsList = {
  data: [
    { id: 1, name: 'Engineering', is_active: true, created_at: '', updated_at: '' },
    { id: 2, name: 'Human Resources', is_active: true, created_at: '', updated_at: '' },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    links: [],
    path: '',
    per_page: 10,
    to: 2,
    total: 2,
  },
};

describe('Departments page', () => {
  beforeEach(() => {
    vi.mocked(departmentsApi.getDepartments).mockResolvedValue(mockDepartmentsList);
  });

  it('renders page title and description when authenticated', async () => {
    renderWithRouter({ route: '/departments', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Departments' })).toBeInTheDocument();
    });
    expect(screen.getByText("Manage your organization's departments")).toBeInTheDocument();
  });

  it('lists departments when API returns data', async () => {
    renderWithRouter({ route: '/departments', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });
    expect(screen.getByText('Human Resources')).toBeInTheDocument();
    expect(departmentsApi.getDepartments).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10, search: '' })
    );
  });

  it('calls getDepartments with search param when user types in search', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/departments', user: adminUser });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search departments...')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('Search departments...'), 'Engine');
    await waitFor(() => {
      expect(departmentsApi.getDepartments).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Engine' })
      );
    });
  });

  it('admin sees Add Department button enabled', async () => {
    renderWithRouter({ route: '/departments', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Department/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Add Department/i })).not.toBeDisabled();
  });

  it('opens Add Department dialog and shows validation error for short name', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/departments', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Department/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Add Department/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Add Department/i })).toBeInTheDocument();
    });
    const nameInput = screen.getByPlaceholderText('Engineering');
    await user.type(nameInput, 'A');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
    expect(departmentsApi.createDepartment).not.toHaveBeenCalled();
  });

  it('calls createDepartment and closes dialog on successful create', async () => {
    vi.mocked(departmentsApi.createDepartment).mockResolvedValue({
      id: 3,
      name: 'New Dept',
      is_active: true,
      created_at: '',
      updated_at: '',
    });
    const user = userEvent.setup();
    renderWithRouter({ route: '/departments', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Department/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Add Department/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Engineering')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('Engineering'), 'New Dept');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(departmentsApi.createDepartment).toHaveBeenCalled();
      const call = vi.mocked(departmentsApi.createDepartment).mock.calls[0];
      expect(call[0]).toMatchObject({ name: 'New Dept', is_active: true });
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Add Department/i })).not.toBeInTheDocument();
    });
  });

  it('shows table headers Name, Status, Edit', async () => {
    renderWithRouter({ route: '/departments', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('updates a department from the table actions', async () => {
    vi.mocked(departmentsApi.updateDepartment).mockResolvedValue({
      id: 1,
      name: 'Engineering Updated',
      is_active: true,
      created_at: '',
      updated_at: '',
    });

    const user = userEvent.setup();
    renderWithRouter({ route: '/departments', user: adminUser });

    const nameCell = await screen.findByText('Engineering');
    const row = nameCell.closest('tr') as HTMLElement;
    const editButton = within(row).getAllByRole('button')[0];

    await user.click(editButton);

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /Edit Department/i })
      ).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Engineering');
    await user.clear(nameInput);
    await user.type(nameInput, 'Engineering Updated');

    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => {
      expect(departmentsApi.updateDepartment).toHaveBeenCalledTimes(1);
      const [id, payload] = vi.mocked(departmentsApi.updateDepartment).mock.calls[0];
      expect(id).toBe(1);
      expect(payload).toMatchObject({ name: 'Engineering Updated', is_active: true });
    });
  });

  it('creates an inactive department when Active Status is toggled off', async () => {
    vi.mocked(departmentsApi.createDepartment).mockResolvedValue({
      id: 3,
      name: 'Inactive Dept',
      is_active: false,
      created_at: '',
      updated_at: '',
    } as any);

    const user = userEvent.setup();

    renderWithRouter({ route: '/departments', user: adminUser });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Department/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Add Department/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Engineering')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Engineering'), 'Inactive Dept');

    const activeSwitch = screen.getByRole('switch', { name: /Active Status/i });
    await user.click(activeSwitch);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(departmentsApi.createDepartment).toHaveBeenCalled();
      const calls = vi.mocked(departmentsApi.createDepartment).mock.calls;
      const [payload] = calls[calls.length - 1];
      expect(payload).toMatchObject({
        name: 'Inactive Dept',
        is_active: false,
      });
    });
  });
});
