import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhjfsthxmzqumajquyvn.supabase.co';
const supabaseKey = 'sb_publishable_fvqOImRG-8kMsfQxln9WMw_JmBmCmNy';

export const supabase = createClient(supabaseUrl, supabaseKey);
