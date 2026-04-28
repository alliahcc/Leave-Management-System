import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Leave Management API',
            version: '1.0.0',
            description: 'MERN Leave Management Backend',
        },
        servers: [{
            url: process.env.SWAGGER_SERVER_URL || 'http://localhost:5000/api/v1',
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