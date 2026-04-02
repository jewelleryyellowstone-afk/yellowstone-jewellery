import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Generic CRUD operations for Firestore collections
 */

// Create document
export const createDocument = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        return { id: docRef.id, error: null };
    } catch (error) {
        return { id: null, error: error.message };
    }
};

// Get single document
export const getDocument = async (collectionName, docId) => {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
        } else {
            return { data: null, error: 'Document not found' };
        }
    } catch (error) {
        return { data: null, error: error.message };
    }
};

// Get all documents from collection
export const getAllDocuments = async (collectionName, options = {}) => {
    try {
        const {
            orderByField = 'createdAt',
            orderDirection = 'desc',
            limitCount = 100,
        } = options;

        const q = query(
            collection(db, collectionName),
            orderBy(orderByField, orderDirection),
            limit(limitCount)
        );
        console.log(`[Firestore] Executing getDocs for ${collectionName}...`);


        const querySnapshot = await getDocs(q);
        console.log(`[Firestore] getDocs success for ${collectionName}, size: ${querySnapshot.size}`);
        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });

        return { data: documents, error: null };
    } catch (error) {
        console.error(`[Firestore] Error in getAllDocuments for ${collectionName}:`, error);
        return { data: [], error: error.message };
    }
};

// Query documents with filters
export const queryDocuments = async (collectionName, filters = [], options = {}) => {
    try {
        const {
            orderByField = 'createdAt',
            orderDirection = 'desc',
            limitCount = 50,
            startAfterDoc = null,
        } = options;

        let constraints = [];

        // Add where filters
        filters.forEach(filter => {
            constraints.push(where(filter.field, filter.operator, filter.value));
        });

        // Add ordering
        constraints.push(orderBy(orderByField, orderDirection));

        // Add limit
        constraints.push(limit(limitCount));

        // Add pagination
        if (startAfterDoc) {
            constraints.push(startAfter(startAfterDoc));
        }

        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);

        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });

        return {
            data: documents,
            lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
            error: null
        };
    } catch (error) {
        return { data: [], lastDoc: null, error: error.message };
    }
};

// Update document
export const updateDocument = async (collectionName, docId, data) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Set document (Upsert)
export const setDocument = async (collectionName, docId, data) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
        }, { merge: true }); // Merge ensures we don't overwrite other fields like email/profile
        return { error: null };
    } catch (error) {
        console.error("Error setting document:", error);
        return { error: error.message };
    }
};

// Delete document
export const deleteDocument = async (collectionName, docId) => {
    try {
        await deleteDoc(doc(db, collectionName, docId));
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Collection-specific helpers
 */

// Products
export const getProducts = (filters = [], options = {}) =>
    queryDocuments('products', filters, options);

export const getProductById = (id) => getDocument('products', id);

export const getProductsByCategory = (categoryId, options = {}) =>
    queryDocuments('products', [{ field: 'categoryId', operator: '==', value: categoryId }], options);

// Categories
export const getCategories = () => getAllDocuments('categories', { orderByField: 'order', orderDirection: 'asc' });

// Orders
export const getOrdersByUser = (userId, options = {}) =>
    queryDocuments('orders', [{ field: 'userId', operator: '==', value: userId }], options);

export const getOrderById = (id) => getDocument('orders', id);
