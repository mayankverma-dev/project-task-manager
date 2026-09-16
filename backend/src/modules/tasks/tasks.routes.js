import { Router } from 'express';
import { tasksController } from './tasks.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { idempotency } from '../../middlewares/idempotency.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  listTasksSchema,
  deleteTaskSchema
} from './tasks.validators.js';

const router = Router({ mergeParams: true });

// Apply auth middleware to all task routes
router.use(authenticate);

router.post(
  '/',
  requireRole(['owner', 'admin', 'member']),
  idempotency,
  validate(createTaskSchema),
  asyncHandler(tasksController.create)
);

router.get(
  '/',
  requireRole(['owner', 'admin', 'member', 'viewer']),
  validate(listTasksSchema),
  asyncHandler(tasksController.list)
);

router.get(
  '/:id',
  requireRole(['owner', 'admin', 'member', 'viewer']),
  validate(getTaskSchema),
  asyncHandler(tasksController.get)
);

router.patch(
  '/:id',
  requireRole(['owner', 'admin', 'member']),
  validate(updateTaskSchema),
  asyncHandler(tasksController.update)
);

router.delete(
  '/:id',
  requireRole(['owner', 'admin']),
  validate(deleteTaskSchema),
  asyncHandler(tasksController.delete)
);

export default router;
