# Smart Document Assistant (Node)

Minimal Node.js base application that starts a local Express server (ES module setup).

## Run

```powershell
npm start
```

Server listens on `http://localhost:4100`.

## Development (auto-restart)

```powershell
npm run dev
```

## Gemini Setup

1. Copy `.env.example` to `.env`.
2. Set `GEMINI_API_KEY`, `GEMINI_MODEL`, and `PORT` in `.env`.

### Test Endpoint

`http://localhost:4100/gemini?prompt=Hello`

## Dependencies

### Production Dependencies
- **@google/genai** - Google Generative AI SDK for embeddings and LLM responses
- **better-sqlite3** - Fast SQLite database for storing queries and embeddings
- **compute-cosine-similarity** - Calculate similarity between document embeddings  
- **cors** - Enable cross-origin requests from React frontend
- **crypto** - Cryptographic utilities for generating unique IDs
- **dotenv** - Load environment variables from .env file
- **express** - Web framework for creating REST API server
- **multer** - Middleware for handling file uploads
- **node-localstorage** - Local storage implementation for caching
- **pdf-parse** - Extract text content from PDF documents
- **uuid** - Generate unique identifiers for database records

### Development Dependencies
- **nodemon** - Auto-restart server during development
