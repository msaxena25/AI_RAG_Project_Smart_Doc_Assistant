import { processPdf } from "../document-processer.js";
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
        cb(null, file.originalname + '-' + uniqueSuffix + path.extname(file.originalname));
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
 * PDF processing endpoint - extracts text and generates embeddings
 * Handles file upload via POST with multipart/form-data
 */
router.post("/upload", upload.single('document'), async (request, response) => {
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
            embeddingDocId: embeddings.embeddingDocId,
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
                embeddingDocId: embeddings.embeddingDocId,
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
 * Get all uploaded documents
 */
router.get("/fetch", async (request, response) => {
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
 * Delete all documents from database
 * DELETE /documents/clear
 */
router.delete("/clear", async (request, response) => {
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