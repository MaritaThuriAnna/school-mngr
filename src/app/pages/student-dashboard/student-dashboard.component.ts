import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-student-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css'
})
export class StudentDashboardComponent {
  studentId = '';
  enrolledCourses: any[] = [];
  attendanceMap: Record<string, any[]> = {};
  generalAverage = 0;

  constructor(private db: FirestoreService, private auth: AuthService) {}

  async ngOnInit() {
    const id = this.auth.getId();
    if (!id) return;
    this.studentId = id;

    const enrollments = await this.db.getEnrollmentsByStudent(this.studentId);

    const coursesWithDetails = [];
    let totalSum = 0;
    let totalCourses = 0;

    for (const enrollment of enrollments) {
      const course = await this.db.getCourseById(enrollment['CourseId']);
      const attendance = await this.db.getAttendanceByStudentAndCourse(this.studentId, enrollment['CourseId']);
    
      const courseInfo = {
        name: course?.['Name'] || course?.['name'],
        grades: enrollment['grades'] || [],
        average: enrollment['average'] || 0,
        attendance: attendance || []
      };
    
      totalSum += courseInfo.average;
      totalCourses++;
      coursesWithDetails.push(courseInfo);
    }
    

    this.enrolledCourses = coursesWithDetails;
    this.generalAverage = totalCourses ? +(totalSum / totalCourses).toFixed(2) : 0;
  }
}
