import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../features/chat/chatSlice';

const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  try {
    const { status, messages } = store.getState().chat;
    if (status !== 'loading') {
      localStorage.setItem('nexusai_messages', JSON.stringify(messages));
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      // Storage full — remove oldest messages and retry once
      try {
        const { messages } = store.getState().chat;
        const trimmed = messages.slice(-20);
        localStorage.setItem('nexusai_messages', JSON.stringify(trimmed));
      } catch { /* still full — silently give up */ }
    }
  }
  return result;
};

const store = configureStore({
  reducer: { chat: chatReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: true }).concat(localStorageMiddleware),
  devTools: import.meta.env.DEV,
});

export default store;
