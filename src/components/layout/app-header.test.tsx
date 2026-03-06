import { screen, waitFor, renderWithRouter } from '@/test/test-utils';
import { mockUser } from '@/test/mocks/auth';

describe('AppHeader', () => {
  it('renders user name when authenticated', async () => {
    renderWithRouter({ route: '/', user: mockUser });
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders Dashboard in breadcrumb', async () => {
    renderWithRouter({ route: '/', user: mockUser });
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    const dashboardLinks = screen.getAllByText('Dashboard');
    expect(dashboardLinks.length).toBeGreaterThan(0);
  });
});
