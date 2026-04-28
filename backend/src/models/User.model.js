import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true,
    },
    name: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    role: {
        type: String,
        enum: ['employee', 'admin'],
        default: 'employee',
    },
    leaveBalance: {
        type: Number,
        default: 20,
        min: 0,
    },

    // Trash flow only
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ isTrashed: 1 });
userSchema.index({ isDeleted: 1 });

// Virtuals
userSchema.virtual('isActive').get(function() {
    return !this.isTrashed;
});

// Pre-save: normalize email, hash password, and generate employeeId
userSchema.pre('save', async function() {
    if (this.email) {
        this.email = this.email.toLowerCase().trim();
    }

    if (this.isModified('password')) {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }

    if (!this.employeeId) {
        const lastUser = await mongoose.model('User')
            .findOne({}, {}, { sort: { createdAt: -1 } });

        let nextNumber = 1;
        if (lastUser && lastUser.employeeId) {
            const lastNumber = parseInt(lastUser.employeeId.replace('EMP', ''), 10);
            nextNumber = lastNumber + 1;
        }

        this.employeeId = `EMP${String(nextNumber).padStart(5, '0')}`;
    }
});


// Method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);