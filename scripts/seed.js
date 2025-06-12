// scripts/seed.js
import 'dotenv/config'; // Import dotenv to load environment variables from .env file
import admin from 'firebase-admin';
import { format, subMonths } from 'date-fns';

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// The UID of the user who will be designated as the admin.
// IMPORTANT: This UID must correspond to a user in your Firebase Authentication.
const adminUserId = 'qvzVYtwVgTdhhoLeMOQP3A0FPQr2'; 
const adminUserEmail = 'admin@example.com'; // The email for the admin user

const appId = 'financial-ledger-5cc34';

const beverageItems = [
  { name: 'Coca-Cola (35cl)', cost: 120, price: 180 },
  { name: 'Pepsi (35cl)', cost: 110, price: 170 },
  { name: 'Fanta (35cl)', cost: 115, price: 175 },
  // ... other items
];

const getCollectionPath = (collectionName) => `artifacts/${appId}/users/${adminUserId}/${collectionName}`;

// Helper function to create the user profile with an admin role
const setupAdminUserProfile = async () => {
  console.log(`Setting up admin profile for user: ${adminUserId}`);
  const profileRef = db.collection('user_profiles').doc(adminUserId);
  await profileRef.set({
    email: adminUserEmail,
    role: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Admin user profile created successfully.');
};

// ... (generateSales, generateExpenses, generateInventory functions remain the same, but ensure they include `userId: adminUserId` in each document)

const generateSales = async (numSales) => {
  console.log(`Generating ${numSales} sales records for user ${adminUserId}...`);
  let batch = db.batch();
  const salesCollectionRef = db.collection(getCollectionPath('sales'));
  const today = new Date();

  for (let i = 0; i < numSales; i++) {
    const randomBeverage = beverageItems[Math.floor(Math.random() * beverageItems.length)];
    const sale = {
      userId: adminUserId, // Ensure userId is set
      item: randomBeverage.name,
      qty: Math.floor(Math.random() * 10) + 1,
      cost: randomBeverage.cost,
      price: randomBeverage.price,
      customer: `Customer ${Math.floor(Math.random() * 100) + 1}`,
      date: format(subMonths(today, Math.random() * 12), 'yyyy-MM-dd'),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(salesCollectionRef.doc(), sale);
    if ((i + 1) % 500 === 0) { await batch.commit(); batch = db.batch(); }
  }
  await batch.commit();
  console.log(`Finished generating ${numSales} sales records.`);
};

// Ensure generateExpenses and generateInventory also include `userId: adminUserId`

const clearCollection = async (collectionPath) => {
  console.log(`Clearing collection: ${collectionPath}`);
  const snapshot = await db.collection(collectionPath).limit(500).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  if (snapshot.size === 500) await clearCollection(collectionPath);
};

const runSeeder = async () => {
  try {
    await setupAdminUserProfile();
    
    console.log(`Clearing existing artifact data for user: ${adminUserId}...`);
    await clearCollection(getCollectionPath('sales'));
    await clearCollection(getCollectionPath('expenses'));
    await clearCollection(getCollectionPath('inventory'));
    console.log('Existing artifact data cleared.');

    await generateSales(200);
    // await generateExpenses(50);
    // await generateInventory();

    console.log('Data seeding complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit(0);
  }
};

runSeeder();
