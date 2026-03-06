/**
 * DocumentList Component
 * 
 * Displays list of uploaded documents with select and delete functionality
 */

import { Upload, CheckCircle, Trash2 } from 'lucide-react';
import './DocumentList.css';

const DocumentList = ({
    documentList,
    selectedDocument,
    onSelectDocument,
    onDeleteDocument,
    onUploadNew,
    deleteToConfirm,
    onDeleteConfirm
}) => {
    return (
        <>
            <div className="uploaded-document-view">
                <div>
                    <div className="doc-status">
                        <div className="doc-details">
                            {documentList.length > 0 ? (
                                <div className="document-list">
                                    {documentList.map((doc, index) => (
                                        <div
                                            key={doc.docId || index}
                                            className={`document-item${selectedDocument && selectedDocument.docId === doc.docId ? ' selected' : ''}`}
                                        >
                                            <div className="document-item-content" onClick={() => onSelectDocument(doc)}>
                                                <CheckCircle size={10} />
                                                <span>{doc.originalName}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteConfirm(doc);
                                                }}
                                                className="delete-btn"
                                                title="Delete document"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-state">No documents uploaded yet. First upload a document to get started.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="upload-new-section">
                    <button
                        type="button"
                        onClick={onUploadNew}
                        className="upload-new-btn"
                    >
                        <Upload size={16} />
                        Upload New Document
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Popup */}
            {deleteToConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-header">Delete Document</h3>
                        <p className="modal-text">
                            Are you sure you want to delete "<strong>{deleteToConfirm.originalName}</strong>"? This action cannot be undone.
                        </p>
                        <div className="modal-buttons">
                            <button
                                onClick={() => onDeleteConfirm(null)}
                                className="modal-btn modal-btn-cancel"
                            >
                                No
                            </button>
                            <button
                                onClick={() => onDeleteDocument(deleteToConfirm.docId)}
                                className="modal-btn modal-btn-delete"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DocumentList;
