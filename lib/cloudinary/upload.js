export async function uploadImage(file, folder = 'general') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await res.json();
    if (data.secure_url) {
      return { url: data.secure_url, error: null };
    }
    throw new Error(data.error?.message || 'Upload failed');
  } catch (error) {
    return { url: null, error: error.message };
  }
}

export async function uploadMultipleImages(files, folder = 'products') {
  try {
    const results = await Promise.all(files.map(file => uploadImage(file, folder)));
    
    // Check if any individual upload failed
    const failed = results.find(r => r.error);
    if (failed) {
      return { urls: [], error: failed.error };
    }
    
    const urls = results.map(r => r.url).filter(Boolean);
    return { urls, error: null };
  } catch (error) {
    return { urls: [], error: error.message };
  }
}

export async function deleteImage(publicId) {
  // Cloudinary deletion requires server-side signature
  // For now log and return success - implement server route later if needed
  console.log('Delete image:', publicId);
  return { error: null };
}

export async function deleteMultipleImages(publicIds) {
  await Promise.all(publicIds.map(id => deleteImage(id)));
  return { error: null };
}
