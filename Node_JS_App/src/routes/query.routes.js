
import RAGService from "../services/rag.service.js";
import { API_MESSAGES, ERROR_MESSAGES } from '../config/app.config.js';
import { sqliteDB } from '../store/sqlite.db.js';
import express from "express";


const router = express.Router();

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

export default router;