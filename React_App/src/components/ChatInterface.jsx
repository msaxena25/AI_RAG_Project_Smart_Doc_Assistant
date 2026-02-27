/**
 * ChatInterface Component
 * 
 * A modern chat interface for querying AI documents with:
 * - Real-time message display
 * - Auto-scroll functionality
 * - Loading states
 * - Error handling
 * - Responsive design
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, FileText } from 'lucide-react';
import { queryDocument } from '../services/api';
import './ChatInterface.css';

const ChatInterface = ({ selectedQuery }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI Document Assistant. You can ask me questions about any documents you\'ve uploaded, and I\'ll provide answers based on the content.',
      timestamp: new Date(),
      queryId: null
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (selectedQuery) {
      setMessages([
        {
          id: selectedQuery.queryId,
          type: 'user',
          content: selectedQuery.prompt,
          timestamp: new Date(selectedQuery.createdAt || Date.now()),
          queryId: selectedQuery.queryId
        },
        {
          id: selectedQuery.queryId + '-ai',
          type: 'ai',
          content: selectedQuery.answer,
          timestamp: new Date(selectedQuery.createdAt || Date.now()),
          queryId: selectedQuery.queryId,
          metadata: { cached: true }
        }
      ]);
      setInputValue('');
      setError(null);
    }
  }, [selectedQuery]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      queryId: null
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);


    try {
      // Call the query API
      const response = await queryDocument(userMessage.content);

      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.answer,
        timestamp: new Date(),
        queryId: response.queryId,
        metadata: response.metadata
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Query error:', err);

      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: err.message || 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
        queryId: null
      };

      setMessages(prev => [...prev, errorMessage]);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const isToday = timestamp.toDateString() === now.toDateString();

    if (isToday) {
      return timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return timestamp.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short'
      });
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: 'Chat cleared! How can I help you with your documents?',
        timestamp: new Date(),
        queryId: null
      }
    ]);
    setError(null);
  };

  return (
    <div className="chat-interface">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-icon">
            <Bot size={24} />
          </div>
          <div className="chat-header-text">
            <h2>AI Document Assistant</h2>
            <p className="chat-status">
              {isLoading ? 'Thinking...' : 'Ready to answer questions'}
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="clear-chat-btn"
          disabled={isLoading}
        >
          Clear Chat
        </button>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        <div className="messages-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.type}-message`}
            >
              <div className="message-avatar">
                {message.type === 'user' ? (
                  <User size={20} />
                ) : message.type === 'ai' ? (
                  <Bot size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
              </div>

              <div className="message-content">
                <div className="message-bubble">
                  <p>{message.content}</p>

                  {/* Show metadata for AI responses */}
                  {message.type === 'ai' && message.metadata?.cached && (
                    <div className="message-metadata">
                      <div className="metadata-item">
                        <FileText size={14} />
                        <span>
                          {'From cache'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <span className="message-timestamp">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="message ai-message loading-message">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="message-bubble loading">
                  <div className="typing-indicator">
                    <Loader2 size={16} className="loading-spinner" />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Display */}
      {/* {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )} */}

      {/* Input Form */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              className="chat-input"
              rows={1}
              disabled={isLoading}
              maxLength={1000}
            />

            <button
              type="submit"
              className="send-button"
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 size={20} className="loading-spinner" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>

          <div className="input-footer">
            <span className="char-count">
              {inputValue.length}/1000 characters
            </span>
            <span className="input-hint">
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;