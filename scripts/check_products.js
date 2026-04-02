
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase Config (Hardcoded for script execution)
const firebaseConfig = {
    apiKey: "AIzaSyAvh66oL4864lzhQI4cCmA3RjdbCR7Ihc0",
    authDomain: "studio-9211767550-84917.firebaseapp.com",
    projectId: "studio-9211767550-84917",
    storageBucket: "studio-9211767550-84917.firebasestorage.app",
    messagingSenderId: "310913647316",
    appId: "1:310913647316:web:6273a0ed956d239ba73141",
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkProducts() {
    console.log('Fetching products...');
    try {
        const snapshot = await getDocs(collection(db, 'products'));
        const total = snapshot.size;
        console.log(`Total Products in DB: ${total}`);

        let activeCount = 0;
        let inactiveCount = 0;
        let undefinedStatusCount = 0;
        let sampleData = null;

        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            const isActive = data.isActive;

            if (index === 0) sampleData = data;

            if (isActive === true) activeCount++;
            else if (isActive === false) inactiveCount++;
            else undefinedStatusCount++;
        });

        console.log(`Summary:`);
        console.log(`- Active (explicit true): ${activeCount}`);
        console.log(`- Inactive (explicit false): ${inactiveCount}`);
        console.log(`- Legacy (undefined, treated as active): ${undefinedStatusCount}`);
        console.log(`- Total Visible to Public: ${activeCount + undefinedStatusCount}`);

        if (sampleData) {
            console.log('Sample Product Data:', JSON.stringify(sampleData, null, 2));
        }

    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

checkProducts();
