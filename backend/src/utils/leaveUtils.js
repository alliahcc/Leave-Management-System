// src/utils/leaveUtils.js

/**
 * Calculate the number of leave days between startDate and endDate.
 * Returns an object with duration and normalized dates.
 */
export const calculateLeaveDays = (startDate, endDate) => {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid dates provided');
        }
        if (end < start) {
            throw new Error('End date cannot be before start date');
        }

        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return {
            startDate: start,
            endDate: end,
            duration: diffDays > 0 ? diffDays : 0,
            isTrashed: false, // default for new leave
            trashedAt: null,
            isDeleted: false, // default for new leave
            deletedAt: null,
        };
    } catch (err) {
        console.error('Error calculating leave days:', err.message);
        return {
            startDate: null,
            endDate: null,
            duration: 0,
            error: err.message,
            isTrashed: false,
            trashedAt: null,
            isDeleted: false,
            deletedAt: null,
        };
    }
};