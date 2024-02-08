import {createSlice} from '@reduxjs/toolkit';

export const ctxSlice = createSlice({
  name: 'ctx',
  initialState: {
    // 状态栏文案
    statusBar: {},
    // 左侧编辑器
    leftEditor: null,
    // 右侧编辑器
    rightEditor: null,
    // 聚焦在左侧编辑器吗？
    focusLeft: true,
    // 加载的 web worker
    worker: null,
    // 编辑器最后执行的动作
    lastAction: null,
  },
  reducers: {
    setStatusBar: (state, action) => {
      state.statusBar = action.payload;
    },
    setLeftEditor: (state, action) => {
      state.leftEditor = action.payload;
    },
    setRightEditor: (state, action) => {
      state.rightEditor = action.payload;
    },
    setFocusLeft: (state) => {
      state.focusLeft = true;
    },
    setFocusRight: (state) => {
      state.focusLeft = false;
    },
    setWorker: (state, action) => {
      state.worker = action.payload;
    },
    setLastAction: (state, action) => {
      state.lastAction = action.payload;
    },
  },
});
