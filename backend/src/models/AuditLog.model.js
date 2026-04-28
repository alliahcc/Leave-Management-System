import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    targetId: { type: String, required: true },
    targetType: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    performedByName: { type: String },
    performedByRole: { type: String }, // "admin" or "employee"
    details: { type: String },

    // 🔹 New fields
    requestMethod: { type: String }, // e.g. GET, POST, DELETE
    requestUrl: { type: String }, // endpoint path
    beforeState: { type: Object }, // snapshot before change
    afterState: { type: Object }, // snapshot after change
    status: { type: String }, // "success" or "failure"

    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);