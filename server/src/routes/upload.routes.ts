import express from 'express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../controllers/upload.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit to support videos
  }
});

router.post('/image', authenticateAdmin, upload.single('image'), uploadImage as any);
router.delete('/image/:filename', authenticateAdmin, deleteImage as any);

export default router;
