// src/middleware/validate.middleware.js
import Joi from 'joi';

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // return all errors, not just the first one
            stripUnknown: true, // remove unknown fields
        });

        if (error) {
            // Collect all error messages
            const messages = error.details.map((detail) => detail.message);

            // Build structured error response
            const errorResponse = {
                success: false,
                statusCode: 400,
                message: messages.join(', '),
            };

            // Attach model-related flags if present in the body
            if (req.body.isDeleted !== undefined) {
                errorResponse.isDeleted = req.body.isDeleted;
            }
            if (req.body.deletedAt !== undefined) {
                errorResponse.deletedAt = req.body.deletedAt;
            }
            if (req.body.isTrashed !== undefined) {
                errorResponse.isTrashed = req.body.isTrashed;
            }
            if (req.body.trashedAt !== undefined) {
                errorResponse.trashedAt = req.body.trashedAt;
            }

            return res.status(400).json(errorResponse);
        }

        // Attach validated (cleaned) body
        req.body = value;
        next();
    };
};

export default validate;