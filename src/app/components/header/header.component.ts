import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';
import { user } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  imports: [NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  sticky = false;
  isAuthenticated = false;
  menuOpen = false;
  dashboardRoute: string = '';
  role: string = ''

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.getRole().then(role => {
      console.log('User role:', role);
      if (role) {
        this.setDashboardRoute(role); // Set the route based on the role
      } else {
        this.dashboardRoute = 'home'; // Fallback to home if no role
      }
    });

    this.isAuthenticated = !!this.authService.user.getValue();
    this.authService.user.subscribe(user => {
      this.isAuthenticated = !!user;
      if (user && user.role) {
        console.log("User role from subscription: ", user.role);
        this.setDashboardRoute(user.role); // Set route when user data changes
      }
    });
  }

  setDashboardRoute(role: string): void {
    switch (role) {
      case 'ADMIN':
        this.dashboardRoute = 'admin-dashboard';
        break;
      case 'PROFESOR':
        this.dashboardRoute = 'profesor-dashboard';
        break;
      case 'STUDENT':
        this.dashboardRoute = 'student-dashboard';
        break;
      default:
        this.dashboardRoute = 'home';
        break;
    }
  }

  navigateTo(pageName: string): void {
    this.router.navigate([pageName]);
    this.closeMenu();
  }

  goToLogin(): void {
    this.navigateTo('/auth');
  }

  goToLogout(): void {
    this.authService.logout();
    this.closeMenu();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }
}
