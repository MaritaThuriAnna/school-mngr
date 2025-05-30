import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, Routes } from '@angular/router';
import { firebaseConfig } from './app/environments/environment';
import { LoginComponent } from './app/pages/login/login.component';
import { HomeComponent } from './app/pages/home/home.component';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { AdminDashboardComponent } from './app/pages/admin-dashboard/admin-dashboard.component';
import { ProfesorDashboardComponent } from './app/pages/profesor-dashboard/profesor-dashboard.component';
import { StudentDashboardComponent } from './app/pages/student-dashboard/student-dashboard.component';
import { AuthGuard } from './app/pages/login/auth.guard';
import { ProfileComponent } from './app/components/profile/profile.component';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideEffects } from '@ngrx/effects';
import { provideStore, StoreModule } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { AuthEffects } from './app/state/auth/auth.effects';
import { authReducer } from './app/state/auth/auth.reducer';
import { userReducer } from './app/state/user/user.reducer';
import { UserEffects } from './app/state/user/user.effects';
const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: '', component: HomeComponent },
  { path: 'auth', component: LoginComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'profesor-dashboard', component: ProfesorDashboardComponent,  canActivate: [AuthGuard]  },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'student-dashboard', component: StudentDashboardComponent,  canActivate: [AuthGuard]  },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    provideStorage(() => getStorage()),

    // NgRx Providers
    provideStore({ auth: authReducer, user: userReducer}),
    provideEffects([AuthEffects, UserEffects]),
    provideStoreDevtools()
  ],
});
