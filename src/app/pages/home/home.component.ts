import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(
    private router: Router
  ) {}

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }

  displayedText: string = ''; 

  displayText(): void {
    this.displayedText = "Invest in yourself more.";
  }
}
