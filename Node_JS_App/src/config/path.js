import path from "path";

// Base directories
export const BASE_DIRS = {
    ROOT: process.cwd(),
    STORAGE: path.join(process.cwd(), "storage")
};

// Storage paths
export const STORAGE_PATHS = {
    EMBEDDINGS: path.join(BASE_DIRS.STORAGE, "embeddings"),
    DOCUMENTS: path.join(BASE_DIRS.STORAGE, "documents"), 
    CACHE: path.join(BASE_DIRS.STORAGE, "cache"),
};

// File paths
export const FILE_PATHS = {
    TEST_PDF: path.join(STORAGE_PATHS.DOCUMENTS, "test_mohit.pdf"),
    // Add more specific file paths as needed
};

// File extensions
export const ALLOWED_DOC_EXTENSIONS = {
    PDF: ['.pdf'],
    DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt']
};