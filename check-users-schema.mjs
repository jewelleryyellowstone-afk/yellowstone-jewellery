import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwewgkdzehckfrxlrbvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZXdna2R6ZWhja2ZyeGxyYnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg4OTU1OSwiZXhwIjoyMDgyNDY1NTU5fQ.HApTn5u35sMIYnRn6P8fZNe_GAReaEFqlS9Puq2wB18';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
   const { data, error } = await supabase.from('users').select('*').limit(1);
   if (error) {
      console.error("Users error:", error.message);
   } else {
      console.log("Users schema:", data.length > 0 ? Object.keys(data[0]) : "Empty table but exists");
   }
}
checkUsers();
