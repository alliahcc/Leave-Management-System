import User from '../../models/User.model.js';
import Leave from '../../models/Leave.model.js';
import { createUserSchema } from '../../validators/user.validator.js';
import validate from '../../middleware/validate.middleware.js';
import { logAudit } from '../../utils/auditUtils.js';

export const createUser = [
    validate(createUserSchema),
    async (req, res) => {
        try {
            const existing = await User.findOne({ email: req.body.email });
            if (existing) {
                await logAudit(req, {
                    action: 'create-user',
                    targetId: req.body.email,
                    targetType: 'User',
                    status: 'failure',
                    details: `Attempted to create user ${req.body.email}, but email already exists`,
                });
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }

            const user = new User(req.body);
            await user.save();

            await logAudit(req, {
                action: 'create-user',
                targetId: user._id.toString(),
                targetType: 'User',
                status: 'success',
                details: `Admin ${req.user.email} created user ${user.email}`,
                afterState: user,
            });

            res.status(201).json({ success: true, message: 'User created successfully', user });
        } catch (err) {
            console.error('Error creating user:', err.message);
            await logAudit(req, {
                action: 'create-user',
                targetId: req.body.email,
                targetType: 'User',
                status: 'failure',
                details: `Server error while creating user ${req.body.email}`,
            });
            res.status(500).json({ success: false, message: 'Server error while creating user' });
        }
    },
];

export const getAllEmployees = async (req, res) => {
    try {
        const employees = await User.find({ isTrashed: false }).select('-password').lean();

        await logAudit(req, {
            action: 'get-all-employees',
            targetId: req.user.id,
            targetType: 'User',
            status: 'success',
            details: 'Fetched all active employees',
        });

        res.json({ success: true, statusCode: 200, employees });
    } catch (err) {
        console.error('Error fetching employees:', err.message);
        await logAudit(req, {
            action: 'get-all-employees',
            targetId: req.user.id,
            targetType: 'User',
            status: 'failure',
            details: 'Server error while fetching employees',
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching employees' });
    }
};

export const getAdminStats = async (req, res) => {
    try {
        const [totalEmployees, pendingLeaves, approvedLeaves] = await Promise.all([
            User.countDocuments({ isTrashed: false }),
            Leave.countDocuments({ status: 'pending', isTrashed: false }),
            Leave.countDocuments({ status: 'approved', isTrashed: false }),
        ]);

        await logAudit(req, {
            action: 'get-admin-stats',
            targetId: req.user.id,
            targetType: 'User',
            status: 'success',
            details: `Fetched admin stats: employees=${totalEmployees}, pendingLeaves=${pendingLeaves}, approvedLeaves=${approvedLeaves}`,
        });

        res.json({ success: true, statusCode: 200, stats: { totalEmployees, pendingLeaves, approvedLeaves } });
    } catch (err) {
        console.error('Error fetching stats:', err.message);
        await logAudit(req, {
            action: 'get-admin-stats',
            targetId: req.user.id,
            targetType: 'User',
            status: 'failure',
            details: 'Server error while fetching admin stats',
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching stats' });
    }
};

export const updateEmployee = async (req, res) => {
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

        const user = await User.findByIdAndUpdate(id, updates, { returnDocument: 'after' }).select('-password');

        if (!user) {
            await logAudit(req, {
                action: 'update-user',
                targetId: id,
                targetType: 'User',
                status: 'failure',
                details: `Attempted to update employee ${id}, but not found`,
                beforeState: before,
            });
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        await logAudit(req, {
            action: 'update-user',
            targetId: user._id.toString(),
            targetType: 'User',
            status: 'success',
            details: `Admin ${req.user.email} updated user ${user.email}`,
            beforeState: before,
            afterState: user,
        });

        res.json({ success: true, message: 'Employee updated successfully', user });
    } catch (err) {
        console.error('Error updating employee:', err.message);
        res.status(500).json({ success: false, message: 'Server error while updating employee' });
    }
};

export const trashEmployee = async (req, res) => {
    try {
        const before = await User.findById(req.params.id).lean();

        if (!before) {
            await logAudit(req, {
                action: 'trash-user',
                targetId: req.params.id,
                targetType: 'User',
                status: 'failure',
                details: 'Employee not found',
            });
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        if (before.role === 'admin') {
            await logAudit(req, {
                action: 'trash-user',
                targetId: req.params.id,
                targetType: 'User',
                status: 'failure',
                details: 'Attempted to trash an admin account',
                beforeState: before,
            });
            return res.status(403).json({ success: false, message: 'Cannot trash an admin account' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isTrashed: true, trashedAt: new Date() },
            { returnDocument: 'after' }
        );

        await logAudit(req, {
            action: 'trash-user',
            targetId: user._id.toString(),
            targetType: 'User',
            status: 'success',
            details: `Employee ${user.employeeId} moved to trash`,
            beforeState: before,
            afterState: user,
        });

        res.json({ success: true, message: 'Employee moved to trash', user });
    } catch (err) {
        console.error('Error trashing employee:', err.message);
        await logAudit(req, {
            action: 'trash-user',
            targetId: req.params.id,
            targetType: 'User',
            status: 'failure',
            details: 'Server error while trashing employee',
        });
        res.status(500).json({ success: false, message: 'Server error while trashing employee' });
    }
};

export const restoreEmployee = async (req, res) => {
    try {
        const before = await User.findById(req.params.id).lean();
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isTrashed: false, trashedAt: null },
            { returnDocument: 'after' }
        );

        if (!user) {
            await logAudit(req, {
                action: 'restore-user',
                targetId: req.params.id,
                targetType: 'User',
                status: 'failure',
                details: `Attempted to restore employee ${req.params.id}, but not found`,
                beforeState: before,
            });
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        await logAudit(req, {
            action: 'restore-user',
            targetId: user._id.toString(),
            targetType: 'User',
            status: 'success',
            details: `Employee ${user.employeeId} restored from trash`,
            beforeState: before,
            afterState: user,
        });

        res.json({ success: true, message: 'Employee restored', user });
    } catch (err) {
        console.error('Error restoring employee:', err.message);
        await logAudit(req, {
            action: 'restore-user',
            targetId: req.params.id,
            targetType: 'User',
            status: 'failure',
            details: `Server error while restoring employee ${req.params.id}`,
        });
        res.status(500).json({ success: false, message: 'Server error while restoring employee' });
    }
};

export const getTrashedEmployees = async (req, res) => {
    try {
        const employees = await User.find({ isTrashed: true }).select('-password').lean();

        res.json({ success: true, statusCode: 200, employees });

        await logAudit(req, {
            action: 'get-trashed-employees',
            targetId: req.user.id,
            targetType: 'User',
            status: 'success',
            details: `Fetched ${employees.length} trashed employees`,
        });
    } catch (err) {
        console.error('Error fetching trashed employees:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching trashed employees' });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const before = await User.findById(req.params.id).lean();
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true, deletedAt: new Date() },
            { returnDocument: 'after' }
        );

        if (!user) {
            await logAudit(req, {
                action: 'delete',
                targetId: req.params.id,
                targetType: 'User',
                status: 'failure',
                details: `Attempted to delete employee ${req.params.id}, but not found`,
                beforeState: before,
            });
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        await logAudit(req, {
            action: 'delete',
            targetId: user.employeeId,
            targetType: 'User',
            status: 'success',
            details: `Employee ${user.employeeId} marked as deleted`,
            beforeState: before,
            afterState: user,
        });

        res.json({ success: true, message: 'Employee marked as deleted', user });
    } catch (err) {
        console.error('Error marking employee deleted:', err.message);
        res.status(500).json({ success: false, message: 'Server error while deleting employee' });
    }
};
