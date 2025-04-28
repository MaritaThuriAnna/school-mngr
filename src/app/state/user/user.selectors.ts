import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './user.reducer';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectUserProfile = createSelector(
  selectUserState,
  (state: UserState) => state?.user
);