import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import * as UserActions from './user.actions';
import { User } from '../../models/user.model';

@Injectable()
export class UserEffects {

  private actions$ = inject(Actions);

  loadUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUserProfile),
      switchMap(() => {
        console.log('Effect: Loading user profile...');
        return from(this.authService.getCurrentUserData()).pipe(
          tap(user => console.log('Effect: User data from authService:', user)),
          map((user: User) => UserActions.loadUserProfileSuccess({ user })),
          catchError((error) => {
            console.error('Effect: Error loading user:', error);
            return of(UserActions.userProfileFailure({ error: error.message }));
          })
        );
      })
    )
  );

  updateUserProfile$ = createEffect(() =>
        this.actions$.pipe(
          ofType(UserActions.updateUserProfile),
          switchMap(({ user }) =>
            from(this.authService.updateUserProfile(user)).pipe(
              map(() => UserActions.updateUserProfileSuccess({ user: user as User })),
              catchError((error) => of(UserActions.userProfileFailure({ error: error.message })))
            )
          )
        )
      );

  constructor(private authService: AuthService) {}
}
