import { query } from '@angular/animations';
import { Component, inject } from '@angular/core';
import { Firestore, collection, where, getDocs, addDoc, doc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-profesor-dashboard',
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './profesor-dashboard.component.html',
  styleUrl: './profesor-dashboard.component.css'
})
export class ProfesorDashboardComponent {

  constructor(
    private auth: AuthService,
    private db: FirestoreService
  ) { }

  professorId: string = '';
  courses: any[] = [];
  selectedCourse: any = null;
  enrolledStudents: any[] = [];
  today = new Date().toISOString().split('T')[0];
  newCourseName: string = '';


  async ngOnInit() {
    const id = this.auth.getId();
    if (!id) return;
    this.professorId = id;
    console.log('professorId', this.professorId);
    this.courses = await this.db.getCoursesByProfessor(id);
  }

  async selectCourse(courseId: string) {
    this.selectedCourse = this.courses.find(c => c.id === courseId);
    this.enrolledStudents = await this.db.getStudentsInCourse(courseId);
    // Fetch attendance summary per student
    for (const student of this.enrolledStudents) {
      const records = await this.db.getAttendanceForStudentInCourse(student.StudentId, courseId);
      student.attendanceSummary = {
        present: records.filter(r => r["status"] === 'present').length,
        total: records.length
      };
    }
  }

  async markAttendance(studentId: string, status: string) {
    await this.db.markAttendance(this.selectedCourse.id, studentId, status, this.today);
    alert('Attendance saved!');
  }

  async addGrade(student: any) {
    if (!student.newGrade) return;
    const result = await this.db.addGrade(student.enrollmentId, student.grades || [], Number(student.newGrade));
    student.grades = result.grades;
    student.average = result.average;
    student.newGrade = '';
    alert('Grade added!');
  }

  onCourseChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedCourseId = target.value;
    this.selectCourse(selectedCourseId);
  }

  async addNewCourse() {
    if (!this.newCourseName.trim()) return;

    const course = {
      Name: this.newCourseName,
      ProfessorId: this.professorId,
      SchoolId: 'HwIxpCjEXq9s6DlX2nJm'
    };

    await this.db.addCourse(course);
    this.courses = await this.db.getCoursesByProfessor(this.professorId);
    this.newCourseName = '';
  }

  editingCourse: any = null;

  openEditor(course: any) {
    this.selectedCourse = course;
    this.editingCourse = { ...course };
  }

  closeModal() {
    this.editingCourse = null;
  }

  async saveCourseChanges() {
    if (!this.selectedCourse || !this.editingCourse.Name?.trim()) {
      alert('Course must have a name.');
      return;
    }

    await this.db.updateCourse(this.selectedCourse.id, {
      Name: this.editingCourse.Name,
      SchoolId: this.editingCourse.SchoolId,
      Description: this.editingCourse.Description || ''
    });

    this.editingCourse = null;
    this.courses = await this.db.getCoursesByProfessor(this.professorId);
    alert('Course updated.');
  }

  async updateCourse() {
    if (!this.selectedCourse) return;
    await this.db.updateCourse(this.selectedCourse.id, { Name: this.selectedCourse.Name });
    alert('Course updated.');
  }

  async deleteCourse() {
    if (!this.selectedCourse) return;
    const confirmDelete = confirm(`Delete course "${this.selectedCourse.Name}"?`);
    if (!confirmDelete) return;
    await this.db.deleteCourse(this.selectedCourse.id);
    this.selectedCourse = null;
    this.courses = await this.db.getCoursesByProfessor(this.professorId);
  }

  get classAverage(): number {
    if (!this.enrolledStudents.length) return 0;
    const sum = this.enrolledStudents.reduce((acc, s) => acc + (s.average || 0), 0);
    return +(sum / this.enrolledStudents.length).toFixed(2);
  }

}
