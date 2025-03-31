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
  DocumentData,
  getDoc,
  Timestamp,
  deleteDoc
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(private firestore: Firestore) { }

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

    const students = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const studentId = data['StudentId'];

      // Fetch student name from Users
      const studentRef = doc(this.firestore, 'User', studentId);
      const studentDoc = await getDoc(studentRef);
      const studentData = studentDoc.exists() ? studentDoc.data() : { name: 'Unknown' };

      students.push({
        enrollmentId: docSnap.id,
        StudentId: studentId,
        name: studentData["name"] || 'Unnamed',
        grades: data["grades"] || [],
        average: data["average"] || 0,
        newGrade: '',
        attendanceStatus: ''
      });
    }

    console.log('[FirestoreService] Loaded enrolled students:', students);
    return students;
  }

  // Mark attendance
  async markAttendance(courseId: string, studentId: string, status: string, date: string) {
    console.log('[FirestoreService] Saving attendance:', { courseId, studentId, status, date });

    const attendanceRef = collection(this.firestore, 'Attendance');

    await addDoc(attendanceRef, {
      CourseId: courseId,
      StudentId: studentId,
      Date: Timestamp.fromDate(new Date(date)), // standard Firestore Timestamp
      Status: status
    });

    console.log('[FirestoreService] Attendance saved successfully');
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

  async getAttendanceForStudentInCourse(studentId: string, courseId: string) {
    const attendanceRef = collection(this.firestore, 'Attendance');
    const q = query(attendanceRef,
      where('studentId', '==', studentId),
      where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }
  

  // Get all enrollments for a student
  async getEnrollmentsByStudent(studentId: string) {
    console.log('[FirestoreService] Getting enrollments for StudentId:', studentId);

    const enrollmentsRef = collection(this.firestore, 'Enrollments');
    const q = query(enrollmentsRef, where('StudentId', '==', studentId));
    const snapshot = await getDocs(q);

    console.log(`[FirestoreService] Found ${snapshot.docs.length} enrollment(s)`);

    const enrollments = snapshot.docs.map(doc => doc.data());
    console.log('[FirestoreService] Enrollments:', enrollments);

    return enrollments;
  }


  // Get a course by ID
  async getCourseById(courseId: string) {
    console.log('[FirestoreService] Getting course by ID:', courseId);

    const courseRef = doc(this.firestore, 'Course', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      console.warn('[FirestoreService] Course not found:', courseId);
      return null;
    }

    const courseData = courseSnap.data();
    console.log('[FirestoreService] Course data:', courseData);
    return courseData;
  }


  // Get all attendance entries for a student in a course
  async getAttendanceByStudentAndCourse(studentId: string, courseId: string) {
    console.log('[FirestoreService] Getting attendance for StudentId:', studentId, 'and CourseId:', courseId);

    const attendanceRef = collection(this.firestore, 'Attendance');
    const q = query(
      attendanceRef,
      where('StudentId', '==', studentId),
      where('CourseId', '==', courseId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn('[FirestoreService] No attendance found for this course/student.');
    } else {
      console.log(`[FirestoreService] Found ${snapshot.docs.length} attendance record(s).`);
    }

    const records = snapshot.docs.map(doc => doc.data());
    console.log('[FirestoreService] Attendance records:', records);

    return records;
  }

  // Create course
  async addCourse(course: any) {
    const courseRef = collection(this.firestore, 'Course');
    await addDoc(courseRef, course);
  }

  // Update course
  async updateCourse(courseId: string, updatedData: any) {
    const courseRef = doc(this.firestore, 'Course', courseId);
    await updateDoc(courseRef, updatedData);
  }

  // Delete course
  async deleteCourse(courseId: string) {
    const courseRef = doc(this.firestore, 'Course', courseId);
    await deleteDoc(courseRef);
  }

}
