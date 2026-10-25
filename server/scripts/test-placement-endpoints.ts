import 'dotenv/config';
import { placementService } from '../src/modules/placement/placement.service.js';

async function test() {
  const user: any = {
    uid: 'r6hLWeYho8RLzYg8xUVo0jDjP4A2',
    institutionCode: 'GIS001',
    role: 'placement_officer',
  };

  console.log('Testing listMembers...');
  const members = await placementService.listMembers(user);
  console.log('✓ listMembers result:', members);

  console.log('Testing getStats...');
  const stats = await placementService.getStats(user);
  console.log('✓ getStats result:', stats);

  process.exit(0);
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
