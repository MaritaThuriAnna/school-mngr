import { createReducer, on } from '@ngrx/store';
import { loadUserProfileSuccess, updateUserProfileSuccess, userProfileFailure } from './user.actions';
import { User } from '../../models/user.model';

export interface UserState {
    user: User | null;
    error: string | null;
}

export const initialState: UserState = {
    user: null,
    error: null,
};

export const userReducer = createReducer(
    initialState,
    on(loadUserProfileSuccess, (state, { user }) => ({ ...state, user, error: null })),
    on(updateUserProfileSuccess, (state, { user }) => ({
        ...state,
        user: { ...state.user, ...user } as User, // Merge with existing user
        error: null
    })),
    on(userProfileFailure, (state, { error }) => ({ ...state, user: null, error }))
);