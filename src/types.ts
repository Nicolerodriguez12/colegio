export type Role = 'admin' | 'teacher' | 'student';

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  studentId?: string;
};

export type Student = {
  id: string;
  fullName: string;
  grade: string;
  group: string;
  guardian: string;
  userId?: string;
};

export type GradeEntry = {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  term: string;
  teacherName: string;
  createdAt: string;
};

export type AppState = {
  users: User[];
  students: Student[];
  grades: GradeEntry[];
  subjects: string[];
  sessionUserId: string | null;
};
