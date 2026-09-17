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

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const file = Array.isArray(filename) ? filename[0] : filename;
    if (!file) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Since deleting from storage requires proper RLS policies (e.g., DELETE policy for anon)
    // or using the service role key, we should handle errors gracefully.
    const { data, error } = await supabase.storage
      .from('media')
      .remove([file as string]);

    if (error) {
      console.error("Supabase delete error:", error);
      return res.status(500).json({ error: 'Failed to delete from storage', details: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete controller error:", error);
    return res.status(500).json({ error: 'Internal server error during delete' });
  }
};
