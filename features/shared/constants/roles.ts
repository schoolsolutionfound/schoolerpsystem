export enum Role {
  Developer = 'dev',
  Admin = 'admin',
  Teacher = 'teacher',
  Student = 'student',
  Principal = 'principal',
  Parent = 'parent',
  Accountant = 'accountant',
  HOD = 'hod',
  Librarian = 'librarian',
  Driver = 'driver',
}

export type RoleType = Role | 'dev' | 'admin' | 'teacher' | 'student' | 'principal' | 'parent' | 'accountant' | 'hod' | 'librarian' | 'driver';
