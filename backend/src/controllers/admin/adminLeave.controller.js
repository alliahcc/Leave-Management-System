import Leave from '../../models/Leave.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import { statusUpdateSchema } from '../../validators/leave.validator.js';
import validate from '../../middleware/validate.middleware.js';
import { logAudit } from '../../utils/auditUtils.js';

export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ isTrashed: false })
            .populate('employee', 'employeeId name lastName department position contact email role')
            .lean();

        await logAudit(req, {
            action: 'get-all-leaves',
            targetId: req.user.id,
            targetType: 'User',
            status: 'success',
            details: 'Fetched all active leave records',
        });

        res.json({ success: true, statusCode: 200, leaves });
    } catch (err) {
        console.error('Error fetching leaves:', err.message);
        await logAudit(req, {
            action: 'get-all-leaves',
            targetId: req.user.id,
            targetType: 'User',
            status: 'failure',
            details: 'Server error while fetching leaves',
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching leaves' });
    }
};

export const viewLeaveRequestDetail = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id)
            .populate('employee', 'name lastName department position contact email role')
            .lean();

        if (!leave) {
            await logAudit(req, {
                action: 'view-leave-detail',
                targetId: req.params.id,
                targetType: 'Leave',
                status: 'failure',
                details: `Attempted to view leave ${req.params.id}, but not found`,
            });
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        await logAudit(req, {
            action: 'view-leave-detail',
            targetId: leave._id.toString(),
            targetType: 'Leave',
            status: 'success',
            details: `Viewed leave request ${leave._id}`,
        });

        res.json({ success: true, statusCode: 200, leave });
    } catch (err) {
        console.error('Error fetching leave:', err.message);
        await logAudit(req, {
            action: 'view-leave-detail',
            targetId: req.params.id,
            targetType: 'Leave',
            status: 'failure',
            details: `Server error while fetching leave ${req.params.id}`,
        });
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateLeaveStatus = [
    validate(statusUpdateSchema),
    async (req, res) => {
        try {
            const leave = await Leave.findById(req.params.id).populate('employee');
            if (!leave) {
                await logAudit(req, {
                    action: 'update-leave-status',
                    targetId: req.params.id,
                    targetType: 'Leave',
                    status: 'failure',
                    details: `Leave ${req.params.id} not found`,
                });
                return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found' });
            }

            if (leave.status !== 'pending') {
                await logAudit(req, {
                    action: 'update-leave-status',
                    targetId: leave._id.toString(),
                    targetType: 'Leave',
                    status: 'failure',
                    details: `Leave ${leave._id} already ${leave.status}`,
                });
                return res.status(400).json({ success: false, statusCode: 400, message: 'Only pending leaves can be updated' });
            }

            const before = { status: leave.status, remarks: leave.remarks };
            leave.status = req.body.status;

            if (req.body.status === 'rejected') {
                leave.remarks = (req.body.remarks && req.body.remarks.trim())
                    ? req.body.remarks.trim()
                    : 'Rejected by admin';
            }

            if (req.body.status === 'approved') {
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);

                if (isNaN(start) || isNaN(end)) {
                    return res.status(400).json({ success: false, statusCode: 400, message: 'Invalid leave dates' });
                }

                const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                if (days <= 0) {
                    return res.status(400).json({ success: false, statusCode: 400, message: 'Invalid leave duration' });
                }

                if (leave.employee.leaveBalance < days) {
                    return res.status(400).json({ success: false, statusCode: 400, message: 'Insufficient leave balance' });
                }

                leave.employee.leaveBalance -= days;
                await leave.employee.save();
                leave.duration = days;
                leave.remarks = (leave.remarks && leave.remarks.trim())
                    ? leave.remarks.trim()
                    : 'Approved by admin';
            }

            await leave.save();

            await logAudit(req, {
                action: 'update-leave-status',
                targetId: leave._id.toString(),
                targetType: 'Leave',
                status: 'success',
                details: `Leave ${leave._id} updated to ${req.body.status}`,
                beforeState: before,
                afterState: { status: leave.status, remarks: leave.remarks },
            });

            res.json({ success: true, statusCode: 200, message: `Leave ${req.body.status}`, leave });
        } catch (err) {
            console.error('Error updating leave status:', err.message);
            await logAudit(req, {
                action: 'update-leave-status',
                targetId: req.params.id,
                targetType: 'Leave',
                status: 'failure',
                details: `Server error while updating leave ${req.params.id}`,
            });
            res.status(500).json({ success: false, statusCode: 500, message: 'Server error while updating leave status' });
        }
    },
];

export const trashLeave = async (req, res) => {
    try {
        const before = await Leave.findById(req.params.id).lean();
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { isTrashed: true, trashedAt: new Date() },
            { returnDocument: 'after' }
        );

        if (!leave) {
            await logAudit(req, {
                action: 'trash-leave',
                targetId: req.params.id,
                targetType: 'Leave',
                status: 'failure',
                details: `Attempted to trash leave ${req.params.id}, but not found`,
                beforeState: before,
            });
            return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found' });
        }

        await logAudit(req, {
            action: 'trash-leave',
            targetId: leave._id.toString(),
            targetType: 'Leave',
            status: 'success',
            details: `Leave ${leave._id} moved to trash`,
            beforeState: before,
            afterState: leave,
        });

        res.json({ success: true, statusCode: 200, message: 'Leave moved to trash', leave });
    } catch (err) {
        console.error('Error trashing leave:', err.message);
        await logAudit(req, {
            action: 'trash-leave',
            targetId: req.params.id,
            targetType: 'Leave',
            status: 'failure',
            details: `Server error while trashing leave ${req.params.id}`,
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while trashing leave' });
    }
};

export const restoreLeave = async (req, res) => {
    try {
        const before = await Leave.findById(req.params.id).lean();
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { isTrashed: false, trashedAt: null },
            { returnDocument: 'after' }
        );

        if (!leave) {
            await logAudit(req, {
                action: 'restore-leave',
                targetId: req.params.id,
                targetType: 'Leave',
                status: 'failure',
                details: `Attempted to restore leave ${req.params.id}, but not found`,
                beforeState: before,
            });
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        await logAudit(req, {
            action: 'restore-leave',
            targetId: leave._id.toString(),
            targetType: 'Leave',
            status: 'success',
            details: `Leave ${leave._id} restored from trash`,
            beforeState: before,
            afterState: leave,
        });

        res.json({ success: true, statusCode: 200, message: 'Leave restored', leave });
    } catch (err) {
        console.error('Error restoring leave:', err.message);
        await logAudit(req, {
            action: 'restore-leave',
            targetId: req.params.id,
            targetType: 'Leave',
            status: 'failure',
            details: `Server error while restoring leave ${req.params.id}`,
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while restoring leave' });
    }
};

export const getTrashedLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ isTrashed: true })
            .populate('employee', 'employeeId name lastName department position contact email role')
            .lean();

        await logAudit(req, {
            action: 'get-trashed-leaves',
            targetId: req.user.id,
            targetType: 'User',
            status: 'success',
            details: `Fetched ${leaves.length} trashed leave records`,
            afterState: leaves,
        });

        res.json({ success: true, statusCode: 200, leaves });
    } catch (err) {
        console.error('Error fetching trashed leaves:', err.message);
        await logAudit(req, {
            action: 'get-trashed-leaves',
            targetId: req.user.id,
            targetType: 'User',
            status: 'failure',
            details: `Server error while fetching trashed leaves: ${err.message}`,
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching trashed leaves' });
    }
};

export const deleteLeave = async (req, res) => {
    try {
        const before = await Leave.findById(req.params.id).lean();
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true, deletedAt: new Date() },
            { returnDocument: 'after' }
        );

        if (!leave) {
            await logAudit(req, {
                action: 'delete-leave',
                targetId: req.params.id,
                targetType: 'Leave',
                status: 'failure',
                details: `Attempted to delete leave ${req.params.id}, but not found`,
                beforeState: before,
            });
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        await logAudit(req, {
            action: 'delete-leave',
            targetId: leave._id.toString(),
            targetType: 'Leave',
            status: 'success',
            details: `Leave ${leave._id} marked as deleted`,
            beforeState: before,
            afterState: leave,
        });

        res.json({ success: true, message: 'Leave marked as deleted', leave });
    } catch (err) {
        console.error('Error marking leave deleted:', err.message);
        await logAudit(req, {
            action: 'delete-leave',
            targetId: req.params.id,
            targetType: 'Leave',
            status: 'failure',
            details: `Server error while deleting leave ${req.params.id}`,
        });
        res.status(500).json({ success: false, message: 'Server error while deleting leave' });
    }
};

export const getAuditLogs = async (req, res) => {
    try {
        const totalLogs = await AuditLog.countDocuments();
        const limit = Math.ceil(totalLogs / 20);
        const page = parseInt(req.query.page, 10) || 1;
        const skip = (page - 1) * limit;

        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        await logAudit(req, {
            action: 'get-audit-logs',
            targetId: req.user.id,
            targetType: 'User',
            status: 'success',
            details: `Fetched ${logs.length} logs (page ${page} of 2)`,
        });

        res.json({
            success: true,
            statusCode: 200,
            logs,
            pagination: {
                totalLogs,
                totalPages: 20,
                currentPage: page,
                pageSize: limit,
            },
        });
    } catch (err) {
        console.error('Error fetching audit logs:', err.message);
        await logAudit(req, {
            action: 'get-audit-logs',
            targetId: req.user.id,
            targetType: 'User',
            status: 'failure',
            details: 'Error fetching logs',
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching audit logs' });
    }
};
