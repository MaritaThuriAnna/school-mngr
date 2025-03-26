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
  ) {}

  professorId: string = '';
  courses: any[] = [];
  selectedCourse: any = null;
  enrolledStudents: any[] = [];
  today = new Date().toISOString().split('T')[0];

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
  
}
