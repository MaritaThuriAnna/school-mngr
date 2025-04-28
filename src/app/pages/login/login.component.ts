import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated } from '../../state/auth/auth.selectors';
import { Observable } from 'rxjs';
import { login } from '../../state/auth/auth.actions';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  name = '';
  role: 'ADMIN' | 'PROFESOR' | 'STUDENT' = 'STUDENT';
  isRegistering = false;
  confirmPassword = '';
  isAuthenticated$!: Observable<boolean>;
  isResetting = false;
  resetMessage: string = '';

  constructor(
    private router: Router,
    private store: Store,
    private authService: AuthService) { }

    ngOnInit() {
      // Use NgRx store to get authentication status
      this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
  
      // Redirect to dashboard if the user is already authenticated
      this.isAuthenticated$.subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/dashboard']);
        }
      });
    }
  
  toggleMode() {
    this.isRegistering = !this.isRegistering;
    this.confirmPassword = '';
    this.isResetting = false;
    this.resetMessage = '';
  }

  toggleReset() {
    this.isResetting = !this.isResetting;
    this.isRegistering = false;
    this.resetMessage = '';
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }

    if (this.isResetting) {
      this.authService.resetPassword(this.email).pipe().subscribe(
        () => {
          this.resetMessage = "Password reset link has been sent to your email.";
        },
        error => {
          console.error(error);
          this.resetMessage = "Error: Unable to send reset email.";
        }
      );
    } else if (this.isRegistering) {
      if (this.password !== this.confirmPassword) {
        this.resetMessage = "Passwords do not match!";
        return;
      }

      this.authService.signup(this.email, this.password, this.name, this.role).pipe().subscribe({
        next: response => {
          console.log('User registered', response);
          this.isRegistering = false;
          this.resetMessage = "Account created! Please log in.";
        }
      });
    } else {
      this.store.dispatch(login({ email: this.email, password: this.password }));
    }

    form.reset();
  }

  resetPassword() {
    if (!this.email) {
      this.resetMessage = "Please enter your email.";
      return;
    }
  }
}
