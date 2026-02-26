export const API_ENDPOINTS = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4100',
    QUERY: '/query',
    PROCESS_PDF: '/process-pdf',
    QUERIES: '/queries',
    STATS: '/stats',
    FEEDBACK: '/queries/{id}/feedback'
};