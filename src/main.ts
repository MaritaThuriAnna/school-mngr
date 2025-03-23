import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from './app/environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: '', component: LoginComponent },
      // { path: 'admin-dashboard', component: AdminComponent, canActivate: [AuthGuard] },
      // { path: 'profesor-dashboard', component: ProfesorComponent, canActivate: [AuthGuard] },
      // { path: 'student-dashboard', component: StudentComponent, canActivate: [AuthGuard] },
      { path: '**', redirectTo: '' }
    ]),
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFireAuthModule,
      AngularFirestoreModule
    )
  ]
});
