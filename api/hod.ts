import { apiClient } from './client';
import {
  HODKPIs,
  HODFacultyMember,
  DepartmentCourse,
  ExamEligibilityRecord,
  DepartmentNotice,
  HallTicketStatus,
} from '../features/hod/types/hod.types';

// In-memory data store for responsive offline & realistic college HOD simulation
let memoryFaculty: HODFacultyMember[] = [
  {
    id: 'fac-01',
    name: 'Dr. Aditi Sengupta',
    employeeId: 'EMP-CS-101',
    email: 'aditi.sengupta@institution.edu',
    phone: '+91 98765 43210',
    rank: 'professor',
    department: 'Computer Science & Engineering',
    specialization: 'Distributed Systems & Cloud Computing',
    maxCreditsPerWeek: 16,
    assignedCredits: 14,
    assignedCourses: ['CS501', 'CS702'],
    status: 'in_lecture',
    cabinNumber: 'CSB-302',
  },
  {
    id: 'fac-02',
    name: 'Prof. Rajeshwar Rao',
    employeeId: 'EMP-CS-102',
    email: 'rajeshwar.rao@institution.edu',
    phone: '+91 98111 22334',
    rank: 'associate_professor',
    department: 'Computer Science & Engineering',
    specialization: 'Algorithms & Computational Complexity',
    maxCreditsPerWeek: 18,
    assignedCredits: 16,
    assignedCourses: ['CS301', 'CS502'],
    status: 'present',
    cabinNumber: 'CSB-305',
  },
  {
    id: 'fac-03',
    name: 'Dr. Neha Kulkarni',
    employeeId: 'EMP-CS-108',
    email: 'neha.kulkarni@institution.edu',
    phone: '+91 98222 33445',
    rank: 'assistant_professor',
    department: 'Computer Science & Engineering',
    specialization: 'Database Internals & Data Mining',
    maxCreditsPerWeek: 20,
    assignedCredits: 18,
    assignedCourses: ['CS503', 'CS505L'],
    status: 'in_lab',
    cabinNumber: 'CSB-208',
  },
  {
    id: 'fac-04',
    name: 'Er. Siddharth Nair',
    employeeId: 'EMP-CS-115',
    email: 'siddharth.nair@institution.edu',
    phone: '+91 98333 44556',
    rank: 'assistant_professor',
    department: 'Computer Science & Engineering',
    specialization: 'Computer Networks & Cybersecurity',
    maxCreditsPerWeek: 20,
    assignedCredits: 12,
    assignedCourses: ['CS504'],
    status: 'present',
    cabinNumber: 'CSB-210',
  },
  {
    id: 'fac-05',
    name: 'Mr. Vigneshwaran S.',
    employeeId: 'EMP-CS-201',
    email: 'vignesh.s@institution.edu',
    phone: '+91 98444 55667',
    rank: 'lab_instructor',
    department: 'Computer Science & Engineering',
    specialization: 'Linux Systems & Network Simulation',
    maxCreditsPerWeek: 24,
    assignedCredits: 22,
    assignedCourses: ['CS505L', 'CS304L'],
    status: 'in_lab',
    cabinNumber: 'Lab-104 Annex',
  },
  {
    id: 'fac-06',
    name: 'Dr. Arvind Mehra',
    employeeId: 'EMP-CS-105',
    email: 'arvind.mehra@institution.edu',
    phone: '+91 98555 66778',
    rank: 'associate_professor',
    department: 'Computer Science & Engineering',
    specialization: 'Artificial Intelligence & Machine Learning',
    maxCreditsPerWeek: 18,
    assignedCredits: 8,
    assignedCourses: ['CS701'],
    status: 'on_leave',
    cabinNumber: 'CSB-309',
  },
];

let memoryCourses: DepartmentCourse[] = [
  {
    id: 'crs-01',
    code: 'CS501',
    name: 'Operating Systems & Kernels',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    type: 'theory',
    credits: 4,
    instructorId: 'fac-01',
    instructorName: 'Dr. Aditi Sengupta',
    instructorRank: 'professor',
    enrolledStudentsCount: 68,
    syllabusProgressPct: 72,
    totalPlannedHours: 52,
    completedHours: 38,
  },
  {
    id: 'crs-02',
    code: 'CS502',
    name: 'Design & Analysis of Algorithms',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    type: 'theory',
    credits: 4,
    instructorId: 'fac-02',
    instructorName: 'Prof. Rajeshwar Rao',
    instructorRank: 'associate_professor',
    enrolledStudentsCount: 68,
    syllabusProgressPct: 65,
    totalPlannedHours: 52,
    completedHours: 34,
  },
  {
    id: 'crs-03',
    code: 'CS503',
    name: 'Database Management Systems',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    type: 'theory',
    credits: 4,
    instructorId: 'fac-03',
    instructorName: 'Dr. Neha Kulkarni',
    instructorRank: 'assistant_professor',
    enrolledStudentsCount: 68,
    syllabusProgressPct: 80,
    totalPlannedHours: 50,
    completedHours: 40,
  },
  {
    id: 'crs-04',
    code: 'CS504',
    name: 'Computer Networks',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    type: 'theory',
    credits: 3,
    instructorId: 'fac-04',
    instructorName: 'Er. Siddharth Nair',
    instructorRank: 'assistant_professor',
    enrolledStudentsCount: 68,
    syllabusProgressPct: 58,
    totalPlannedHours: 42,
    completedHours: 24,
  },
  {
    id: 'crs-05',
    code: 'CS505L',
    name: 'Advanced Systems & DBMS Lab',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    type: 'practical_lab',
    credits: 2,
    instructorId: 'fac-05',
    instructorName: 'Mr. Vigneshwaran S.',
    instructorRank: 'lab_instructor',
    enrolledStudentsCount: 68,
    syllabusProgressPct: 75,
    totalPlannedHours: 36,
    completedHours: 27,
    labBatchesCount: 3,
  },
  {
    id: 'crs-06',
    code: 'CS301',
    name: 'Data Structures & OOPs',
    department: 'Computer Science & Engineering',
    semester: 'Semester 3',
    type: 'theory',
    credits: 4,
    instructorId: 'fac-02',
    instructorName: 'Prof. Rajeshwar Rao',
    instructorRank: 'associate_professor',
    enrolledStudentsCount: 72,
    syllabusProgressPct: 62,
    totalPlannedHours: 52,
    completedHours: 32,
  },
  {
    id: 'crs-07',
    code: 'CS506E',
    name: 'Cloud Infrastructure & DevOps',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    type: 'elective',
    credits: 3,
    instructorId: undefined,
    instructorName: undefined,
    instructorRank: undefined,
    enrolledStudentsCount: 42,
    syllabusProgressPct: 0,
    totalPlannedHours: 40,
    completedHours: 0,
  },
];

let memoryEligibility: ExamEligibilityRecord[] = [
  {
    id: 'elg-001',
    studentId: 'std-cse-501',
    studentName: 'Aarav M. Sharma',
    usn: '1RV22CS004',
    semester: 'Semester 5',
    department: 'Computer Science & Engineering',
    overallAttendancePct: 64,
    coursesBelowThreshold: 3,
    internalAssessmentScore: 28,
    hallTicketStatus: 'detained',
    condonationReason: 'Severe dengue fever with 2 weeks hospitalization.',
    remarks: 'Medical certificate submitted to HOD office; pending condonation review.',
  },
  {
    id: 'elg-002',
    studentId: 'std-cse-512',
    studentName: 'Bhavya Venkatesh',
    usn: '1RV22CS019',
    semester: 'Semester 5',
    department: 'Computer Science & Engineering',
    overallAttendancePct: 71,
    coursesBelowThreshold: 1,
    internalAssessmentScore: 36,
    hallTicketStatus: 'condonation_needed',
    condonationReason: 'Represented college in National Smart India Hackathon.',
    remarks: 'Dean of Student Affairs recommendation letter on file.',
  },
  {
    id: 'elg-003',
    studentId: 'std-cse-527',
    studentName: 'Chetan R. Gowda',
    usn: '1RV22CS034',
    semester: 'Semester 5',
    department: 'Computer Science & Engineering',
    overallAttendancePct: 58,
    coursesBelowThreshold: 4,
    internalAssessmentScore: 21,
    hallTicketStatus: 'detained',
    condonationReason: undefined,
    remarks: 'Unexplained chronic absenteeism. Parent meeting conducted on Sept 18.',
  },
  {
    id: 'elg-004',
    studentId: 'std-cse-533',
    studentName: 'Divya P. Nair',
    usn: '1RV22CS045',
    semester: 'Semester 5',
    department: 'Computer Science & Engineering',
    overallAttendancePct: 73,
    coursesBelowThreshold: 1,
    internalAssessmentScore: 42,
    hallTicketStatus: 'condonation_needed',
    condonationReason: 'Inter-collegiate basketball tournament participation.',
    remarks: 'Sports director duty leave certificate verified.',
  },
  {
    id: 'elg-005',
    studentId: 'std-cse-541',
    studentName: 'Eshan Farhan',
    usn: '1RV22CS052',
    semester: 'Semester 5',
    department: 'Computer Science & Engineering',
    overallAttendancePct: 88,
    coursesBelowThreshold: 0,
    internalAssessmentScore: 45,
    hallTicketStatus: 'eligible',
  },
  {
    id: 'elg-006',
    studentId: 'std-cse-315',
    studentName: 'Gaurav Kulkarni',
    usn: '1RV23CS028',
    semester: 'Semester 3',
    department: 'Computer Science & Engineering',
    overallAttendancePct: 69,
    coursesBelowThreshold: 2,
    internalAssessmentScore: 31,
    hallTicketStatus: 'condonation_needed',
    condonationReason: 'Typhoid recovery.',
    remarks: 'Clinic documents attached.',
  },
];

let memoryNotices: DepartmentNotice[] = [
  {
    id: 'not-01',
    title: 'Mid-Semester Internal Assessment - II Schedule & Rubrics',
    content: 'All faculty members are requested to submit question papers for IA-2 with Bloom taxonomy levels to the exam cell by Monday 5:00 PM.',
    department: 'Computer Science & Engineering',
    priority: 'urgent',
    targetAudience: 'faculty',
    publishedDate: '2026-10-02',
    authorName: 'Dr. HOD',
    authorRole: 'Head of Department',
  },
  {
    id: 'not-02',
    title: 'Mandatory Lab Component Safety & Equipment Handover',
    content: 'Lab Instructors must inspect IoT sensors and oscilloscope calibration logs before the Semester Practical Mock Examinations.',
    department: 'Computer Science & Engineering',
    priority: 'important',
    targetAudience: 'lab_assistants',
    publishedDate: '2026-09-29',
    authorName: 'Dr. HOD',
    authorRole: 'Head of Department',
  },
  {
    id: 'not-03',
    title: 'Shortage of Attendance Notification & Hall Ticket Clearance',
    content: 'Students with attendance below 75% across Semester 3, 5, and 7 must report to the Department Academic Committee before the final detention freeze.',
    department: 'Computer Science & Engineering',
    priority: 'urgent',
    targetAudience: 'students',
    publishedDate: '2026-09-27',
    authorName: 'Dr. HOD',
    authorRole: 'Head of Department',
  },
];

export async function fetchHODKPIsApi(department?: string): Promise<HODKPIs> {
  try {
    const res = await apiClient<HODKPIs>(`/admin/hod/kpis${department ? `?department=${encodeURIComponent(department)}` : ''}`);
    if (res) return res;
  } catch {
    // fallback to computed mock data
  }

  const presentFaculty = memoryFaculty.filter((f) => f.status !== 'on_leave' && f.status !== 'absent').length;
  const detainedCount = memoryEligibility.filter((e) => e.hallTicketStatus !== 'eligible').length;
  const unassigned = memoryCourses.filter((c) => !c.instructorId).length;
  const practicalCount = memoryCourses.filter((c) => c.type === 'practical_lab').length;
  const avgSyllabus = Math.round(
    memoryCourses.reduce((sum, c) => sum + c.syllabusProgressPct, 0) / (memoryCourses.length || 1)
  );

  return {
    totalStudents: 320,
    facultyOnDuty: presentFaculty,
    totalFaculty: memoryFaculty.length,
    activeCourses: memoryCourses.length,
    practicalLabsCount: practicalCount,
    averageSyllabusProgress: avgSyllabus,
    detentionAlertsCount: detainedCount,
    unassignedCoursesCount: unassigned,
    todayLabSessions: 4,
  };
}

export async function fetchHODFacultyApi(department?: string): Promise<HODFacultyMember[]> {
  try {
    const res = await apiClient<HODFacultyMember[]>(`/admin/hod/faculty${department ? `?department=${encodeURIComponent(department)}` : ''}`);
    if (res && Array.isArray(res) && res.length > 0) {
      return res;
    }
  } catch {
    // fallback
  }
  return [...memoryFaculty];
}

export async function fetchDepartmentCoursesApi(department?: string): Promise<DepartmentCourse[]> {
  try {
    const res = await apiClient<DepartmentCourse[]>(`/admin/hod/courses${department ? `?department=${encodeURIComponent(department)}` : ''}`);
    if (res && Array.isArray(res) && res.length > 0) {
      return res;
    }
  } catch {
    // fallback
  }
  return [...memoryCourses];
}

export async function assignCourseInstructorApi(
  courseId: string,
  facultyId: string,
  facultyName: string
): Promise<{ success: boolean; course: DepartmentCourse }> {
  try {
    const res = await apiClient<{ success: boolean; course: DepartmentCourse }>(
      `/admin/hod/courses/${courseId}/assign`,
      {
        method: 'POST',
        body: JSON.stringify({ facultyId, facultyName }),
      }
    );
    if (res?.success) {
      return res;
    }
  } catch {
    // fallback
  }

  const faculty = memoryFaculty.find((f) => f.id === facultyId);
  const courseIdx = memoryCourses.findIndex((c) => c.id === courseId);
  if (courseIdx >= 0) {
    memoryCourses[courseIdx] = {
      ...memoryCourses[courseIdx],
      instructorId: facultyId,
      instructorName: facultyName,
      instructorRank: faculty?.rank,
    };

    if (faculty && !faculty.assignedCourses.includes(memoryCourses[courseIdx].code)) {
      faculty.assignedCourses.push(memoryCourses[courseIdx].code);
      faculty.assignedCredits += memoryCourses[courseIdx].credits;
    }

    return { success: true, course: memoryCourses[courseIdx] };
  }

  throw new Error('Course not found');
}

export async function fetchExamEligibilityApi(
  department?: string,
  semester?: string
): Promise<ExamEligibilityRecord[]> {
  try {
    const query = [
      department ? `department=${encodeURIComponent(department)}` : '',
      semester ? `semester=${encodeURIComponent(semester)}` : '',
    ].filter(Boolean).join('&');
    const res = await apiClient<ExamEligibilityRecord[]>(`/admin/hod/eligibility${query ? `?${query}` : ''}`);
    if (res && Array.isArray(res) && res.length > 0) {
      return res;
    }
  } catch {
    // fallback
  }
  if (semester && semester !== 'all') {
    return memoryEligibility.filter((e) => e.semester.toLowerCase() === semester.toLowerCase());
  }
  return [...memoryEligibility];
}

export async function updateHallTicketStatusApi(
  recordId: string,
  status: HallTicketStatus,
  note?: string
): Promise<{ success: boolean; record: ExamEligibilityRecord }> {
  try {
    const res = await apiClient<{ success: boolean; record: ExamEligibilityRecord }>(
      `/admin/hod/eligibility/${recordId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      }
    );
    if (res?.success) {
      return res;
    }
  } catch {
    // fallback
  }

  const idx = memoryEligibility.findIndex((e) => e.id === recordId);
  if (idx >= 0) {
    memoryEligibility[idx] = {
      ...memoryEligibility[idx],
      hallTicketStatus: status,
      remarks: note ? note : memoryEligibility[idx].remarks,
      approvedBy: 'Head of Department',
      approvalDate: new Date().toISOString().split('T')[0],
    };
    return { success: true, record: memoryEligibility[idx] };
  }

  throw new Error('Eligibility record not found');
}

export async function fetchDepartmentNoticesApi(department?: string): Promise<DepartmentNotice[]> {
  try {
    const res = await apiClient<DepartmentNotice[]>(`/admin/hod/notices${department ? `?department=${encodeURIComponent(department)}` : ''}`);
    if (res && Array.isArray(res) && res.length > 0) {
      return res;
    }
  } catch {
    // fallback
  }
  return [...memoryNotices];
}

export async function createDepartmentNoticeApi(
  noticeData: Omit<DepartmentNotice, 'id' | 'publishedDate'>
): Promise<{ success: boolean; notice: DepartmentNotice }> {
  try {
    const res = await apiClient<{ success: boolean; notice: DepartmentNotice }>(
      '/admin/hod/notices',
      {
        method: 'POST',
        body: JSON.stringify(noticeData),
      }
    );
    if (res?.success) {
      return res;
    }
  } catch {
    // fallback
  }

  const newNotice: DepartmentNotice = {
    ...noticeData,
    id: `not-${Date.now()}`,
    publishedDate: new Date().toISOString().split('T')[0],
  };

  memoryNotices.unshift(newNotice);
  return { success: true, notice: newNotice };
}
