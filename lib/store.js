import {combineReducers, configureStore} from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import {persistReducer, persistStore} from 'redux-persist';
import {settingsSlice} from "@/reducers/settingsSlice";
import {ctxSlice} from "@/reducers/ctxSlice";
import version from "@/lib/version";

const persistConfig = {
  key: 'root',
  version: version,
  whitelist: ["settings"],
  storage,
};

const rootReducer = persistReducer(persistConfig, combineReducers({
  settings: settingsSlice.reducer,
  ctx: ctxSlice.reducer,
}));

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export function enableAutoFormatSelector(state) {
  return state.settings.enableAutoFormat;
}

export function enableAutoSortSelector(state) {
  return state.settings.enableAutoSort;
}

export function enableNestParseSelector(state) {
  return state.settings.enableNestParse;
}

export function leftWidthSelector(state) {
  return state.settings.leftWidth;
}

export function enableCmdModeSelector(state) {
  return state.ctx.enableCmdMode;
}

export function lastCmdSelector(state) {
  return state.ctx.lastCmd;
}

export function statusBarSelector(state) {
  return state.ctx.statusBar;
}

export function leftEditorSelector(state) {
  return state.ctx.leftEditor;
}

export function rightEditorSelector(state) {
  return state.ctx.rightEditor;
}

export function focusLeftSelector(state) {
  return state.ctx.focusLeft;
}

export function workerSelector(state) {
  return state.ctx.worker;
}

// 获取最后使用的 editor
export function lastEditorSelector(state) {
  return focusLeftSelector(state) ? leftEditorSelector(state) : rightEditorSelector(state);
}

// 获取另一个 editor
export function pairEditorSelector(state) {
  const thisEditor = lastEditorSelector(state);
  return thisEditor && thisEditor.isLeft() ? rightEditorSelector(state) : leftEditorSelector(state);
}
