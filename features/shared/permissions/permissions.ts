import { Role, RoleType } from '../constants/roles';

export function normalizeRole(role?: string): string {
  return (role || '').trim().toLowerCase();
}

export function isDeveloper(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === Role.Developer || norm === Role.Admin;
}

export function isAdmin(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === Role.Admin || norm === Role.Maintainer || norm === 'institution admin' || norm === 'admin';
}

export function isTeacher(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === Role.Teacher;
}

export function isStudent(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === Role.Student;
}

export function isMaintainer(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === Role.Maintainer;
}

export function canManageInstitutions(role?: string): boolean {
  return isDeveloper(role);
}

export function hasRole(role?: string, allowedRoles: RoleType[] = []): boolean {
  const norm = normalizeRole(role);
  return allowedRoles.some((r) => normalizeRole(r) === norm);
}
