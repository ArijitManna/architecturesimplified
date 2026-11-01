import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

import { authController } from '../controllers/auth.controller.js';
import { categoryController } from '../controllers/category.controller.js';
import { topicController } from '../controllers/topic.controller.js';
import { sectionController } from '../controllers/section.controller.js';
import { diagramController } from '../controllers/diagram.controller.js';
import { resourceController } from '../controllers/resource.controller.js';
import { learningPathController } from '../controllers/learning-path.controller.js';
import { challengeController } from '../controllers/challenge.controller.js';
import { adminController } from '../controllers/admin.controller.js';
import { searchController } from '../controllers/search.controller.js';
import { tagController } from '../controllers/tag.controller.js';

const router = Router();
const admin = [authenticate, requireRole('ADMIN')];

// ---- Auth ----
router.post('/auth/login', asyncHandler(authController.login));
router.get('/auth/me', authenticate, asyncHandler(authController.me));

// ---- Public ----
router.get('/categories', asyncHandler(categoryController.listPublic));
router.get('/categories/:slug', asyncHandler(categoryController.getBySlug));

router.get('/topics', asyncHandler(topicController.listPublic));
router.get('/topics/:categorySlug/:topicSlug', asyncHandler(topicController.getByPath));

router.get('/learning-paths', asyncHandler(learningPathController.listPublic));
router.get('/learning-paths/:slug', asyncHandler(learningPathController.getBySlug));

router.get('/challenges', asyncHandler(challengeController.listPublic));
router.get('/challenges/:slug', asyncHandler(challengeController.getBySlug));
router.post('/challenges/:slug/submit', asyncHandler(challengeController.submit));

router.get('/search', asyncHandler(searchController.search));
router.get('/tags', asyncHandler(tagController.list));

// ---- Admin ----
router.get('/admin/dashboard', ...admin, asyncHandler(adminController.dashboard));

router.get('/admin/categories', ...admin, asyncHandler(categoryController.listAdmin));
router.post(
  '/admin/categories',
  ...admin,
  upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 },
  ]),
  asyncHandler(categoryController.create)
);
router.put(
  '/admin/categories/:id',
  ...admin,
  upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 },
  ]),
  asyncHandler(categoryController.update)
);
router.delete('/admin/categories/:id', ...admin, asyncHandler(categoryController.remove));

router.get('/admin/topics', ...admin, asyncHandler(topicController.listAdmin));
router.get('/admin/topics/:id', ...admin, asyncHandler(topicController.getAdmin));
router.post('/admin/topics', ...admin, asyncHandler(topicController.create));
router.put('/admin/topics/:id', ...admin, asyncHandler(topicController.update));
router.delete('/admin/topics/:id', ...admin, asyncHandler(topicController.remove));
router.post('/admin/topics/:id/publish', ...admin, asyncHandler(topicController.publish));
router.post('/admin/topics/:id/unpublish', ...admin, asyncHandler(topicController.unpublish));
router.post('/admin/topics/:id/archive', ...admin, asyncHandler(topicController.archive));
router.post('/admin/topics/:id/duplicate', ...admin, asyncHandler(topicController.duplicate));

router.post('/admin/topics/:id/sections', ...admin, asyncHandler(sectionController.create));
router.put('/admin/sections/:id', ...admin, asyncHandler(sectionController.update));
router.delete('/admin/sections/:id', ...admin, asyncHandler(sectionController.remove));

router.post(
  '/admin/topics/:id/diagrams',
  ...admin,
  upload.single('file'),
  asyncHandler(diagramController.create)
);
router.put(
  '/admin/diagrams/:id',
  ...admin,
  upload.single('file'),
  asyncHandler(diagramController.update)
);
router.delete('/admin/diagrams/:id', ...admin, asyncHandler(diagramController.remove));

router.post(
  '/admin/topics/:id/resources',
  ...admin,
  upload.single('file'),
  asyncHandler(resourceController.create)
);
router.put(
  '/admin/resources/:id',
  ...admin,
  upload.single('file'),
  asyncHandler(resourceController.update)
);
router.delete('/admin/resources/:id', ...admin, asyncHandler(resourceController.remove));

router.get('/admin/learning-paths', ...admin, asyncHandler(learningPathController.listAdmin));
router.get('/admin/learning-paths/:id', ...admin, asyncHandler(learningPathController.getAdmin));
router.post('/admin/learning-paths', ...admin, asyncHandler(learningPathController.create));
router.put('/admin/learning-paths/:id', ...admin, asyncHandler(learningPathController.update));
router.delete('/admin/learning-paths/:id', ...admin, asyncHandler(learningPathController.remove));

router.get('/admin/challenges', ...admin, asyncHandler(challengeController.listAdmin));
router.get('/admin/challenges/:id', ...admin, asyncHandler(challengeController.getAdmin));
router.post('/admin/challenges', ...admin, asyncHandler(challengeController.create));
router.put('/admin/challenges/:id', ...admin, asyncHandler(challengeController.update));
router.delete('/admin/challenges/:id', ...admin, asyncHandler(challengeController.remove));

export default router;
