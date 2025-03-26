import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  DocumentReference,
  DocumentData
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(private firestore: Firestore) {}

  // Get courses by professor ID
  async getCoursesByProfessor(professorId: string) {
    console.log('[FirestoreService] Fetching courses for professorId:', professorId);

    const coursesRef = collection(this.firestore, 'Course');
    const q = query(coursesRef, where('ProfessorId', '==', professorId));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn('[FirestoreService] No courses found for professorId:', professorId);
    } else {
      console.log(`[FirestoreService] Found ${snapshot.docs.length} course(s).`);
    }

    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('[FirestoreService] Loaded courses:', courses);
    return courses;
  }

  // Get students enrolled in a course
  async getStudentsInCourse(courseId: string) {
    console.log('[FirestoreService] Fetching students for courseId:', courseId);

    const enrollmentsRef = collection(this.firestore, 'Enrollments');
    const q = query(enrollmentsRef, where('CourseId', '==', courseId));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn('[FirestoreService] No students found enrolled in courseId:', courseId);
    } else {
      console.log(`[FirestoreService] Found ${snapshot.docs.length} enrolled student(s).`);
    }

    const students = snapshot.docs.map(doc => ({
      enrollmentId: doc.id,
      ...doc.data(),
      newGrade: '',
      attendanceStatus: ''
    }));

    console.log('[FirestoreService] Loaded enrolled students:', students);
    return students;
  }

  // Mark attendance
  async markAttendance(courseId: string, studentId: string, status: string, date: string) {
    console.log(`[FirestoreService] Marking attendance: courseId=${courseId}, studentId=${studentId}, status=${status}, date=${date}`);

    const attendanceRef = collection(this.firestore, 'Attendance');
    await addDoc(attendanceRef, {
      courseId,
      studentId,
      date,
      status
    });

    console.log('[FirestoreService] Attendance recorded successfully.');
  }

  // Add a grade to a student and update average
  async addGrade(enrollmentId: string, currentGrades: number[], newGrade: number) {
    console.log(`[FirestoreService] Adding grade for enrollmentId=${enrollmentId}`);
    console.log('[FirestoreService] Current grades:', currentGrades, '| New grade:', newGrade);

    const updatedGrades = [...currentGrades, newGrade];
    const average = updatedGrades.reduce((a, b) => a + b, 0) / updatedGrades.length;

    console.log('[FirestoreService] Updated grades:', updatedGrades, '| New average:', average);

    const enrollmentRef = doc(this.firestore, 'Enrollments', enrollmentId);
    await updateDoc(enrollmentRef, {
      grades: updatedGrades,
      average
    });

    console.log('[FirestoreService] Grade updated in Firestore successfully.');

    return {
      grades: updatedGrades,
      average
    };
  }
}
