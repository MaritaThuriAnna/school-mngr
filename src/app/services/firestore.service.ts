import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  getDoc,
  Timestamp,
  deleteDoc
} from '@angular/fire/firestore';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(private firestore: Firestore) { }

  // Get courses by professor ID
  async getCoursesByProfessor(professorId: string) {
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
    const updatedGrades = [...currentGrades, newGrade];
    const average = updatedGrades.reduce((a, b) => a + b, 0) / updatedGrades.length;

    console.log('[FirestoreService] Updated grades:', updatedGrades, '| New average:', average);

    const enrollmentRef = doc(this.firestore, 'Enrollments', enrollmentId);
    await updateDoc(enrollmentRef, {
      grades: updatedGrades,
      average
    });

    return {
      grades: updatedGrades,
      average
    };
  }

  async getAttendanceForStudentInCourse(studentId: string, courseId: string) {
    const attendanceRef = collection(this.firestore, 'Attendance');
    const q = query(attendanceRef,
      where('StudentId', '==', studentId),
      where('CourseId', '==', courseId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }

  async getEnrollmentById(enrollmentId: string): Promise<Enrollment | null> {
    try {
      const enrollmentRef = doc(this.firestore, 'Enrollments', enrollmentId);
      const enrollmentSnap = await getDoc(enrollmentRef);
      if (!enrollmentSnap.exists()) {
        console.warn('[FirestoreService] Enrollment not found for ID:', enrollmentId);
        return null;
      }
      const enrollmentData = enrollmentSnap.data() as Omit<Enrollment, 'id'>;
      const enrollment: Enrollment = { ...enrollmentData };
      console.log('[FirestoreService] Enrollment found:', enrollment);
      return enrollment;
    } catch (error) {
      console.error('[FirestoreService] Error getting enrollment by ID:', error);
      throw error;
    }
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    try {
      const enrollmentsRef = collection(this.firestore, 'Enrollments');
      const snapshot = await getDocs(enrollmentsRef);
      const enrollments = snapshot.docs.map(doc => {
        const data = doc.data();
        const enrollment: Enrollment = {
          Id: doc.id,
          CourseId: data['CourseId'],
          StudentId: data['StudentId'],
          sessionIndex: data['sessionIndex'],
          average: data['average'],
          grades: data['grades'],
        };
        return enrollment;
      });
      console.log('[FirestoreService] Enrollments data:', enrollments.map(e => ({
        id: e.Id,
        StudentId: e.StudentId,
        CourseId: e.CourseId,
        sessionIndex: e.sessionIndex,
      })));
      return enrollments;
    } catch (error) {
      console.error('[FirestoreService] Error getting all enrollments:', error);
      throw error;
    }
  }

  async getEnrollmentsByStudent(studentId: string) {
    const enrollmentsRef = collection(this.firestore, 'Enrollments');
    const q = query(enrollmentsRef, where('StudentId', '==', studentId));
    const snapshot = await getDocs(q);

    console.log(`[FirestoreService] Found ${snapshot.docs.length} enrollment(s)`);

    const enrollments = snapshot.docs.map(doc => doc.data());
    console.log('[FirestoreService] Enrollments:', enrollments);

    return enrollments;
  }

  async getCourseById(courseId: string) {
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

  async getAttendanceByStudentAndCourse(studentId: string, courseId: string) {

    const attendanceRef = collection(this.firestore, 'Attendance');
    const q = query(
      attendanceRef,
      where('StudentId', '==', studentId),
      where('CourseId', '==', courseId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn('[FirestoreService] No attendance found for this course/student.');
    } 

    const records = snapshot.docs.map(doc => doc.data());
    console.log('[FirestoreService] Attendance records:', records);

    return records;
  }

  async addCourse(course: any) {
    const courseRef = collection(this.firestore, 'Course');
    await addDoc(courseRef, course);
  }

  async updateCourse(courseId: string, updatedData: any) {
    const courseRef = doc(this.firestore, 'Course', courseId);
    await updateDoc(courseRef, updatedData);
  }

  async deleteCourse(courseId: string) {
    const courseRef = doc(this.firestore, 'Course', courseId);
    await deleteDoc(courseRef);
  }

  async getUserDataById(userId: string) {

    const userRef = await doc(this.firestore, 'User', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn('[FirestoreService] No user data found for ID:', userId);
      return null;
    }

    const userData = userSnap.data();
    console.log('[FirestoreService] User data retrieved:', userData);
    return userData;
  }

  async getAllCourses(): Promise<Course[]> {
    const coursesRef = collection(this.firestore, 'Course');
    const snapshot = await getDocs(coursesRef);

    const coursesPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const professorId = data['ProfessorId'] as string;
      const courseId = doc.id;

      const professorName = await this.getProfessorNameById(professorId);

      const studentData = await this.getStudentsInCourse(courseId);
      const students = studentData.map((student) => student.name);

      return {
        id: doc.id,
        name: data['Name'] as string,
        professor: professorName,
        students: students,
        schedule: data['schedule'] || [],
      } as Course;
    });

    const courses = await Promise.all(coursesPromises);
    return courses;
  }

  async getProfessorNameById(professorId: string): Promise<string> {
    const userData = await this.getUserDataById(professorId);
    if (userData && userData['name']) {
      return userData['name'];
    }
    console.warn('[FirestoreService] Professor name not found for ID:', professorId);
    return 'Unknown Professor';
  }

  async enrollStudent(courseId: string, studentId: string, sessionIndex: number): Promise<void> {
    const enrollmentsRef = collection(this.firestore, 'Enrollments');
    await addDoc(enrollmentsRef, {
      CourseId: courseId,
      StudentId: studentId,
      sessionIndex: sessionIndex,
      grades: [],
      average: 0,
    });
  }

  async getAllStudents(): Promise<{ id: string; name: string }[]> {
    const usersRef = collection(this.firestore, 'User');
    const q = query(usersRef, where('role', '==', 'STUDENT'));
    const snapshot = await getDocs(q);

    const students = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data()['name'] || 'Unknown Student',
    }));

    return students;
  }

  async detectAllConflicts(): Promise<{
    studentId: string;
    studentName: string;
    enrollment1: any;
    enrollment2: any;
    course1: Course;
    course2: Course;
  }[]> {
    const conflicts: {
      studentId: string;
      studentName: string;
      enrollment1: any;
      enrollment2: any;
      course1: Course;
      course2: Course;
    }[] = [];

    // Get all students
    const students = await this.getAllStudents();

    for (const student of students) {
      const studentId = student.id;
      const studentName = student.name;

      // Get all enrollments for this student
      const enrollments = await this.getEnrollmentsByStudent(studentId);
      if (enrollments.length < 2) continue; // Need at least 2 enrollments to have a conflict

      // Compare each pair of enrollments
      for (let i = 0; i < enrollments.length; i++) {
        for (let j = i + 1; j < enrollments.length; j++) {
          const enrollment1 = enrollments[i];
          const enrollment2 = enrollments[j];

          const courseId1 = enrollment1['CourseId'];
          const courseId2 = enrollment2['CourseId'];


          const course1 = await this.getCourseById(courseId1);
          const course2 = await this.getCourseById(courseId2);
          if (!course1 || !course2 || !course1['schedule'] || !course2['schedule']) continue;

          const sessionIndex1 = enrollment1['sessionIndex'];
          const sessionIndex2 = enrollment2['sessionIndex'];

          const session1 = course1['schedule'][sessionIndex1];
          const session2 = course2['schedule'][sessionIndex2];

          // Check if sessions are on the same day
          if (session1.day !== session2.day) continue;
          // Check for time overlap
          const overlap = this.doTimesOverlap(
            session1.startTime,
            session1.endTime,
            session2.startTime,
            session2.endTime
          );

          if (overlap) {
            // Fetch professor names for the courses
            const professor1 = await this.getProfessorNameById(course1['ProfessorId']);
            const professor2 = await this.getProfessorNameById(course2['ProfessorId']);

            const course1Details: Course = {
              id: courseId1,
              name: course1['Name'],
              professor: professor1,
              students: (await this.getStudentsInCourse(courseId1)).map(s => s.name),
              schedule: course1['schedule'],
            };

            const course2Details: Course = {
              id: courseId2,
              name: course2['Name'],
              professor: professor2,
              students: (await this.getStudentsInCourse(courseId2)).map(s => s.name),
              schedule: course2['schedule'],
            };

            conflicts.push({
              studentId,
              studentName,
              enrollment1,
              enrollment2,
              course1: course1Details,
              course2: course2Details,
            });
          }
        }
      }
    }
    return conflicts;
  }

  public doTimesOverlap(
    startTime1: string,
    endTime1: string,
    startTime2: string,
    endTime2: string
  ): boolean {
    const [startHour1, startMinute1] = startTime1.split(':').map(Number);
    const [endHour1, endMinute1] = endTime1.split(':').map(Number);
    const [startHour2, startMinute2] = startTime2.split(':').map(Number);
    const [endHour2, endMinute2] = endTime2.split(':').map(Number);

    const start1 = startHour1 * 60 + startMinute1;
    const end1 = endHour1 * 60 + endMinute1;
    const start2 = startHour2 * 60 + startMinute2;
    const end2 = endHour2 * 60 + endMinute2;

    return start1 < end2 && start2 < end1;
  }
}
