import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../../features/chat/chatSlice';
import Sidebar from '../../components/Sidebar';

const session1 = { id: '1', title: 'First Chat', createdAt: 2000, messages: [] };
const session2 = { id: '2', title: 'Second Chat', createdAt: 1000, messages: [] };

const makeStore = (sessions = { '1': session1 }, currentId = '1') =>
  configureStore({
    reducer: { chat: chatReducer },
    preloadedState: {
      chat: { sessions, currentSessionId: currentId, status: 'idle', error: null },
    },
  });

const renderSidebar = (props = {}) => {
  const store = props.store ?? makeStore();
  const onClose = props.onClose ?? vi.fn();
  const defaults = {
    sessions: { '1': session1 },
    currentId: '1',
    isMobile: false,
    isOpen: true,
    onClose,
  };
  return {
    store,
    onClose,
    ...render(
      <Provider store={store}>
        <Sidebar {...defaults} {...props} onClose={onClose} />
      </Provider>
    ),
  };
};

describe('Sidebar', () => {
  it('renders NexusAI brand name', () => {
    renderSidebar();
    expect(screen.getByText('NexusAI')).toBeInTheDocument();
  });

  it('renders New Chat button', () => {
    renderSidebar();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('renders session titles', () => {
    const store = makeStore({ '1': session1, '2': session2 });
    renderSidebar({ sessions: { '1': session1, '2': session2 }, store });
    expect(screen.getByText('First Chat')).toBeInTheDocument();
    expect(screen.getByText('Second Chat')).toBeInTheDocument();
  });

  it('dispatches newChat when New Chat is clicked', () => {
    const { store } = renderSidebar();
    const before = Object.keys(store.getState().chat.sessions).length;
    fireEvent.click(screen.getByText('New Chat'));
    expect(Object.keys(store.getState().chat.sessions).length).toBe(before + 1);
  });

  it('dispatches switchSession when a session is clicked', () => {
    const store = makeStore({ '1': session1, '2': session2 }, '1');
    renderSidebar({ sessions: { '1': session1, '2': session2 }, currentId: '1', store });
    fireEvent.click(screen.getByText('Second Chat'));
    expect(store.getState().chat.currentSessionId).toBe('2');
  });

  it('dispatches deleteSession when trash icon is clicked', () => {
    const store = makeStore({ '1': session1, '2': session2 }, '1');
    renderSidebar({ sessions: { '1': session1, '2': session2 }, currentId: '1', store });
    const sessionEl = screen.getByText('Second Chat').closest('div[class]');
    const deleteBtn = sessionEl.querySelector('button');
    fireEvent.click(deleteBtn);
    expect(store.getState().chat.sessions['2']).toBeUndefined();
  });

  it('shows mobile close button when isMobile=true', () => {
    renderSidebar({ isMobile: true, isOpen: true });
    const closeBtn = document.querySelector('aside button[class*="absolute"]');
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls onClose when mobile close button is clicked', () => {
    const onClose = vi.fn();
    renderSidebar({ isMobile: true, isOpen: true, onClose });
    const closeBtn = document.querySelector('aside button[class*="absolute"]');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows backdrop when isMobile=true and isOpen=true', () => {
    renderSidebar({ isMobile: true, isOpen: true });
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    renderSidebar({ isMobile: true, isOpen: true, onClose });
    const backdrop = document.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not show backdrop when isMobile=false', () => {
    renderSidebar({ isMobile: false });
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeNull();
  });

  it('calls onClose after session switch on mobile', () => {
    const onClose = vi.fn();
    const store = makeStore({ '1': session1, '2': session2 }, '1');
    renderSidebar({ sessions: { '1': session1, '2': session2 }, currentId: '1', store, isMobile: true, isOpen: true, onClose });
    fireEvent.click(screen.getByText('Second Chat'));
    expect(onClose).toHaveBeenCalled();
  });
});
