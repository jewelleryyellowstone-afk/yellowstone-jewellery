import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://cwewgkdzehckfrxlrbvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZXdna2R6ZWhja2ZyeGxyYnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg4OTU1OSwiZXhwIjoyMDgyNDY1NTU5fQ.HApTn5u35sMIYnRn6P8fZNe_GAReaEFqlS9Puq2wB18'; // Taking service role from .env.local

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
  const orderIds = [
    'ORDER_dfa09551_1775322713986',
    'ORDER_4ec822f4_1775292967409',
    'ORDER_0af516d3_1775290484794', // SUCCESS
    'ORDER_b5fc76f3_1775290156070',
    'ORDER_563c74ed_1775285615831',
    'ORDER_c5553cb9_1775285552644',
    'ORDER_ad9a2819_1775284936252', // SUCCESS
    'ORDER_095f0494_1775284592133', // SUCCESS
    'ORDER_4676b5d4_1775283302940',
    'ORDER_7a3f2d8f_1775279785640',
    'ORDER_cff89ddd_1775279079904',
    'ORDER_a9a523da_1775279007813',
    'ORDER_29ed642e_1775227907301'  // SUCCESS
  ];

  let results = [];

  for (const id of orderIds) {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    if (error) {
       results.push({ id, status: 'ERROR', error: error.message });
    } else if (!data) {
       results.push({ id, status: 'NOT FOUND' });
    } else {
       results.push({ id, payment_status: data.payment_status, status: data.status, amount: data.amount });
    }
  }

  fs.writeFileSync('orders_status.json', JSON.stringify(results, null, 2));
  console.log("Wrote to orders_status.json");
}

checkOrders().catch(console.error);
