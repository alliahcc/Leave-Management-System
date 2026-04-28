import User from '../models/User.model.js';
import Leave from '../models/Leave.model.js';
import AuditLog from '../models/AuditLog.model.js';
import { calculateLeaveDays } from '../utils/leaveUtils.js';
import { createLeaveSchema } from '../validators/leave.validator.js';
import validate from '../middleware/validate.middleware.js';

// === EMPLOYEE PROFILE ===
export const getEmployeeById = async(req, res) => {
    try {
        const { id } = req.params;

        // Access restriction for employees
        if (req.user.role === 'employee' && req.user.id !== id) {
            await AuditLog.create({
                action: 'get-employee',
                targetId: id,
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: 'Access denied'
            });
            return res.status(403).json({ success: false, statusCode: 403, message: 'Access denied' });
        }

        const user = await User.findOne({ _id: id, isTrashed: false }).select('-password');
        if (!user) {
            await AuditLog.create({
                action: 'get-employee',
                targetId: id,
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: 'Employee not found'
            });
            return res.status(404).json({ success: false, statusCode: 404, message: 'Employee not found' });
        }

        await AuditLog.create({
            action: 'get-employee',
            targetId: user._id.toString(),
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'success',
            details: 'Employee profile fetched'
        });

        res.json({ success: true, statusCode: 200, user });
    } catch (err) {
        console.error('Error fetching employee:', err.message);
        await AuditLog.create({
            action: 'get-employee',
            targetId: req.params.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'failure',
            details: 'Server error while fetching employee'
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching employee' });
    }
};

// === LEAVE MANAGEMENT ===
export const getMyLeaves = async(req, res) => {
    try {
        const leaves = await Leave.find({ employee: req.user.id, isTrashed: false })
            .sort({ createdAt: -1 })
            .populate('employee', 'name lastName department position contact email role')
            .lean();

        await AuditLog.create({
            action: 'get-my-leaves',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'success',
            details: 'Fetched my leaves'
        });

        res.json({ success: true, statusCode: 200, leaves });
    } catch (err) {
        console.error('Error fetching leaves:', err.message);

        await AuditLog.create({
            action: 'get-my-leaves',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'failure',
            details: 'Server error while fetching my leaves'
        });

        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while fetching leaves',
        });
    }
};

export const createLeave = [
    validate(createLeaveSchema),
    async(req, res) => {
        try {
            const employee = await User.findById(req.user.id);
            if (!employee || employee.isTrashed) {
                await AuditLog.create({
                    action: 'apply-leave',
                    targetId: req.user.id,
                    targetType: 'User',
                    performedBy: req.user.id,
                    performedByName: `${req.user.name} ${req.user.lastName}`,
                    performedByRole: req.user.role,
                    requestMethod: req.method,
                    requestUrl: req.originalUrl,
                    status: 'failure',
                    details: 'Employee not found or trashed'
                });
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            const { duration } = calculateLeaveDays(req.body.startDate, req.body.endDate);
            if (employee.leaveBalance < duration) {
                await AuditLog.create({
                    action: 'apply-leave',
                    targetId: req.user.id,
                    targetType: 'User',
                    performedBy: req.user.id,
                    performedByName: `${req.user.name} ${req.user.lastName}`,
                    performedByRole: req.user.role,
                    requestMethod: req.method,
                    requestUrl: req.originalUrl,
                    status: 'failure',
                    details: 'Insufficient leave balance'
                });
                return res.status(400).json({ success: false, message: 'Insufficient leave balance' });
            }

            const leave = new Leave({
                ...req.body,
                employee: req.user.id,
                employeeName: employee.name,
                employeeLastName: employee.lastName,
                duration,
                status: 'pending',
                isTrashed: false,
                trashedAt: null,
            });

            await leave.save();

            await AuditLog.create({
                action: 'apply-leave',
                targetId: leave._id.toString(),
                targetType: 'Leave',
                performedBy: req.user.id,
                performedByName: `${employee.name} ${employee.lastName}`,
                performedByRole: employee.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: null,
                afterState: leave,
                status: 'success',
                details: 'Leave request created'
            });

            res.status(201).json({ success: true, message: 'Leave request created successfully', leave });
        } catch (err) {
            console.error('Error creating leave:', err.message);
            await AuditLog.create({
                action: 'apply-leave',
                targetId: req.user.id,
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: 'Server error while creating leave'
            });
            res.status(500).json({ success: false, message: 'Server error while creating leave' });
        }
    },
];


export const cancelLeave = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            await AuditLog.create({
                action: 'cancel-leave',
                targetId: null,
                targetType: 'Leave',
                performedBy: null,
                performedByName: 'unauthenticated',
                performedByRole: 'unauthenticated',
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: 'Authentication required'
            });
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'Authentication required',
            });
        }

        const leave = await Leave.findOne({
            _id: req.params.id,
            employee: req.user.id,
            isTrashed: false,
        });

        if (!leave) {
            await AuditLog.create({
                action: 'cancel-leave',
                targetId: req.params.id,
                targetType: 'Leave',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: 'Leave not found or no permission'
            });
            return res.status(404).json({
                success: false,
                statusCode: 404,
                message: 'Leave not found or you do not have permission to cancel it',
            });
        }

        if (leave.status !== 'pending') {
            await AuditLog.create({
                action: 'cancel-leave',
                targetId: leave._id.toString(),
                targetType: 'Leave',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: `Cannot cancel leave with status ${leave.status}`
            });
            return res.status(400).json({
                success: false,
                statusCode: 400,
                message: `Only pending leaves can be cancelled. Current status: ${leave.status}`,
            });
        }

        const before = { status: leave.status };
        leave.status = 'cancelled';
        await leave.save();

        await AuditLog.create({
            action: 'cancel-leave',
            targetId: leave._id.toString(),
            targetType: 'Leave',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: before,
            afterState: { status: leave.status },
            status: 'success',
            details: 'Leave cancelled'
        });

        res.json({
            success: true,
            statusCode: 200,
            message: 'Leave cancelled successfully',
            leave,
        });
    } catch (err) {
        console.error('Error cancelling leave:', err.message);
        await AuditLog.create({
            action: 'cancel-leave',
            targetId: req.params.id,
            targetType: 'Leave',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'failure',
            details: 'Server error while cancelling leave'
        });
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while cancelling leave',
        });
    }
};

// === TRASH & RESTORE LEAVES (Employee) ===
export const trashMyLeave = async(req, res) => {
    try {
        const leave = await Leave.findOne({ _id: req.params.id, employee: req.user.id, isTrashed: false });
        if (!leave) {
            await AuditLog.create({
                action: 'trash-leave',
                targetId: req.params.id,
                targetType: 'Leave',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: 'Leave not found or already trashed'
            });
            return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found or already trashed' });
        }

        const before = {...leave.toObject() };
        leave.isTrashed = true;
        leave.trashedAt = new Date();
        await leave.save();

        await AuditLog.create({
            action: 'trash-leave',
            targetId: leave._id.toString(),
            targetType: 'Leave',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: before,
            afterState: { isTrashed: leave.isTrashed, trashedAt: leave.trashedAt },
            status: 'success',
            details: 'Leave trashed'
        });

        res.json({ success: true, statusCode: 200, message: 'Leave moved to trash successfully', leave });
    } catch (err) {
        console.error('Error trashing leave:', err.message);
        await AuditLog.create({
            action: 'trash-leave',
            targetId: req.params.id,
            targetType: 'Leave',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'failure',
            details: 'Server error while trashing leave'
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while trashing leave' });
    }
};

export const restoreMyLeave = async(req, res) => {
    try {
        const leave = await Leave.findOne({
            _id: req.params.id,
            employee: req.user.id,
            isTrashed: true,
        });

        if (!leave) {
            await AuditLog.create({
                action: 'restore-leave',
                targetId: req.params.id,
                targetType: 'Leave',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: 'Leave not found or not trashed'
            });
            return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found or not trashed' });
        }

        const before = {...leave.toObject() };
        leave.isTrashed = false;
        leave.trashedAt = null;
        await leave.save();

        await AuditLog.create({
            action: 'restore-leave',
            targetId: leave._id.toString(),
            targetType: 'Leave',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: before,
            afterState: { isTrashed: leave.isTrashed, trashedAt: leave.trashedAt },
            status: 'success',
            details: 'Leave restored'
        });

        res.json({ success: true, statusCode: 200, message: 'Leave restored successfully', leave });
    } catch (err) {
        console.error('Error restoring leave:', err.message);
        await AuditLog.create({
            action: 'restore-leave',
            targetId: req.params.id,
            targetType: 'Leave',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'failure',
            details: 'Server error while restoring leave'
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while restoring leave' });
    }
};