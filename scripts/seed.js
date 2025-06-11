// scripts/seed.js
import 'dotenv/config'; // Import dotenv to load environment variables from .env file
import admin from 'firebase-admin';
import { format, subMonths } from 'date-fns';

// This is the correct way to parse the service account key from an environment variable.
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// The specific UID for the test user to associate generated data with.
// This UID must match a user you can log in with to see the data.
const userId = 'qvzVYtwVgTdhhoLeMOQP3A0FPQr2'; // The user's provided test userId

// Explicitly define the appId for seeding, matching the client-side paths
const appId = 'financial-ledger-5cc34';


// Define a list of realistic beverage items with typical cost and price ranges
const beverageItems = [
  { name: 'Coca-Cola (35cl)', cost: 120, price: 180 },
  { name: 'Pepsi (35cl)', cost: 110, price: 170 },
  { name: 'Fanta (35cl)', cost: 115, price: 175 },
  { name: 'Sprite (35cl)', cost: 115, price: 175 },
  { name: 'Schweppes (35cl)', cost: 130, price: 200 },
  { name: 'Maltina (33cl)', cost: 180, price: 250 },
  { name: 'Amstel Malta (33cl)', cost: 170, price: 240 },
  { name: 'Star Beer (60cl)', cost: 300, price: 450 },
  { name: 'Gulder Beer (60cl)', cost: 320, price: 480 },
  { name: 'Guinness Stout (60cl)', cost: 350, price: 550 },
  { name: 'Fearless Energy Drink', cost: 250, price: 380 },
  { name: 'Red Bull', cost: 600, price: 900 },
  { name: 'Nestle Pure Life Water (50cl)', cost: 50, price: 100 },
  { name: 'Eva Water (75cl)', cost: 70, price: 120 },
  { name: 'Hollandia Yoghurt (1L)', cost: 800, price: 1200 },
  { name: 'Peak Milk (400g tin)', cost: 1000, price: 1500 },
  { name: 'Milo (500g)', cost: 1500, price: 2200 },
  { name: 'Bournvita (450g)', cost: 1400, price: 2100 },
  { name: 'Lipton Tea Bags (25pcs)', cost: 300, price: 450 },
  { name: 'Nescafe Classic (50g)', cost: 500, price: 750 },
];

// Helper to get collection path for the specific user
const getCollectionPath = (collectionName) => `artifacts/${appId}/users/${userId}/${collectionName}`;

// Helper function to generate a random date within a range
const getRandomDate = (start, end) => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return format(date, 'yyyy-MM-dd');
};

// Helper function to get a random item from the beverage list
const getRandomBeverage = () => {
  const index = Math.floor(Math.random() * beverageItems.length);
  return beverageItems[index];
};

// Generate Sales Data
const generateSales = async (numSales) => {
  console.log(`Generating ${numSales} sales records for user ${userId}...`);
  let batch = db.batch();
  const salesCollectionRef = db.collection(getCollectionPath('sales'));
  const today = new Date();

  for (let i = 0; i < numSales; i++) {
    const randomBeverage = getRandomBeverage();
    const qty = Math.floor(Math.random() * 10) + 1; // 1 to 10 units
    const saleDate = getRandomDate(subMonths(today, 12), today); // Sales over the last year

    const sale = {
      userId: userId, // Add userId to the document
      item: randomBeverage.name,
      qty: qty,
      cost: randomBeverage.cost, // Renamed from costPerUnit
      price: randomBeverage.price, // Renamed from pricePerUnit
      customer: `Customer ${Math.floor(Math.random() * 100) + 1}`,
      date: saleDate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const newDocRef = salesCollectionRef.doc();
    batch.set(newDocRef, sale);

    if ((i + 1) % 500 === 0) {
      await batch.commit();
      console.log(`Committed ${i + 1} sales records.`);
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`Finished generating and committing ${numSales} sales records.`);
};

// Generate Expenses Data
const generateExpenses = async (numExpenses) => {
  console.log(`Generating ${numExpenses} expense records for user ${userId}...`);
  let batch = db.batch();
  const expensesCollectionRef = db.collection(getCollectionPath('expenses'));
  const today = new Date();

  const expenseCategories = ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Supplies', 'Maintenance', 'Transportation', 'Miscellaneous'];

  for (let i = 0; i < numExpenses; i++) {
    const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    const amount = parseFloat((Math.random() * 10000 + 500).toFixed(2));
    const expenseDate = getRandomDate(subMonths(today, 12), today);

    const expense = {
      userId: userId, // Add userId to the document
      item: `${category} Expense`,
      amount: amount,
      date: expenseDate,
      category: category,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const newDocRef = expensesCollectionRef.doc();
    batch.set(newDocRef, expense);

    if ((i + 1) % 500 === 0) {
      await batch.commit();
      console.log(`Committed ${i + 1} expense records.`);
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`Finished generating and committing ${numExpenses} expense records.`);
};

// Generate Inventory Data
const generateInventory = async () => {
    console.log(`Generating inventory records for user ${userId}...`);
    let batch = db.batch();
    const inventoryCollectionRef = db.collection(getCollectionPath('inventory'));
    const existingInventoryItems = new Set();

    for (const item of beverageItems) {
        if (existingInventoryItems.has(item.name)) {
            continue;
        }

        const qtyIn = Math.floor(Math.random() * 500) + 50;
        const inventoryItem = {
            userId: userId, // Add userId to the document
            itemName: item.name, // Matches frontend expectation
            qtyIn: qtyIn,
            qtyOut: 0,
            costPrice: item.cost,
            salePrice: item.price,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Use item name as document ID to ensure uniqueness
        const docRef = inventoryCollectionRef.doc(item.name);
        batch.set(docRef, inventoryItem);
        existingInventoryItems.add(item.name);

        if (existingInventoryItems.size % 500 === 0) {
            await batch.commit();
            console.log(`Committed ${existingInventoryItems.size} inventory records.`);
            batch = db.batch(); // Start a new batch
        }
    }

    await batch.commit();
    console.log(`Finished generating and committing ${existingInventoryItems.size} inventory records.`);
};


// Helper to clear a collection before seeding
const clearCollection = async (collectionPath) => {
  console.log(`Clearing collection: ${collectionPath}`);
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.limit(500).get();
  if (snapshot.size === 0) {
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Cleared ${snapshot.size} documents from ${collectionPath}`);
  if (snapshot.size > 0) {
    return clearCollection(collectionPath);
  }
};

// Main function to run the seeder
const runSeeder = async () => {
  try {
    console.log(`Clearing existing data for user: ${userId}...`);
    await clearCollection(getCollectionPath('sales'));
    await clearCollection(getCollectionPath('expenses'));
    await clearCollection(getCollectionPath('inventory'));
    console.log('Existing data cleared.');

    await generateSales(200);
    await generateExpenses(50);
    await generateInventory();

    console.log('Data seeding complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit(0);
  }
};

runSeeder();
