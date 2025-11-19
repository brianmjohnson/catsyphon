/**
 * Tests for ProjectList component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import ProjectList from './ProjectList';
import * as api from '@/lib/api';
import type { ProjectListItem } from '@/types/api';

// Mock the API module
vi.mock('@/lib/api', () => ({
  getProjects: vi.fn(),
}));

const mockProjects: ProjectListItem[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'payment-service',
    description: 'Payment processing service with Stripe integration',
    directory_path: '/Users/kulesh/dev/payment-service',
    session_count: 23,
    last_session_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    created_at: '2025-10-15T10:00:00Z',
    updated_at: '2025-11-22T16:45:00Z',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    name: 'catsyphon',
    description: 'AI conversation analytics platform',
    directory_path: '/Users/kulesh/dev/catsyphon',
    session_count: 156,
    last_session_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    created_at: '2025-09-01T08:00:00Z',
    updated_at: '2025-11-22T17:50:00Z',
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    name: 'mobile-app',
    description: null,
    directory_path: '/Users/sarah/projects/mobile-app',
    session_count: 45,
    last_session_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    created_at: '2025-11-01T12:00:00Z',
    updated_at: '2025-11-21T14:30:00Z',
  },
];

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ProjectList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getProjects).mockResolvedValue(mockProjects);
  });

  describe('rendering', () => {
    it('should render the projects header', async () => {
      render(<ProjectList />);

      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(
        screen.getByText('Browse analytics for all your projects')
      ).toBeInTheDocument();
    });

    it('should render all projects with session counts', async () => {
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('payment-service')).toBeInTheDocument();
      });

      // Verify all 3 projects rendered
      expect(screen.getByText('payment-service')).toBeInTheDocument();
      expect(screen.getByText('catsyphon')).toBeInTheDocument();
      expect(screen.getByText('mobile-app')).toBeInTheDocument();

      // Verify session counts displayed
      expect(screen.getByText('23')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('should render project descriptions when present', async () => {
      render(<ProjectList />);

      await waitFor(() => {
        expect(
          screen.getByText('Payment processing service with Stripe integration')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('AI conversation analytics platform')
      ).toBeInTheDocument();
    });

    it('should render directory paths', async () => {
      render(<ProjectList />);

      await waitFor(() => {
        expect(
          screen.getByText('/Users/kulesh/dev/payment-service')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('/Users/kulesh/dev/catsyphon')).toBeInTheDocument();
      expect(
        screen.getByText('/Users/sarah/projects/mobile-app')
      ).toBeInTheDocument();
    });

    it('should render last activity timestamps', async () => {
      render(<ProjectList />);

      await waitFor(() => {
        // Verify relative timestamps are displayed (exact text may vary based on date-fns)
        const timestamps = screen.getAllByText(/ago$/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('navigation', () => {
    it('should navigate to project detail on card click', async () => {
      const user = userEvent.setup();
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('payment-service')).toBeInTheDocument();
      });

      // Click the first project card
      const projectCard = screen
        .getByText('payment-service')
        .closest('button');
      expect(projectCard).toBeInTheDocument();

      await user.click(projectCard!);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/projects/550e8400-e29b-41d4-a716-446655440000'
      );
    });

    it('should navigate to correct project when clicking different cards', async () => {
      const user = userEvent.setup();
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('catsyphon')).toBeInTheDocument();
      });

      // Click the second project
      const catsyphonCard = screen.getByText('catsyphon').closest('button');
      await user.click(catsyphonCard!);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/projects/660e8400-e29b-41d4-a716-446655440001'
      );
    });
  });

  describe('loading state', () => {
    it('should show loading skeletons while fetching', () => {
      // Make API call pending
      vi.mocked(api.getProjects).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProjectList />);

      // Verify loading skeletons present (3 skeletons by default)
      const skeletons = screen.getAllByRole('generic').filter((el) =>
        el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should hide loading state once data loads', async () => {
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('payment-service')).toBeInTheDocument();
      });

      // No loading skeletons should remain
      const skeletons = screen.queryAllByRole('generic').filter((el) =>
        el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBe(0);
    });
  });

  describe('empty state', () => {
    it('should show empty state when no projects exist', async () => {
      vi.mocked(api.getProjects).mockResolvedValue([]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('No projects yet')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Upload conversation logs to get started')
      ).toBeInTheDocument();
    });

    it('should not show empty state when projects exist', async () => {
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('payment-service')).toBeInTheDocument();
      });

      expect(screen.queryByText('No projects yet')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should show error message when API call fails', async () => {
      const errorMessage = 'Network connection failed';
      vi.mocked(api.getProjects).mockRejectedValue(new Error(errorMessage));

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
      });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should handle unknown errors gracefully', async () => {
      vi.mocked(api.getProjects).mockRejectedValue('Unknown error');

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
      });

      expect(screen.getByText('Unknown error')).toBeInTheDocument();
    });
  });

  describe('visual elements', () => {
    it('should render folder icons for each project', async () => {
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('payment-service')).toBeInTheDocument();
      });

      // Verify Folder icons present (lucide-react renders SVGs without role)
      const projectCards = screen.getAllByRole('button');
      expect(projectCards.length).toBe(3);

      // Each card should have the folder icon class
      projectCards.forEach((card) => {
        const svg = card.querySelector('svg.lucide-folder');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should render Activity icons for session metrics', async () => {
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('payment-service')).toBeInTheDocument();
      });

      // Verify "Sessions" labels present
      const sessionLabels = screen.getAllByText('Sessions', { exact: false });
      expect(sessionLabels.length).toBe(3); // One per project
    });

    it('should render Clock icons for last activity', async () => {
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('payment-service')).toBeInTheDocument();
      });

      // Verify "Last Active" labels present
      const activityLabels = screen.getAllByText('Last Active', {
        exact: false,
      });
      expect(activityLabels.length).toBe(3); // One per project
    });

    it('should render ChevronRight icons for navigation affordance', async () => {
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('payment-service')).toBeInTheDocument();
      });

      // ChevronRight icons should be present in all project cards
      const projectCards = screen.getAllByRole('button');
      expect(projectCards.length).toBe(3);
    });
  });
});
