import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generalRateLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = Router();

router.use(authenticate);
router.use(generalRateLimiter);

router.get(
  '/',
  asyncHandler(notificationsController.list)
);

router.patch(
  '/read-all',
  asyncHandler(notificationsController.markAllAsRead)
);

router.patch(
  '/:id/read',
  asyncHandler(notificationsController.markAsRead)
);

export default router;
