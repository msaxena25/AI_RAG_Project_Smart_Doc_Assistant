/**
 * MainPage Component
 * 
 * Main application page that combines document upload and chat interface
 * Allows users to upload documents and then chat with them
 */

import React, { useState, useEffect } from 'react';
import DocumentUpload from './DocumentUpload';
import ChatInterface from './ChatInterface';
import { FileText, MessageCircle, Upload, CheckCircle, Trash2 } from 'lucide-react';
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
    const [chatSystemMessage, setChatSystemMessage] = useState('');
    // Track if system message has been shown
    const [systemMessageShown, setSystemMessageShown] = useState(false);
    const [deleteToConfirm, setDeleteToConfirm] = useState(null);

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
                // Select the last added document by default
                if (data.length > 0) {
                    setSelectedDocument(data[0]);
                } else {
                    setSelectedDocument(null);
                }
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
        if (data && data.name) {
            setChatSystemMessage(
                <>
                    The document <span style={{ color: 'rgb(84, 0, 169)' }}>'{data.name}'</span> has been successfully uploaded. You may now proceed with your queries.
                </>
            );
        } else {
            setChatSystemMessage('The document has been successfully uploaded. You may now proceed with your queries.');
        }
        setSystemMessageShown(false);
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

    // Handle delete document
    const handleDeleteDocument = async (docId) => {
        try {
            const response = await documentAPI.deleteDocument(docId);
            if (response.success) {
                // Remove from list
                setDocumentList(prev => prev.filter(doc => doc.docId !== docId));
                // Clear selection if deleted document was selected
                if (selectedDocument && selectedDocument.docId === docId) {
                    setSelectedDocument(null);
                }
                setDeleteToConfirm(null);
            } else {
                alert(`Error: ${response.error}`);
            }
        } catch (error) {
            alert(`Error deleting document: ${error.message}`);
        }
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
                                                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '10px', justifyContent: 'space-between' }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }} onClick={() => handleSelectDocument(doc)}>
                                                                    <CheckCircle size={10} />
                                                                    <span>{doc.originalName}</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteToConfirm(doc);
                                                                    }}
                                                                    style={{
                                                                        background: 'transparent',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        color: '#ef4444',
                                                                        padding: '0.25rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                    title="Delete document"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
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
                            onClick={() => {
                                setBottomTab('documents');
                                setSelectedQuery(null);
                            }}
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
                        <ChatInterface
                            selectedQuery={selectedQuery}
                            selectedDocument={selectedDocument}
                            systemMessage={!systemMessageShown ? chatSystemMessage : ''}
                            onSystemMessageShown={() => setSystemMessageShown(true)}
                        />
                    </div>
                </div>
            </div>
            {/* Bottom Tabs */}
            <div className="main-footer">
                <div className="footer-info">
                    <p>Powered by Gemini AI & RAG Technology</p>
                </div>
            </div>

            {/* Delete Confirmation Popup */}
            {deleteToConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Delete Document</h3>
                        <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
                            Are you sure you want to delete "<strong>{deleteToConfirm.originalName}</strong>"? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setDeleteToConfirm(null)}
                                style={{
                                    padding: '0.5rem 1.5rem',
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    color: '#6b7280',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                No
                            </button>
                            <button
                                onClick={() => handleDeleteDocument(deleteToConfirm.docId)}
                                style={{
                                    padding: '0.5rem 1.5rem',
                                    border: 'none',
                                    background: '#ef4444',
                                    color: 'white',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainPage;