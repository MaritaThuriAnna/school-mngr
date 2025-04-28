// models/course.model.ts
export interface Course {
    id: string;
    name: string;
    professor: string; 
    students: string[];
    schedule: {
        day: string;
        startTime: string;
        endTime: string;
        weeks: number;
      }[];
}