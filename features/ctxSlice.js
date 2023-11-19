"use client";
import {createSlice} from '@reduxjs/toolkit';

export const ctxSlice = createSlice({
  name: 'ctx',
  initialState: {
    // 启用自动格式化吗？
    enableAutoFormat: true,
    // 隐藏右侧编辑器吗？0 不隐藏、true 隐藏、false 不隐藏（平分两侧编辑器）
    hideRightEditor: 0,
    // 状态栏文案
    statusBar: {},
    // 左侧编辑器
    leftEditor: null,
    // 右侧编辑器
    rightEditor: null,
  },
  reducers: {
    switchAutoFormat: (state) => {
      state.enableAutoFormat = !state.enableAutoFormat;
    },
    switchHideRightEditor: (state) => {
      state.hideRightEditor = !state.hideRightEditor;
    },
    showRightEditor: (state) => {
      state.hideRightEditor = false;
    },
    setStatusBar: (state, action) => {
      state.statusBar = action.payload;
    },
    setLeftEditor: (state, action) => {
      state.leftEditor = action.payload;
    },
    setRightEditor: (state, action) => {
      state.rightEditor = action.payload;
    },
  },
});

export const {
  switchAutoFormat,
  switchHideRightEditor,
  showRightEditor,
  setStatusBar,
  setLeftEditor,
  setRightEditor,
} = ctxSlice.actions;

export default ctxSlice.reducer;

export function getLastEditor(ctx) {
  const [l, r] = [ctx.leftEditor, ctx.rightEditor];
  return l.focusTime() >= r.focusTime() ? l : r;
}

export function getEditor(ctx, name) {
  return name === "left" ? ctx.leftEditor : ctx.rightEditor;
}
