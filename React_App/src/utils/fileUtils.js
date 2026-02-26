/**
 * Utility functions for file handling and validation
 */

/**
 * File validation configuration
 */
export const FILE_CONFIG = {
  ALLOWED_EXTENSIONS: ['pdf', 'txt'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'text/plain',
    'text/txt',
  ],
};

/**
 * Validate file type based on extension
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export function validateFileType(file) {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided',
    };
  }

  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();

  if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Invalid file type. Only ${FILE_CONFIG.ALLOWED_EXTENSIONS.join(', ')} files are allowed.`,
    };
  }

  return {
    isValid: true,
    extension: fileExtension,
  };
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export function validateFileSize(file) {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided',
    };
  }

  if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Current size: ${formatFileSize(file.size)}`,
    };
  }

  return {
    isValid: true,
    size: file.size,
  };
}

/**
 * Validate file MIME type
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export function validateMimeType(file) {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided',
    };
  }

  if (!FILE_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Expected: ${FILE_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return {
    isValid: true,
    mimeType: file.type,
  };
}

/**
 * Comprehensive file validation
 * @param {File} file - File to validate
 * @returns {Object} Complete validation result
 */
export function validateFile(file) {
  const errors = [];
  
  if (!file) {
    return {
      isValid: false,
      errors: ['No file selected'],
    };
  }

  // Validate file type
  const typeValidation = validateFileType(file);
  if (!typeValidation.isValid) {
    errors.push(typeValidation.error);
  }

  // Validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    errors.push(sizeValidation.error);
  }

  // Validate MIME type
  const mimeValidation = validateMimeType(file);
  if (!mimeValidation.isValid) {
    errors.push(mimeValidation.error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: errors.length === 0 ? {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: typeValidation.extension,
      lastModified: file.lastModified,
    } : null,
  };
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension
 */
export function getFileExtension(filename) {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is PDF
 * @param {File} file - File to check
 * @returns {boolean} True if PDF
 */
export function isPDF(file) {
  return file.type === 'application/pdf' || getFileExtension(file.name) === 'pdf';
}

/**
 * Check if file is text
 * @param {File} file - File to check
 * @returns {boolean} True if text file
 */
export function isTextFile(file) {
  return file.type === 'text/plain' || getFileExtension(file.name) === 'txt';
}

/**
 * Generate file preview info
 * @param {File} file - File to preview
 * @returns {Object} Preview information
 */
export function generateFilePreview(file) {
  return {
    name: file.name,
    size: formatFileSize(file.size),
    type: file.type,
    extension: getFileExtension(file.name),
    lastModified: new Date(file.lastModified).toLocaleString(),
    isPDF: isPDF(file),
    isText: isTextFile(file),
  };
}