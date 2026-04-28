// src/middleware/role.middleware.js

const roleMiddleware = (roles = []) => {
    return (req, res, next) => {
        try {
            if (!req.user || !req.user.role) {
                return res.status(401).json({
                    success: false,
                    statusCode: 401,
                    message: 'Unauthorized: no user role found',
                });
            }

            // Block deleted or trashed accounts
            if (req.user.isDeleted || req.user.isTrashed) {
                return res.status(403).json({
                    success: false,
                    statusCode: 403,
                    message: 'Access denied: account is inactive',
                    isDeleted: req.user.isDeleted,
                    deletedAt: req.user.deletedAt,
                    isTrashed: req.user.isTrashed,
                    trashedAt: req.user.trashedAt,
                });
            }

            const allowedRoles = (Array.isArray(roles) ? roles : [roles])
                .map(r => String(r).toLowerCase());
            const userRole = String(req.user.role).toLowerCase();

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    statusCode: 403,
                    message: 'Access denied: insufficient permissions',
                    role: req.user.role,
                });
            }

            next();
        } catch (err) {
            console.error('Role middleware error:', err.message);
            res.status(500).json({
                success: false,
                statusCode: 500,
                message: 'Server error in role middleware',
            });
        }
    };
};

export default roleMiddleware;