import { StudentFeeRecord, HomeroomSection } from '../types/principal.types';
import { DEFAULT_INSTITUTION_CLASSES } from './defaultClasses';

export const DEPARTMENT_OPTIONS = [
  'All',
  'Computer Science',
  'Electronics & Comm',
  'Mechanical Eng',
  'Civil Eng',
  'AIML',
  'Applied Sciences',
] as const;

export const YEAR_OPTIONS = [
  'All',
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
] as const;

export const INSTITUTION_OPTIONS = [
  'All',
  'Main Campus',
  'Engineering Campus',
  'School of Technology',
] as const;

export const STATUS_OPTIONS = [
  'All',
  'Due Only',
  'No Due',
] as const;

const FIRST_NAMES = [
  'Aarav', 'Rohan', 'Priya', 'Ananya', 'Vikram', 'Sneha', 'Rahul', 'Aditi',
  'Varun', 'Neha', 'Kabir', 'Ishita', 'Arjun', 'Pooja', 'Tanmay', 'Divya',
  'Karan', 'Meera', 'Gaurav', 'Riya', 'Sameer', 'Shreya', 'Siddharth', 'Kavya',
  'Aditya', 'Harini', 'Abhishek', 'Bhavna', 'Chetan', 'Deepika', 'Gautam',
  'Jaspreet', 'Karthik', 'Lavanya', 'Manish', 'Nandini', 'Pranav', 'Roshni',
  'Sachin', 'Trisha', 'Umar', 'Vidya', 'Yash', 'Zoya', 'Naveen', 'Swati'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patil', 'Iyer', 'Deshmukh', 'Singh', 'Reddy',
  'Mehta', 'Nair', 'Kulkarni', 'Joshi', 'Chopra', 'Malhotra', 'Bose', 'Chatterjee',
  'Sen', 'Pillai', 'Rao', 'Shetty', 'Bhat', 'Agarwal', 'Menon', 'Balakrishnan',
  'Mukherjee', 'Trivedi', 'Pandey', 'Saxena', 'Choudhury', 'Banerjee'
];

export function generateAllInstitutionalStudentFees(homeroomSections?: HomeroomSection[]): StudentFeeRecord[] {
  const sections = homeroomSections && homeroomSections.length > 0 ? homeroomSections : DEFAULT_INSTITUTION_CLASSES;
  const records: StudentFeeRecord[] = [];

  sections.forEach((sec, secIdx) => {
    const studentCount = sec.studentCount || 40;
    const dept = sec.department || 'Computer Science';
    const year = sec.grade || '1st Year';

    // Map department to standard abbreviation
    let deptCode = 'CSE';
    let baseFee = 85000;
    let institution = 'Main Campus';

    if (dept.includes('Computer') || dept.includes('CSE')) {
      deptCode = 'CSE';
      baseFee = 85000;
      institution = 'Main Campus';
    } else if (dept.includes('AIML') || dept.includes('Artificial')) {
      deptCode = 'AIM';
      baseFee = 90000;
      institution = 'Main Campus';
    } else if (dept.includes('Electronics') || dept.includes('ECE')) {
      deptCode = 'ECE';
      baseFee = 78000;
      institution = 'Engineering Campus';
    } else if (dept.includes('Mechanical') || dept.includes('Mech')) {
      deptCode = 'MEC';
      baseFee = 75000;
      institution = 'Engineering Campus';
    } else if (dept.includes('Civil')) {
      deptCode = 'CIV';
      baseFee = 72000;
      institution = 'School of Technology';
    } else if (dept.includes('Applied')) {
      deptCode = 'APS';
      baseFee = 65000;
      institution = 'School of Technology';
    }

    // Determine year prefix for roll number
    let yrPrefix = '24';
    if (year.includes('2nd') || year.includes('2')) yrPrefix = '23';
    else if (year.includes('3rd') || year.includes('3')) yrPrefix = '22';
    else if (year.includes('4th') || year.includes('4')) yrPrefix = '21';

    for (let i = 0; i < studentCount; i++) {
      const fn = FIRST_NAMES[(i * 3 + secIdx * 5) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(i * 2 + secIdx * 7) % LAST_NAMES.length];
      const rollNumber = `${yrPrefix}${deptCode}${(i + 1).toString().padStart(3, '0')}`;

      // Deterministic fee status distribution (~24% dues total)
      const isOverdue = (i * 7 + secIdx * 3) % 9 === 0;
      const isDue = !isOverdue && (i * 5 + secIdx * 2) % 7 === 0;

      let dueAmount = 0;
      let paidAmount = baseFee;
      let status: 'due' | 'paid' | 'overdue' = 'paid';
      let dueDate = 'Completed';
      let lastPaymentDate: string | undefined = `1${(i % 8) + 1} Sep 2026`;

      if (isOverdue) {
        dueAmount = Math.round(baseFee * 0.45);
        paidAmount = baseFee - dueAmount;
        status = 'overdue';
        dueDate = `1${(i % 5) + 1} Oct 2026`;
        lastPaymentDate = undefined;
      } else if (isDue) {
        dueAmount = Math.round(baseFee * 0.25);
        paidAmount = baseFee - dueAmount;
        status = 'due';
        dueDate = `2${(i % 8) + 1} Oct 2026`;
        lastPaymentDate = undefined;
      }

      records.push({
        id: `fee_${sec.id}_${i + 1}`,
        classId: sec.id,
        className: sec.name,
        studentName: `${fn} ${ln}`,
        rollNumber,
        department: dept,
        year,
        institution,
        totalFee: baseFee,
        paidAmount,
        dueAmount,
        dueDate,
        lastPaymentDate,
        status,
        contactPhone: `+91 98${(76543210 + i * 137 + secIdx * 23).toString().slice(0, 8)}`,
        guardianName: `${LAST_NAMES[(i * 2 + secIdx * 7 + 1) % LAST_NAMES.length]} K.`,
      });
    }
  });

  // CRITICAL REQUIREMENT: "initially students with due should be in top andbelow the student with no due"
  return records.sort((a, b) => {
    const aHasDue = a.dueAmount > 0 ? 1 : 0;
    const bHasDue = b.dueAmount > 0 ? 1 : 0;

    if (aHasDue !== bHasDue) {
      return bHasDue - aHasDue; // Dues first
    }
    if (aHasDue && bHasDue) {
      return b.dueAmount - a.dueAmount; // Higher dues first
    }
    return a.studentName.localeCompare(b.studentName);
  });
}

// Full institutional dataset matching all 1,854 students in DEFAULT_INSTITUTION_CLASSES
export const MOCK_STUDENT_FEES: StudentFeeRecord[] = generateAllInstitutionalStudentFees();
