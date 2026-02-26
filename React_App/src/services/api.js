/**
 * API Service for communicating with Node.js backend
 */

import axios from 'axios';

// Base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4100';
const API_KEY = import.meta.env.VITE_API_KEY || 'your-secure-api-key-here';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    
    // Handle common error scenarios
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          throw new Error('Authentication failed. Please check your API key.');
        case 403:
          throw new Error('Access forbidden. Check your permissions.');
        case 404:
          throw new Error('API endpoint not found.');
        case 413:
          throw new Error('File too large. Please upload a smaller file.');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(data?.message || `API Error: ${status}`);
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Request setup error.');
    }
  }
);

/**
 * Document processing API calls
 */
export const documentAPI = {
  /**
   * Process PDF document
   * @param {File} file - The PDF file to process
   * @returns {Promise<Object>} Processing result
   */
  async processPDF(file) {
    try {
      console.log('📄 Processing document:', file.name);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await apiClient.post('/process-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        success: true,
        data: {
          ...response.data,
          uploadedFileName: file.name,
          uploadedFileSize: file.size
        },
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Query processed documents
   * @param {string} prompt - User's question
   * @returns {Promise<Object>} Query result
   */
  async queryDocument(prompt) {
    try {
      const response = await apiClient.get('/query', {
        params: { prompt },
      });
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get all stored queries
   * @returns {Promise<Object>} All queries
   */
  async getAllQueries() {
    try {
      const response = await apiClient.get('/queries');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  async getAllDocuments() {
    try {
      const response = await apiClient.get('/documents');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get query statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    try {
      const response = await apiClient.get('/stats');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * Simplified API functions for easy import
 */
export const processDocument = documentAPI.processPDF;
export const queryDocument = async (prompt) => {
  const result = await documentAPI.queryDocument(prompt);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
};
export const getAllQueries = documentAPI.getAllQueries;
export const getStats = documentAPI.getStats;
export const healthCheck = documentAPI.healthCheck;

export default apiClient;