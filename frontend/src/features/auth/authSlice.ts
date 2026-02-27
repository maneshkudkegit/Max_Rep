import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { api } from '../../lib/api';
import type { AuthUser } from '../../types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
};

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const res = await api.get<AuthUser>('/auth/me');
  return res.data;
});

export const logoutAction = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(bootstrapAuth.fulfilled, (state, action) => {
      state.user = action.payload;
      state.loading = false;
    });
    builder.addCase(bootstrapAuth.rejected, (state) => {
      state.user = null;
      state.loading = false;
    });
    builder.addCase(logoutAction.fulfilled, (state) => {
      state.user = null;
      state.loading = false;
    });
  },
});

export default slice.reducer;
