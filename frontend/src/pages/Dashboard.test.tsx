/**
 * Tests for Dashboard component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/utils';
import Dashboard from './Dashboard';
import * as api from '@/lib/api';

// Mock the API module
vi.mock('@/lib/api', () => ({
  getOverviewStats: vi.fn(),
}));

const mockStats = {
  total_conversations: 150,
  total_messages: 3500,
  total_projects: 5,
  total_developers: 12,
  recent_conversations: 25,
  success_rate: 85.5,
  conversations_by_status: {
    completed: 100,
    in_progress: 30,
    failed: 15,
    open: 5,
  },
  conversations_by_agent: {
    'claude-code': 120,
    copilot: 20,
    cursor: 10,
  },
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getOverviewStats).mockResolvedValue(mockStats);
  });

  it('should render the dashboard title', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('CatSyphon Dashboard')).toBeInTheDocument();
      expect(
        screen.getByText('Overview of conversation logs and coding agent activity')
      ).toBeInTheDocument();
    });
  });

  it('should display total conversations', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Total Conversations')).toBeInTheDocument();
    });
  });

  it('should display total messages', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('3,500')).toBeInTheDocument();
      expect(screen.getByText('Total Messages')).toBeInTheDocument();
    });
  });

  it('should display total projects', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });
  });

  it('should display total developers', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Developers')).toBeInTheDocument();
    });
  });

  it('should display recent activity count', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('25 in last 7 days')).toBeInTheDocument();
    });
  });

  it('should display success rate', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
  });

  it('should display status breakdown', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('By Status')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
      expect(screen.getByText('open')).toBeInTheDocument();
    });
  });

  it('should display agent type breakdown', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('By Agent Type')).toBeInTheDocument();
      expect(screen.getByText('claude-code')).toBeInTheDocument();
      expect(screen.getByText('copilot')).toBeInTheDocument();
      expect(screen.getByText('cursor')).toBeInTheDocument();
    });
  });

  it('should display quick action links', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Browse Conversations')).toBeInTheDocument();
      expect(screen.getByText('Failed Conversations')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    vi.mocked(api.getOverviewStats).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<Dashboard />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    vi.mocked(api.getOverviewStats).mockRejectedValue(
      new Error('Failed to fetch stats')
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading dashboard/)).toBeInTheDocument();
    });
  });

  it('should calculate average messages per conversation', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      // 3500 / 150 = 23.33 → 23
      expect(screen.getByText('23 avg per conversation')).toBeInTheDocument();
    });
  });

  it('should display status percentages correctly', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      // completed: 100/150 = 66.7%
      expect(screen.getByText('100 (66.7%)')).toBeInTheDocument();
      // in_progress: 30/150 = 20.0%
      expect(screen.getByText('30 (20.0%)')).toBeInTheDocument();
    });
  });

  it('should display agent type percentages correctly', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      // claude-code: 120/150 = 80.0%
      expect(screen.getByText('120 (80.0%)')).toBeInTheDocument();
      // copilot: 20/150 = 13.3%
      expect(screen.getByText('20 (13.3%)')).toBeInTheDocument();
    });
  });
});
