import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "school-mngr-b1fd3", appId: "1:789100474743:web:8163f9a10a5b40b79db172", storageBucket: "school-mngr-b1fd3.firebasestorage.app", apiKey: "AIzaSyDfv-YCtjXt68XnGul0LcK06eiSyMW6394", authDomain: "school-mngr-b1fd3.firebaseapp.com", messagingSenderId: "789100474743", measurementId: "G-RM337S449H" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())]
};
