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
