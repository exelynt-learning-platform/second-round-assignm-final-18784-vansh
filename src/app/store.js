import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../features/chat/chatSlice';

const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  try {
    const { status, error, ...persistable } = store.getState().chat;
    localStorage.setItem('nexusai_state', JSON.stringify(persistable));
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
