// src/validators/user.validator.js
import Joi from 'joi';

export const createUserSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(50)
        .trim()
        .required()
        .messages({
            'string.min': 'Name must be at least 3 characters long',
            'string.max': 'Name cannot exceed 50 characters',
            'any.required': 'Name is required',
        }),

    lastName: Joi.string()
        .min(2)
        .max(50)
        .trim()
        .required()
        .messages({
            'string.min': 'Last name must be at least 2 characters long',
            'string.max': 'Last name cannot exceed 50 characters',
            'any.required': 'Last name is required',
        }),

    department: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .required()
        .messages({
            'string.min': 'Department must be at least 2 characters long',
            'string.max': 'Department cannot exceed 100 characters',
            'any.required': 'Department is required',
        }),

    position: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .required()
        .messages({
            'string.min': 'Position must be at least 2 characters long',
            'string.max': 'Position cannot exceed 100 characters',
            'any.required': 'Position is required',
        }),

    contact: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Contact must be a valid phone number (10–15 digits)',
            'any.required': 'Contact is required',
        }),

    email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),

    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*]).+$'))
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password cannot exceed 128 characters',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            'any.required': 'Password is required',
        }),

    role: Joi.string()
        .valid('employee', 'admin')
        .default('employee')
        .messages({
            'any.only': 'Role must be either employee or admin',
        }),

    leaveBalance: Joi.number()
        .min(0)
        .default(20)
        .messages({
            'number.min': 'Leave balance cannot be negative',
        }),

    isTrashed: Joi.boolean().default(false),
    trashedAt: Joi.date().allow(null),
    isDeleted: Joi.boolean().default(false),
    deletedAt: Joi.date().allow(null),
});