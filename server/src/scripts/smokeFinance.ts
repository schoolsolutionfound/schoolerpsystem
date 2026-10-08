import 'dotenv/config';
import { adminService } from '../modules/admin/admin.service.js';
import { db, dbFindUsersByInstitution } from '../modules/shared/db/index.js';

async function main() {
  if (!db) {
    console.error('SMOKE FAIL: db is null (DATABASE_URL missing?)');
    process.exit(1);
  }

  const inst = process.env.SMOKE_INST || 'TST001';
  const users = await dbFindUsersByInstitution(inst).catch(() => [] as any[]);
  const raw: any = users;
  const list: any[] = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];
  const accountants = list.filter((u) => (u.role || '').toLowerCase() === 'accountant');
  const parents = list.filter((u) => (u.role || '').toLowerCase() === 'parent');
  const students = list.filter((u) => (u.role || '').toLowerCase() === 'student');

  console.log(`${inst} users: accountants=${accountants.length} parents=${parents.length} students=${students.length}`);

  const fees = await adminService.getFees(inst);
  console.log(`list fees: ${fees.length}`);

  const fee = await adminService.createFee(inst, {
    title: 'SMOKE Temp Fee',
    category: 'student_fee',
    amount: 1,
    term: 'smoke',
    academicYear: '2026-27',
    dueDate: '2026-12-31',
    status: 'active',
    createdBy: 'smoke',
  });
  console.log(`create fee: ${fee.id}`);

  const updated = await adminService.updateFee(fee.id, inst, { title: 'SMOKE Temp Fee (updated)' });
  console.log(`update fee: ${updated.title}`);

  let paymentId = '';
  if (students[0] && fee) {
    const pay = await adminService.createFeePayment(inst, {
      feeStructureId: fee.id,
      studentId: students[0].id,
      amount: 1,
      paymentMethod: 'cash',
      paymentDate: '2026-09-23',
      status: 'paid',
      createdBy: 'smoke',
    });
    paymentId = pay.id;
    console.log(`create payment: ${pay.id} receipt=${pay.receiptNo}`);

    const payments = await adminService.getFeePayments(inst);
    console.log(`list payments: ${payments.length}`);

    await adminService.updateFeePayment(paymentId, inst, { notes: 'smoke' });
    console.log('update payment: ok');
  } else {
    console.log(`SKIP payment: no student in ${inst}`);
  }

  if (parents[0]) {
    try {
      const parentFees = await adminService.getParentFees(inst, parents[0].firebaseUid || parents[0].id);
      console.log(`parent fees: ${Array.isArray(parentFees) ? parentFees.length : parentFees}`);
    } catch (e: any) {
      console.log(`parent fees error: ${e?.message || e}`);
    }
  } else {
    console.log(`SKIP parent fees: no parent`);
  }

  if (students[0]) {
    try {
      const studentFees = await adminService.getStudentFees(inst, students[0].firebaseUid || students[0].id);
      console.log(`student fees: ${Array.isArray(studentFees) ? studentFees.length : studentFees}`);
    } catch (e: any) {
      console.log(`student fees error: ${e?.message || e}`);
    }
  } else {
    console.log(`SKIP student fees: no student`);
  }

  if (paymentId) {
    await adminService.deleteFeePayment(paymentId, inst);
    console.log('delete payment: ok');
  }
  await adminService.deleteFee(fee.id, inst);
  console.log('delete fee: ok');

  const after = await adminService.getFees(inst);
  const leftover = after.find((f: any) => f.id === fee.id);
  if (leftover) {
    console.error('SMOKE FAIL: fee still present after delete');
    process.exit(1);
  }

  console.log('SMOKE PASS');
  process.exit(0);
}

main().catch((err) => {
  console.error('SMOKE FAIL:', err);
  process.exit(1);
});
