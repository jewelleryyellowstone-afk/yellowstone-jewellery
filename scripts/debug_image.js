
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Firebase Config
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

async function checkProductImage() {
    console.log('Fetching product by ID...');
    try {
        const docRef = doc(db, 'products', 'xVBgTgyVbyQ4VOARvzMc');
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.log('No product found with ID xVBgTgyVbyQ4VOARvzMc');
            return;
        }

        const data = docSnap.data();
        console.log(`Product Found: ${data.name} (ID: ${docSnap.id})`);
        console.log('Images Array:', JSON.stringify(data.images, null, 2));

    } catch (error) {
        console.error('Error fetching product:', error);
    }
}

checkProductImage();
