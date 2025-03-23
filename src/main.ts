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

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: '', component: HomeComponent },
  { path: 'auth', component: LoginComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'profesor-dashboard', component: ProfesorDashboardComponent },
  { path: 'student-dashboard', component: StudentDashboardComponent },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
  ],
});
