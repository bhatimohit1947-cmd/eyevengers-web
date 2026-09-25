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
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.post('/image', authenticateAdmin, upload.single('image'), uploadImage as any);
router.delete('/image/:filename', authenticateAdmin, deleteImage as any);

export default router;
