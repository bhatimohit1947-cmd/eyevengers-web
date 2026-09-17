import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import crypto from 'crypto';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${originalName}`;
    
    // Upload to Supabase 'media' bucket
    const { data, error } = await supabase.storage
      .from('media')
      .upload(uniqueFilename, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ error: 'Failed to upload to storage', details: error.message });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(uniqueFilename);

    return res.status(200).json({ 
      url: publicUrlData.publicUrl,
      filename: uniqueFilename
    });

  } catch (error) {
    console.error("Upload controller error:", error);
    return res.status(500).json({ error: 'Internal server error during upload' });
  }
};
