// src/validators/leave.validator.js
import Joi from 'joi';

export const createLeaveSchema = Joi.object({
    leaveType: Joi.string()
        .valid('vacation', 'sick', 'personal', 'other')
        .required()
        .messages({
            'any.only': 'Leave type must be one of: vacation, sick, personal, other',
            'any.required': 'Leave type is required',
        }),

    startDate: Joi.date()
        .iso()
        .required()
        .messages({
            'date.base': 'Start date must be a valid ISO date',
            'any.required': 'Start date is required',
        }),

    endDate: Joi.date()
        .iso()
        .min(Joi.ref('startDate'))
        .required()
        .messages({
            'date.min': 'End date cannot be before start date',
            'date.base': 'End date must be a valid ISO date',
            'any.required': 'End date is required',
        }),

    reason: Joi.string()
        .min(10)
        .max(255)
        .required()
        .messages({
            'string.min': 'Reason must be at least 10 characters long',
            'string.max': 'Reason cannot exceed 255 characters',
            'any.required': 'Reason is required',
        }),
});

export const statusUpdateSchema = Joi.object({
    status: Joi.string()
        .valid('approved', 'rejected', 'cancelled')
        .required()
        .messages({
            'any.only': 'Status must be either approved, rejected, or cancelled',
            'any.required': 'Status is required',
        }),

    remarks: Joi.string()
        .min(3)
        .max(255)
        .when('status', {
            is: 'rejected',
            then: Joi.required().messages({
                'any.required': 'Remarks are required when rejecting',
                'string.empty': 'Remarks cannot be empty',
            }),
            otherwise: Joi.optional().allow(''), // ✅ allow empty or undefined for approve/cancel
        }),
});