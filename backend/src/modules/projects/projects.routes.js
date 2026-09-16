import { Router } from 'express';
import { projectsController } from './projects.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { idempotency } from '../../middlewares/idempotency.middleware.js';
import { generalRateLimiter } from '../../middlewares/rateLimit.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  getProjectSchema,
  listProjectsSchema,
  deleteProjectSchema
} from './projects.validators.js';

const router = Router({ mergeParams: true });

// Apply auth middleware to all project routes
router.use(authenticate);
router.use(generalRateLimiter);

router.post(
  '/',
  requireRole(['owner', 'admin', 'member']),
  idempotency,
  validate(createProjectSchema),
  asyncHandler(projectsController.create)
);

router.get(
  '/',
  requireRole(['owner', 'admin', 'member', 'viewer']),
  validate(listProjectsSchema),
  asyncHandler(projectsController.list)
);

router.get(
  '/:id',
  requireRole(['owner', 'admin', 'member', 'viewer']),
  validate(getProjectSchema),
  asyncHandler(projectsController.get)
);

router.patch(
  '/:id',
  requireRole(['owner', 'admin']),
  validate(updateProjectSchema),
  asyncHandler(projectsController.update)
);

router.delete(
  '/:id',
  requireRole(['owner', 'admin']),
  validate(deleteProjectSchema),
  asyncHandler(projectsController.delete)
);

export default router;
