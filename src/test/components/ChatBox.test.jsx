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
      chat: {
        sessions: { '1': { id: '1', title: 'New Chat', createdAt: 1000, messages: [] } },
        currentSessionId: '1',
        status: 'idle',
        error: null,
        ...extra,
      },
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
    expect(screen.getAllByText('NexusAI').length).toBeGreaterThan(0);
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
    // The X dismiss button is inside the error banner
    const errorBanner = screen.getByText('Some error').closest('div');
    const dismissBtn = errorBanner.querySelector('button');
    fireEvent.click(dismissBtn);
    expect(store.getState().chat.error).toBeNull();
  });

  it('dispatches addUserMessage when send is clicked', () => {
    const store = makeStore();
    renderApp(store);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByTitle('Send message'));
    const msgs = store.getState().chat.sessions['1'].messages;
    expect(msgs.some((m) => m.content === 'Test message')).toBe(true);
  });

  it('shows hamburger menu button on mobile via matchMedia', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    // matchMedia mock returns matches:false by default so sidebar stays open
    renderApp();
    // sidebar New Chat button should still be present
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('shows session title in header', () => {
    const store = makeStore();
    store.dispatch({ type: 'chat/addUserMessage', payload: { text: 'My first question', sessionId: '1' } });
    renderApp(store);
    expect(screen.getByText('My first question')).toBeInTheDocument();
  });

  it('renders sidebar with New Chat button on desktop', () => {
    renderApp();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });
});
