import { AppData, User, Project, Certificate, PatentConfig, UserRole } from '../types';

const STORAGE_KEY = 'patent_auth_app_v1_cn';

const INITIAL_CONFIG: PatentConfig = {
  patentName: '高效太阳能光伏转换装置',
  patentNo: 'CN-2024-98765432',
  backgroundUrl: '', // Empty means default style
};

const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: '商业授权 - A类', cost: 500 },
  { id: 'p2', name: '研发与实验使用', cost: 200 },
  { id: 'p3', name: '教育展示用途', cost: 50 },
];

const INITIAL_USERS: User[] = [
  {
    id: 'admin',
    username: 'admin',
    password: 'admin',
    companyName: '系统管理员',
    credits: 0,
    role: UserRole.ADMIN,
  },
  {
    id: 'user1',
    username: 'tech_corp',
    password: '123',
    companyName: '未来科技股份有限公司',
    credits: 1000,
    role: UserRole.USER,
  },
];

const INITIAL_DATA: AppData = {
  currentUser: null,
  users: INITIAL_USERS,
  projects: INITIAL_PROJECTS,
  certificates: [],
  config: INITIAL_CONFIG,
};

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Return a deep copy of initial data to prevent reference pollution after resets
  return JSON.parse(JSON.stringify(INITIAL_DATA));
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const resetData = () => {
  localStorage.removeItem(STORAGE_KEY);
  // Removed window.location.reload() to prevent preview issues in development environments
}