export interface Enrollment {
  Id: string; // The document ID in the Enrollments collection (e.g., WSGTPdrRUxH1feppnZm)
  CourseId: string; // The ID of the course (e.g., BEDMTIYONjdHLdiyoySQ)
  StudentId: string; // The ID of the student (e.g., v9w1vrTUAC3WCWBDVeER6B3s0t9G2)
  sessionIndex: number; // The session index for the course (e.g., 0)
  average?: number; // Optional: The average grade (e.g., 10)
  grades?: number[]; // Optional: Array of grades (e.g., [8, 10])
}