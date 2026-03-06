import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders "Active" when isActive is true', () => {
    render(<StatusBadge isActive={true} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders "Inactive" when isActive is false', () => {
    render(<StatusBadge isActive={false} />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
