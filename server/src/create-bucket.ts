import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://bhjfsthxmzqumajquyvn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_fvqOImRG-8kMsfQxln9WMw_JmBmCmNy';

const supabase = createClient(supabaseUrl, supabaseKey);

async function init() {
  console.log("Checking buckets...");
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }
  
  const mediaBucketExists = buckets.some(b => b.name === 'media');
  
  if (!mediaBucketExists) {
    console.log("Bucket 'media' not found. Creating...");
    const { data, error } = await supabase.storage.createBucket('media', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
      console.error("Error creating bucket:", error);
    } else {
      console.log("Bucket 'media' created successfully!", data);
    }
  } else {
    console.log("Bucket 'media' already exists. Updating to public...");
    await supabase.storage.updateBucket('media', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm'],
      fileSizeLimit: 10485760
    });
    console.log("Bucket 'media' updated.");
  }
}

init();
