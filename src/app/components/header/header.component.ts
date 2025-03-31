import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

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

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = !!this.authService.user.getValue();
    this.authService.user.subscribe(user => {
      this.isAuthenticated = !!user;
    });
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
