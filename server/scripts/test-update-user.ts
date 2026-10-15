import 'dotenv/config';
import { adminService } from '../src/modules/admin/admin.service.js';
import { db } from '../src/modules/shared/db/index.js';
import * as schema from '../src/modules/shared/db/schema.js';
import { eq } from 'drizzle-orm';

async function test() {
  console.log('--- Testing adminService.updateUser role promotion ---');
  if (!db) {
    console.error('Database connection not available');
    process.exit(1);
  }
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, 'staff.multirole@school.com'));

  if (user.length === 0) {
    console.error('User not found');
    process.exit(1);
  }

  const target = user[0];
  console.log('Before update:', { id: target.id, role: target.role, roles: target.roles });

  // Promote with updated roles and title
  const updated = await adminService.updateUser(target.id, target.institutionCode || 'OAK002', {
    title: 'Senior Dean of Finance & Admissions',
    role: 'admission_officer',
    roles: ['accountant', 'admission_officer', 'teacher'],
  });

  console.log('After update:', {
    id: updated?.id,
    title: updated?.title,
    role: updated?.role,
    roles: updated?.roles,
  });

  process.exit(0);
}

test().catch(console.error);
