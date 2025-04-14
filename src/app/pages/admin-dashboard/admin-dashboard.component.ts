import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FirestoreService } from '../../services/firestore.service';
import { Course } from '../../models/course.model';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { deleteDoc, doc, updateDoc } from '@angular/fire/firestore';

interface Conflict {
  studentId: string;
  studentName: string;
  enrollment1: { id: string; CourseId: string; sessionIndex: number; [key: string]: any };
  enrollment2: { id: string; CourseId: string; sessionIndex: number; [key: string]: any };
  course1: Course;
  course2: Course;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  students: { id: string; name: string }[] = [];
  filterText: string = '';
  loading: boolean = false;
  conflict: string | null = null;
  selectedCourseId: string = '';
  selectedStudentId: string = '';
  selectedSessionIndex: number | null = null;
  conflictDetails: { studentName: string; course1: Course; course2: Course; conflictingSession1: any; conflictingSession2: any } | null = null;

  currentTab: 'courses' | 'conflicts' = 'courses';
  conflicts: Conflict[] = [];
  conflictTabVisible = false;

  selectedConflict: Conflict | null = null;
  newSessionIndex1: number | null = null;
  newSessionIndex2: number | null = null;

  constructor(
    private firestoreService: FirestoreService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCourses();
    await this.loadStudents();
    await this.loadConflicts();
  }

  async loadCourses(): Promise<void> {
    this.loading = true;
    try {
      this.courses = await this.firestoreService.getAllCourses();
      this.filteredCourses = [...this.courses].filter(course => !!course);
    } catch (error) {
      this.courses = [];
      this.filteredCourses = [];
      alert('Failed to load courses. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  async loadStudents(): Promise<void> {
    try {
      this.students = await this.firestoreService.getAllStudents();
    } catch (error) {
      this.students = [];
      alert('Failed to load students. Please try again.');
    }
  }

  async loadConflicts(): Promise<void> {
    this.loading = true;
    try {
      this.conflicts = await this.firestoreService.detectAllConflicts();
    } catch (error) {
      this.conflicts = [];
      alert('Failed to load conflicts. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  onFilterTextChange(): void {
    this.filterCourses();
  }

  private filterCourses(): void {
    if (!this.filterText) {
      this.filteredCourses = [...this.courses].filter(course => !!course);
      return;
    }

    this.filteredCourses = this.courses.filter(course => {
      if (!course) return false;
      const name = course.name ? course.name.toLowerCase() : '';
      const professor = course.professor ? course.professor.toLowerCase() : '';
      const filterTextLower = this.filterText.toLowerCase();
      return name.includes(filterTextLower) || professor.includes(filterTextLower);
    });
  }

  getSelectedCourse(): Course | undefined {
    return this.courses.find((course) => course.id === this.selectedCourseId);
  }

  async onResolveConflict(courseId: string, studentName: string): Promise<void> {
    try {
      const student = await this.findStudentByName(studentName);
      if (!student) {
        this.conflict = `Student ${studentName} not found.`;
        return;
      }

      const studentId = student.id;
      const enrollments = await this.firestoreService.getEnrollmentsByStudent(studentId);
      const newCourse = this.courses.find((course) => course.id === courseId);
      if (!newCourse) {
        this.conflict = `Course with ID ${courseId} not found.`;
        return;
      }

      let conflictFound = false;
      let conflictingCourse: Course | null = null;
      let conflictingSession1: any = null;
      let conflictingSession2: any = null;

      for (const enrollment of enrollments) {
        const enrolledCourseId = enrollment['CourseId'];
        if (enrolledCourseId === courseId) continue;

        const enrolledCourse = await this.firestoreService.getCourseById(enrolledCourseId);
        if (!enrolledCourse) continue;

        const schedule = enrolledCourse['schedule'] || enrolledCourse['Schedule'];
        if (!Array.isArray(schedule)) continue;

        const enrolledSessionIndex = enrollment['sessionIndex'];
        if (enrolledSessionIndex < 0 || enrolledSessionIndex >= schedule.length) continue;

        const enrolledSession = schedule[enrolledSessionIndex];
        if (!enrolledSession || !enrolledSession.day) continue;

        const newCourseSession = newCourse.schedule.find((_, index) => index === this.selectedSessionIndex) || newCourse.schedule[0];
        if (!newCourseSession || !newCourseSession.day) continue;

        if (newCourseSession.day !== enrolledSession.day) continue;

        const overlap = this.firestoreService.doTimesOverlap(
          newCourseSession.startTime,
          newCourseSession.endTime,
          enrolledSession.startTime,
          enrolledSession.endTime
        );

        if (overlap) {
          conflictFound = true;
          conflictingSession1 = newCourseSession;
          conflictingSession2 = enrolledSession;
          conflictingCourse = {
            id: enrolledCourse['id'],
            name: enrolledCourse['Name'],
            professor: await this.firestoreService.getProfessorNameById(enrolledCourse['ProfessorId']),
            students: newCourse.students,
            schedule: schedule,
          };
          break;
        }
      }

      if (conflictFound && conflictingCourse) {
        this.conflict = `Schedule conflict detected for ${studentName} on ${conflictingSession1.day}.`;
        this.conflictDetails = { studentName, course1: newCourse, course2: conflictingCourse, conflictingSession1, conflictingSession2 };
      } else {
        this.conflict = null;
        this.conflictDetails = null;
      }
    } catch (error) {
      console.error('[AdminDashboard] Error checking conflict:', error);
      this.conflict = 'Error checking conflict.';
    }
  }

  async enrollStudent(): Promise<void> {
    if (!this.selectedCourseId || !this.selectedStudentId || this.selectedSessionIndex === null) {
      alert('Please select a course, a student, and a session.');
      return;
    }

    try {
      const student = this.students.find((s) => s.id === this.selectedStudentId);
      if (!student) {
        alert('Student not found.');
        return;
      }

      const newCourse = this.courses.find((course) => course.id === this.selectedCourseId);
      if (!newCourse) {
        alert('Course not found.');
        return;
      }

      const newSession = newCourse.schedule[this.selectedSessionIndex];
      if (!newSession) {
        alert('Selected session not found.');
        return;
      }

      const enrollments = await this.firestoreService.getEnrollmentsByStudent(this.selectedStudentId);
      let conflictFound = false;
      let conflictingCourse: Course | null = null;
      let conflictingSession1: any = null;
      let conflictingSession2: any = null;

      for (const enrollment of enrollments) {
        const enrolledCourseId = enrollment['CourseId'];
        const enrolledCourse = await this.firestoreService.getCourseById(enrolledCourseId);
        if (!enrolledCourse) continue;

        const schedule = enrolledCourse['schedule'] || enrolledCourse['Schedule'];
        if (!Array.isArray(schedule)) continue;

        const enrolledSessionIndex = enrollment['sessionIndex'];
        if (enrolledSessionIndex < 0 || enrolledSessionIndex >= schedule.length) continue;

        const enrolledSession = schedule[enrolledSessionIndex];
        if (!enrolledSession || !enrolledSession.day) continue;

        if (newSession.day !== enrolledSession.day) continue;

        const overlap = this.firestoreService.doTimesOverlap(
          newSession.startTime,
          newSession.endTime,
          enrolledSession.startTime,
          enrolledSession.endTime
        );

        if (overlap) {
          conflictFound = true;
          conflictingSession1 = newSession;
          conflictingSession2 = enrolledSession;
          conflictingCourse = {
            id: enrolledCourse['id'],
            name: enrolledCourse['Name'],
            professor: await this.firestoreService.getProfessorNameById(enrolledCourse['ProfessorId']),
            students: newCourse.students,
            schedule: schedule,
          };
          break;
        }
      }

      if (conflictFound && conflictingCourse) {
        this.conflict = `Schedule conflict detected for ${student.name} on ${conflictingSession1.day}.`;
        this.conflictDetails = { studentName: student.name, course1: newCourse, course2: conflictingCourse, conflictingSession1, conflictingSession2 };
        return;
      }

      await this.firestoreService.enrollStudent(this.selectedCourseId, this.selectedStudentId, this.selectedSessionIndex);
      alert('Student enrolled successfully!');
      await this.loadCourses();
      await this.loadConflicts();
      this.selectedSessionIndex = null;
    } catch (error) {
      console.error('[AdminDashboard] Error enrolling student:', error);
      alert('Failed to enroll student.');
    }
  }

  async resolveConflict(keepCourseId: string): Promise<void> {
    if (!this.conflictDetails) return;

    const { studentName, course1, course2 } = this.conflictDetails;
    const student = await this.findStudentByName(studentName);
    if (!student) {
      this.conflict = `Student ${studentName} not found.`;
      return;
    }

    const studentId = student.id;
    const courseToRemoveId = keepCourseId === course1.id ? course2.id : course1.id;

    const enrollments = await this.firestoreService.getEnrollmentsByStudent(studentId);
    const enrollmentToRemove = enrollments.find((e) => e['CourseId'] === courseToRemoveId);
    if (enrollmentToRemove) {
      const enrollmentRef = doc(this.firestoreService['firestore'], 'Enrollments', enrollmentToRemove['id']);
      await deleteDoc(enrollmentRef);
    }

    await this.firestoreService.enrollStudent(keepCourseId, studentId, this.selectedSessionIndex!);
    alert(`Student ${studentName} enrolled in ${keepCourseId === course1.id ? course1.name : course2.name} successfully!`);

    await this.loadCourses();
    await this.loadConflicts();
    this.conflict = null;
    this.conflictDetails = null;
    this.selectedSessionIndex = null;
  }

  async findStudentByName(studentName: string): Promise<any> {
    try {
      const students = await this.firestoreService.getAllStudents();
      const student = students.find((s) => s.name.toLowerCase() === studentName.toLowerCase());
      if (!student) {
        console.warn(`[AdminDashboard] No student found with name: ${studentName}`);
        return null;
      }
      const userData = await this.firestoreService.getUserDataById(student.id);
      if (!userData) {
        console.warn(`[AdminDashboard] No user data found for student ID: ${student.id}`);
        return null;
      }
      return { ...userData, id: student.id };
    } catch (error) {
      console.error('[AdminDashboard] Error finding student by name:', error);
      return null;
    }
  }

  clearConflict(): void {
    this.conflict = null;
    this.conflictDetails = null;
    this.selectedSessionIndex = null;
  }

  async resolveConflictInTab(conflict: Conflict, keepCourseId: string): Promise<void> {
    if (!conflict) {
      console.error('[AdminDashboard] conflict is undefined in resolveConflictInTab');
      alert('Cannot resolve conflict: Conflict data is missing.');
      return;
    }

    const { studentId, enrollment1, enrollment2 } = conflict;

    if (enrollment1?.CourseId !== conflict.course1?.id || enrollment2?.CourseId !== conflict.course2?.id) {
      console.error('[AdminDashboard] CourseId mismatch in conflict:', {
        enrollment1CourseId: enrollment1?.CourseId,
        course1Id: conflict.course1?.id,
        enrollment2CourseId: enrollment2?.CourseId,
        course2Id: conflict.course2?.id,
      });
      alert('Cannot resolve conflict: Course data is inconsistent.');
      return;
    }

    const courseToRemoveId = keepCourseId === conflict.course1.id ? conflict.course2.id : conflict.course1.id;
    const enrollmentToRemove = courseToRemoveId === enrollment1.CourseId ? enrollment1 : enrollment2;
    if (!enrollmentToRemove) {
      console.error('[AdminDashboard] No matching enrollment found to remove for courseId:', courseToRemoveId);
      alert('Cannot resolve conflict: No matching enrollment found to remove.');
      return;
    }

    if (!enrollmentToRemove['Id']) {
      console.error('[AdminDashboard] Enrollment ID is undefined:', enrollmentToRemove);
      alert('Cannot resolve conflict: Enrollment ID is missing.');
      return;
    }

    try {
      const enrollment = await this.firestoreService.getEnrollmentById(enrollmentToRemove['Id']);
      if (!enrollment) {
        console.error('[AdminDashboard] Enrollment not found in Firestore:', enrollmentToRemove['Id']);
        alert('Cannot resolve conflict: Enrollment no longer exists.');
        return;
      }

      const enrollmentRef = doc(this.firestoreService['firestore'], 'Enrollments', enrollmentToRemove['Id']);
      await deleteDoc(enrollmentRef);

      alert(`Conflict resolved: Student ${conflict.studentName} kept in ${keepCourseId === conflict.course1.id ? conflict.course1.name : conflict.course2.name}`);
      await this.loadCourses();
      await this.loadConflicts();
      this.closeConflictModal();
    } catch (error) {
      console.error('[AdminDashboard] Error resolving conflict:', error);
      alert('Failed to resolve conflict. Please try again.');
    }
  }

  private async updateEnrollmentSession(enrollmentId: string, newSessionIndex: number): Promise<void> {
    try {
      const enrollmentRef = doc(this.firestoreService['firestore'], 'Enrollments', enrollmentId);
      await updateDoc(enrollmentRef, { sessionIndex: newSessionIndex });
    } catch (error) {
      console.error('[AdminDashboard] Error updating enrollment:', error);
      throw error;
    }
  }

  private async refreshConflicts(studentId: string): Promise<void> {
    try {
      const newConflicts = await this.firestoreService.detectAllConflicts();
      this.conflicts = newConflicts.filter(c => c.studentId === studentId) as Conflict[];
    } catch (error) {
      console.error('[AdminDashboard] Error refreshing conflicts:', error);
      throw error;
    }
  }

  async changeSessionInConflict(conflict: Conflict, courseIdToChange: string, newSessionIndex: number): Promise<void> {
    if (!conflict) {
      console.error('[AdminDashboard] conflict is undefined in changeSessionInConflict');
      alert('Cannot change session: Conflict data is missing.');
      return;
    }

    if (newSessionIndex < 0) {
      console.error('[AdminDashboard] Invalid newSessionIndex:', newSessionIndex);
      alert('Cannot change session: Invalid session index.');
      return;
    }

    try {
      const { studentId, enrollment1, enrollment2 } = conflict;
      const enrollmentToUpdate = courseIdToChange === enrollment1?.CourseId ? enrollment1 : enrollment2;
      if (!enrollmentToUpdate) {
        console.error('[AdminDashboard] No matching enrollment found for courseIdToChange:', courseIdToChange);
        alert('Cannot change session: No matching enrollment found for the selected course.');
        return;
      }

      const enrollment = await this.firestoreService.getEnrollmentById(enrollmentToUpdate.id);
      if (!enrollment) {
        console.error('[AdminDashboard] Enrollment not found in Firestore:', enrollmentToUpdate.id);
        alert('Cannot change session: Enrollment no longer exists.');
        return;
      }

      this.cdr.detach();

      await this.updateEnrollmentSession(enrollmentToUpdate.id, newSessionIndex);
      await this.refreshConflicts(studentId);

      if (this.conflicts.length === 0) {
        alert(`Conflict resolved: Session changed for ${conflict.studentName} in ${courseIdToChange === conflict.course1.id ? conflict.course1.name : conflict.course2.name}`);
        await this.loadCourses();
        await this.loadConflicts();
        this.closeConflictModal();
      } else {
        alert('Session changed, but the conflict persists. Please try another session or resolve by keeping one course.');
        await this.loadConflicts();
      }
    } catch (error) {
      console.error('[AdminDashboard] Error changing session:', error);
      alert('Failed to change session. Please try again.');
    } finally {
      this.cdr.reattach();
      this.cdr.detectChanges();
    }
  }

  async openConflictModal(conflict: Conflict): Promise<void> {
    if (!conflict) {
      console.error('[AdminDashboard] conflict is undefined in openConflictModal');
      alert('Cannot open conflict modal: Conflict data is missing.');
      return;
    }

    this.selectedConflict = conflict;
    this.newSessionIndex1 = conflict.enrollment1.sessionIndex;
    this.newSessionIndex2 = conflict.enrollment2.sessionIndex;
    this.conflictTabVisible = true;
  }

  closeConflictModal(): void {
    this.conflictTabVisible = false;
    this.selectedConflict = null;
    this.newSessionIndex1 = null;
    this.newSessionIndex2 = null;
  }
}