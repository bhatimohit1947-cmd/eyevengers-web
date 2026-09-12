const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bhjfsthxmzqumajquyvn.supabase.co',
  'sb_publishable_fvqOImRG-8kMsfQxln9WMw_JmBmCmNy'
);

(async () => {
  console.log('Fetching products...');
  const { data: p } = await supabase.from('products').select('*');
  if (!p) { console.log('No products found'); return; }
  
  const pMap = {};
  p.forEach(x => { pMap[x.name] = x.image_url; });
  
  console.log('Fetching orders...');
  const { data: o } = await supabase.from('orders').select('*');
  if (!o) { console.log('No orders found'); return; }
  
  let c = 0;
  for(let ord of o) {
    if(ord.details && !ord.details.imageUrl && pMap[ord.details.frame]) {
      ord.details.imageUrl = pMap[ord.details.frame];
      await supabase.from('orders').update({ details: ord.details }).eq('id', ord.id);
      c++;
    }
  }
  console.log('Updated ' + c + ' old orders with photos!');
})();
