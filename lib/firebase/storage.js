import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload image to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {string} path - Storage path (e.g., 'products/', 'banners/')
 * @returns {Promise<{url: string, error: null} | {url: null, error: string}>}
 */
export const uploadImage = async (file, path = 'images/') => {
    try {
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const storageRef = ref(storage, `${path}${filename}`);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file);

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        return { url: downloadURL, error: null };
    } catch (error) {
        console.error('Upload error:', error);
        return { url: null, error: error.message };
    }
};

/**
 * Upload multiple images
 * @param {File[]} files - Array of image files
 * @param {string} path - Storage path
 * @returns {Promise<{urls: string[], error: null} | {urls: [], error: string}>}
 */
export const uploadMultipleImages = async (files, path = 'images/') => {
    try {
        const uploadPromises = files.map(file => uploadImage(file, path));
        const results = await Promise.all(uploadPromises);

        // Check if any upload failed
        const failedUpload = results.find(result => result.error);
        if (failedUpload) {
            return { urls: [], error: failedUpload.error };
        }

        const urls = results.map(result => result.url);
        return { urls, error: null };
    } catch (error) {
        return { urls: [], error: error.message };
    }
};

/**
 * Delete image from Firebase Storage
 * @param {string} imageUrl - Full URL of the image to delete
 * @returns {Promise<{error: null} | {error: string}>}
 */
export const deleteImage = async (imageUrl) => {
    try {
        // Extract path from URL
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        return { error: null };
    } catch (error) {
        console.error('Delete error:', error);
        return { error: error.message };
    }
};

/**
 * Delete multiple images
 * @param {string[]} imageUrls - Array of image URLs
 * @returns {Promise<{error: null} | {error: string}>}
 */
export const deleteMultipleImages = async (imageUrls) => {
    try {
        const deletePromises = imageUrls.map(url => deleteImage(url));
        await Promise.all(deletePromises);
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};
