import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InputArea from '../../components/InputArea';

const renderInput = (props = {}) => {
  const defaults = {
    input: '',
    setInput: vi.fn(),
    onSend: vi.fn(),
    status: 'idle',
    isMobile: false,
  };
  return render(<InputArea {...defaults} {...props} />);
};

describe('InputArea', () => {
  it('renders textarea', () => {
    renderInput();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows desktop placeholder on desktop', () => {
    renderInput({ isMobile: false });
    expect(screen.getByPlaceholderText('Message NexusAI… (Enter to send)')).toBeInTheDocument();
  });

  it('shows mobile placeholder on mobile', () => {
    renderInput({ isMobile: true });
    expect(screen.getByPlaceholderText('Message NexusAI…')).toBeInTheDocument();
  });

  it('calls setInput when typing', () => {
    const setInput = vi.fn();
    renderInput({ setInput });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(setInput).toHaveBeenCalled();
  });

  it('calls onSend when send button is clicked', () => {
    const onSend = vi.fn();
    renderInput({ input: 'hello', onSend });
    fireEvent.click(screen.getByTitle('Send message'));
    expect(onSend).toHaveBeenCalled();
  });

  it('send button is disabled when input is empty', () => {
    renderInput({ input: '' });
    expect(screen.getByTitle('Send message')).toBeDisabled();
  });

  it('send button is disabled when status is loading', () => {
    renderInput({ input: 'hello', status: 'loading' });
    expect(screen.getByTitle('Send message')).toBeDisabled();
  });

  it('textarea is disabled when status is loading', () => {
    renderInput({ status: 'loading' });
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('calls onSend on Enter key (no shift)', () => {
    const onSend = vi.fn();
    renderInput({ input: 'hello', onSend });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalled();
  });

  it('does not call onSend on Shift+Enter', () => {
    const onSend = vi.fn();
    renderInput({ input: 'hello', onSend });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('renders mic button when speech is supported', () => {
    renderInput();
    expect(screen.getByTitle('Voice input')).toBeInTheDocument();
  });

  it('shows listening indicator when mic is active', () => {
    renderInput();
    fireEvent.click(screen.getByTitle('Voice input'));
    expect(screen.getByText('Listening… speak now')).toBeInTheDocument();
  });

  it('shows Stop recording title when listening', () => {
    renderInput();
    fireEvent.click(screen.getByTitle('Voice input'));
    expect(screen.getByTitle('Stop recording')).toBeInTheDocument();
  });
});
