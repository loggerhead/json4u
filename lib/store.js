import {configureStore} from '@reduxjs/toolkit';
import ctxReducer from '../features/ctxSlice';

export default configureStore({
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
