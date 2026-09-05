import { Router } from 'express';
import { 
  getPages, 
  getPageWithSections, 
  updateSection, 
  createSection, 
  deleteSection 
} from '../controllers/cms.controller';
import { authenticateAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Page routes
router.get('/pages', getPages);
router.get('/pages/:slug', getPageWithSections);

// Section routes (Protected)
router.post('/sections', authenticateAdmin, createSection);
router.put('/sections/:id', authenticateAdmin, updateSection);
router.delete('/sections/:id', authenticateAdmin, deleteSection);

export default router;
