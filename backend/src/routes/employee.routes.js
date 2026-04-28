import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import {
    getEmployeeById,
    getMyLeaves,
    createLeave,
    cancelLeave,
    trashMyLeave,
    restoreMyLeave,
} from '../controllers/employee.controller.js';

const router = Router();

router.use(authMiddleware); // all employee routes require authentication

// === EMPLOYEE PROFILE ===
router.get('/employees/:id', getEmployeeById);

// === LEAVE MANAGEMENT ===
router.get('/leaves/my', getMyLeaves);
router.post('/leaves', createLeave);

// Cancel a pending leave
router.patch('/leaves/:id/cancel', cancelLeave);

// Soft-delete a leave (employee can move their own leave to trash)
router.patch('/leaves/:id/trash', trashMyLeave);

// Restore a soft-deleted leave
router.patch('/leaves/:id/restore', restoreMyLeave);

export default router;