import AuditLog from '../models/AuditLog.model.js';

export const logAudit = async (req, { action, targetId, targetType, status, details, beforeState = null, afterState = null }) => {
    await AuditLog.create({
        action,
        targetId,
        targetType,
        performedBy: req.user?.id,
        performedByName: req.user ? `${req.user.name} ${req.user.lastName}` : 'unknown',
        performedByRole: req.user?.role || 'unauthenticated',
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        beforeState,
        afterState,
        status,
        details,
    });
};
