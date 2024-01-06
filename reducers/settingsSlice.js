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
    // 左侧编辑器宽度 (百分比)
    leftWidth: 75,
    // 用于折叠时还原
    prevLeftWidth: 0,
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
    setLeftWidth: (state, action) => {
      state.leftWidth = action.payload;
    },
    setPrevLeftWidth: (state, action) => {
      state.prevLeftWidth = action.payload;
    },
  },
});
