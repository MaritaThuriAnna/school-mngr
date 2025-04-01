import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import * as UserActions from './user.actions';

@Injectable()
export class UserEffects {
    private actions$ = inject(Actions);

    constructor(private authService: AuthService) {}

    loadUser$ = createEffect(() =>
        this.actions$.pipe(
            ofType(UserActions.loadUser),
            switchMap(() => 
                from(this.authService.getCurrentUserData()).pipe(
                    map((user) => UserActions.loadUserSuccess({ user })),
                    catchError((error) => of(UserActions.loadUserFailure({ error: error.message })))
                )
            )
        )
    );

    updateUser$ = createEffect(() =>
        this.actions$.pipe(
            ofType(UserActions.updateUser),
            switchMap(({ user }) => 
                from(this.authService.updateUserProfile(user)).pipe(
                    map(() => UserActions.updateUserSuccess({ user })),
                    catchError((error) => of(UserActions.updateUserFailure({ error: error.message })))
                )
            )
        )
    );
}
