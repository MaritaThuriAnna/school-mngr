import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import * as AuthActions from './auth.actions';
import { Router } from '@angular/router';

@Injectable()
export class AuthEffects {

    //git link of the error
    // https://github.com/ngrx/platform/issues/3654

    private actions$ = inject(Actions);

    login$;
    logout$;
    loginSuccess$;
    constructor(
        private authService: AuthService,
        private router: Router
    ) {
        this.login$ = createEffect(() =>
            this.actions$.pipe(
                ofType(AuthActions.login),
                switchMap(({ email, password }) => {
                    return this.authService.login(email, password).pipe(
                        map(userData => AuthActions.loginSuccess({ user: userData })),
                        catchError(error => of(AuthActions.loginFailure({ error })))
                    );
                })
            )
        );

        this.logout$ = createEffect(
            () =>
                this.actions$.pipe(
                    ofType(AuthActions.logout),
                    tap(() => {
                        this.authService.logout();
                        this.router.navigate(['/auth']);
                    })
                ),
            { dispatch: false }
        );

        this.loginSuccess$ = createEffect(
            () =>
                this.actions$.pipe(
                    ofType(AuthActions.loginSuccess),
                    tap(({ user }) => {
                        console.log('Redirecting after login based on role:', user.role);
                        if (user.role === 'ADMIN') {
                            this.router.navigate(['admin-dashboard']);
                        } else if (user.role === 'PROFESOR') {
                            this.router.navigate(['profesor-dashboard']);
                        } else if (user.role === 'STUDENT') {
                            this.router.navigate(['student-dashboard']);
                        } else {
                            this.router.navigate(['home']);
                        }
                    })
                ),
            { dispatch: false }
        );
    }
}
