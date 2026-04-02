import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../features/chat/chatSlice';

// Persist only after synchronous reducers settle.
// Async thunks (pending/fulfilled/rejected) all dispatch plain actions,
// so by the time next(action) returns the state is already final for that action.
// We skip saving during loading to avoid persisting a mid-flight state.
const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  try {
    const { status, error, ...persistable } = store.getState().chat;
    if (status !== 'loading') {
      localStorage.setItem('nexusai_state', JSON.stringify(persistable));
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
