import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/auth.routes.js';
import employeeRoutes from './src/routes/employee.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import errorMiddleware from './src/middleware/error.middleware.js';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// === Security & Middleware ===
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Swagger Docs (development only) ===
if (process.env.NODE_ENV !== 'production') {
    const swaggerDocument = yaml.load('./src/config/swagger.yaml');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));
}

// === Routes ===
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employee', employeeRoutes);
app.use('/api/v1/admin', adminRoutes);

// === Health Check ===
app.get('/api/v1/health', (req, res) =>
    res.json({ status: 'ok', message: 'Server is running', uptime: process.uptime() })
);

// === Error Handling Middleware ===
app.use(errorMiddleware);

// === Start Server ===
const start = async() => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Swagger Docs: http://localhost:${PORT}/api-docs`);
            }
        });
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
};

start();