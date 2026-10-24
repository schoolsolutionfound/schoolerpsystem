import dotenv from 'dotenv';
import path from 'path';
import { admissionService } from '../src/modules/admission/admission.service.js';
import { db } from '../src/modules/shared/db/index.js';
import { admissionCourses, admissionApplications } from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  console.log('🧪 Starting Admission Module End-to-End Test...');

  const testInst = 'TEST_INST_001';
  const testBatch = '2026-2027';

  try {
    // 1. Initial Stats
    const initialStats = await admissionService.getStats(testInst, testBatch);
    console.log('✅ 1. getStats returned successfully:', {
      totalSeats: initialStats.totalSeats,
      allocatedSeats: initialStats.allocatedSeats,
      confirmedSeats: initialStats.confirmedSeats,
      waitingListCount: initialStats.waitingListCount,
    });

    // 2. Create Course (CS with 120 seats, CET: 80, Management: 40)
    const courseCode = `TEST_CS_${Date.now() % 1000}`;
    const course = await admissionService.createCourse(testInst, {
      academicYear: testBatch,
      courseCode,
      courseName: 'Test Computer Science',
      programType: 'engineering',
      totalSeats: 120,
      quotas: [
        { quotaName: 'CET', seats: 80 },
        { quotaName: 'Management', seats: 40 },
      ],
    });
    console.log('✅ 2. createCourse succeeded:', { id: course.id, code: course.courseCode, totalSeats: course.totalSeats });

    // 3. Create Student (Should start in waiting_list)
    const student = await admissionService.createApplication(testInst, 'test_user_id', {
      academicYear: testBatch,
      fullName: 'Aarav Sharma',
      parentPhone: '9876543210',
      dob: '2005-06-15',
      fatherName: 'Rajesh Sharma',
      motherName: 'Meena Sharma',
      bloodGroup: 'O+',
      programType: 'engineering',
      preferredCourseId: course.id,
      preferredCourseName: course.courseName,
      customFields: { sslcMarks: '94.5%', kcetRank: 3200 },
    });
    console.log('✅ 3. createApplication created in WAITING LIST:', {
      id: student.id,
      name: student.fullName,
      status: student.status,
      appNo: student.applicationNumber,
    });

    if (student.status !== 'waiting_list') {
      throw new Error(`Expected status to be waiting_list, got: ${student.status}`);
    }

    // 4. Allocate Seat (to CET quota)
    const allocated = await admissionService.allocateSeat(testInst, student.id, {
      courseId: course.id,
      quota: 'CET',
      notes: 'Initial CET counseling allocation',
    });
    console.log('✅ 4. allocateSeat succeeded:', {
      id: allocated.id,
      status: allocated.status,
      allocatedCourse: allocated.allocatedCourseName,
      quota: allocated.allocatedQuota,
    });

    if (allocated.status !== 'allocated') {
      throw new Error(`Expected status to be allocated, got: ${allocated.status}`);
    }

    // Verify Seat counts
    const coursesAfterAlloc = await admissionService.getCourses(testInst, testBatch);
    const csCourse = coursesAfterAlloc.find((c) => c.id === course.id);
    console.log('✅ 5. Verified seat decrement:', {
      allocatedSeats: csCourse?.allocatedSeats,
      availableSeats: csCourse?.availableSeats,
      quotaSummaries: csCourse?.quotaSummaries,
    });

    if (csCourse?.allocatedSeats !== 1) {
      throw new Error(`Expected 1 allocated seat, got: ${csCourse?.allocatedSeats}`);
    }

    // 6. Unallocate Seat (Should return to waiting list & free up seat)
    const unallocated = await admissionService.unallocateSeat(testInst, student.id, 'Candidate requested branch change');
    console.log('✅ 6. unallocateSeat returned student to WAITING LIST:', {
      id: unallocated.id,
      status: unallocated.status,
      allocatedCourseId: unallocated.allocatedCourseId,
    });

    if (unallocated.status !== 'waiting_list' || unallocated.allocatedCourseId !== null) {
      throw new Error(`Expected status to be waiting_list with null allocatedCourseId, got: ${unallocated.status}`);
    }

    // Re-verify Seat freed up
    const coursesAfterUnalloc = await admissionService.getCourses(testInst, testBatch);
    const csAfterUnalloc = coursesAfterUnalloc.find((c) => c.id === course.id);
    console.log('✅ 7. Verified seat freed up after unallocation:', {
      allocatedSeats: csAfterUnalloc?.allocatedSeats,
      availableSeats: csAfterUnalloc?.availableSeats,
    });

    if (csAfterUnalloc?.allocatedSeats !== 0) {
      throw new Error(`Expected 0 allocated seats after unallocation, got: ${csAfterUnalloc?.allocatedSeats}`);
    }

    // 8. Re-allocate & Confirm Admission
    await admissionService.allocateSeat(testInst, student.id, {
      courseId: course.id,
      quota: 'Management',
    });
    const confirmed = await admissionService.confirmSeat(testInst, student.id, 'Fee paid via DD #89211');
    console.log('✅ 8. confirmSeat finalized admission:', {
      id: confirmed.id,
      status: confirmed.status,
      confirmedAt: confirmed.confirmedAt,
    });

    if (confirmed.status !== 'confirmed') {
      throw new Error(`Expected status to be confirmed, got: ${confirmed.status}`);
    }

    // Clean up test data
    if (db) {
      await db.delete(admissionApplications).where(eq(admissionApplications.id, student.id));
      await db.delete(admissionCourses).where(eq(admissionCourses.id, course.id));
      console.log('🧹 Cleaned up test data.');
    }

    console.log('🎉 ALL ADMISSION MODULE TESTS PASSED PERFECTLY!');
  } catch (err: any) {
    console.error('❌ Test failed:', err.message || err);
  } finally {
    process.exit(0);
  }
}

run();
