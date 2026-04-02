import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer, {
  addUserMessage, clearChat, clearError, sendMessage,
} from '../../features/chat/chatSlice';

const makeStore = (preloadedState) =>
  configureStore({ reducer: { chat: chatReducer }, preloadedState });

const baseState = () => ({
  chat: { messages: [], status: 'idle', error: null },
});

// ── addUserMessage ────────────────────────────────────────────────────────────
describe('addUserMessage', () => {
  it('adds a user message', () => {
    const store = makeStore(baseState());
    store.dispatch(addUserMessage('Hello'));
    const msgs = store.getState().chat.messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].content).toBe('Hello');
  });

  it('message has id and timestamp', () => {
    const store = makeStore(baseState());
    store.dispatch(addUserMessage('Hi'));
    const msg = store.getState().chat.messages[0];
    expect(msg.id).toBeDefined();
    expect(msg.timestamp).toBeDefined();
  });

  it('clears error on dispatch', () => {
    const state = baseState();
    state.chat.error = 'some error';
    const store = makeStore(state);
    store.dispatch(addUserMessage('Hi'));
    expect(store.getState().chat.error).toBeNull();
  });

  it('appends multiple messages', () => {
    const store = makeStore(baseState());
    store.dispatch(addUserMessage('First'));
    store.dispatch(addUserMessage('Second'));
    expect(store.getState().chat.messages).toHaveLength(2);
  });
});

// ── clearChat ─────────────────────────────────────────────────────────────────
describe('clearChat', () => {
  it('clears all messages', () => {
    const state = baseState();
    state.chat.messages = [{ id: 1, role: 'user', content: 'Hi', timestamp: '10:00' }];
    const store = makeStore(state);
    store.dispatch(clearChat());
    expect(store.getState().chat.messages).toHaveLength(0);
  });

  it('clears error', () => {
    const state = baseState();
    state.chat.error = 'err';
    const store = makeStore(state);
    store.dispatch(clearChat());
    expect(store.getState().chat.error).toBeNull();
  });
});

// ── clearError ────────────────────────────────────────────────────────────────
describe('clearError', () => {
  it('sets error to null', () => {
    const state = baseState();
    state.chat.error = 'Something went wrong';
    const store = makeStore(state);
    store.dispatch(clearError());
    expect(store.getState().chat.error).toBeNull();
  });
});

// ── sendMessage thunk ─────────────────────────────────────────────────────────
describe('sendMessage thunk', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sets status to loading on pending', () => {
    const store = makeStore(baseState());
    store.dispatch(sendMessage.pending('', 'hi'));
    expect(store.getState().chat.status).toBe('loading');
    expect(store.getState().chat.error).toBeNull();
  });

  it('adds assistant message and sets idle on fulfilled', () => {
    const store = makeStore(baseState());
    store.dispatch(sendMessage.fulfilled('Hello there!', '', 'hi'));
    const state = store.getState().chat;
    expect(state.status).toBe('idle');
    const last = state.messages[state.messages.length - 1];
    expect(last.role).toBe('assistant');
    expect(last.content).toBe('Hello there!');
  });

  it('sets error and idle on rejected', () => {
    const store = makeStore(baseState());
    store.dispatch(sendMessage.rejected(null, '', 'hi', 'Network error'));
    expect(store.getState().chat.status).toBe('idle');
    expect(store.getState().chat.error).toBe('Network error');
  });

  it('uses fallback error when payload is undefined', () => {
    const store = makeStore(baseState());
    store.dispatch(sendMessage.rejected(null, '', 'hi', undefined));
    expect(store.getState().chat.error).toBe('Something went wrong. Please try again.');
  });

  it('dispatches fulfilled with answer from fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ body: 'AI response' }),
    });
    const store = makeStore(baseState());
    await store.dispatch(sendMessage('hello'));
    const msgs = store.getState().chat.messages;
    const assistant = msgs.find((m) => m.role === 'assistant');
    expect(assistant).toBeDefined();
    expect(assistant.content).toBe('AI response');
  });

  it('rejects when fetch response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    });
    const store = makeStore(baseState());
    await store.dispatch(sendMessage('hello'));
    expect(store.getState().chat.error).toContain('500');
  });

  it('rejects when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
    const store = makeStore(baseState());
    await store.dispatch(sendMessage('hello'));
    expect(store.getState().chat.error).toBeTruthy();
  });

  it('rejects when VITE_API_URL is not set', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const store = makeStore(baseState());
    await store.dispatch(sendMessage('hello'));
    expect(store.getState().chat.error).toBe('API endpoint is not configured.');
    vi.stubEnv('VITE_API_URL', 'https://mock-api.example.com/Stage/');
  });
});
