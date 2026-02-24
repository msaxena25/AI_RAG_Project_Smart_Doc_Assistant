import { processPdf } from "./process-pdf.js";
import { generateAnswerFromLLM } from "./genai-util.js";
import { findTopSimilarChunks} from "./similarity-search.js";
import { listStoredEmbeddings, loadEmbeddingsFromFile } from "./embedding-store.js";
import { getPromptEmbeddingWithCache, listCachedPrompts, clearPromptCache } from "./prompt-cache.js";
import formatLLMMessage from './util.js';
import dotenv from "dotenv";
import express from "express";
import path from "path";
dotenv.config();

// Static file path from asset folder
const assetPdfPath = path.join(process.cwd(), "asset", "test_mohit.pdf");


const app = express();
const port = process.env.PORT;

if (!port) {
    console.error("PORT is not set. Set it in .env.");
    process.exit(1);
}

app.get("/", (request, response) => {
    response.type("text").send("Smart Document Assistant Node server is running.\n");
});

app.get("/query", async (request, response) => {
    try {
        const userPrompt = request.query.prompt || request.query.q;

        if (!userPrompt) {
            response.status(400).json({ error: "Please provide a prompt parameter" });
            return;
        }

        // Get embedding for user prompt (with caching)
        const promptEmbedding = await getPromptEmbeddingWithCache(userPrompt);

        // Find top 3 most similar chunks
        const similarityResult = findTopSimilarChunks(promptEmbedding, null, assetPdfPath);

        // Format message for LLM
        const llmMessage = formatLLMMessage(userPrompt, similarityResult);

        response.json({
            // prompt: userPrompt,
            // chunks: similarityResult.topChunks,
            // formattedText: similarityResult,
            llmMessage: llmMessage
        });
    } catch (error) {
        console.log("🚀 ~ error:", error);
        response.status(500).json({ error: "Failed to process user prompt" });
    }
});

app.get("/process-pdf", async (request, response) => {
    try {
        const embeddings = await processPdf(assetPdfPath); // coverts PDF to text chunks & embeddings and saves to file.
        response.json(embeddings);
    } catch (error) {
        console.log("🚀 ~ PDF chunk error:", error);
        response.status(500).json({ error: "Failed to extract PDF chunks" });
    }
});
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});



