import { createReducer, on } from '@ngrx/store';
import * as UserActions from './user.actions';
import { User } from '../../models/user.model';

export interface UserState {
  user: User | null;
  error: string | null;
  loading: boolean;
}

export const initialState: UserState = {
  user: null,
  error: null,
  loading: false,
};

export const userReducer = createReducer(
  initialState,

  on(UserActions.loadUser, (state) => ({
    ...state,
    loading: true,
  })),

  on(UserActions.loadUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
  })),

  on(UserActions.loadUserFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),

  on(UserActions.updateUser, (state) => ({
    ...state,
    loading: true,
  })),

  on(UserActions.updateUserSuccess, (state, { user }) => ({
    ...state,
    loading: false,
  })),

  on(UserActions.updateUserFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  }))
);
