import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import AuditLog from '../models/AuditLog.model.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator.js';
import validate from '../middleware/validate.middleware.js';

// === LOGIN ===
export const login = [
    validate(loginSchema),
    async(req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email: email.toLowerCase().trim() });

            if (!user) {
                await AuditLog.create({
                    action: 'login',
                    targetId: email,
                    targetType: 'User',
                    performedBy: undefined,
                    performedByName: email,
                    performedByRole: 'unauthenticated',
                    requestMethod: req.method,
                    requestUrl: req.originalUrl,
                    status: 'failure',
                    details: 'User not found'
                });
                return res.status(401).json({ success: false, statusCode: 401, message: 'Invalid credentials' });
            }

            if (user.isTrashed) {
                await AuditLog.create({
                    action: 'login',
                    targetId: user._id.toString(),
                    targetType: 'User',
                    performedBy: user._id,
                    performedByName: `${user.name} ${user.lastName}`,
                    performedByRole: user.role,
                    requestMethod: req.method,
                    requestUrl: req.originalUrl,
                    status: 'failure',
                    details: 'Account trashed'
                });
                return res.status(403).json({ success: false, statusCode: 403, message: 'Account is trashed. Contact admin.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                await AuditLog.create({
                    action: 'login',
                    targetId: user._id.toString(),
                    targetType: 'User',
                    performedBy: user._id,
                    performedByName: `${user.name} ${user.lastName}`,
                    performedByRole: user.role,
                    requestMethod: req.method,
                    requestUrl: req.originalUrl,
                    status: 'failure',
                    details: 'Incorrect password'
                });
                return res.status(401).json({ success: false, statusCode: 401, message: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email },
                process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            await AuditLog.create({
                action: 'login',
                targetId: user._id.toString(),
                targetType: 'User',
                performedBy: user._id,
                performedByName: `${user.name} ${user.lastName}`,
                performedByRole: user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'success',
                details: 'Login success'
            });

            res.json({ success: true, statusCode: 200, message: 'Login successful', token, user });
        } catch (err) {
            console.error('Error during login:', err.message);
            await AuditLog.create({
                action: 'login',
                targetId: req.body.email,
                targetType: 'User',
                performedBy: undefined,
                performedByName: req.body.email,
                performedByRole: 'unauthenticated',
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: 'Server error during login'
            });
            res.status(500).json({ success: false, statusCode: 500, message: 'Server error while logging in' });
        }
    },
];

export const getMe = async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user || user.isTrashed) {
            await AuditLog.create({
                action: 'get-me',
                targetId: req.user.id,
                targetType: 'User',
                performedBy: req.user.id,
                performedByName: `${req.user.name} ${req.user.lastName}`,
                performedByRole: req.user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: 'failure',
                details: 'User not found'
            });
            return res.status(404).json({ success: false, statusCode: 404, message: 'User not found' });
        }

        await AuditLog.create({
            action: 'get-me',
            targetId: user._id.toString(),
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'success',
            details: 'Profile fetched'
        });

        res.json({ success: true, statusCode: 200, user });
    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        await AuditLog.create({
            action: 'get-me',
            targetId: req.user.id,
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            status: 'failure',
            details: 'Server error fetching profile'
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while fetching profile' });
    }
};

// === LOGOUT ===
export const logout = async(req, res) => {
    try {
        await AuditLog.create({
            action: 'logout',
            targetId: req.user.id.toString(),
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: null,
            afterState: null,
            status: 'success',
            details: `User ${req.user.email} logged out`
        });

        res.json({ success: true, statusCode: 200, message: 'Logout successful' });
    } catch (err) {
        console.error('Error during logout:', err.message);
        await AuditLog.create({
            action: 'logout',
            targetId: req.user.id.toString(),
            targetType: 'User',
            performedBy: req.user.id,
            performedByName: `${req.user.name} ${req.user.lastName}`,
            performedByRole: req.user.role,
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            beforeState: null,
            afterState: null,
            status: 'failure',
            details: `Server error during logout for ${req.user.email}`
        });
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while logging out' });
    }
};

// === CHANGE PASSWORD ===
export const changePassword = [
    validate(changePasswordSchema),
    async(req, res) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user || user.isTrashed) {
                await AuditLog.create({
                    action: 'change-password',
                    targetId: req.user.id,
                    targetType: 'User',
                    performedBy: req.user.id,
                    performedByName: `${req.user.name} ${req.user.lastName}`,
                    performedByRole: req.user.role,
                    requestMethod: req.method,
                    requestUrl: req.originalUrl,
                    status: 'failure',
                    details: 'User not found'
                });
                return res.status(404).json({ success: false, statusCode: 404, message: 'User not found' });
            }

            const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
            if (!isMatch) {
                await AuditLog.create({
                    action: 'change-password',
                    targetId: user._id.toString(),
                    targetType: 'User',
                    performedBy: user._id,
                    performedByName: `${user.name} ${user.lastName}`,
                    performedByRole: user.role,
                    requestMethod: req.method,
                    requestUrl: req.originalUrl,
                    status: 'failure',
                    details: 'Incorrect current password'
                });
                return res.status(400).json({ success: false, statusCode: 400, message: 'Current password is incorrect' });
            }

            const before = { password: user.password };
            user.password = req.body.newPassword;
            await user.save();

            await AuditLog.create({
                action: 'change-password',
                targetId: user._id.toString(),
                targetType: 'User',
                performedBy: user._id,
                performedByName: `${user.name} ${user.lastName}`,
                performedByRole: user.role,
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                beforeState: before,
                afterState: { password: 'updated' },
                status: 'success',
                details: 'Password changed'
            });

            res.json({ success: true, statusCode: 200, message: 'Password changed successfully' });
        } catch (err) {
            console.error('Error changing password:', err.message);
            await AuditLog.create({
                action: 'change-password',
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
                details: 'Server error while changing password'
            });
            res.status(500).json({
                success: false,
                statusCode: 500,
                message: 'Server error while changing password',
            });
        }
    },
];