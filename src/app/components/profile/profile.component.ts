import { Component, OnInit } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';
import { selectUserProfile } from '../../state/user/user.selectors';
import { loadUserProfile, updateUserProfile } from '../../state/user/user.actions';
import { tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [NgIf, FormsModule, AsyncPipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user$!: Observable<User | null>;
  user: User | null = null;
  editing = false;
  newName = '';
  newEmail = '';
  bio = '';
  officeHours = '';
  profilePicture = 'default-avatar.png';

  constructor(private store: Store) {
    this.user$ = this.store.select(selectUserProfile);
  }

  ngOnInit(): void {
    console.log('Dispatching loadUserProfile action');
    this.store.dispatch(loadUserProfile());

    this.user$.subscribe((user) => {
      console.log('User from store:', user);
      if (user) {
        this.user = user;
        this.newName = user.name || '';
        this.newEmail = user.email || '';
        this.bio = user.bio || '';
        this.officeHours = user.officeHours || '';
        this.profilePicture = user.profilePicture || 'assets/default-avatar.png';
      } else {
        console.warn('No user data in store yet.');
      }
    });
  }

  toggleEdit(): void {
    this.editing = !this.editing;
  }

  saveChanges(): void {
    if (this.user) {
      const updatedUser = new User(
        this.newEmail || this.user.email,
        this.user.id,
        this.user.token!,
        this.user.tokenExpirationDate!,
        this.user.role,
        this.newName || this.user.name,
        this.profilePicture || this.user.profilePicture,
        this.bio || this.user.bio,
        this.officeHours || this.user.officeHours
      );
      this.store.dispatch(updateUserProfile({ user: updatedUser }));
      // Reload the profile data after update
      this.store.dispatch(loadUserProfile());
      alert('Profile updated successfully!');
      this.editing = false;
    } else {
      alert('No user data available to update.');
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePicture = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
}