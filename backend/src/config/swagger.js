import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Leave Management API',
            version: '1.0.0',
            description: 'API documentation for testing leave requests, approval workflows, employee management, and authentication features of the Leave Management System.',
        },
        servers: [{
            url: process.env.SWAGGER_SERVER_URL || 'https://final-leave-management-system-tpdz.vercel.app',
            description: 'Development server',
        }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;