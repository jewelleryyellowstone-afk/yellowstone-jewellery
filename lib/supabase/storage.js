import { supabase } from './client';

const BUCKET = 'images';

export const uploadImage = async (file, folder = 'general') => {
  try {
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error.message };
  }
};

export const uploadMultipleImages = async (files, folder = 'products') => {
  try {
    const urls = await Promise.all(files.map(file => uploadImage(file, folder)));
    return { urls: urls.map(r => r.url), error: null };
  } catch (error) {
    return { urls: [], error: error.message };
  }
};

export const deleteImage = async (url) => {
  try {
    const path = url.split(`${BUCKET}/`)[1];
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const deleteMultipleImages = async (urls) => {
  await Promise.all(urls.map(url => deleteImage(url)));
  return { error: null };
};
