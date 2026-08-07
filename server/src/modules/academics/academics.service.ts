import { academicsRepository } from './academics.repository.js';
import { dbGetAllUsers } from '../shared/db/index.js';
import {
  CreateClassSectionInput,
  UpdateClassSectionInput,
  CreateSubjectInput,
  CreateSubjectTeacherInput,
  CreatePeriodInput,
  UpdateInstitutionTermsInput,
  UpdateHolidayCalendarInput,
} from './academics.schema.js';

const TEACHER_ROLES = ['teacher', 'hod', 'admin', 'principal'];

export class AcademicsService {
  // ---------- Class Sections ----------
  public async listClassSections(institutionCode: string) {
    return academicsRepository.listClassSections(institutionCode);
  }

  public async createClassSection(institutionCode: string, input: CreateClassSectionInput) {
    if (input.classTeacherId) {
      const teacher = await this.findTeacher(institutionCode, input.classTeacherId);
      if (!teacher) {
        throw { statusCode: 400, code: 'INVALID_CLASS_TEACHER', message: 'classTeacherId does not reference a valid teacher in this institution' };
      }
    }
    return academicsRepository.createClassSection({ ...input, institutionCode });
  }

  public async updateClassSection(institutionCode: string, id: string, input: UpdateClassSectionInput) {
    const existing = await academicsRepository.getClassSectionById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'CLASS_SECTION_NOT_FOUND', message: 'Class/section not found' };
    }
    if (existing.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: class/section belongs to another institution' };
    }
    if (input.classTeacherId) {
      const teacher = await this.findTeacher(institutionCode, input.classTeacherId);
      if (!teacher) {
        throw { statusCode: 400, code: 'INVALID_CLASS_TEACHER', message: 'classTeacherId does not reference a valid teacher in this institution' };
      }
    }
    return academicsRepository.updateClassSection(id, input);
  }

  public async deleteClassSection(institutionCode: string, id: string) {
    const existing = await academicsRepository.getClassSectionById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'CLASS_SECTION_NOT_FOUND', message: 'Class/section not found' };
    }
    if (existing.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: class/section belongs to another institution' };
    }
    return academicsRepository.deleteClassSection(id);
  }

  // ---------- Subjects ----------
  public async listSubjects(institutionCode: string) {
    return academicsRepository.listSubjects(institutionCode);
  }

  public async createSubject(institutionCode: string, input: CreateSubjectInput) {
    return academicsRepository.createSubject({ ...input, institutionCode });
  }

  // ---------- Subject Teachers ----------
  public async listSubjectTeachers(institutionCode: string, classSectionId?: string, teacherId?: string) {
    return academicsRepository.listSubjectTeachers(institutionCode, classSectionId, teacherId);
  }

  public async createSubjectTeacher(institutionCode: string, input: CreateSubjectTeacherInput) {
    const classSection = await academicsRepository.getClassSectionById(input.classSectionId);
    if (!classSection || classSection.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 400, code: 'INVALID_CLASS_SECTION', message: 'classSectionId does not reference a class/section in this institution' };
    }

    const subject = await academicsRepository.getSubjectById(input.subjectId);
    if (!subject || subject.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 400, code: 'INVALID_SUBJECT', message: 'subjectId does not reference a subject in this institution' };
    }

    const teacher = await this.findTeacher(institutionCode, input.teacherId);
    if (!teacher) {
      throw { statusCode: 400, code: 'INVALID_TEACHER', message: 'teacherId does not reference a valid teacher in this institution' };
    }

    const existing = await academicsRepository.listSubjectTeachers(institutionCode, input.classSectionId);
    if (existing.some((st) => st.subjectId === input.subjectId)) {
      throw { statusCode: 409, code: 'SUBJECT_TEACHER_EXISTS', message: 'A teacher is already assigned to this subject for this class/section' };
    }

    return academicsRepository.createSubjectTeacher({ ...input, institutionCode });
  }

  public async deleteSubjectTeacher(institutionCode: string, id: string) {
    const existing = await academicsRepository.getSubjectTeacherById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'SUBJECT_TEACHER_NOT_FOUND', message: 'Subject-teacher assignment not found' };
    }
    if (existing.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: assignment belongs to another institution' };
    }
    return academicsRepository.deleteSubjectTeacher(id);
  }

  // ---------- Periods ----------
  public async listPeriods(institutionCode: string) {
    return academicsRepository.listPeriods(institutionCode);
  }

  public async createPeriod(institutionCode: string, input: CreatePeriodInput) {
    const existing = await academicsRepository.listPeriods(institutionCode);
    if (existing.some((p) => p.label.toLowerCase() === input.label.toLowerCase())) {
      throw { statusCode: 409, code: 'PERIOD_LABEL_EXISTS', message: `A period labeled "${input.label}" already exists` };
    }
    return academicsRepository.createPeriod({ ...input, institutionCode });
  }

  // ---------- Term & Holiday Config (delegated to admin config endpoints) ----------
  public async updateTerms(institutionCode: string, input: UpdateInstitutionTermsInput) {
    const { adminService } = await import('../admin/admin.service.js');
    return adminService.updateInstitutionConfig(institutionCode, {
      terms: [{ academicYear: input.academicYear, terms: input.terms }],
    });
  }

  public async updateHolidays(institutionCode: string, input: UpdateHolidayCalendarInput) {
    const { adminService } = await import('../admin/admin.service.js');
    return adminService.updateInstitutionConfig(institutionCode, {
      blockedDates: input.blockedDates,
    });
  }

  // ---------- Helpers ----------
  private async findTeacher(institutionCode: string, userId: string) {
    const allUsers = await dbGetAllUsers();
    const teacher = allUsers.find((u) => u.id === userId || u.firebaseUid === userId);
    if (!teacher) return undefined;
    if (teacher.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) return undefined;
    if (!TEACHER_ROLES.includes(teacher.role.toLowerCase())) return undefined;
    return teacher;
  }
}

export const academicsService = new AcademicsService();
