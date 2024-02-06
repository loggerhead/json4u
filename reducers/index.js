import {ctxSlice} from './ctxSlice';
import {settingsSlice} from './settingsSlice';

export const {
  setLastAction,
  setStatusBar,
  setLeftEditor,
  setRightEditor,
  setFocusLeft,
  setFocusRight,
  setWorker,
} = ctxSlice.actions;

export const {
  switchAutoFormat,
  switchAutoSort,
  switchNestParse,
  setLeftWidth,
} = settingsSlice.actions;
