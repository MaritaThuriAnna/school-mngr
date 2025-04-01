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
    private authService: AuthService) { }

  async ngOnInit(): Promise<void> {
    try {
      // Fetch current user data
      this.user = await this.authService.getCurrentUserData();
      console.log("Fetched user: ", this.user);

      // Prepopulate the form fields with user data
      if (this.user) {
        this.newName = this.user.name || '';
        this.newEmail = this.user.email || '';
        this.profilePicture = this.user.profilePicture || 'default-avatar.png';
        console.log("Initialized name and email: ", this.newName, this.newEmail);
      } else {
        console.warn('No user data found.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  toggleEdit(): void {
    this.editing = !this.editing;
  }

  saveChanges(): void {
    this.user.profilePicture = this.profilePicture;
    const updatedFields: any = {};
    if (this.user.profilePicture) updatedFields.profilePicture = this.user.profilePicture;

    this.authService.updateUserProfile(this.user).then(() => {
      alert('Profile updated successfully!');
      this.editing = false;
    }).catch((error) => {
      console.error('Error updating profile: ', error);
      alert('Failed to update profile!');
    });
  }


  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePicture = reader.result as string;
        this.user.profilePicture = this.profilePicture;
      };
      reader.readAsDataURL(file);
    }
  }
}
