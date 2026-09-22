import { Router } from 'express';
import { attachmentsController } from './attachments.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generalRateLimiter } from '../../middlewares/rateLimit.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(generalRateLimiter);

router.post(
  '/',
  requireRole(['owner', 'admin', 'member']),
  upload.single('file'),
  asyncHandler(attachmentsController.upload)
);

router.get(
  '/',
  requireRole(['owner', 'admin', 'member', 'viewer']),
  asyncHandler(attachmentsController.list)
);

router.delete(
  '/:id',
  requireRole(['owner', 'admin', 'member']), // Service restricts to author/admin+
  asyncHandler(attachmentsController.delete)
);

export default router;
