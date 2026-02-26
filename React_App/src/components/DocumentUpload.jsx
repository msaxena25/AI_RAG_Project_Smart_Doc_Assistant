/**
 * DocumentUpload Component
 * 
 * Responsive document upload component with validation and API integration
 */

import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  File
} from 'lucide-react';
import { documentAPI } from '../services/api';
import { validateFile, formatFileSize, generateFilePreview } from '../utils/fileUtils';
import './DocumentUpload.css';

const DocumentUpload = ({ onDocumentUploaded, onClose, compact = false }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file
    const validation = validateFile(selectedFile);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setFile(null);
      setUploadResult(null);
      return;
    }

    // File is valid
    setFile(selectedFile);
    setValidationErrors([]);
    setUploadResult(null);
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelect(selectedFile);
  };

  /**
   * Handle drag events
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    handleFileSelect(droppedFile);
  };

  /**
   * Handle file upload
   */
  const handleUpload = async () => {
    if (!file) return;

    console.log('🚀 Starting upload for:', file.name);
    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      console.log('📤 Calling documentAPI.processPDF...');
      const result = await documentAPI.processPDF(file);
      console.log('📥 Upload result:', result);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        console.log('✅ Upload successful!');
        setUploadResult({
          success: true,
          message: 'Document processed successfully!',
          data: result.data,
        });

        // Notify parent component of successful upload
        if (onDocumentUploaded) {
          console.log('🔔 Notifying parent of successful upload');
          onDocumentUploaded({
            name: file.name,
            size: file.size,
            type: file.type,
            result: result.data
          });
        }
      } else {
        console.error('❌ Upload failed:', result.error);
        setUploadResult({
          success: false,
          message: result.error || 'Failed to process document',
        });
      }
    } catch (error) {
      console.error('💥 Upload exception:', error);
      setUploadResult({
        success: false,
        message: error.message || 'Upload failed',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Close upload form and reset state
   */
  const handleClose = () => {
    setFile(null);
    setValidationErrors([]);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClose) {
      onClose();
    }
  };

  /**
   * Trigger file input
   */
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const filePreview = file ? generateFilePreview(file) : null;

  return (
    <div className="document-upload-container">
      <div className="upload-header">
        <h2>
          <FileText className="header-icon" />
          Document Upload
        </h2>
        <p>Upload PDF or TXT files to process with AI</p>
      </div>

      {/* Upload Area */}
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileInputChange}
          className="file-input"
        />

        {!file ? (
          <div className="upload-prompt">
            <Upload className="upload-icon" />
            <h3>Drop your document here</h3>
            <p>or <span className="click-text">click to browse</span></p>
            <div className="file-types">
              <span>Supported: PDF, TXT</span>
              <span>Max size: 10MB</span>
            </div>
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-icon">
              {filePreview?.isPDF ? <FileText /> : <File />}
            </div>
            <div className="file-info">
              <h4>{filePreview?.name}</h4>
              <div className="file-details">
                <span>{filePreview?.size}</span>
                <span>{filePreview?.extension?.toUpperCase()}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="remove-file"
              aria-label="Remove file"
            >
              X
            </button>
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <AlertCircle className="error-icon" />
          <div className="error-list">
            {validationErrors.map((error, index) => (
              <p key={index} className="error-message">{error}</p>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p>Processing document... {uploadProgress}%</p>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
          {uploadResult.success ? <CheckCircle /> : <AlertCircle />}
          <div className="result-content">
            <h4>{uploadResult.success ? 'Success!' : 'Error'}</h4>
            <p>{uploadResult.message}</p>
            {uploadResult.success && uploadResult.data && (
              <div className="result-details">
                <p>Document processed successfully</p>
                {uploadResult.data.embeddings && (
                  <p>Generated {uploadResult.data.embeddings.count} embeddings</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="upload-actions">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading || validationErrors.length > 0}
          className="upload-button"
        >
          {uploading ? (
            <>
              <Loader2 className="spinning" />
              Processing...
            </>
          ) : (
            <>
              <Upload />
              Process Document
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="reset-button"
        >
          Close
        </button>

      </div>
    </div>
  );
};

export default DocumentUpload;