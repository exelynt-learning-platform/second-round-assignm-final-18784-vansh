import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageList from '../../components/MessageList';

const userMsg   = { id: 1, role: 'user',      content: 'Hello there',        timestamp: '10:00' };
const assistMsg = { id: 2, role: 'assistant',  content: 'Hi! How can I help?', timestamp: '10:01' };
const codeMsg   = { id: 3, role: 'assistant',  content: '```js\nconsole.log("hi")\n```', timestamp: '10:02' };

describe('MessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no messages and status is idle', () => {
    render(<MessageList messages={[]} status="idle" />);
    expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
  });

  it('does not show empty state when status is loading', () => {
    render(<MessageList messages={[]} status="loading" />);
    expect(screen.queryByText('How can I help you today?')).toBeNull();
  });

  it('renders user message content', () => {
    render(<MessageList messages={[userMsg]} status="idle" />);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('renders assistant message content', () => {
    render(<MessageList messages={[assistMsg]} status="idle" />);
    expect(screen.getByText(/Hi! How can I help/)).toBeInTheDocument();
  });

  it('renders timestamps', () => {
    render(<MessageList messages={[userMsg]} status="idle" />);
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('shows typing indicator when status is loading', () => {
    render(<MessageList messages={[]} status="loading" />);
    expect(screen.getByText('NexusAI is thinking…')).toBeInTheDocument();
  });

  it('does not show typing indicator when status is idle', () => {
    render(<MessageList messages={[userMsg]} status="idle" />);
    expect(screen.queryByText('NexusAI is thinking…')).toBeNull();
  });

  it('renders multiple messages', () => {
    render(<MessageList messages={[userMsg, assistMsg]} status="idle" />);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText(/Hi! How can I help/)).toBeInTheDocument();
  });

  it('shows Copy button on assistant messages', () => {
    render(<MessageList messages={[assistMsg]} status="idle" />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('does not show Copy button on user messages', () => {
    render(<MessageList messages={[userMsg]} status="idle" />);
    expect(screen.queryByText('Copy')).toBeNull();
  });

  it('copies text and shows Copied! feedback', async () => {
    render(<MessageList messages={[assistMsg]} status="idle" />);
    fireEvent.click(screen.getByText('Copy'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(assistMsg.content);
    await waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());
  });

  it('renders code blocks for assistant messages', () => {
    render(<MessageList messages={[codeMsg]} status="idle" />);
    expect(document.querySelector('pre')).toBeInTheDocument();
  });
});
