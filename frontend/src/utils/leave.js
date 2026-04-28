// src/utils/leave.js

/**
 * Maps leave type codes/keys to human-readable labels.
 * Must match backend enum: vacation, sick, personal, other.
 */
export const labelForLeaveType = (type) => {
    switch (type) {
        case "sick":
            return "Sick Leave";
        case "vacation":
            return "Vacation Leave";
        case "personal":
            return "Personal Leave";
        case "other":
            return "Other Leave";
        default:
            return "Unknown Leave Type";
    }
};

/**
 * Maps leave status codes to readable labels.
 * Backend enum: pending, approved, rejected, cancelled.
 */
export const statusLabel = (status) => {
    switch (status) {
        case "pending":
            return "Pending Approval";
        case "approved":
            return "Approved";
        case "rejected":
            return "Rejected";
        case "cancelled":
            return "Cancelled";
        default:
            return "Unknown Status";
    }
};

/**
 * Formats leave duration (startDate → endDate).
 */
export const formatLeaveDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "";
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} → ${end}`;
};