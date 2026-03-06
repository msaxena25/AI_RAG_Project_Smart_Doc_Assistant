/**
 * MainPage Component
 * 
 * Main application page that combines document upload and chat interface
 * Allows users to upload documents and then chat with them
 */

import React, { useState, useEffect } from 'react';
import DocumentUpload from './DocumentUpload';
import ChatInterface from './ChatInterface';
import DocumentList from './DocumentList';
import { FileText, MessageCircle } from 'lucide-react';
import './MainPage.css';
import { documentAPI } from '../services/api';
import QueryList from './QueryList';

const MainPage = () => {
    const [showUploadForm, setShowUploadForm] = useState(true);
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
        setSelectedDocument(doc)
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
                                <DocumentList
                                    documentList={documentList}
                                    selectedDocument={selectedDocument}
                                    onSelectDocument={handleSelectDocument}
                                    onDeleteDocument={handleDeleteDocument}
                                    onUploadNew={handleUploadNew}
                                    deleteToConfirm={deleteToConfirm}
                                    onDeleteConfirm={setDeleteToConfirm}
                                />
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
        </div>
    );
};

export default MainPage;