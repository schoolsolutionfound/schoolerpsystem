export enum Role {
  Developer = 'dev',
  Admin = 'admin',
  Maintainer = 'maintainer',
  Teacher = 'teacher',
  Student = 'student',
}

export type RoleType = Role | 'dev' | 'admin' | 'maintainer' | 'teacher' | 'student';
