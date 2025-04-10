import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { doc, Firestore, getDoc, setDoc } from '@angular/fire/firestore';


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

  constructor(
    private http: HttpClient, 
    private router: Router,
    private firestore: Firestore
  ) {
    this.autoLogin();
  }

  getId() {
    return this.user.getValue()?.id;
  }

  signup(email: string, password: string) {
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
            name: email.split('@')[0],
            role: 'STUDENT',
            schoolId: 'schoolId1'
          };
  
          const userDocRef = doc(this.firestore, 'User', response.localId);
          await setDoc(userDocRef, userProfile);
        })
      );
  }

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
        tap(async (response) => {
          this.handleAuthentication(
            response.email,
            response.localId,
            response.idToken,
            +response.expiresIn
          );
  
          // 🔍 Fetch role from Firestore
          const userDocRef = doc(this.firestore, 'User', response.localId);
          const userSnap = await getDoc(userDocRef);
          const userData = userSnap.data() as { role: string };
  
          if (userData?.role === 'ADMIN') {
            this.router.navigate(['admin-dashboard']);
          } else if (userData?.role === 'PROFESOR') {
            this.router.navigate(['profesor-dashboard']);
          } else if (userData?.role === 'STUDENT') {
            this.router.navigate(['student-dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        })
      );
  }

//   login(email: string, password: string) {
//     return this.http
//       .post<AuthResponseData>(
//         `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`,
//         {
//           email: email,
//           password: password,
//           returnSecureToken: true,
//         }
//       )
//       .pipe(
//         tap((response) => {
//           this.handleAuthentication(
//             response.email,
//             response.localId,
//             response.idToken,
//             +response.expiresIn
//           );
//           // this.user.next(response);
//           this.router.navigate(['track']);
//         })
//       );
//   }

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
    expiresIn: number
  ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    this.user.next(user);
    localStorage.setItem('userData', JSON.stringify(user)); // Store user in local storage
  }

  autoLogin() {
    const userData: {
      email: string;
      id: string;
      _token: string;
      _tokenExpirationDate: string;
    } = JSON.parse(localStorage.getItem('userData')!);
    if (!userData) {
      return;
    }
    const loadedUser = new User(
      userData.email,
      userData.id,
      userData._token,
      new Date(userData._tokenExpirationDate)
    );
    if (loadedUser.token) {
      this.user.next(loadedUser);
    }
  }
}
