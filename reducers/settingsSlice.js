import {createSlice} from '@reduxjs/toolkit';

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    // 启用自动格式化吗？
    enableAutoFormat: true,
    // 启用自动 JSON 排序吗？
    enableAutoSort: true,
    // 启用嵌套解析吗？
    enableNestParse: true,
    // 隐藏右侧编辑器吗？0 不隐藏、true 隐藏、false 不隐藏（平分两侧编辑器）
    hideRightEditor: 0,
  },
  reducers: {
    switchAutoFormat: (state) => {
      state.enableAutoFormat = !state.enableAutoFormat;
    },
    switchAutoSort: (state) => {
      state.enableAutoSort = !state.enableAutoSort;
    },
    switchNestParse: (state) => {
      state.enableNestParse = !state.enableNestParse;
    },
    switchHideRightEditor: (state) => {
      state.hideRightEditor = !state.hideRightEditor;
    },
    showRightEditor: (state) => {
      state.hideRightEditor = false;
    },
  },
});
