import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import {
    createUser,
    getAllEmployees,
    getAdminStats,
    updateEmployee,
    trashEmployee,
    restoreEmployee,
    getTrashedEmployees,
    deleteEmployee,
} from '../controllers/admin/adminUser.controller.js';
import {
    getAllLeaves,
    updateLeaveStatus,
    trashLeave,
    restoreLeave,
    getTrashedLeaves,
    viewLeaveRequestDetail,
    deleteLeave,
    getAuditLogs,
} from '../controllers/admin/adminLeave.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// === USER MANAGEMENT ===
router.post('/users', createUser);
router.get('/employees', getAllEmployees);
router.get('/stats', getAdminStats);

// Update employee details
router.patch("/employees/:id", updateEmployee);

// Move employee to trash
router.patch("/employees/:id/trash", trashEmployee);

// Restore employee from trash
router.patch('/employees/:id/restore', restoreEmployee);

// Get trashed employees
router.get('/employees/trashed', getTrashedEmployees);

// Permanently delete employee (mark as deleted)
router.delete('/employees/:id/permanent', deleteEmployee);

// === LEAVE MANAGEMENT ===
router.get('/leaves', getAllLeaves);

// Get trashed leaves
router.get('/leaves/trashed', getTrashedLeaves);

router.get('/leaves/:id', viewLeaveRequestDetail);

// Update leave status (approve/reject/cancel)
router.patch('/leaves/:id/status', updateLeaveStatus);

// Move leave to trash
router.patch('/leaves/:id/trash', trashLeave);

// Restore leave from trash
router.patch('/leaves/:id/restore', restoreLeave);

// Permanently delete leave (mark as deleted)
router.delete('/leaves/:id/permanent', deleteLeave);

// Get audit logs
router.get('/audit-logs', getAuditLogs);

export default router;