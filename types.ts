export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be hashed
  companyName: string;
  credits: number;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  cost: number;
}

export interface PatentConfig {
  patentName: string;
  patentNo: string;
  backgroundUrl: string; // Base64 or URL
}

export interface Certificate {
  id: string; // 12 digit code
  userId: string;
  projectId: string;
  projectName: string;
  patentName: string;
  patentNo: string;
  applicantName: string;
  issueDate: string; // ISO string
  isPaid: boolean;
}

export interface AppData {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  certificates: Certificate[];
  config: PatentConfig;
}