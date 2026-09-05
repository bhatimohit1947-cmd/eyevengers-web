import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://bhjfsthxmzqumajquyvn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_fvqOImRG-8kMsfQxln9WMw_JmBmCmNy';

export const supabase = createClient(supabaseUrl, supabaseKey);
