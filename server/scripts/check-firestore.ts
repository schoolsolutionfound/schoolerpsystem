import 'dotenv/config';
import { admin } from '../src/modules/shared/config/firebase.js';

async function checkFirestore() {
  const firestore = admin.firestore();
  console.log('--- Checking Firestore users collection ---');
  try {
    const snap = await firestore.collection('users').get();
    console.log('Total docs in Firestore users:', snap.size);
    snap.forEach((doc) => {
      const data = doc.data();
      console.log(doc.id, '=>', {
        email: data.email,
        role: data.role || data.userRole,
        institutionCode: data.institutionCode || data.institutionId || data.schoolId,
        schoolName: data.schoolName || data.institutionName,
        name: data.fullName || data.name || data.displayName,
      });
    });
  } catch (err: any) {
    console.error('Firestore read error:', err.message);
  }

  // Also check institutions collection if any
  try {
    const instSnap = await firestore.collection('institutions').get();
    console.log('\nTotal docs in Firestore institutions:', instSnap.size);
    instSnap.forEach((doc) => {
      console.log(doc.id, '=>', doc.data());
    });
  } catch {}

  process.exit(0);
}

checkFirestore().catch((e) => {
  console.error(e);
  process.exit(1);
});
