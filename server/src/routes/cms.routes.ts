import { Router } from 'express';
import { 
  getPages, 
  getPageWithSections, 
  updateSection, 
  createSection, 
  deleteSection 
} from '../controllers/cms.controller';

const router = Router();

// Page routes
router.get('/pages', getPages);
router.get('/pages/:slug', getPageWithSections);

// Section routes
router.post('/sections', createSection);
router.put('/sections/:id', updateSection);
router.delete('/sections/:id', deleteSection);

export default router;
