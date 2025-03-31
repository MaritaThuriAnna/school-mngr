import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [NgIf, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: any;
  editing = false;
  newName: string = '';
  newEmail: string = '';
  newPassword: string = '';
  profilePicture: string = 'assets/default-avatar.png';

  constructor(
    private authService: AuthService,
    private router: Router) { }

  async ngOnInit(): Promise<void> {
    try {
      // Fetch current user data
      this.user = await this.authService.getCurrentUserData();
      console.log("Fetched user: ", this.user);

      // Prepopulate the form fields with user data
      if (this.user) {
        this.newName = this.user.Name;
        this.newEmail = this.user.Email;
      } else {
        console.warn('No user data found.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  toggleEdit(): void {
    this.editing = !this.editing;
    // Prepopulate the fields when editing is enabled
    if (this.editing && this.user) {
      this.newName = this.user.Name;
      this.newEmail = this.user.Email;
    }
  }

  saveChanges(): void {
    if (this.newName.trim() && this.newEmail.trim()) {
      this.user.name = this.newName;
      this.user.email = this.newEmail;
      // Update user info in the database
      this.authService.updateUserProfile(this.user).then(() => {
        alert('Profile updated successfully!');
        this.editing = false;
      });
    } else {
      alert('Name and Email cannot be empty!');
    }
  }

  changePassword(): void {
    if (this.newPassword.trim()) {
      this.authService.updatePassword(this.newPassword).then(() => {
        alert('Password changed successfully!');
        this.newPassword = '';
      }).catch((error) => {
        alert('Error changing password: ' + error.message);
      });
    }
  }

  // onProfilePictureChange(event: any): void {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       this.profilePicture = reader.result as string;
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // }
}
