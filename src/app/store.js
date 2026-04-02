import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../features/chat/chatSlice';

const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  try {
    const { status, messages } = store.getState().chat;
    if (status !== 'loading') {
      localStorage.setItem('nexusai_messages', JSON.stringify(messages));
    }
  } catch { /* quota exceeded — silently ignore */ }
  return result;
};

const store = configureStore({
  reducer: { chat: chatReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: true }).concat(localStorageMiddleware),
  devTools: import.meta.env.DEV,
});

export default store;
