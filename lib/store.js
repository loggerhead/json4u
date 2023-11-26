"use client";
import {configureStore} from '@reduxjs/toolkit';
import ctxReducer from '../features/ctxSlice';

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
    const c = ctx(store);
    const settings = JSON.stringify({
      enableAutoFormat: c.enableAutoFormat,
      enableAutoSort: c.enableAutoSort,
      enableNestParse: c.enableNestParse,
      hideRightEditor: c.hideRightEditor ? true : 0,
    });
    localStorage.setItem('settings', settings);
  } catch (err) {
    console.error(err);
  }
});
