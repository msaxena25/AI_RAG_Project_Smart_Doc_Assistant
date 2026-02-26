import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Database file path
const DB_PATH = path.join(process.cwd(), 'storage', 'database', 'queries.db');

/**
 * SQLite Database service for managing user queries
 */
class SQLLiteDB {
    constructor() {
        this.db = null;
        this.init();
    }

    /**
     * Initialize database connection and create tables
     */
    init() {
        try {
            // Create database directory if it doesn't exist
            const dbDir = path.dirname(DB_PATH);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Connect to database
            this.db = new Database(DB_PATH);
            this.db.pragma('journal_mode = WAL'); // Enable WAL mode for better performance

            this.createTable();
            console.log('✅ SQLite database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create user_queries and documents tables
     */
    createTable() {
        const createQueriesTableSQL = `
            CREATE TABLE IF NOT EXISTS user_queries (
                queryId TEXT PRIMARY KEY,
                prompt TEXT NOT NULL,
                answer TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                liked INTEGER DEFAULT 0 CHECK (liked IN (0, 1)),
                disliked INTEGER DEFAULT 0 CHECK (disliked IN (0, 1)),
                isDeleted INTEGER DEFAULT 0 CHECK (isDeleted IN (0, 1))
            )
        `;

        const createDocumentsTableSQL = `
            CREATE TABLE IF NOT EXISTS documents (
                docId TEXT PRIMARY KEY,
                originalName TEXT NOT NULL,
                storedFileName TEXT NOT NULL,
                filePath TEXT NOT NULL,
                fileSize INTEGER,
                mimeType TEXT,
                uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                processedAt DATETIME,
                embeddingDocId TEXT,
                totalEmbeddings INTEGER DEFAULT 0,
                isDeleted INTEGER DEFAULT 0 CHECK (isDeleted IN (0, 1))
            )
        `;

        try {
            this.db.exec(createQueriesTableSQL);
            console.log('✅ user_queries table created/verified');
            this.db.exec(createDocumentsTableSQL);
            console.log('✅ documents table created/verified');
        } catch (error) {
            console.error('❌ Failed to create table:', error);
            throw error;
        }
    }

    /**
     * Insert a new user query
     * @param {string} prompt - User's question
     * @param {string} answer - AI-generated answer
     * @returns {object} Inserted query data
     */
    insertQuery(prompt, answer) {
        const queryId = uuidv4();
        const insertSQL = `
            INSERT INTO user_queries (queryId, prompt, answer, createdAt)
            VALUES (?, ?, ?, datetime('now'))
        `;

        try {
            const stmt = this.db.prepare(insertSQL);
            const result = stmt.run(queryId, prompt, answer);

            // Maintain only last 10 queries
            // this.maintainQueryLimit();

            // Return the inserted query
            const insertedQuery = this.getQueryById(queryId);
            console.log(`✅ Query inserted with ID: ${queryId}`);
            return insertedQuery;
        } catch (error) {
            console.error('❌ Failed to insert query:', error);
            throw error;
        }
    }

    /**
     * Get query by ID
     * @param {string} queryId - Query ID
     * @returns {object|null} Query data or null if not found
     */
    getQueryById(queryId) {
        const selectSQL = `
            SELECT queryId, prompt, answer, createdAt, liked, disliked, isDeleted
            FROM user_queries 
            WHERE queryId = ? AND isDeleted = 0
        `;

        try {
            const stmt = this.db.prepare(selectSQL);
            const result = stmt.get(queryId);
            return result || null;
        } catch (error) {
            console.error('❌ Failed to get query by ID:', error);
            throw error;
        }
    }

    /**
     * Get all non-deleted queries (latest 10)
     * @returns {array} Array of query objects
     */
    getAllQueries() {
        const selectSQL = `
            SELECT queryId, prompt, answer, createdAt, liked, disliked, isDeleted
            FROM user_queries 
            WHERE isDeleted = 0
            ORDER BY createdAt DESC
            LIMIT 10
        `;

        try {
            const stmt = this.db.prepare(selectSQL);
            const results = stmt.all();
            return results;
        } catch (error) {
            console.error('❌ Failed to get all queries:', error);
            throw error;
        }
    }

    /**
     * Update query feedback (like/dislike)
     * @param {string} queryId - Query ID
     * @param {object} feedback - Feedback object {liked?: boolean, disliked?: boolean}
     * @returns {boolean} Success status
     */
    updateQueryFeedback(queryId, feedback) {
        const { liked, disliked } = feedback;
        const updateSQL = `
            UPDATE user_queries 
            SET liked = COALESCE(?, liked), 
                disliked = COALESCE(?, disliked)
            WHERE queryId = ? AND isDeleted = 0
        `;

        try {
            const stmt = this.db.prepare(updateSQL);
            const result = stmt.run(
                liked !== undefined ? (liked ? 1 : 0) : null,
                disliked !== undefined ? (disliked ? 1 : 0) : null,
                queryId
            );

            const success = result.changes > 0;
            if (success) {
                console.log(`✅ Query feedback updated for ID: ${queryId}`);
            } else {
                console.log(`⚠️ No query found to update with ID: ${queryId}`);
            }
            return success;
        } catch (error) {
            console.error('❌ Failed to update query feedback:', error);
            throw error;
        }
    }

    /**
     * Soft delete a query (mark as deleted)
     * @param {string} queryId - Query ID
     * @returns {boolean} Success status
     */
    deleteQuery(queryId) {
        const deleteSQL = `
            UPDATE user_queries 
            SET isDeleted = 1
            WHERE queryId = ? AND isDeleted = 0
        `;

        try {
            const stmt = this.db.prepare(deleteSQL);
            const result = stmt.run(queryId);

            const success = result.changes > 0;
            if (success) {
                console.log(`✅ Query soft deleted with ID: ${queryId}`);
            } else {
                console.log(`⚠️ No query found to delete with ID: ${queryId}`);
            }
            return success;
        } catch (error) {
            console.error('❌ Failed to delete query:', error);
            throw error;
        }
    }

    /**
     * Permanently delete old queries to maintain only last 10 records
     */
    maintainQueryLimit() {
        const cleanupSQL = `
            DELETE FROM user_queries 
            WHERE queryId NOT IN (
                SELECT queryId FROM user_queries 
                WHERE isDeleted = 0
                ORDER BY createdAt DESC 
                LIMIT 10
            ) AND isDeleted = 0
        `;

        try {
            const stmt = this.db.prepare(cleanupSQL);
            const result = stmt.run();

            if (result.changes > 0) {
                console.log(`✅ Cleaned up ${result.changes} old queries to maintain limit`);
            }
        } catch (error) {
            console.error('❌ Failed to maintain query limit:', error);
            throw error;
        }
    }

    /**
     * Get query statistics
     * @returns {object} Statistics object
     */
    getQueryStats() {
        const statsSQL = `
            SELECT 
                COUNT(*) as totalQueries,
                SUM(liked) as totalLikes,
                SUM(disliked) as totalDislikes,
                COUNT(CASE WHEN liked = 1 THEN 1 END) as likedQueries,
                COUNT(CASE WHEN disliked = 1 THEN 1 END) as dislikedQueries
            FROM user_queries 
            WHERE isDeleted = 0
        `;

        try {
            const stmt = this.db.prepare(statsSQL);
            const result = stmt.get();
            return {
                totalQueries: result.totalQueries || 0,
                totalLikes: result.totalLikes || 0,
                totalDislikes: result.totalDislikes || 0,
                likedQueries: result.likedQueries || 0,
                dislikedQueries: result.dislikedQueries || 0
            };
        } catch (error) {
            console.error('❌ Failed to get query stats:', error);
            throw error;
        }
    }

    /**
     * Find query by exact prompt match
     * @param {string} prompt - Exact prompt text to search for
     * @returns {object|null} Query data or null if not found
     */
    findQueryByPrompt(prompt) {
        const searchSQL = `
            SELECT queryId, prompt, answer, createdAt, liked, disliked, isDeleted
            FROM user_queries 
            WHERE LOWER(TRIM(prompt)) = LOWER(TRIM(?)) AND isDeleted = 0
            ORDER BY createdAt DESC
            LIMIT 1
        `;

        try {
            const stmt = this.db.prepare(searchSQL);
            const result = stmt.get(prompt);
            return result || null;
        } catch (error) {
            console.error('❌ Failed to find query by prompt:', error);
            throw error;
        }
    }

    /**
     * Delete all queries from the table (hard delete)
     * @returns {number} Number of deleted records
     */
    deleteAllQueries() {
        const deleteAllSQL = `DELETE FROM user_queries`;

        try {
            const stmt = this.db.prepare(deleteAllSQL);
            const result = stmt.run();

            console.log(`✅ All queries deleted. Removed ${result.changes} records`);
            return result.changes;
        } catch (error) {
            console.error('❌ Failed to delete all queries:', error);
            throw error;
        }
    }

    /**
     * Soft delete all queries (mark all as deleted)
     * @returns {number} Number of updated records
     */
    softDeleteAllQueries() {
        const softDeleteAllSQL = `
            UPDATE user_queries 
            SET isDeleted = 1 
            WHERE isDeleted = 0
        `;

        try {
            const stmt = this.db.prepare(softDeleteAllSQL);
            const result = stmt.run();

            console.log(`✅ All queries soft deleted. Updated ${result.changes} records`);
            return result.changes;
        } catch (error) {
            console.error('❌ Failed to soft delete all queries:', error);
            throw error;
        }
    }

    /**
     * Truncate table and reset auto-increment (complete table reset)
     * @returns {boolean} Success status
     */
    truncateTable() {
        try {
            this.db.exec('DELETE FROM user_queries');
            this.db.exec('DELETE FROM sqlite_sequence WHERE name="user_queries"');

            console.log('✅ Table truncated and reset successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to truncate table:', error);
            throw error;
        }
    }

    /**
     * Insert a new document record
     * @param {object} docData - Document metadata {originalName, storedFileName, filePath, fileSize, mimeType}
     * @returns {object} Inserted document data
     */
    insertDocument(docData) {
        const docId = uuidv4();
        const insertSQL = `
            INSERT INTO documents (docId, originalName, storedFileName, filePath, fileSize, mimeType, uploadedAt)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `;

        try {
            const stmt = this.db.prepare(insertSQL);
            stmt.run(
                docId,
                docData.originalName,
                docData.storedFileName,
                docData.filePath,
                docData.fileSize || 0,
                docData.mimeType || 'application/pdf'
            );

            const insertedDoc = this.getDocumentById(docId);
            console.log(`✅ Document inserted with ID: ${docId}`);
            return insertedDoc;
        } catch (error) {
            console.error('❌ Failed to insert document:', error);
            throw error;
        }
    }

    /**
     * Get document by ID
     * @param {string} docId - Document ID
     * @returns {object|null} Document data or null if not found
     */
    getDocumentById(docId) {
        const selectSQL = `
            SELECT docId, originalName, storedFileName, filePath, fileSize, mimeType, uploadedAt, processedAt, embeddingDocId, totalEmbeddings, isDeleted
            FROM documents 
            WHERE docId = ? AND isDeleted = 0
        `;

        try {
            const stmt = this.db.prepare(selectSQL);
            const result = stmt.get(docId);
            return result || null;
        } catch (error) {
            console.error('❌ Failed to get document by ID:', error);
            throw error;
        }
    }

    /**
     * Get all uploaded documents
     * @returns {array} Array of document objects
     */
    getAllDocuments() {
        const selectSQL = `
            SELECT docId, originalName, storedFileName, filePath, fileSize, mimeType, uploadedAt, processedAt, embeddingDocId, totalEmbeddings
            FROM documents 
            WHERE isDeleted = 0
            ORDER BY uploadedAt DESC
        `;

        try {
            const stmt = this.db.prepare(selectSQL);
            const results = stmt.all();
            return results;
        } catch (error) {
            console.error('❌ Failed to get all documents:', error);
            throw error;
        }
    }

    /**
     * Update document metadata after processing
     * @param {string} docId - Document ID
     * @param {object} updateData - {embeddingDocId, totalEmbeddings, processedAt}
     * @returns {boolean} Success status
     */
    updateDocumentAfterProcessing(docId, updateData) {
        const { embeddingDocId, totalEmbeddings } = updateData;
        const updateSQL = `
            UPDATE documents 
            SET embeddingDocId = ?, totalEmbeddings = ?, processedAt = datetime('now')
            WHERE docId = ? AND isDeleted = 0
        `;

        try {
            const stmt = this.db.prepare(updateSQL);
            const result = stmt.run(embeddingDocId || null, totalEmbeddings || 0, docId);

            const success = result.changes > 0;
            if (success) {
                console.log(`✅ Document metadata updated for ID: ${docId}`);
            } else {
                console.log(`⚠️ No document found to update with ID: ${docId}`);
            }
            return success;
        } catch (error) {
            console.error('❌ Failed to update document:', error);
            throw error;
        }
    }

    /**
     * Soft delete a document
     * @param {string} docId - Document ID
     * @returns {boolean} Success status
     */
    deleteDocument(docId) {
        const deleteSQL = `
            UPDATE documents 
            SET isDeleted = 1
            WHERE docId = ? AND isDeleted = 0
        `;

        try {
            const stmt = this.db.prepare(deleteSQL);
            const result = stmt.run(docId);

            const success = result.changes > 0;
            if (success) {
                console.log(`✅ Document soft deleted with ID: ${docId}`);
            } else {
                console.log(`⚠️ No document found to delete with ID: ${docId}`);
            }
            return success;
        } catch (error) {
            console.error('❌ Failed to delete document:', error);
            throw error;
        }
    }

    /**
     * Get document count
     * @returns {number} Total count of non-deleted documents
     */
    getDocumentCount() {
        const countSQL = `
            SELECT COUNT(*) as count
            FROM documents 
            WHERE isDeleted = 0
        `;

        try {
            const stmt = this.db.prepare(countSQL);
            const result = stmt.get();
            return result.count || 0;
        } catch (error) {
            console.error('❌ Failed to get document count:', error);
            throw error;
        }
    }

    /**
     * Delete all documents from the table (hard delete)
     * @returns {number} Number of deleted records
     */
    deleteAllDocuments() {
        const deleteAllSQL = `DELETE FROM documents`;

        try {
            const stmt = this.db.prepare(deleteAllSQL);
            const result = stmt.run();

            console.log(`✅ All documents deleted. Removed ${result.changes} records`);
            return result.changes;
        } catch (error) {
            console.error('❌ Failed to delete all documents:', error);
            throw error;
        }
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            console.log('✅ Database connection closed');
        }
    }
}

// Export singleton instance
export const sqliteDB = new SQLLiteDB();

// Export class for testing
export { SQLLiteDB };