import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload.controller';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.post('/image', upload.single('image'), uploadImage as any);

export default router;
