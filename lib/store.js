import {configureStore} from '@reduxjs/toolkit';
import {copySettings, ctxReducer} from '../features/ctxSlice';

export const store = configureStore({
  reducer: {ctx: ctxReducer},
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// 在需要实时状态的地方使用：
// 1. const {store} = useContext(ReactReduxContext);
// 2. ctx(store).XXX 访问字段
export function ctx(store) {
  return store.getState().ctx;
}

// 监听 store 变更，将 settings 写入 local storage
store.subscribe(() => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const settings = copySettings(ctx(store));
    settings.hideRightEditor = settings.hideRightEditor ? true : 0;
    localStorage.setItem('settings', JSON.stringify(settings));
  } catch (err) {
    console.error(err);
  }
});
