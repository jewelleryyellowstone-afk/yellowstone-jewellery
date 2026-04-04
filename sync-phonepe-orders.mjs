import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwewgkdzehckfrxlrbvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZXdna2R6ZWhja2ZyeGxyYnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg4OTU1OSwiZXhwIjoyMDgyNDY1NTU5fQ.HApTn5u35sMIYnRn6P8fZNe_GAReaEFqlS9Puq2wB18';

const supabase = createClient(supabaseUrl, supabaseKey);

const missingOrders = [
  { merchantId: 'ORDER_dfa09551_1775322713986', status: 'PENDING' },
  { merchantId: 'ORDER_4ec822f4_1775292967409', status: 'FAILED' },
  { merchantId: 'ORDER_0af516d3_1775290484794', status: 'SUCCESS' },
  { merchantId: 'ORDER_b5fc76f3_1775290156070', status: 'FAILED' },
  { merchantId: 'ORDER_563c74ed_1775285615831', status: 'FAILED' },
  { merchantId: 'ORDER_c5553cb9_1775285552644', status: 'FAILED' },
  { merchantId: 'ORDER_ad9a2819_1775284936252', status: 'SUCCESS' },
  { merchantId: 'ORDER_095f0494_1775284592133', status: 'SUCCESS' },
  { merchantId: 'ORDER_4676b5d4_1775283302940', status: 'FAILED' },
  { merchantId: 'ORDER_7a3f2d8f_1775279785640', status: 'FAILED' },
  { merchantId: 'ORDER_cff89ddd_1775279079904', status: 'FAILED' },
  { merchantId: 'ORDER_a9a523da_1775279007813', status: 'FAILED' },
  { merchantId: 'ORDER_29ed642e_1775227907301', status: 'SUCCESS' },
];

async function syncOrders() {
  console.log("Fetching all recent orders to map partial UUIDs...");
  
  const { data: allOrders, error: fetchErr } = await supabase.from('orders').select('id, payment_status');
  if (fetchErr) {
      console.error("Failed to fetch orders:", fetchErr);
      return;
  }

  for (const { merchantId, status } of missingOrders) {
    const uuidSuffix = merchantId.split('_')[1]; // '0af516d3'
    const matchingOrder = allOrders.find(o => o.id.includes(uuidSuffix));
    
    if (!matchingOrder) {
        console.warn(`⚠️ Could not find order mapping for ${merchantId} (looking for suffix ${uuidSuffix})`);
        continue;
    }

    if (status === 'SUCCESS') {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'processing', payment_id: merchantId })
        .eq('id', matchingOrder.id);
        
      if (error) {
         console.error(`❌ Failed to update ${merchantId}: ${error.message}`);
      } else {
         console.log(`✅ Synced SUCCESS for ${merchantId} -> Order Info: ${matchingOrder.id}`);
      }
    } 
    else if (status === 'FAILED') {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'failed', payment_id: merchantId })
        .eq('id', matchingOrder.id);
        
      if (error) {
         console.error(`❌ Failed to fail ${merchantId}: ${error.message}`);
      } else {
         console.log(`✅ Synced FAILED for ${merchantId} -> Order Info: ${matchingOrder.id}`);
      }
    }
  }
}

syncOrders().catch(console.error);
