/**
 * MainPage Component
 * 
 * Main application page that combines document upload and chat interface
 * Allows users to upload documents and then chat with them
 */

import React, { useState, useEffect } from 'react';
import DocumentUpload from './DocumentUpload';
import ChatInterface from './ChatInterface';
import { FileText, MessageCircle, Upload, CheckCircle } from 'lucide-react';
import { formatFileSize } from '../utils/fileUtils';
import './MainPage.css';
import { API_ENDPOINTS } from '../config/api';
import { documentAPI } from '../services/api';
import QueryList from './QueryList';

const MainPage = () => {
    const [showUploadForm, setShowUploadForm] = useState(true);
    const [hasUploadedDoc, setHasUploadedDoc] = useState(false); // Define the missing state
    const [uploadStatus, setUploadStatus] = useState(''); // Additional state for upload feedback
    const [currentQuery, setCurrentQuery] = useState('');
    const [error, setError] = useState('');
    const [documentList, setDocumentList] = useState([]); // State to hold list of all documents
    const [bottomTab, setBottomTab] = useState('documents');
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);

    // Check if document has been processed on component mount
    useEffect(() => {
        getAllDocuments(); // Fetch all documents on mount
    }, []);

    const getAllDocuments = async () => {
        try {
            const response = await documentAPI.getAllDocuments();
            if (response.success) {
                const data = response.data.documents || [];
                setShowUploadForm(data.length === 0); // Hide upload form if documents exist
                setDocumentList(data);
            } else {
                console.error('Failed to fetch documents:', response.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            return [];
        }
    }

    /**
     * Check if a document has been uploaded and processed
     */
    const checkDocumentStatus = async () => {
        try {
            // You might want to add an endpoint to check document status
            // For now, we'll check if there are any queries (indicating document processing)
            const response = await fetch(`${API_ENDPOINTS.BASE_URL}/stats`, {
                headers: {
                    'X-API-Key': import.meta.env.VITE_API_KEY
                }
            });

            if (response.ok) {
                const data = await response.json();
                setHasUploadedDoc(data.stats?.totalQueries > 0 || false);
            }
        } catch (error) {
            console.error('Error checking document status:', error);
            // Assume no document if we can't check
            setHasUploadedDoc(false);
        }
    };

    /**
     * Handle feedback submission
     */
    const handleFeedback = async (queryId, feedbackType) => {
        try {
            const feedback = {
                [feedbackType]: true,
                [feedbackType === 'liked' ? 'disliked' : 'liked']: false
            };

            const response = await fetch(
                `${API_ENDPOINTS.BASE_URL}/queries/${queryId}/feedback`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': import.meta.env.VITE_API_KEY
                    },
                    body: JSON.stringify(feedback)
                }
            );

            if (response.ok) {
                // Update the query in the local state
                setQueries(prevQueries =>
                    prevQueries.map(query =>
                        query.id === queryId
                            ? { ...query, ...feedback }
                            : query
                    )
                );
            } else {
                console.error('Failed to submit feedback');
            }
        } catch (error) {
            console.error('Feedback error:', error);
        }
    };

    const onDocumentUploaded = (data) => {
        getAllDocuments(); // Refresh document list after upload
        setShowUploadForm(false);
    }

    const handleCloseDocumentUploadSection = () => {
        setShowUploadForm(false);
    }

    const handleUploadNew = () => {
        setShowUploadForm(true);
    }

    // Document click handler
    const handleSelectDocument = (doc) => {
        setSelectedDocument(doc);
        console.log("🚀 ~ doc:", doc)
        // You can use doc.originalName and doc.docId here as needed
        // Example: console.log('Selected document:', doc.originalName, doc.docId);
    };

    return (
        <div className="main-page">
            {/* Content Area - Always Split Layout */}
            <div className="main-content split-layout">
                {/* Upload Panel (Left) */}
                <div className="upload-panel">
                    <div className="panel-header">
                        <FileText size={20} />
                        <h3>{bottomTab === 'documents' ? 'Document Management' : 'Recent Queries'}</h3>
                    </div>
                    <div className="panel-content">
                        {bottomTab === 'documents' ? (
                            showUploadForm ? (
                                <DocumentUpload
                                    compact={true}
                                    onDocumentUploaded={onDocumentUploaded}
                                    onClose={handleCloseDocumentUploadSection}
                                />
                            ) : (
                                <div className="uploaded-document-view">
                                    {/* Uploaded Document Info */}
                                    <div>
                                        <div className="doc-status">
                                            <div className="doc-details">
                                                {documentList.length > 0 ? (
                                                    <div className="document-list">
                                                        {documentList.map((doc, index) => (
                                                            <div
                                                                key={doc.docId || index}
                                                                className={`document-item${selectedDocument && selectedDocument.docId === doc.docId ? ' selected' : ''}`}
                                                                onClick={() => handleSelectDocument(doc)}
                                                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '10px' }}
                                                            >
                                                                <CheckCircle size={10} />
                                                                <span>{doc.originalName}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p>No documents uploaded yet. First upload a document to get started.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Upload New Document Button */}
                                    <div className="upload-new-section">
                                        <button
                                            type="button"
                                            onClick={handleUploadNew}
                                            className="upload-new-btn"
                                        >
                                            <Upload size={16} />
                                            Upload New Document
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            <QueryList onSelectQuery={setSelectedQuery} selectedQuery={selectedQuery} />
                        )}
                    </div>
                    <div className="tab-navigation">
                        <button
                            className={`tab-button${bottomTab === 'documents' ? ' active' : ''}`}
                            onClick={() => setBottomTab('documents')}
                        >
                            <span className="tab-label">Documents</span>
                        </button>
                        <button
                            className={`tab-button${bottomTab === 'queries' ? ' active' : ''}`}
                            onClick={() => setBottomTab('queries')}
                        >
                            <span className="tab-label">Recent Queries</span>
                        </button>
                    </div>
                </div>

                {/* Chat Panel (Right) */}
                <div className="chat-panel">
                    <div className="panel-header">
                        <MessageCircle size={20} />
                        <h3>Chat with AI</h3>
                    </div>
                    <div className="panel-content">
                        <ChatInterface selectedQuery={selectedQuery} selectedDocument={selectedDocument} />
                    </div>
                </div>
            </div>
            {/* Bottom Tabs */}
            <div className="main-footer">
                <div className="footer-info">
                    <p>Powered by Gemini AI & RAG Technology</p>
                </div>
            </div>
        </div>
    );
};

export default MainPage;