const {createClient} = require('@supabase/supabase-js');
const s = createClient('https://bhjfsthxmzqumajquyvn.supabase.co', 'sb_publishable_fvqOImRG-8kMsfQxln9WMw_JmBmCmNy');

s.from('memberships').update({
  features: ['frame free on next purchase', '__BENEFITS_JSON__:{"discountPercent":20}']
}).eq('id', 'plan_1787146221318').then(r => {
  console.log('Update:', r.error || 'Success');
  s.from('memberships').select('features').eq('id', 'plan_1787146221318').then(r2 => {
    console.dir(r2.data, {depth: null});
  });
});
