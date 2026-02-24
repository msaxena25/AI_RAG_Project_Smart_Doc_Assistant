import { processPdf } from "./document-processer.js";
import { findTopSimilarChunks } from "./vector-operations/cosine-similarity-search.js";
import { getPromptEmbeddingWithCache } from "./store/prompt.cache.js";
import formatLLMMessage from './utils/util.js';
import { FILE_PATHS } from './config/path.js';
import { SERVER_CONFIG, API_MESSAGES, ERROR_MESSAGES } from './config/app.config.js';
import dotenv from "dotenv";
import express from "express";
dotenv.config();


const app = express();
const port = process.env.PORT || SERVER_CONFIG.DEFAULT_PORT;

if (!port) {
    console.error(ERROR_MESSAGES.PORT_NOT_SET);
    process.exit(1);
}

app.get("/", (request, response) => {
    response.type("text").send(API_MESSAGES.SERVER_RUNNING);
});

app.get("/query", async (request, response) => {
    try {
        const userPrompt = request.query.prompt || request.query.q;

        if (!userPrompt) {
            response.status(400).json({ error: API_MESSAGES.INVALID_PROMPT });
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
        response.status(500).json({ error: ERROR_MESSAGES.PROCESS_PROMPT_ERROR });
    }
});

app.get("/process-pdf", async (request, response) => {
    try {
        const embeddings = await processPdf(FILE_PATHS.TEST_PDF); // coverts PDF to text chunks & embeddings and saves to file.
        response.json(embeddings);
    } catch (error) {
        console.log("🚀 ~ PDF chunk error:", error);
        response.status(500).json({ error: "Failed to extract PDF chunks" });
    }
});
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});



