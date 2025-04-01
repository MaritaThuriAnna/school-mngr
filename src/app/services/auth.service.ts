import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { doc, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';


interface AuthResponseData {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  role: 'ADMIN' | 'PROFESOR' | 'STUDENT';
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiKey = 'AIzaSyDfv-YCtjXt68XnGul0LcK06eiSyMW6394';
  user = new BehaviorSubject<User | null>(null);
  role$ = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private firestore: Firestore,
    private firestoreService: FirestoreService
  ) {
    this.autoLogin();
  }

  getId() {
    return this.user.getValue()?.id;
  }

  async getRole(): Promise<string | null> {
    if (this.role$.getValue()) {
      return this.role$.getValue();
    }

    const currentUser = this.user.getValue();
    if (currentUser) {
      const userData = await this.firestoreService.getUserDataById(currentUser.id);
      if (userData?.['role']) {
        this.role$.next(userData['role']);
        return userData['role'];
      }
    }

    return null;
  }

  signup(email: string, password: string, name: string, role: 'PROFESOR' | 'STUDENT') {
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.apiKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      )
      .pipe(
        tap(async (response) => {
          this.sendVerificationEmail(response.idToken).subscribe(() =>
            console.log('Verification mail sent!')
          );
  
          const userProfile = {
            id: response.localId,
            email,
            name,
            role,
            schoolId: 'HwIxpCjEXq9s6DlX2nJm'
          };
  
          const userDocRef = doc(this.firestore, 'User', response.localId);
          await setDoc(userDocRef, userProfile);
        })
      );
  }

  // login(email: string, password: string) {
  //   return this.http
  //     .post<AuthResponseData>(
  //       `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`,
  //       {
  //         email,
  //         password,
  //         returnSecureToken: true,
  //       }
  //     )
  //     .pipe(
  //       tap(async (response) => {
  //         this.handleAuthentication(
  //           response.email,
  //           response.localId,
  //           response.idToken,
  //           +response.expiresIn,
  //           response.role,
  //           response.name
  //         );


  //         const userDocRef = doc(this.firestore, 'User', response.localId);
  //         const userSnap = await getDoc(userDocRef);
  //         const userData = userSnap.data() as { role: string };

  //         if (userData?.role === 'ADMIN') {
  //           this.router.navigate(['admin-dashboard']);
  //         } else if (userData?.role === 'PROFESOR') {
  //           this.router.navigate(['profesor-dashboard']);
  //         } else if (userData?.role === 'STUDENT') {
  //           this.router.navigate(['student-dashboard']);
  //         } else {
  //           this.router.navigate(['/']);
  //         }
  //       })
  //     );
  // }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      )
      .pipe(
        map(response => {
          const expirationDate = new Date(new Date().getTime() + +response.expiresIn * 1000);
          
          // Safely cast the role to one of the expected types
          const role: 'ADMIN' | 'PROFESOR' | 'STUDENT' = 
            ['ADMIN', 'PROFESOR', 'STUDENT'].includes(response.role) ? response.role as 'ADMIN' | 'PROFESOR' | 'STUDENT' : 'STUDENT';
  
          const user = new User(
            response.email,
            response.localId,
            response.idToken,
            expirationDate,
            role,
            response.name || response.email.split('@')[0]
          );
          
          this.user.next(user); // Update the BehaviorSubject
          return user; // Return the mapped user object
        }),
        tap((user) => {
          this.handleAuthentication(
            user.email,
            user.id,
            user.token!,
            (user.tokenExpirationDate.getTime() - new Date().getTime()) / 1000, // Corrected getter usage
            user.role,
            user.name
          );
          localStorage.setItem('userData', JSON.stringify(user)); // Store user in local storage
        })
      );
  }

  resetPassword(email: string) {
    return this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`,
      {
        requestType: 'PASSWORD_RESET',
        email: email,
      }
    );
  }

  logout() {
    this.user.next(null);
    console.log('User logged out!');
    this.router.navigate(['/auth']);
  }

  sendVerificationEmail(idToken: string) {
    return this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`,
      {
        requestType: 'VERIFY_EMAIL',
        idToken,
      }
    );
  }

  private handleAuthentication(
    email: string,
    userId: string,
    token: string,
    expiresIn: number,
    role: 'ADMIN' | 'PROFESOR' | 'STUDENT',
    name: string
  ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate, role, name);
    this.user.next(user);
    localStorage.setItem('userData', JSON.stringify(user)); // Store user in local storage
  }

  autoLogin() {
    const userData: {
      email: string;
      id: string;
      _token: string;
      _tokenExpirationDate: string;
      role: 'ADMIN' | 'PROFESOR' | 'STUDENT';
      name: string
    } = JSON.parse(localStorage.getItem('userData')!);
    if (!userData) {
      return;
    }
    const loadedUser = new User(
      userData.email,
      userData.id,
      userData._token,
      new Date(userData._tokenExpirationDate),
      userData.role,
      userData.name
    );
    if (loadedUser.token) {
      this.user.next(loadedUser);
    }
  }

  async getCurrentUserData(): Promise<any> {
    const currentUser = this.user.getValue();
    if (!currentUser) {
      console.warn('[AuthService] No user is currently logged in.');
      return null;
    }

    console.log('[AuthService] Getting full data for user ID:', currentUser.id);
    const userData = await this.firestoreService.getUserDataById(currentUser.id);

    if (userData) {
      console.log('[AuthService] Full user data retrieved:', userData);
      return userData;
    } else {
      console.warn('[AuthService] User data not found in Firestore.');
      return null;
    }
  }

  updateUserProfile(user: any): Promise<void> {
    console.log('[AuthService] Updating user profile:', user);

    // Filter out undefined or empty fields
    const filteredUser = Object.keys(user).reduce((acc, key) => {
      if (user[key] !== undefined && user[key] !== '') {
        acc[key] = user[key];
      }
      return acc;
    }, {} as any);

    const userDocRef = doc(this.firestore, 'User', user.id);
    return updateDoc(userDocRef, filteredUser);
  }

  updatePassword(newPassword: string): Promise<void> {
    console.log('[AuthService] Updating user password.');
    return Promise.resolve();
  }
}
