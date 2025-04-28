# SchoolMngr

SchoolMngr is a university course management web application built with **Angular**, **Firebase**, and **NgRx**. It supports distinct dashboards and permissions for **Admin**, **Professor**, and **Student** users. It also features automatic schedule conflict detection and resolution.

---

Visit site: https://school-mngr-nine.vercel.app/

## Technologies Used

- **Frontend**: Angular 17
- **State Management**: NgRx (Store, Effects, Selectors)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: CSS/SCSS with custom components

---

## Main Features

### Admin

- View all courses with associated professors and students
- Dynamic filtering in the course table
- Enroll students in specific course sessions
- Automatic detection of **schedule conflicts**
- Conflict resolution via:
  - Keeping one course
  - Changing session for the conflicting course
- View all conflicts in a dedicated tab (modal popup)
- Simulated email notification to student upon conflict

### Professor

- Add / remove / update grades
- Add course sessions with date and time
- View attendance per student
- Leave private notes for students
- View class average and attendance rate

### Student

- View enrolled courses and sessions
- View grades and average per course
- View attendance and absence history
- Automatically calculated overall GPA

---

## Firebase Collections Structure

- `User`: holds user data (role, name, contact, etc.)
- `Course`: contains course metadata, sessions, professor
- `Enrollments`: links student to course + session, grades, average
- `Attendance`: logs attendance per student and session
