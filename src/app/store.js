import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../features/chat/chatSlice';

const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  const { status, messages } = store.getState().chat;
  if (status === 'loading') return result;
  try {
    localStorage.setItem('nexusai_messages', JSON.stringify(messages));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      try {
        localStorage.setItem('nexusai_messages', JSON.stringify(messages.slice(-20)));
      } catch { /* storage unavailable */ }
    }
  }
  return result;
};

const store = configureStore({
  reducer: { chat: chatReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: true }).concat(localStorageMiddleware),
  devTools: import.meta.env.DEV === true,
});

export default store;
