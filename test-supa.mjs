import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwewgkdzehckfrxlrbvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZXdna2R6ZWhja2ZyeGxyYnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4ODk1NTksImV4cCI6MjA4MjQ2NTU1OX0.HSZPildC_hFF4yZKEkCttld212J3GpuP3QMUvr7s-Tg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubabase() {
  console.log("Testing Supabase connection...");
  
  const { data: products, error: pqErr } = await supabase.from('products').select('*').limit(3);
  if (pqErr) {
    console.error("Products error:", pqErr);
  } else {
    console.log("Products retrieved:", products.length);
    if (products.length > 0) {
      console.log("Sample image URLs:", products[0].images);
    }
  }

  const { data: categories, error: cErr } = await supabase.from('categories').select('*').limit(3);
  if (cErr) {
    console.error("Categories error:", cErr);
  } else {
    console.log("Categories retrieved:", categories.length);
    if (categories.length > 0) {
      console.log("Sample category image URL:", categories[0].image);
    }
  }
}

testSubabase().catch(console.error);
