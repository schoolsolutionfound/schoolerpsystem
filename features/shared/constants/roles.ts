export enum Role {
  Developer = 'dev',
  Admin = 'admin',
  Maintainer = 'maintainer',
  Teacher = 'teacher',
  Student = 'student',
  Principal = 'principal',
  Parent = 'parent',
  Accountant = 'accountant',
  HOD = 'hod',
  Librarian = 'librarian',
}

export type RoleType = Role | 'dev' | 'admin' | 'maintainer' | 'teacher' | 'student' | 'principal' | 'parent' | 'accountant' | 'hod' | 'librarian';
