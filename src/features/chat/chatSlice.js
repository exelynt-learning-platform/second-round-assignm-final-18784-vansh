import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const timestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Generates a concise, meaningful title from the first user prompt
const generateTitle = (text) => {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  // If short enough, use as-is
  if (cleaned.length <= 40) return cleaned;
  // Try to cut at a sentence boundary within 40 chars
  const sentenceEnd = cleaned.search(/[.!?]/);
  if (sentenceEnd > 8 && sentenceEnd <= 40) return cleaned.slice(0, sentenceEnd + 1);
  // Cut at last word boundary before 40 chars
  const cut = cleaned.slice(0, 40);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 8 ? cut.slice(0, lastSpace) : cut) + '…';
};

const newSession = (id) => ({
  id,
  title: 'New Chat',
  createdAt: Date.now(),
  messages: [],
});

const loadState = () => {
  try {
    const raw = localStorage.getItem('nexusai_state');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saved = loadState();
const defaultSessionId = Date.now().toString();

const initialState = saved || {
  sessions: { [defaultSessionId]: newSession(defaultSessionId) },
  currentSessionId: defaultSessionId,
  status: 'idle',
  error: null,
};

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ userText, sessionId }, { rejectWithValue }) => {
    try {
      const API_URL = import.meta.env.DEV
        ? '/api/Stage/'
        : (import.meta.env.VITE_API_URL ?? 'https://kh7lvyb2b2.execute-api.us-east-1.amazonaws.com/Stage/');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText }),
      });
      if (!response.ok)
        return rejectWithValue(`Request failed: ${response.status} ${response.statusText}`);
      const data = await response.json();
      let answer = data.body;
      if (typeof answer === 'string') {
        try {
          const parsed = JSON.parse(answer);
          answer = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        } catch {
          answer = answer.replace(/^\"|\"$/g, '').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        }
      }
      return { answer, sessionId };
    } catch {
      return rejectWithValue('Network error. Please check your internet connection and try again.');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage: (state, action) => {
      const { text, sessionId } = action.payload;
      const session = state.sessions[sessionId];
      if (!session) return;
      session.messages.push({ id: Date.now(), role: 'user', content: text, timestamp: timestamp() });
      // Set title from first message using smart generator
      if (session.messages.length === 1) {
        session.title = generateTitle(text);
      }
      state.error = null;
    },
    newChat: (state) => {
      const id = Date.now().toString();
      state.sessions[id] = newSession(id);
      state.currentSessionId = id;
      state.error = null;
      state.status = 'idle';
    },
    switchSession: (state, action) => {
      state.currentSessionId = action.payload;
      state.error = null;
      state.status = 'idle';
    },
    deleteSession: (state, action) => {
      const id = action.payload;
      delete state.sessions[id];
      const ids = Object.keys(state.sessions);
      if (ids.length === 0) {
        const newId = Date.now().toString();
        state.sessions[newId] = newSession(newId);
        state.currentSessionId = newId;
      } else if (state.currentSessionId === id) {
        state.currentSessionId = ids[ids.length - 1];
      }
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.status = 'idle';
        const { answer, sessionId } = action.payload;
        const session = state.sessions[sessionId];
        if (session) {
          session.messages.push({ id: Date.now(), role: 'assistant', content: answer, timestamp: timestamp() });
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload || 'Something went wrong. Please try again.';
      });
  },
});

export const { addUserMessage, newChat, switchSession, deleteSession, clearError } = chatSlice.actions;
export default chatSlice.reducer;
