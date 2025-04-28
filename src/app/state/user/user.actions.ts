import { createAction, props } from '@ngrx/store';
import { User } from '../../models/user.model';

export const loadUserProfile = createAction('[User] Load Profile');
export const loadUserProfileSuccess = createAction(
  '[User] Load Profile Success',
  props<{ user: User }>()
);
export const updateUserProfile = createAction(
  '[User] Update Profile',
  props<{ user: Partial<User> }>()
);

export const updateUserProfileSuccess = createAction(
  '[User] Update Profile Success',
  props<{ user: User }>()
);
export const userProfileFailure = createAction(
  '[User] Profile Failure',
  props<{ error: string }>()
);
