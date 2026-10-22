require('dotenv').config();
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

(async () => {
  let pageToken;
  const users = [];
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  console.log(`\n=== FIREBASE AUTH — TOTAL USERS: ${users.length} ===\n`);

  const byRole = {};
  for (const u of users) {
    const claims = u.customClaims || {};
    const role = claims.role || (claims.admin === true ? 'admin' : 'unknown');
    const inst = claims.institutionCode || claims.instCode || '';
    byRole[role] = (byRole[role] || 0) + 1;
    console.log(
      `[${role}] ${u.displayName || '(no name)'} | ${u.email || '(no email)'} | ${inst || '-'} | uid=${u.uid} | disabled=${u.disabled} | verified=${u.emailVerified} | created=${u.metadata.creationTime}`
    );
    if (Object.keys(claims).length) console.log(`        claims: ${JSON.stringify(claims)}`);
  }

  console.log('\n=== COUNT BY ROLE ===');
  Object.entries(byRole)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log(`  TOTAL: ${users.length}`);
  console.log(
    '\n(passwords are not retrievable — Firebase stores scrypt hashes and exposes no API to read them)'
  );
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
