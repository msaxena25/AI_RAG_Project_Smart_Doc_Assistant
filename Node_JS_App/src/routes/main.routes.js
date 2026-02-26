import { processPdf } from "../document-processer.js";
import RAGService from "../services/rag.service.js";
import { API_MESSAGES, ERROR_MESSAGES } from '../config/app.config.js';
import { FILE_PATHS } from '../config/path.js';
import { sqliteDB } from '../store/sqlite.db.js';
import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './storage/documents';
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for PDF files only
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * Health check endpoint
 */
router.get("/", (request, response) => {
    response.type("text").send(API_MESSAGES.SERVER_RUNNING);
});

/**
 * Main query endpoint - processes user questions using RAG
 */
router.get("/query", async (request, response) => {
    try {
        const userPrompt = request.query.prompt || request.query.q;
        if (!userPrompt) {
            response.status(400).json({ error: API_MESSAGES.INVALID_PROMPT });
            return;
        }

        const result = await RAGService.processPrompt(userPrompt);

        response.json({
            success: true,
            prompt: userPrompt,
            answer: result.answer,
            queryId: result.queryId,
            metadata: result.metadata
        });
    } catch (error) {
        console.log("🚀 ~ Query error:", error);
        response.status(500).json({ 
            success: false,
            error: ERROR_MESSAGES.PROCESS_PROMPT_ERROR,
            details: error.message 
        });
    }
});

/**
 * PDF processing endpoint - extracts text and generates embeddings
 * Handles file upload via POST with multipart/form-data
 */
router.post("/process-pdf", upload.single('document'), async (request, response) => {
    try {
        // Check if file was uploaded
        if (!request.file) {
            return response.status(400).json({ 
                success: false, 
                error: "No file uploaded. Please select a PDF file." 
            });
        }

        console.log('📄 Processing uploaded file:', request.file.originalname);
        console.log('📁 File path:', request.file.path);

        // Process the uploaded PDF file
        const embeddings = await processPdf(request.file.path);
        
        // Store document metadata in SQLite
        const docData = {
            originalName: request.file.originalname,
            storedFileName: request.file.filename,
            filePath: request.file.path,
            fileSize: request.file.size,
            mimeType: request.file.mimetype
        };

        const insertedDoc = sqliteDB.insertDocument(docData);

        // Update document with processing results
        sqliteDB.updateDocumentAfterProcessing(insertedDoc.docId, {
            pdfId: embeddings.pdfId,
            totalEmbeddings: embeddings.totalEmbeddings
        });

        response.json({
            success: true,
            message: "PDF processed successfully",
            docId: insertedDoc.docId,
            docName: request.file.originalname,
            filePath: request.file.path,
            fileSize: request.file.size,
            embeddings: {
                count: embeddings.totalEmbeddings,
                pdfId: embeddings.pdfId,
                message: embeddings.message
            }
        });
    } catch (error) {
        console.log("🚀 ~ PDF processing error:", error);
        
        // Clean up uploaded file on error
        if (request.file && fs.existsSync(request.file.path)) {
            fs.unlinkSync(request.file.path);
        }
        
        response.status(500).json({ 
            success: false, 
            error: "Failed to process PDF file",
            details: error.message 
        });
    }
});

/**
 * Get all stored queries from database
 */
router.get("/queries", async (request, response) => {
    try {
        const queries = sqliteDB.getAllQueries();
        response.json({
            success: true,
            message: "Retrieved all queries",
            count: queries.length,
            queries: queries
        });
    } catch (error) {
        console.log("🚀 ~ Get queries error:", error);
        response.status(500).json({ success: false, error: "Failed to retrieve queries" });
    }
});

/**
 * Get all uploaded documents
 */
router.get("/documents", async (request, response) => {
    try {
        const documents = sqliteDB.getAllDocuments();
        response.json({
            success: true,
            message: "Retrieved all uploaded documents",
            count: documents.length,
            documents: documents
        });
    } catch (error) {
        console.log("🚀 ~ Get documents error:", error);
        response.status(500).json({ success: false, error: "Failed to retrieve documents" });
    }
});

/**
 * Get query statistics
 */
router.get("/stats", async (request, response) => {
    try {
        const stats = sqliteDB.getQueryStats();
        response.json({
            success: true,
            message: "Query statistics",
            stats: stats
        });
    } catch (error) {
        console.log("🚀 ~ Stats error:", error);
        response.status(500).json({ success: false, error: "Failed to get statistics" });
    }
});

/**
 * Update query feedback (like/dislike)
 */
router.post("/queries/:queryId/feedback", express.json(), async (request, response) => {
    try {
        const { queryId } = request.params;
        const { liked, disliked } = request.body;

        const success = sqliteDB.updateQueryFeedback(queryId, { liked, disliked });
        
        if (success) {
            response.json({ success: true, message: "Feedback updated successfully" });
        } else {
            response.status(404).json({ success: false, error: "Query not found" });
        }
    } catch (error) {
        console.log("🚀 ~ Feedback error:", error);
        response.status(500).json({ success: false, error: "Failed to update feedback" });
    }
});

/**
 * Delete all queries from database
 * DELETE /queries/clear
 */
router.delete("/queries/clear", async (request, response) => {
    try {
        const { type } = request.query; // ?type=soft|hard|truncate
        let deletedCount = 0;
        let message = "";

        switch (type) {
            case 'soft':
                deletedCount = sqliteDB.softDeleteAllQueries();
                message = `Soft deleted ${deletedCount} queries (recoverable)`;
                break;
            case 'hard':
                deletedCount = sqliteDB.deleteAllQueries();
                message = `Permanently deleted ${deletedCount} queries`;
                break;
            case 'truncate':
                sqliteDB.truncateTable();
                message = "Table truncated and reset successfully";
                break;
            default:
                // Default to soft delete for safety
                deletedCount = sqliteDB.softDeleteAllQueries();
                message = `Soft deleted ${deletedCount} queries (default: recoverable)`;
        }

        response.json({
            success: true,
            message: message,
            type: type || 'soft',
            deletedCount: type === 'truncate' ? 'all' : deletedCount
        });
    } catch (error) {
        console.log("🚀 ~ Delete all queries error:", error);
        response.status(500).json({ 
            success: false,
            error: "Failed to delete queries",
            details: error.message 
        });
    }
});

/**
 * Delete all documents from database
 * DELETE /documents/clear
 */
router.delete("/documents/clear", async (request, response) => {
    try {
        const deletedCount = sqliteDB.deleteAllDocuments();
        response.json({
            success: true,
            message: `Deleted ${deletedCount} documents`,
            deletedCount
        });
    } catch (error) {
        console.log("🚀 ~ Delete all documents error:", error);
        response.status(500).json({
            success: false,
            error: "Failed to delete documents",
            details: error.message
        });
    }
});

export default router;