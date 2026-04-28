import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

const authMiddleware = async(req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'No token, authorization denied',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from DB to ensure account is active and not trashed/deleted
        const user = await User.findById(decoded.id).select('-password');
        if (!user || user.isDeleted || user.isTrashed) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'Unauthorized: user not found or inactive',
            });
        }

        // Attach enriched user info to request
        req.user = {
            id: user._id.toString(),
            name: user.name,
            lastName: user.lastName,
            department: user.department,
            position: user.position,
            contact: user.contact,
            email: user.email,
            role: user.role,
            leaveBalance: user.leaveBalance,
            isDeleted: user.isDeleted,
            deletedAt: user.deletedAt,
            isTrashed: user.isTrashed,
            trashedAt: user.trashedAt,
            createdAt: user.createdAt,
        };

        if (!req.user.role) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'Unauthorized: no user role found',
            });
        }

        next();
    } catch (err) {
        console.error('JWT verification failed:', err.message);
        return res.status(401).json({
            success: false,
            statusCode: 401,
            message: 'Token is not valid',
        });
    }
};

export default authMiddleware;