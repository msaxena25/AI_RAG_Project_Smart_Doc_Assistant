import { SERVER_CONFIG, ERROR_MESSAGES, validateEnvironmentConfig } from './config/app.config.js';
import { queryDB } from './store/sqlite.db.js';
import mainRoutes from './routes/main.routes.js';
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
dotenv.config();

const app = express();
const port = SERVER_CONFIG.DEFAULT_PORT;

/**
 * Initialize database connection and handle errors
 */
function initializeDatabase() {
    console.log('🔄 Initializing SQLite database...');
    try {
        // Database is automatically initialized when imported
        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

// Initialize database
initializeDatabase();

// Validate environment configuration
console.log('🔄 Validating environment configuration...');
if (!validateEnvironmentConfig()) {
    console.error('❌ Environment validation failed. Please fix the configuration and restart.');
    process.exit(1);
}

// Validate port configuration
if (!port) {
    console.error(ERROR_MESSAGES.PORT_NOT_SET);
    process.exit(1);
}

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // React dev server ports
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', mainRoutes);

// Start server
app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
    console.log('📋 Available endpoints:');
    console.log('  GET  /           - Health check');
    console.log('  GET  /query      - Process user queries');
    console.log('  GET  /process-pdf - Process PDF documents');
    console.log('  GET  /queries    - Get all stored queries');
    console.log('  GET  /stats      - Get query statistics');
    console.log('  POST /queries/:id/feedback - Update query feedback');
    console.log('---------------------------------------------------------------');
});

// Graceful shutdown handlers
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
    queryDB.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
    queryDB.close();
    process.exit(0);
});



