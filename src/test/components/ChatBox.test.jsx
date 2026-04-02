import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../../features/chat/chatSlice';
import ChatBox from '../../components/ChatBox';

const makeStore = (extra = {}) =>
  configureStore({
    reducer: { chat: chatReducer },
    preloadedState: {
      chat: { messages: [], status: 'idle', error: null, ...extra },
    },
  });

const renderApp = (storeOverride) => {
  const store = storeOverride ?? makeStore();
  return { store, ...render(<Provider store={store}><ChatBox /></Provider>) };
};

describe('ChatBox', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
  });

  it('renders NexusAI header', () => {
    renderApp();
    expect(screen.getByText('NexusAI')).toBeInTheDocument();
  });

  it('shows Online status when idle', () => {
    renderApp();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows Generating status when loading', () => {
    renderApp(makeStore({ status: 'loading' }));
    expect(screen.getByText('Generating…')).toBeInTheDocument();
  });

  it('shows empty state message', () => {
    renderApp();
    expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
  });

  it('shows error banner when error exists', () => {
    renderApp(makeStore({ error: 'Something went wrong' }));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('dismisses error banner on X click', () => {
    const store = makeStore({ error: 'Some error' });
    renderApp(store);
    const errorBanner = screen.getByText('Some error').closest('div');
    fireEvent.click(errorBanner.querySelector('button'));
    expect(store.getState().chat.error).toBeNull();
  });

  it('dispatches addUserMessage when send is clicked', () => {
    const store = makeStore();
    renderApp(store);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Test message' } });
    fireEvent.click(screen.getByTitle('Send message'));
    expect(store.getState().chat.messages.some((m) => m.content === 'Test message')).toBe(true);
  });

  it('clears messages when Clear button is clicked', () => {
    const store = makeStore({
      messages: [{ id: 1, role: 'user', content: 'Hi', timestamp: '10:00' }],
    });
    renderApp(store);
    fireEvent.click(screen.getByTitle('Clear chat'));
    expect(store.getState().chat.messages).toHaveLength(0);
  });

  it('renders Clear button in header', () => {
    renderApp();
    expect(screen.getByTitle('Clear chat')).toBeInTheDocument();
  });

  it('shows textarea input area', () => {
    renderApp();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
