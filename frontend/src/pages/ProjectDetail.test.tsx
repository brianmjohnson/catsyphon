/**
 * Tests for ProjectDetail component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import ProjectDetail from './ProjectDetail';
import * as api from '@/lib/api';
import type {
  ProjectStats,
  ProjectSession,
  ProjectFileAggregation,
  ProjectListItem,
} from '@/types/api';

// Mock the API module
vi.mock('@/lib/api', () => ({
  getProjects: vi.fn(),
  getProjectStats: vi.fn(),
  getProjectSessions: vi.fn(),
  getProjectFiles: vi.fn(),
}));

// Mock useParams to return a project ID
const mockProjectId = '550e8400-e29b-41d4-a716-446655440000';
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: mockProjectId }),
    useNavigate: () => vi.fn(),
  };
});

const mockProjects: ProjectListItem[] = [
  {
    id: mockProjectId,
    name: 'payment-service',
    description: 'Payment processing service',
    directory_path: '/Users/kulesh/dev/payment-service',
    session_count: 23,
    last_session_at: '2025-11-22T16:45:00Z',
    created_at: '2025-10-15T10:00:00Z',
    updated_at: '2025-11-22T16:45:00Z',
  },
];

const mockStats: ProjectStats = {
  project_id: mockProjectId,
  session_count: 23,
  total_messages: 1247,
  total_files_changed: 89,
  success_rate: 0.87,
  avg_session_duration_seconds: 3240, // 54 minutes
  first_session_at: '2025-11-01T10:00:00Z',
  last_session_at: '2025-11-22T16:45:00Z',
  top_features: [
    'Stripe payment gateway integration',
    'Refund processing workflow',
    'Webhook validation',
  ],
  top_problems: [
    'Stripe API authentication errors',
    'Docker container networking issues',
  ],
  tool_usage: {
    git: 18,
    bash: 15,
    npm: 11,
    pytest: 7,
    docker: 4,
  },
  developer_count: 2,
  developers: ['kulesh', 'sarah'],
};

const mockSessions: ProjectSession[] = [
  {
    id: 'session-1',
    start_time: '2025-11-22T14:14:00Z',
    end_time: '2025-11-22T15:37:00Z',
    duration_seconds: 4980,
    status: 'completed',
    success: true,
    message_count: 45,
    files_count: 4,
    agent_type: 'claude-code',
    developer: 'kulesh',
  },
  {
    id: 'session-2',
    start_time: '2025-11-22T10:30:00Z',
    end_time: '2025-11-22T11:15:00Z',
    duration_seconds: 2700,
    status: 'completed',
    success: true,
    message_count: 32,
    files_count: 3,
    agent_type: 'claude-code',
    developer: 'sarah',
  },
  {
    id: 'session-3',
    start_time: '2025-11-21T15:45:00Z',
    end_time: '2025-11-21T18:00:00Z',
    duration_seconds: 8100,
    status: 'failed',
    success: false,
    message_count: 67,
    files_count: 2,
    agent_type: 'claude-code',
    developer: 'kulesh',
  },
];

const mockFiles: ProjectFileAggregation[] = [
  {
    file_path: 'src/payments/stripe.py',
    modification_count: 12,
    total_lines_added: 245,
    total_lines_deleted: 89,
    last_modified_at: '2025-11-22T16:45:00Z',
    session_ids: ['session-1', 'session-2'],
  },
  {
    file_path: 'src/payments/models.py',
    modification_count: 8,
    total_lines_added: 123,
    total_lines_deleted: 45,
    last_modified_at: '2025-11-22T10:30:00Z',
    session_ids: ['session-2'],
  },
  {
    file_path: 'tests/test_stripe.py',
    modification_count: 6,
    total_lines_added: 89,
    total_lines_deleted: 12,
    last_modified_at: '2025-11-22T14:14:00Z',
    session_ids: ['session-1'],
  },
];

describe('ProjectDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getProjects).mockResolvedValue(mockProjects);
    vi.mocked(api.getProjectStats).mockResolvedValue(mockStats);
    vi.mocked(api.getProjectSessions).mockImplementation(async () => mockSessions);
    vi.mocked(api.getProjectFiles).mockImplementation(async () => mockFiles);
  });

  describe('tab navigation', () => {
    it('should render all three tabs', async () => {
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Stats & Insights')).toBeInTheDocument();
      });

      expect(screen.getByText('Sessions')).toBeInTheDocument();
      expect(screen.getByText('Files')).toBeInTheDocument();
    });

    it('should show Stats tab by default', async () => {
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      });

      // Verify Stats tab content visible
      expect(screen.getByText('23')).toBeInTheDocument(); // session count
      expect(screen.getByText('87%')).toBeInTheDocument(); // success rate
    });

    it('should switch to Sessions tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument();
      });

      // Click Sessions tab
      const sessionsTab = screen.getByText('Sessions');
      await user.click(sessionsTab);

      // Verify Sessions tab content visible (kulesh appears twice in mock data)
      await waitFor(() => {
        const kuleshElements = screen.getAllByText('kulesh');
        expect(kuleshElements.length).toBeGreaterThan(0);
      });
      expect(screen.getByText('sarah')).toBeInTheDocument();
    });

    it('should switch to Files tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Files')).toBeInTheDocument();
      });

      // Click Files tab
      const filesTab = screen.getByText('Files');
      await user.click(filesTab);

      // Verify Files tab content visible
      await waitFor(() => {
        expect(
          screen.getByText('src/payments/stripe.py')
        ).toBeInTheDocument();
      });
      expect(screen.getByText('src/payments/models.py')).toBeInTheDocument();
    });

    it('should maintain active tab state when switching', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument();
      });

      // Click Sessions tab
      await user.click(screen.getByText('Sessions'));

      // Wait for content (kulesh appears twice in mock data)
      await waitFor(() => {
        const kuleshElements = screen.getAllByText('kulesh');
        expect(kuleshElements.length).toBeGreaterThan(0);
      });

      // Click back to Stats tab
      await user.click(screen.getByText('Stats & Insights'));

      // Verify Stats content visible again
      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      });
      // Verify session count is still displayed
      expect(screen.getByText('23')).toBeInTheDocument(); // session count
      expect(screen.getByText('87%')).toBeInTheDocument(); // success rate
    });
  });

  describe('Stats tab', () => {
    it('should display all 6 metric cards', async () => {
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Messages')).toBeInTheDocument();
      expect(screen.getByText('Files Changed')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Duration')).toBeInTheDocument();
      expect(screen.getByText('Developers')).toBeInTheDocument();
    });

    it('should display correct session count', async () => {
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      });

      // Verify session count is displayed (value from mockStats)
      expect(screen.getByText('23')).toBeInTheDocument();
    });

    it('should display correct success rate', async () => {
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Success Rate')).toBeInTheDocument();
      });

      // Verify success rate is displayed (87% from mockStats: 0.87 * 100)
      expect(screen.getByText('87%')).toBeInTheDocument();
    });

    it('should display top features list', async () => {
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Top Features')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Stripe payment gateway integration')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Refund processing workflow')
      ).toBeInTheDocument();
      expect(screen.getByText('Webhook validation')).toBeInTheDocument();
    });

    it('should display top problems list', async () => {
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Top Problems')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Stripe API authentication errors')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Docker container networking issues')
      ).toBeInTheDocument();
    });

    it('should display tool usage grid', async () => {
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tool Usage')).toBeInTheDocument();
      });

      // Verify tool counts displayed
      expect(screen.getByText('18')).toBeInTheDocument(); // git
      expect(screen.getByText('15')).toBeInTheDocument(); // bash
      expect(screen.getByText('11')).toBeInTheDocument(); // npm
      expect(screen.getByText('7')).toBeInTheDocument(); // pytest
      expect(screen.getByText('4')).toBeInTheDocument(); // docker

      // Verify tool names
      expect(screen.getByText('git')).toBeInTheDocument();
      expect(screen.getByText('bash')).toBeInTheDocument();
      expect(screen.getByText('npm')).toBeInTheDocument();
    });

    it('should hide features list when empty', async () => {
      vi.mocked(api.getProjectStats).mockResolvedValue({
        ...mockStats,
        top_features: [],
      });

      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      });

      expect(screen.queryByText('Top Features')).not.toBeInTheDocument();
    });

    it('should hide problems list when empty', async () => {
      vi.mocked(api.getProjectStats).mockResolvedValue({
        ...mockStats,
        top_problems: [],
      });

      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      });

      expect(screen.queryByText('Top Problems')).not.toBeInTheDocument();
    });
  });

  describe('Sessions tab', () => {
    it('should display all sessions in table', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument();
      });

      // Click Sessions tab
      await user.click(screen.getByText('Sessions'));

      // Wait for table to render (kulesh appears twice in mock data)
      await waitFor(() => {
        const kuleshElements = screen.getAllByText('kulesh');
        expect(kuleshElements.length).toBe(2); // session-1 and session-3
      });

      expect(screen.getByText('sarah')).toBeInTheDocument();

      // Verify 3 sessions rendered (header + 3 data rows = 4 total)
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBe(4);
    });

    it('should display session status badges', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sessions'));

      await waitFor(() => {
        // Completed status (session-1 and session-2)
        const completedBadges = screen.getAllByText('completed');
        expect(completedBadges.length).toBe(2);
      });

      // Failed status (session-3)
      const failedBadges = screen.getAllByText('failed');
      expect(failedBadges.length).toBe(1);
    });

    it('should display developer usernames', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sessions'));

      // Wait for developer names to render (kulesh appears twice)
      await waitFor(() => {
        const kuleshElements = screen.getAllByText('kulesh');
        expect(kuleshElements.length).toBe(2); // session-1 and session-3
      });

      const sarahElements = screen.getAllByText('sarah');
      expect(sarahElements.length).toBe(1); // session-2
    });

    it('should display message counts', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sessions'));

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument();
      });

      expect(screen.getByText('32')).toBeInTheDocument();
      expect(screen.getByText('67')).toBeInTheDocument();
    });

    it('should display file counts', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sessions'));

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show empty state when no sessions', async () => {
      vi.mocked(api.getProjectSessions).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sessions'));

      await waitFor(() => {
        expect(screen.getByText(/No sessions/i)).toBeInTheDocument();
      });
    });
  });

  describe('Files tab', () => {
    it('should display all files in table', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Files')).toBeInTheDocument();
      });

      // Click Files tab
      await user.click(screen.getByText('Files'));

      await waitFor(() => {
        expect(
          screen.getByText('src/payments/stripe.py')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('src/payments/models.py')).toBeInTheDocument();
      expect(screen.getByText('tests/test_stripe.py')).toBeInTheDocument();
    });

    it('should display modification counts', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Files')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Files'));

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument();
      });

      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('should display lines added with plus sign', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Files')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Files'));

      await waitFor(() => {
        expect(screen.getByText('+245')).toBeInTheDocument();
      });

      expect(screen.getByText('+123')).toBeInTheDocument();
      expect(screen.getByText('+89')).toBeInTheDocument();
    });

    it('should display lines deleted with minus sign', async () => {
      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Files')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Files'));

      await waitFor(() => {
        expect(screen.getByText('-89')).toBeInTheDocument();
      });

      expect(screen.getByText('-45')).toBeInTheDocument();
      expect(screen.getByText('-12')).toBeInTheDocument();
    });

    it('should show empty state when no files', async () => {
      vi.mocked(api.getProjectFiles).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Files')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Files'));

      await waitFor(() => {
        expect(screen.getByText(/No files/i)).toBeInTheDocument();
      });
    });
  });

  describe('loading states', () => {
    it('should show loading state for Stats tab', () => {
      vi.mocked(api.getProjectStats).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProjectDetail />);

      // Verify loading skeleton present
      const loadingElements = screen.getAllByRole('generic').filter((el) =>
        el.className.includes('animate-pulse')
      );
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should show loading state for Sessions tab', async () => {
      const user = userEvent.setup();
      vi.mocked(api.getProjectSessions).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sessions'));

      // Verify loading skeleton present
      await waitFor(() => {
        const loadingElements = screen.getAllByRole('generic').filter((el) =>
          el.className.includes('animate-pulse')
        );
        expect(loadingElements.length).toBeGreaterThan(0);
      });
    });

    it('should show loading state for Files tab', async () => {
      const user = userEvent.setup();
      vi.mocked(api.getProjectFiles).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Files')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Files'));

      // Verify loading skeleton present
      await waitFor(() => {
        const loadingElements = screen.getAllByRole('generic').filter((el) =>
          el.className.includes('animate-pulse')
        );
        expect(loadingElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('error handling', () => {
    it('should show error message when stats API fails', async () => {
      vi.mocked(api.getProjectStats).mockRejectedValue(
        new Error('Failed to load stats')
      );

      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load stats')).toBeInTheDocument();
      });
    });

    it('should show error message when sessions API fails', async () => {
      const user = userEvent.setup();
      vi.mocked(api.getProjectSessions).mockRejectedValue(
        new Error('Failed to load sessions')
      );

      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sessions'));

      await waitFor(() => {
        expect(screen.getByText('Failed to load sessions')).toBeInTheDocument();
      });
    });

    it('should show error message when files API fails', async () => {
      const user = userEvent.setup();
      vi.mocked(api.getProjectFiles).mockRejectedValue(
        new Error('Failed to load files')
      );

      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Files')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Files'));

      await waitFor(() => {
        expect(screen.getByText('Failed to load files')).toBeInTheDocument();
      });
    });
  });
});
