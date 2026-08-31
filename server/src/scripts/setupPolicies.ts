import 'dotenv/config';
import { supabase } from '../supabaseClient';

const policies = [
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'terms', title: 'Terms & Conditions' },
  { slug: 'refund', title: 'Cancellation & Refund Policy' },
  { slug: 'shipping', title: 'Shipping & Delivery Policy' },
  { slug: 'contact', title: 'Contact Us' }
];

async function setupPolicies() {
  console.log('Setting up policy pages in CMS...');

  for (const policy of policies) {
    const pageId = `page_${policy.slug}`;
    
    // Check if page exists
    const { data: existingPage } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('slug', policy.slug)
      .single();

    if (!existingPage) {
      console.log(`Creating page: ${policy.title}`);
      const { error: pageError } = await supabase
        .from('cms_pages')
        .insert([{
          id: pageId,
          slug: policy.slug,
          title: policy.title,
          status: 'published'
        }]);

      if (pageError) {
        console.error(`Failed to create page ${policy.slug}:`, pageError);
        continue;
      }
      
      // Create an empty PolicyText section for this page
      console.log(`Creating section for: ${policy.title}`);
      await supabase.from('cms_sections').insert([{
        id: `sec_${policy.slug}_text`,
        page_id: pageId,
        section_type: 'PolicyText',
        order_index: 1,
        is_visible: true,
        config_json: { content: `<p>Start writing your ${policy.title} here...</p>` }
      }]);
    } else {
      console.log(`Page ${policy.slug} already exists.`);
    }
  }

  console.log('Setup completed.');
}

setupPolicies();
