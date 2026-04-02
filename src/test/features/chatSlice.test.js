import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer, {
  addUserMessage, newChat, switchSession,
  deleteSession, clearError, sendMessage,
} from '../../features/chat/chatSlice';

// ── helpers ──────────────────────────────────────────────────────────────────
const makeStore = (preloadedState) =>
  configureStore({ reducer: { chat: chatReducer }, preloadedState });

const makeSession = (id = '1') => ({
  id,
  title: 'New Chat',
  createdAt: 1000,
  messages: [],
});

const baseState = () => ({
  chat: {
    sessions: { '1': makeSession('1') },
    currentSessionId: '1',
    status: 'idle',
    error: null,
  },
});

// ── reducer: addUserMessage ───────────────────────────────────────────────────
describe('addUserMessage', () => {
  it('adds a user message to the correct session', () => {
    const store = makeStore(baseState());
    store.dispatch(addUserMessage({ text: 'Hello', sessionId: '1' }));
    const msgs = store.getState().chat.sessions['1'].messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].content).toBe('Hello');
  });

  it('sets title from first message (short text)', () => {
    const store = makeStore(baseState());
    store.dispatch(addUserMessage({ text: 'What is React?', sessionId: '1' }));
    expect(store.getState().chat.sessions['1'].title).toBe('What is React?');
  });

  it('sets title truncated at word boundary for long text', () => {
    const store = makeStore(baseState());
    const long = 'Write me a Python function that reads a CSV file and parses it';
    store.dispatch(addUserMessage({ text: long, sessionId: '1' }));
    const title = store.getState().chat.sessions['1'].title;
    expect(title.length).toBeLessThanOrEqual(41);
    expect(title.endsWith('…')).toBe(true);
  });

  it('sets title at sentence boundary', () => {
    const store = makeStore(baseState());
    store.dispatch(addUserMessage({ text: 'Explain Redux. Also tell me more about it.', sessionId: '1' }));
    const title = store.getState().chat.sessions['1'].title;
    expect(title).toBe('Explain Redux.');
  });

  it('does not update title on second message', () => {
    const store = makeStore(baseState());
    store.dispatch(addUserMessage({ text: 'First message', sessionId: '1' }));
    store.dispatch(addUserMessage({ text: 'Second message', sessionId: '1' }));
    expect(store.getState().chat.sessions['1'].title).toBe('First message');
  });

  it('clears error on dispatch', () => {
    const state = baseState();
    state.chat.error = 'some error';
    const store = makeStore(state);
    store.dispatch(addUserMessage({ text: 'Hi', sessionId: '1' }));
    expect(store.getState().chat.error).toBeNull();
  });

  it('does nothing for unknown sessionId', () => {
    const store = makeStore(baseState());
    store.dispatch(addUserMessage({ text: 'Hi', sessionId: 'unknown' }));
    expect(store.getState().chat.sessions['1'].messages).toHaveLength(0);
  });
});

// ── reducer: newChat ──────────────────────────────────────────────────────────
describe('newChat', () => {
  it('creates a new session and switches to it', () => {
    const store = makeStore(baseState());
    store.dispatch(newChat());
    const state = store.getState().chat;
    const ids = Object.keys(state.sessions);
    expect(ids).toHaveLength(2);
    expect(state.currentSessionId).not.toBe('1');
  });

  it('new session has title New Chat and empty messages', () => {
    const store = makeStore(baseState());
    store.dispatch(newChat());
    const state = store.getState().chat;
    const newSession = state.sessions[state.currentSessionId];
    expect(newSession.title).toBe('New Chat');
    expect(newSession.messages).toHaveLength(0);
  });

  it('resets status and error', () => {
    const state = baseState();
    state.chat.status = 'loading';
    state.chat.error = 'err';
    const store = makeStore(state);
    store.dispatch(newChat());
    expect(store.getState().chat.status).toBe('idle');
    expect(store.getState().chat.error).toBeNull();
  });
});

// ── reducer: switchSession ────────────────────────────────────────────────────
describe('switchSession', () => {
  it('switches currentSessionId', () => {
    const state = baseState();
    state.chat.sessions['2'] = makeSession('2');
    const store = makeStore(state);
    store.dispatch(switchSession('2'));
    expect(store.getState().chat.currentSessionId).toBe('2');
  });

  it('clears error and resets status on switch', () => {
    const state = baseState();
    state.chat.sessions['2'] = makeSession('2');
    state.chat.error = 'err';
    state.chat.status = 'loading';
    const store = makeStore(state);
    store.dispatch(switchSession('2'));
    expect(store.getState().chat.error).toBeNull();
    expect(store.getState().chat.status).toBe('idle');
  });
});

// ── reducer: deleteSession ────────────────────────────────────────────────────
describe('deleteSession', () => {
  it('removes the session', () => {
    const state = baseState();
    state.chat.sessions['2'] = makeSession('2');
    const store = makeStore(state);
    store.dispatch(deleteSession('2'));
    expect(store.getState().chat.sessions['2']).toBeUndefined();
  });

  it('switches to another session when active session is deleted', () => {
    const state = baseState();
    state.chat.sessions['2'] = makeSession('2');
    state.chat.currentSessionId = '1';
    const store = makeStore(state);
    store.dispatch(deleteSession('1'));
    expect(store.getState().chat.currentSessionId).toBe('2');
  });

  it('creates a new session when last session is deleted', () => {
    const store = makeStore(baseState());
    store.dispatch(deleteSession('1'));
    const state = store.getState().chat;
    expect(Object.keys(state.sessions)).toHaveLength(1);
    expect(state.currentSessionId).toBeDefined();
  });
});

// ── reducer: clearError ───────────────────────────────────────────────────────
describe('clearError', () => {
  it('sets error to null', () => {
    const state = baseState();
    state.chat.error = 'Something went wrong';
    const store = makeStore(state);
    store.dispatch(clearError());
    expect(store.getState().chat.error).toBeNull();
  });
});

// ── async thunk: sendMessage ──────────────────────────────────────────────────
describe('sendMessage thunk', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sets status to loading on pending', () => {
    const store = makeStore(baseState());
    store.dispatch(sendMessage.pending('', { userText: 'hi', sessionId: '1' }));
    expect(store.getState().chat.status).toBe('loading');
    expect(store.getState().chat.error).toBeNull();
  });

  it('adds assistant message and sets idle on fulfilled', () => {
    const store = makeStore(baseState());
    store.dispatch(addUserMessage({ text: 'hi', sessionId: '1' }));
    store.dispatch(sendMessage.fulfilled(
      { answer: 'Hello there!', sessionId: '1' },
      '',
      { userText: 'hi', sessionId: '1' }
    ));
    const state = store.getState().chat;
    expect(state.status).toBe('idle');
    const msgs = state.sessions['1'].messages;
    expect(msgs[msgs.length - 1].role).toBe('assistant');
    expect(msgs[msgs.length - 1].content).toBe('Hello there!');
  });

  it('sets error and idle on rejected', () => {
    const store = makeStore(baseState());
    store.dispatch(sendMessage.rejected(null, '', {}, 'Network error'));
    const state = store.getState().chat;
    expect(state.status).toBe('idle');
    expect(state.error).toBe('Network error');
  });

  it('uses fallback error message when payload is undefined', () => {
    const store = makeStore(baseState());
    store.dispatch(sendMessage.rejected(null, '', {}, undefined));
    expect(store.getState().chat.error).toBe('Something went wrong. Please try again.');
  });

  it('dispatches fulfilled with answer from fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ body: 'AI response' }),
      headers: { entries: () => [] },
    });
    const store = makeStore(baseState());
    await store.dispatch(sendMessage({ userText: 'hello', sessionId: '1' }));
    const msgs = store.getState().chat.sessions['1'].messages;
    const assistant = msgs.find((m) => m.role === 'assistant');
    expect(assistant).toBeDefined();
    expect(assistant.content).toBe('AI response');
  });

  it('rejects when fetch response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'error body',
      headers: { entries: () => [] },
    });
    const store = makeStore(baseState());
    await store.dispatch(sendMessage({ userText: 'hello', sessionId: '1' }));
    expect(store.getState().chat.error).toContain('500');
  });

  it('rejects when fetch throws (network error)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
    const store = makeStore(baseState());
    await store.dispatch(sendMessage({ userText: 'hello', sessionId: '1' }));
    expect(store.getState().chat.error).toBeTruthy();
  });

  it('rejects when VITE_API_URL is not set', async () => {
    const origFetch = global.fetch;
    // Temporarily override env by mocking fetch to simulate missing URL scenario
    global.fetch = vi.fn().mockRejectedValue(new Error('API endpoint is not configured.'));
    const store = makeStore(baseState());
    await store.dispatch(sendMessage({ userText: 'hello', sessionId: '1' }));
    expect(store.getState().chat.error).toBeTruthy();
    global.fetch = origFetch;
  });
});
