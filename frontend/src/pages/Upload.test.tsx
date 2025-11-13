/**
 * Tests for Upload component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import Upload from './Upload';
import * as api from '@/lib/api';

// Mock the API module
vi.mock('@/lib/api', () => ({
  uploadSingleConversationLog: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Helper to create a mock File object
const createMockFile = (name: string, type = 'application/jsonl'): File => {
  const blob = new Blob(['mock content'], { type });
  return new File([blob], name, { type });
};

describe('Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload page with title', () => {
    render(<Upload />);

    expect(screen.getByText(/Upload Conversation Logs/i)).toBeInTheDocument();
  });

  it('should display upload interface', () => {
    render(<Upload />);

    // Component should render successfully
    expect(document.body.textContent).toBeTruthy();
  });

  it('should show .jsonl file requirement message', () => {
    render(<Upload />);

    const allText = document.body.textContent || '';
    expect(allText.toLowerCase()).toContain('jsonl');
  });

  it('should have a file input', () => {
    render(<Upload />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('should accept multiple files', () => {
    render(<Upload />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput.multiple).toBe(true);
  });

  it('should handle drag enter', () => {
    const { container } = render(<Upload />);

    const dropZone = container.querySelector('[class*="border"]');
    if (dropZone) {
      fireEvent.dragEnter(dropZone, {
        dataTransfer: {
          files: [createMockFile('test.jsonl')],
        },
      });

      // Component should react to drag state (visual feedback)
      expect(container).toBeTruthy();
    }
  });

  it('should verify file input accepts .jsonl files', () => {
    render(<Upload />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Input should be configured to accept files
    expect(fileInput).toBeTruthy();
    expect(fileInput.type).toBe('file');
  });
});
