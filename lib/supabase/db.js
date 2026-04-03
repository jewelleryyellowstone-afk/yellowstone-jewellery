import { supabase } from './client';

export const getAllDocuments = async (table, options = {}) => {
  try {
    let query = supabase.from(table).select('*');
    if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    if (options.limit) query = query.limit(options.limit);
    if (options.filters) {
      options.filters.forEach(([col, val]) => { query = query.eq(col, val); });
    }
    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

export const getDocument = async (table, id) => {
  try {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const createDocument = async (table, data) => {
  try {
    const { data: result, error } = await supabase.from(table).insert([{
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select().single();
    if (error) throw error;
    return { id: result.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

export const updateDocument = async (table, id, data) => {
  try {
    const { error } = await supabase.from(table).update({
      ...data,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const deleteDocument = async (table, id) => {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const queryDocuments = async (table, filters = [], options = {}) => {
  try {
    let query = supabase.from(table).select('*');
    filters.forEach(([col, val]) => { query = query.eq(col, val); });
    if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

export const setDocument = async (table, id, data) => {
  try {
    const { error } = await supabase.from(table).upsert({ id, ...data, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// --- Helper Functions for Storefront backward compatibility ---

export const getProducts = async (filters = [], options = {}) => {
  try {
    let query = supabase.from('products').select('*');
    
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        // Handle legacy Firebase filter arrays [field, operator, value]
        if (Array.isArray(filter) && filter.length === 3) {
           const [field, op, val] = filter;
           if (op === '==') query = query.eq(field, val);
        }
      });
    }

    if (options.orderByField) {
      query = query.order(options.orderByField, { ascending: options.orderDirection === 'asc' });
    }
    if (options.limitCount) {
      query = query.limit(options.limitCount);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("getProducts Error:", error);
    return { data: [], error: error.message };
  }
};

export const getCategories = async () => {
  return await getAllDocuments('categories', { orderBy: 'order', ascending: true });
};

export const getProductById = async (id) => {
  return await getDocument('products', id);
};
