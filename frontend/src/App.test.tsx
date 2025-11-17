/**
 * Tests for the root App component with routing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import * as apiSetup from '@/lib/api-setup';

// Mock the api-setup module
vi.mock('@/lib/api-setup', () => ({
  checkSetupStatus: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    // Mock checkSetupStatus to return that onboarding is complete
    vi.mocked(apiSetup.checkSetupStatus).mockResolvedValue({
      needs_onboarding: false,
      organization_count: 1,
      workspace_count: 1,
    });
  });

  it('renders navigation header', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CatSyphon')).toBeInTheDocument();
    });
  });

  it('renders Conversations navigation link', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      const conversationsLink = screen.getByText('Conversations');
      expect(conversationsLink).toBeInTheDocument();
      expect(conversationsLink.closest('a')).toHaveAttribute('href', '/conversations');
    });
  });

  it('renders Ingestion navigation link', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      const ingestionLink = screen.getByText('Ingestion');
      expect(ingestionLink).toBeInTheDocument();
      expect(ingestionLink.closest('a')).toHaveAttribute('href', '/ingestion');
    });
  });

  it('renders CatSyphon brand link to home', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      const brandLink = screen.getByText('CatSyphon');
      expect(brandLink.closest('a')).toHaveAttribute('href', '/');
    });
  });

  it('has proper semantic HTML structure', async () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.querySelector('nav')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });

  it('applies correct CSS classes for layout', async () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('min-h-screen', 'bg-background');
    });
  });
});
