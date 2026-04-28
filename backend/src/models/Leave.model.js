import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    employeeName: { type: String, required: true, trim: true },
    employeeLastName: { type: String, required: true, trim: true },

    leaveType: {
        type: String,
        enum: ['vacation', 'sick', 'personal', 'other'],
        required: true,
        trim: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending',
    },
    remarks: { type: String, trim: true, default: '' },

    // Trash flow only
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

// Indexes
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ isTrashed: 1 });
leaveSchema.index({ isDeleted: 1 });

// Virtual: leaveDays
leaveSchema.virtual('leaveDays').get(function() {
    if (this.startDate && this.endDate) {
        const diff = Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 0;
    }
    return 0;
});

// Pre-save validation
leaveSchema.pre('save', async function() {
    if (this.endDate < this.startDate) {
        throw new Error('End date cannot be before start date');
    }
});

leaveSchema.set('toJSON', { virtuals: true });
leaveSchema.set('toObject', { virtuals: true });

export default mongoose.model('Leave', leaveSchema);