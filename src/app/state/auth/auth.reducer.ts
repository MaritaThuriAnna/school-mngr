import { createReducer, on } from '@ngrx/store';
import { loginSuccess, loginFailure, logout } from './auth.actions';
import { initialState, AuthState } from './auth.state';

export const authReducer = createReducer(
  initialState,
  on(loginSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    role: user.role,
    error: null,
  })),
  on(loginFailure, (state, { error }) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    role: null,
    error,
  })),
  on(logout, (state) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    role: null,
    error: null,
  }))
);
