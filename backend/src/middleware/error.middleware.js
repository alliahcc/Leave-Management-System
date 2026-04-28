// src/middleware/error.middleware.js

const errorMiddleware = (err, req, res, next) => {
    console.error('❌ Error:', err.message);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    const statusCode = err.statusCode || err.status || 500;

    // Build a structured error response
    const errorResponse = {
        success: false,
        statusCode,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };

    // Attach model-related flags if available
    if (err.isDeleted !== undefined) {
        errorResponse.isDeleted = err.isDeleted;
    }
    if (err.deletedAt !== undefined) {
        errorResponse.deletedAt = err.deletedAt;
    }
    if (err.isTrashed !== undefined) {
        errorResponse.isTrashed = err.isTrashed;
    }
    if (err.trashedAt !== undefined) {
        errorResponse.trashedAt = err.trashedAt;
    }

    // Optionally include user/leave context if passed along in error
    if (err.userContext) {
        errorResponse.user = {
            id: err.userContext.id,
            name: err.userContext.name,
            lastName: err.userContext.lastName,
            department: err.userContext.department,
            position: err.userContext.position,
            contact: err.userContext.contact,
            email: err.userContext.email,
            role: err.userContext.role,
            leaveBalance: err.userContext.leaveBalance,
        };
    }

    if (err.leaveContext) {
        errorResponse.leave = {
            id: err.leaveContext.id,
            employeeName: err.leaveContext.employeeName,
            employeeLastName: err.leaveContext.employeeLastName,
            leaveType: err.leaveContext.leaveType,
            startDate: err.leaveContext.startDate,
            endDate: err.leaveContext.endDate,
            duration: err.leaveContext.duration,
            reason: err.leaveContext.reason,
            status: err.leaveContext.status,
        };
    }

    res.status(statusCode).json(errorResponse);
};

export default errorMiddleware;