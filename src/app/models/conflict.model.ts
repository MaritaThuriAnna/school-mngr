import { Course } from "./course.model";

export interface Conflict {
  studentId: string;
  studentName: string;
  enrollment1: { id: string; CourseId: string; sessionIndex: number; [key: string]: any };
  enrollment2: { id: string; CourseId: string; sessionIndex: number; [key: string]: any };
  course1: Course;
  course2: Course;
}