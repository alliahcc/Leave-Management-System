import { Router } from 'express';
import {
    login,
    getMe,
    changePassword,
    logout
} from '../controllers/auth.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

// === AUTHENTICATION ===
router.post('/login', login);

// === LOGOUT ===
router.post('/logout', authMiddleware, logout);

// === USER PROFILE ===
router.get('/me', authMiddleware, getMe);

// === PASSWORD MANAGEMENT ===
router.post('/change-password', authMiddleware, changePassword);

// === ACCOUNT MANAGEMENT (NEW) ===
// Soft-delete own account (mark isDeleted + deletedAt)
router.patch('/me/soft-delete', authMiddleware, async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id, { isDeleted: true, deletedAt: new Date() }, { returnDocument: 'after' }
        ).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, statusCode: 404, message: 'User not found' });
        }
        res.json({ success: true, statusCode: 200, message: 'Account soft-deleted', user });
    } catch (err) {
        console.error('Error soft-deleting account:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while soft-deleting account' });
    }
});

// Restore own account (reset isDeleted + deletedAt)
router.patch('/me/restore', authMiddleware, async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id, { isDeleted: false, deletedAt: null }, { returnDocument: 'after' }
        ).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, statusCode: 404, message: 'User not found' });
        }
        res.json({ success: true, statusCode: 200, message: 'Account restored', user });
    } catch (err) {
        console.error('Error restoring account:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while restoring account' });
    }
});

// Trash own account (mark isTrashed + trashedAt)
router.patch('/me/trash', authMiddleware, async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id, { isTrashed: true, trashedAt: new Date() }, { returnDocument: 'after' }
        ).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, statusCode: 404, message: 'User not found' });
        }
        res.json({ success: true, statusCode: 200, message: 'Account moved to trash', user });
    } catch (err) {
        console.error('Error trashing account:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while trashing account' });
    }
});

// Restore trashed account (reset isTrashed + trashedAt)
router.patch('/me/restore-trash', authMiddleware, async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id, { isTrashed: false, trashedAt: null }, { returnDocument: 'after' }
        ).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, statusCode: 404, message: 'User not found' });
        }
        res.json({ success: true, statusCode: 200, message: 'Account restored from trash', user });
    } catch (err) {
        console.error('Error restoring trashed account:', err.message);
        res.status(500).json({ success: false, statusCode: 500, message: 'Server error while restoring trashed account' });
    }
});

export default router;