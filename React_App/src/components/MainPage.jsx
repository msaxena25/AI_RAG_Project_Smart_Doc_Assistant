/**
 * MainPage Component
 * 
 * Main application page that combines document upload and chat interface
 * Allows users to upload documents and then chat with them
 */

import React, { useState } from 'react';
import DocumentUpload from './DocumentUpload';
import ChatInterface from './ChatInterface';
import { FileText, MessageCircle, Home } from 'lucide-react';
import './MainPage.css';

const MainPage = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [hasUploadedDoc, setHasUploadedDoc] = useState(false);

  // Handle successful document upload
  const handleDocumentUploaded = () => {
    setHasUploadedDoc(true);
    // Auto-switch to chat after successful upload
    setActiveTab('chat');
  };

  // Tab configuration
  const tabs = [
    {
      id: 'upload',
      label: 'Upload Documents',
      icon: FileText,
      component: <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />,
      description: 'Upload PDF or text documents to get started'
    },
    {
      id: 'chat',
      label: 'Chat with AI',
      icon: MessageCircle,
      component: <ChatInterface />,
      description: 'Ask questions about your uploaded documents',
      disabled: !hasUploadedDoc
    }
  ];

  return (
    <div className="main-page">
      {/* Navigation Header */}
      <div className="main-nav">
        <div className="nav-header">
          <div className="nav-title">
            <Home size={24} />
            <h1>AI Document Assistant</h1>
          </div>
          
          <div className="nav-subtitle">
            <p>Upload documents and chat with AI to get instant answers</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                className={`tab-button ${
                  activeTab === tab.id ? 'active' : ''
                } ${tab.disabled ? 'disabled' : ''}`}
                disabled={tab.disabled}
              >
                <Icon size={20} />
                <span className="tab-label">{tab.label}</span>
                {tab.disabled && (
                  <span className="disabled-badge">Upload first</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Description */}
        <div className="tab-description">
          <p>{tabs.find(tab => tab.id === activeTab)?.description}</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="main-content">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>

      {/* Status Footer */}
      <div className="main-footer">
        <div className="status-indicators">
          <div className={`status-item ${hasUploadedDoc ? 'active' : ''}`}>
            <div className="status-dot"></div>
            <span>Document {hasUploadedDoc ? 'Ready' : 'Needed'}</span>
          </div>
          
          <div className={`status-item ${activeTab === 'chat' ? 'active' : ''}`}>
            <div className="status-dot"></div>
            <span>Chat {activeTab === 'chat' ? 'Active' : 'Available'}</span>
          </div>
        </div>
        
        <div className="footer-info">
          <p>Powered by Gemini AI & RAG Technology</p>
        </div>
      </div>
    </div>
  );
};

export default MainPage;