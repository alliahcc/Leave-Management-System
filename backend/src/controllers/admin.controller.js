import User from '../models/User.model.js';
import Leave from '../models/Leave.model.js';
import { calculateLeaveDays } from '../utils/leaveUtils.js';
import { createUserSchema } from '../validators/user.validator.js';
import { statusUpdateSchema } from '../validators/leave.validator.js';
import validate from '../middleware/validate.middleware.js';
import AuditLog from '../models/AuditLog.model.js';

// === USER MANAGEMENT ===
export const createUser = [
    validate(createUserSchema),
    async(req, res) => {
        try {
            const existing = await User.findOne({ email: req.body.email });
            if (existing) {
                await AuditLog.create({
                    action: 'create-user',
                    targetId: req.body.email,
                    targetType: 'User',
                    performedBy: req.user.id,
                    performedByName: `${req.user.name} ${req.user.lastName}`,
                    performedByRole: req.user.role,
                    requestMethod: req.method,
                    requestUrl: req.originalUrl,
                    beforeState: null,
                    afterState: null,
                    status: 'failure',
                    details: `Attempted to create user ${req.body.email}, but email already exists`
                });
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }

            const user = new User(req.body);
            await user.save();

            // 🔹 Audit log with method, url, status
            await AuditLog.create({
                action: 'create-user',
                targetId: user._id.toString(),
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: null,
                afterState: user,
                status: 'success',
                details: `Admin ${req.user.email} created user ${user.email}`
            });

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user
            });
        } catch (err) {
            console.error('Error creating user:', err.message);

            await AuditLog.create({
                action: 'create-user',
                targetId: req.body.email,
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: null,
                afterState: null,
                status: 'failure',
                details: `Server error while creating user ${req.body.email}`
            });

            res.status(500).json({ success: false, message: 'Server error while creating user' });
        }
    }
];

export const getAllEmployees = async(req, res) => {
    try {
        const employees = await User.find({ isTrashed: false })
            .select('-password')
            .lean();

        await AuditLog.create({
            action: 'get-all-employees',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'success',
            details: `Fetched all active employees`
        });

        res.json({ success: true, statusCode: 200, employees });
    } catch (err) {
        console.error('Error fetching employees:', err.message);
        await AuditLog.create({
            action: 'get-all-employees',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'failure',
            details: `Server error while fetching employees`
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching employees' });
    }
};


export const getAdminStats = async(req, res) => {
    try {
        const [totalEmployees, pendingLeaves, approvedLeaves] = await Promise.all([
            User.countDocuments({ isTrashed: false }),
            Leave.countDocuments({ status: 'pending', isTrashed: false }),
            Leave.countDocuments({ status: 'approved', isTrashed: false }),
        ]);

        await AuditLog.create({
            action: 'get-admin-stats',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'success',
            details: `Fetched admin stats: employees=${totalEmployees}, pendingLeaves=${pendingLeaves}, approvedLeaves=${approvedLeaves}`
        });

        res.json({ success: true, statusCode: 200, stats: { totalEmployees, pendingLeaves, approvedLeaves } });
    } catch (err) {
        console.error('Error fetching stats:', err.message);
        await AuditLog.create({
            action: 'get-admin-stats',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'failure',
            details: `Server error while fetching admin stats`
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching stats' });
    }
};


// === UPDATE EMPLOYEE ===
export const updateEmployee = async(req, res) => {
    try {
        const { id } = req.params;
        const before = await User.findById(id).lean();

        const updates = {
            name: req.body.name,
            lastName: req.body.lastName,
            department: req.body.department,
            position: req.body.position,
            contact: req.body.contact,
            email: req.body.email,
            role: req.body.role,
            leaveBalance: req.body.leaveBalance,
            updatedAt: new Date(),
        };

        const user = await User.findByIdAndUpdate(id, updates, { returnDocument: 'after' }).select("-password");

        if (!user) {
            await AuditLog.create({
                action: 'update-user',
                targetId: id,
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: before,
                afterState: null,
                status: 'failure',
                details: `Attempted to update employee ${id}, but not found`
            });
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        await AuditLog.create({
            action: 'update-user',
            targetId: user._id.toString(),
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: before,
            afterState: user,
            status: 'success',
            details: `Admin ${req.user.email} updated user ${user.email}`
        });

        res.json({ success: true, message: "Employee updated successfully", user });
    } catch (err) {
        console.error("Error updating employee:", err.message);
        res.status(500).json({ success: false, message: "Server error while updating employee" });
    }
};

export const trashEmployee = async(req, res) => {
    try {
        // Snapshot before change
        const before = await User.findById(req.params.id).lean();

        if (!before) {
            await AuditLog.create({
                action: 'trash-user',
                targetId: req.params.id,
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: null,
                afterState: null,
                status: 'failure',
                details: 'Employee not found'
            });
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // 🚫 Prevent trashing admins
        if (before.role === 'admin') {
            await AuditLog.create({
                action: 'trash-user',
                targetId: req.params.id,
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: before,
                afterState: null,
                status: 'failure',
                details: 'Attempted to trash an admin account'
            });
            return res.status(403).json({ success: false, message: 'Cannot trash an admin account' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id, { isTrashed: true, trashedAt: new Date() }, { returnDocument: 'after' }
        );

        // Audit log for success
        await AuditLog.create({
            action: 'trash-user',
            targetId: user._id.toString(),
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: before,
            afterState: user,
            status: 'success',
            details: `Employee ${user.employeeId} moved to trash`
        });

        res.json({ success: true, message: 'Employee moved to trash', user });
    } catch (err) {
        console.error('Error trashing employee:', err.message);
        await AuditLog.create({
            action: 'trash-user',
            targetId: req.params.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: null,
            afterState: null,
            status: 'failure',
            details: 'Server error while trashing employee'
        });
        res.status(500).json({ success: false, message: 'Server error while trashing employee' });
    }
};

export const restoreEmployee = async(req, res) => {
    try {
        // Snapshot before change
        const before = await User.findById(req.params.id).lean();

        const user = await User.findByIdAndUpdate(
            req.params.id, { isTrashed: false, trashedAt: null }, { returnDocument: 'after' }
        );

        if (!user) {
            await AuditLog.create({
                action: 'restore-user',
                targetId: req.params.id,
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: before,
                afterState: null,
                status: 'failure',
                details: `Attempted to restore employee ${req.params.id}, but not found`
            });
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Audit log for success
        await AuditLog.create({
            action: 'restore-user',
            targetId: user._id.toString(),
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: before,
            afterState: user,
            status: 'success',
            details: `Employee ${user.employeeId} restored from trash`
        });

        res.json({ success: true, message: 'Employee restored', user });
    } catch (err) {
        console.error('Error restoring employee:', err.message);
        await AuditLog.create({
            action: 'restore-user',
            targetId: req.params.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: null,
            afterState: null,
            status: 'failure',
            details: `Server error while restoring employee ${req.params.id}`
        });
        res.status(500).json({ success: false, message: 'Server error while restoring employee' });
    }
};

// === GET TRASHED EMPLOYEES ===
export const getTrashedEmployees = async(req, res) => {
    try {
        const employees = await User.find({ isTrashed: true })
            .select('-password')
            .lean();

        res.json({ success: true, statusCode: 200, employees });

        //AUDITLOGS
        await AuditLog.create({
            action: 'get-trashed-employees',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role
        });
    } catch (err) {
        console.error('Error fetching trashed employees:', err.message);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while fetching trashed employees',
        });
    }
};
// Permanent delete (mark as deleted, not remove)
export const deleteEmployee = async(req, res) => {
    try {
        const before = await User.findById(req.params.id).lean(); // snapshot before

        const user = await User.findByIdAndUpdate(
            req.params.id, { isDeleted: true, deletedAt: new Date() }, { returnDocument: 'after' }
        );

        if (!user) {
            await AuditLog.create({
                action: 'delete',
                targetId: req.params.id,
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: before,
                afterState: null,
                status: 'failure',
                details: `Attempted to delete employee ${req.params.id}, but not found`
            });
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // 🔹 Audit log
        await AuditLog.create({
            action: 'delete',
            targetId: user.employeeId,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: before,
            afterState: user,
            status: 'success',
            details: `Employee ${user.employeeId} marked as deleted`
        });

        res.json({ success: true, message: 'Employee marked as deleted', user });
    } catch (err) {
        console.error('Error marking employee deleted:', err.message);
        res.status(500).json({ success: false, message: 'Server error while deleting employee' });
    }
};


// === LEAVE MANAGEMENT ===
export const getAllLeaves = async(req, res) => {
    try {
        const leaves = await Leave.find({ isTrashed: false })
            .populate('employee', 'employeeId name lastName department position contact email role')
            .lean();

        await AuditLog.create({
            action: 'get-all-leaves',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'success',
            details: `Fetched all active leave records`
        });

        res.json({ success: true, statusCode: 200, leaves });
    } catch (err) {
        console.error('Error fetching leaves:', err.message);
        await AuditLog.create({
            action: 'get-all-leaves',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'failure',
            details: `Server error while fetching leaves`
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching leaves' });
    }
};


export const viewLeaveRequestDetail = async(req, res) => {
    try {
        const leave = await Leave.findById(req.params.id)
            .populate('employee', 'name lastName department position contact email role')
            .lean();

        if (!leave) {
            await AuditLog.create({
                action: 'view-leave-detail',
                targetId: req.params.id,
                targetType: 'Leave',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: `Attempted to view leave ${req.params.id}, but not found`
            });
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        await AuditLog.create({
            action: 'view-leave-detail',
            targetId: leave._id.toString(),
            targetType: 'Leave',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'success',
            details: `Viewed leave request ${leave._id}`
        });

        res.json({ success: true, statusCode: 200, leave });
    } catch (err) {
        console.error('Error fetching leave:', err.message);
        await AuditLog.create({
            action: 'view-leave-detail',
            targetId: req.params.id,
            targetType: 'Leave',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'failure',
            details: `Server error while fetching leave ${req.params.id}`
        });
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


export const updateLeaveStatus = [
    validate(statusUpdateSchema),
    async(req, res) => {
        try {
            const leave = await Leave.findById(req.params.id).populate("employee");
            if (!leave) {
                await AuditLog.create({
                    action: "update-leave-status",
                    targetId: req.params.id,
                    targetType: "Leave",
                    performedBy: req.user.id,
                    performedByName: `${req.user.name} ${req.user.lastName}`,
                    performedByRole: req.user.role,
                    requestMethod: req.method,
                    requestUrl: req.originalUrl,
                    status: "failure",
                    details: `Leave ${req.params.id} not found`,
                });
                return res.status(404).json({ success: false, statusCode: 404, message: "Leave not found" });
            }

            if (leave.status !== "pending") {
                await AuditLog.create({
                    action: "update-leave-status",
                    targetId: leave._id.toString(),
                    targetType: "Leave",
                    performedBy: req.user.id,
                    performedByName: `${req.user.name} ${req.user.lastName}`,
                    performedByRole: req.user.role,
                    requestMethod: req.method,
                    requestUrl: req.originalUrl,
                    status: "failure",
                    details: `Leave ${leave._id} already ${leave.status}`,
                });
                return res.status(400).json({ success: false, statusCode: 400, message: "Only pending leaves can be updated" });
            }

            const before = { status: leave.status, remarks: leave.remarks };

            leave.status = req.body.status;

            // Only set remarks if rejecting
            if (req.body.status === "rejected") {
                leave.remarks = (req.body.remarks && req.body.remarks.trim()) ?
                    req.body.remarks.trim() :
                    "Rejected by admin";
            }

            if (req.body.status === "approved") {
                // Ensure startDate and endDate are valid
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);

                if (isNaN(start) || isNaN(end)) {
                    return res.status(400).json({ success: false, statusCode: 400, message: "Invalid leave dates" });
                }

                const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1; // inclusive
                if (days <= 0) {
                    return res.status(400).json({ success: false, statusCode: 400, message: "Invalid leave duration" });
                }

                if (leave.employee.leaveBalance < days) {
                    return res.status(400).json({ success: false, statusCode: 400, message: "Insufficient leave balance" });
                }

                leave.employee.leaveBalance -= days;
                await leave.employee.save();
                leave.duration = days;
                // remarks optional for approval
                leave.remarks = (leave.remarks && leave.remarks.trim()) ?
                    leave.remarks.trim() :
                    "Approved by admin";
            }

            await leave.save();

            await AuditLog.create({
                action: "update-leave-status",
                targetId: leave._id.toString(),
                targetType: "Leave",
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: before,
                afterState: { status: leave.status, remarks: leave.remarks },
                status: "success",
                details: `Leave ${leave._id} updated to ${req.body.status}`,
            });

            res.json({
                success: true,
                statusCode: 200,
                message: `Leave ${req.body.status}`,
                leave,
            });
        } catch (err) {
            console.error("Error updating leave status:", err.message);
            await AuditLog.create({
                action: "update-leave-status",
                targetId: req.params.id,
                targetType: "Leave",
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: "failure",
                details: `Server error while updating leave ${req.params.id}`,
            });
            res.status(500).json({ success: false, statusCode: 500, message: "Server error while updating leave status" });
        }
    },
];

export const trashLeave = async(req, res) => {
    try {
        const before = await Leave.findById(req.params.id).lean();
        const leave = await Leave.findByIdAndUpdate(
            req.params.id, { isTrashed: true, trashedAt: new Date() }, { returnDocument: 'after' }
        );

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
                beforeState: before,
                afterState: null,
                status: 'failure',
                details: `Attempted to trash leave ${req.params.id}, but not found`
            });
            return res.status(404).json({ success: false, statusCode: 404, message: 'Leave not found' });
        }

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
            afterState: leave,
            status: 'success',
            details: `Leave ${leave._id} moved to trash`
        });

        res.json({ success: true, statusCode: 200, message: 'Leave moved to trash', leave });
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
            details: `Server error while trashing leave ${req.params.id}`
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while trashing leave' });
    }
};


export const restoreLeave = async(req, res) => {
    try {
        const before = await Leave.findById(req.params.id).lean();
        const leave = await Leave.findByIdAndUpdate(
            req.params.id, { isTrashed: false, trashedAt: null }, { returnDocument: 'after' }
        );

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
                beforeState: before,
                afterState: null,
                status: 'failure',
                details: `Attempted to restore leave ${req.params.id}, but not found`
            });
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

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
            afterState: leave,
            status: 'success',
            details: `Leave ${leave._id} restored from trash`
        });

        res.json({ success: true, statusCode: 200, message: 'Leave restored', leave });
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
            details: `Server error while restoring leave ${req.params.id}`
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while restoring leave' });
    }
};

// === GET TRASHED LEAVES ===
// Get all trashed leave records
export const getTrashedLeaves = async(req, res) => {
    try {
        const leaves = await Leave.find({ isTrashed: true })
            .populate('employee', 'employeeId name lastName department position contact email role')
            .lean();

        await AuditLog.create({
            action: 'get-trashed-leaves',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: null,
            afterState: leaves,
            status: 'success',
            details: `Fetched ${leaves.length} trashed leave records`
        });

        res.json({ success: true, statusCode: 200, leaves });
    } catch (err) {
        console.error('Error fetching trashed leaves:', err.message);

        await AuditLog.create({
            action: 'get-trashed-leaves',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: null,
            afterState: null,
            status: 'failure',
            details: `Server error while fetching trashed leaves: ${err.message}`
        });

        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Server error while fetching trashed leaves',
        });
    }
};

// Permanent delete (mark as deleted, not remove)
export const deleteLeave = async(req, res) => {
    try {
        // Snapshot before change
        const before = await Leave.findById(req.params.id).lean();

        const leave = await Leave.findByIdAndUpdate(
            req.params.id, { isDeleted: true, deletedAt: new Date() }, { returnDocument: 'after' }
        );

        if (!leave) {
            await AuditLog.create({
                action: 'delete-leave',
                targetId: req.params.id,
                targetType: 'Leave',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: before,
                afterState: null,
                status: 'failure',
                details: `Attempted to delete leave ${req.params.id}, but not found`
            });
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        // Audit log for success
        await AuditLog.create({
            action: 'delete-leave',
            targetId: leave._id.toString(),
            targetType: 'Leave',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: before,
            afterState: leave,
            status: 'success',
            details: `Leave ${leave._id} marked as deleted`
        });

        res.json({ success: true, message: 'Leave marked as deleted', leave });
    } catch (err) {
        console.error('Error marking leave deleted:', err.message);
        await AuditLog.create({
            action: 'delete-leave',
            targetId: req.params.id,
            targetType: 'Leave',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: null,
            afterState: null,
            status: 'failure',
            details: `Server error while deleting leave ${req.params.id}`
        });
        res.status(500).json({ success: false, message: 'Server error while deleting leave' });
    }
};

export const getAuditLogs = async(req, res) => {
    try {
        const totalLogs = await AuditLog.countDocuments();

        // ✅ Force exactly 2 pages
        const limit = Math.ceil(totalLogs / 20); // divide logs into 2 pages
        const page = parseInt(req.query.page, 10) || 1;
        const skip = (page - 1) * limit;

        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        await AuditLog.create({
            action: "get-audit-logs",
            targetId: req.user.id,
            targetType: "User",
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: "success",
            details: `Fetched ${logs.length} logs (page ${page} of 2)`,
        });

        res.json({
            success: true,
            statusCode: 200,
            logs,
            pagination: {
                totalLogs,
                totalPages: 20, // ✅ always 2 pages
                currentPage: page,
                pageSize: limit,
            },
        });
    } catch (err) {
        console.error("Error fetching audit logs:", err.message);

        await AuditLog.create({
            action: "get-audit-logs",
            targetId: req.user.id,
            targetType: "User",
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: "failure",
            details: "Error fetching logs",
        });

        res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Server error while fetching audit logs",
        });
    }
};