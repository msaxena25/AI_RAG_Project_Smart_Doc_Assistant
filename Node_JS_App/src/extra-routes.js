import express from "express";
import { listStoredEmbeddings, loadEmbeddingsFromFile } from "./store/embedding.store.js";
import { getTop3SimilarChunks, getTop3ChunksText } from "./vector-operations/cosine-similarity-search.js";
const app = express();

// New endpoint to list stored embeddings
app.get("/embeddings", (request, response) => {
    try {
        const storedEmbeddings = listStoredEmbeddings();
        response.json({
            message: "Stored embeddings",
            count: storedEmbeddings.length,
            embeddings: storedEmbeddings
        });
    } catch (error) {
        console.log("🚀 ~ List embeddings error:", error);
        response.status(500).json({ error: "Failed to list embeddings" });
    }
});

// New endpoint to get specific embedding data
app.get("/embeddings/:pdfId", (request, response) => {
    try {
        const pdfId = request.params.pdfId;
        const embeddingData = loadEmbeddingsFromFile(pdfId);

        if (!embeddingData) {
            response.status(404).json({ error: "Embedding not found" });
            return;
        }

        response.json(embeddingData);
    } catch (error) {
        console.log("🚀 ~ Get embedding error:", error);
        response.status(500).json({ error: "Failed to get embedding" });
    }
});

// Debug endpoint to view top 3 similar chunks
app.get("/top-chunks", (request, response) => {
    try {
        const top3Chunks = getTop3SimilarChunks();
        const formattedText = getTop3ChunksText();

        response.json({
            message: "Top 3 similar chunks from last search",
            count: top3Chunks.length,
            chunks: top3Chunks.map(chunk => ({
                chunkIndex: chunk.chunkIndex,
                textPreview: chunk.text.substring(0, 150) + "...",
                fullText: chunk.text,
                similarityScore: chunk.similarityScore
            })),
            formattedForGemini: formattedText
        });
    } catch (error) {
        console.log("🚀 ~ Get top chunks error:", error);
        response.status(500).json({ error: "Failed to get top chunks" });
    }
});

// Cache management endpoints
app.get("/cache/prompts", (request, response) => {
    try {
        const cachedPrompts = listCachedPrompts();
        response.json({
            message: "Cached prompt embeddings",
            count: cachedPrompts.length,
            prompts: cachedPrompts
        });
    } catch (error) {
        console.log("🚀 ~ Get cached prompts error:", error);
        response.status(500).json({ error: "Failed to get cached prompts" });
    }
});

app.delete("/cache/prompts", (request, response) => {
    try {
        clearPromptCache();
        response.json({
            message: "Prompt cache cleared successfully"
        });
    } catch (error) {
        console.log("🚀 ~ Clear cache error:", error);
        response.status(500).json({ error: "Failed to clear cache" });
    }
});
