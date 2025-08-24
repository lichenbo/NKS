// js/chatbot.js

/**
 * NKS Chatbot System - AI-powered assistant for "A New Kind of Science"
 * Provides intelligent question-answering using RAG model API integration
 * Supports trilingual UI (EN/ZH/JA) with persistent chat history
 * 
 * Key Features:
 * - RAG model integration for book content queries
 * - Responsive UI: desktop input bar, mobile floating button
 * - Persistent chat history with localStorage
 * - Error handling with user-friendly messages
 * - Dynamic positioning aligned with annotations column
 * 
 * Time Complexity: O(n) for chat history operations where n is message count
 * Space Complexity: O(h) where h is chat history size in localStorage
 */

window.APP = window.APP || {};

(function(APP) {
    'use strict';

    /**
     * NKS Chatbot class providing complete AI assistant functionality
     * Integrates with RAG model API to answer questions about "A New Kind of Science"
     * Manages UI state, chat history, and responsive behavior
     * 
     * @class NKSChatbot
     */
    class NKSChatbot {
        /**
         * Initialize chatbot with API configuration and UI setup
         * Sets up DOM elements, event listeners, and loads chat history
         * 
         * Time Complexity: O(h) where h is stored chat history size
         * Space Complexity: O(1) for instance properties
         */
        constructor() {
            this.apiUrl = "https://nks-746942233281.us-west1.run.app";
            this.isExpanded = false;
            this.isTyping = false;
            this.messageHistory = [];
            this.storageKey = 'nks-chat-history';
            
            this.initializeElements();
            this.bindEvents();
            this.loadChatHistory();
        }
        
        /**
         * Initialize DOM element references for chatbot UI components
         * Caches all necessary DOM elements and tracks mobile state
         * 
         * Time Complexity: O(1)
         * @returns {void}
         * @private
         */
        initializeElements() {
            // Main container
            this.chatContainer = document.getElementById('nks-chat');
            
            // Mobile round button
            this.mobileButton = document.getElementById('mobile-chat-button');
            
            // Collapsed state elements
            this.inputBar = document.getElementById('chat-input-bar');
            this.quickInput = document.getElementById('chat-quick-input');
            this.quickSendButton = document.getElementById('chat-quick-send');
            
            // Track mobile state
            this.isMobile = window.innerWidth <= 768;
            
            // Expanded state elements
            this.conversation = document.getElementById('chat-conversation');
            this.minimizeButton = document.getElementById('chat-minimize');
            this.messagesContainer = document.getElementById('chat-messages');
            this.inputField = document.getElementById('chat-input');
            this.sendButton = document.getElementById('chat-send');
            this.typingIndicator = document.getElementById('chat-typing');
        }
        
        /**
         * Bind all event listeners for chatbot interactions
         * Sets up mobile/desktop events, language changes, and resize handling
         * 
         * Time Complexity: O(1)
         * @returns {void}
         * @private
         */
        bindEvents() {
            // Mobile round button click
            if (this.mobileButton) {
                this.mobileButton.addEventListener('click', () => this.handleMobileButtonClick());
            }
            
            // Quick input events (collapsed state)
            this.quickSendButton.addEventListener('click', () => this.sendQuickMessage());
            this.quickInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendQuickMessage();
                }
            });
            
            // Click on quick input field - open conversation if there's existing history
            this.quickInput.addEventListener('click', () => {
                if (this.messageHistory.length > 0 && !this.isExpanded) {
                    this.expandChat();
                }
            });
            
            // Full chat events (expanded state)
            this.sendButton.addEventListener('click', () => this.sendMessage());
            this.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Minimize button
            this.minimizeButton.addEventListener('click', () => this.minimizeChat());
            
            // Chat can only be closed via the minimize button
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.isMobile = window.innerWidth <= 768;
            });
            
            // Update placeholder text when language changes
            document.addEventListener('languageChanged', () => this.updateLanguageElements());
        }
        
        /**
         * Handle mobile button click to expand chat interface
         * Mobile-specific behavior for opening conversation view
         * 
         * @returns {void}
         * @public
         */
        handleMobileButtonClick() {
            if (this.isMobile) {
                // On mobile: always open the conversation view
                // If there's history, user will see it; if not, they'll see empty state
                this.expandChat();
            }
        }
        
        /**
         * Minimize chat interface with mobile/desktop specific behavior
         * Returns to appropriate collapsed state based on device type
         * 
         * @returns {void}
         * @public
         */
        minimizeChat() {
            if (this.isMobile) {
                // On mobile: return to round button state
                this.isExpanded = false;
                this.conversation.classList.add('hidden');
            } else {
                // Desktop behavior unchanged
                this.isExpanded = false;
                this.conversation.classList.add('hidden');
            }
        }
        
        /**
         * Send message from quick input field (collapsed state)
         * Expands to conversation view and processes the message
         * 
         * @async
         * @returns {Promise<void>}
         * @public
         */
        async sendQuickMessage() {
            const message = this.quickInput.value.trim();
            if (!message || this.isTyping) return;
            
            // Clear quick input
            this.quickInput.value = '';
            
            // Expand to conversation view
            this.expandChat();
            
            // Add user message and get bot response
            this.addMessage('user', message);
            await this.getBotResponse(message);
        }
        
        /**
         * Send message from main input field (expanded state)
         * Processes message and gets bot response
         * 
         * @async
         * @returns {Promise<void>}
         * @public
         */
        async sendMessage() {
            const message = this.inputField.value.trim();
            if (!message || this.isTyping) return;
            
            // Clear input
            this.inputField.value = '';
            
            // Add user message and get bot response
            this.addMessage('user', message);
            await this.getBotResponse(message);
        }
        
        /**
         * Expand chat interface to full conversation view
         * Shows conversation history and focuses input field
         * 
         * @returns {void}
         * @public
         */
        expandChat() {
            this.isExpanded = true;
            this.inputBar.style.display = 'none';
            this.conversation.classList.remove('hidden');
            
            // On mobile, move to body and ensure full-screen positioning
            if (this.isMobile) {
                document.body.appendChild(this.conversation);
                this.conversation.style.position = 'fixed';
                this.conversation.style.top = '0';
                this.conversation.style.left = '0';
                this.conversation.style.right = '0';
                this.conversation.style.bottom = '0';
                this.conversation.style.width = '100vw';
                this.conversation.style.height = '100vh';
                this.conversation.style.zIndex = '9999';
            }
            
            // Focus on the main input field
            setTimeout(() => {
                this.inputField.focus();
                this.scrollToBottom();
            }, 300);
        }
        
        /**
         * Minimize chat to collapsed input bar state (desktop)
         * Returns to single-line input mode and focuses quick input
         * 
         * @returns {void}
         * @public
         */
        minimizeChat() {
            this.isExpanded = false;
            this.conversation.classList.add('hidden');
            this.inputBar.style.display = 'flex';
            
            // Clear the quick input when minimizing
            setTimeout(() => {
                this.quickInput.focus();
            }, 300);
        }
        
        /**
         * Get bot response from RAG API with comprehensive error handling
         * Shows typing indicator during API call and handles various error conditions
         * 
         * @async
         * @param {string} message - User's message to send to API
         * @returns {Promise<void>}
         * @public
         */
        async getBotResponse(message) {
            // Show typing indicator
            this.showTypingIndicator();
            
            try {
                // Call RAG API
                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt: message })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // API returns pure text, so get it as text instead of JSON
                const botResponse = await response.text();
                console.log('🤖 API Response received:', botResponse);
                
                // Hide typing indicator and add bot response
                this.hideTypingIndicator();
                this.addMessage('bot', botResponse);
                
            } catch (error) {
                console.error('Chatbot API error:', error);
                
                // Hide typing indicator and show error message
                this.hideTypingIndicator();
                
                let errorMessage;
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    errorMessage = 'I\'m having trouble connecting to my knowledge base. Please check your internet connection and try again.';
                } else if (error.message.includes('HTTP 429')) {
                    errorMessage = 'I\'m receiving too many requests right now. Please wait a moment and try again.';
                } else if (error.message.includes('HTTP 5')) {
                    errorMessage = 'My knowledge service is temporarily unavailable. Please try again in a few minutes.';
                } else {
                    errorMessage = 'I encountered an unexpected error. Please try asking your question in a different way.';
                }
                
                this.addMessage('bot', errorMessage, true);
            }
        }
        
        /**
         * Add message to chat history and UI
         * Creates message UI element and stores in history with persistence
         * 
         * @param {string} type - Message type ('user' or 'bot')
         * @param {string} content - Message content text
         * @param {boolean} [isError=false] - Whether message is an error message
         * @returns {void}
         * @public
         */
        addMessage(type, content, isError = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}-message${isError ? ' error-message' : ''}`;
            
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'message-avatar';
            avatarDiv.textContent = type === 'user' ? '👤' : '🤖';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            const contentP = document.createElement('p');
            contentP.textContent = content;
            
            contentDiv.appendChild(contentP);
            messageDiv.appendChild(avatarDiv);
            messageDiv.appendChild(contentDiv);
            
            this.messagesContainer.appendChild(messageDiv);
            
            // Store in history
            this.messageHistory.push({ type, content, isError });
            
            // Save to localStorage
            this.saveChatHistory();
            
            // Update UI state (might be first message)
            this.updateUIState();
            
            // Scroll to bottom
            this.scrollToBottom();
        }
        
        /**
         * Show typing indicator during bot response generation
         * @returns {void}
         * @private
         */
        showTypingIndicator() {
            this.isTyping = true;
            if (this.typingIndicator) {
                this.typingIndicator.classList.remove('hidden');
            }
            this.scrollToBottom();
        }
        
        /**
         * Hide typing indicator after bot response
         * @returns {void}
         * @private
         */
        hideTypingIndicator() {
            this.isTyping = false;
            if (this.typingIndicator) {
                this.typingIndicator.classList.add('hidden');
            }
        }
        
        /**
         * Scroll chat messages to bottom
         * @returns {void}
         * @private
         */
        scrollToBottom() {
            setTimeout(() => {
                if (this.messagesContainer) {
                    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
                }
            }, 50);
        }
        
        /**
         * Update UI elements when language changes
         * Updates placeholder text and translatable elements
         * 
         * @returns {void}
         * @public
         */
        updateLanguageElements() {
            // Update placeholder texts
            const quickPlaceholder = this.getTranslatedText('chat-quick-placeholder', 'Ask about A New Kind of Science...');
            if (this.quickInput) {
                this.quickInput.placeholder = quickPlaceholder;
            }
            
            const inputPlaceholder = this.getTranslatedText('chat-input-placeholder', 'Continue the conversation...');
            if (this.inputField) {
                this.inputField.placeholder = inputPlaceholder;
            }
            
            // Update other translatable elements
            const translatableElements = this.chatContainer.querySelectorAll('[data-i18n]');
            translatableElements.forEach(element => {
                const key = element.getAttribute('data-i18n');
                const translation = this.getTranslatedText(key);
                if (translation) {
                    element.textContent = translation;
                }
            });
            
            // Update placeholder attributes
            const placeholderElements = this.chatContainer.querySelectorAll('[data-i18n-placeholder]');
            placeholderElements.forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                const translation = this.getTranslatedText(key);
                if (translation) {
                    element.placeholder = translation;
                }
            });
        }
        
        /**
         * Get translated text for current language
         * @param {string} key - Translation key
         * @param {string} [fallback=''] - Fallback text if translation not found
         * @returns {string} Translated text or fallback
         * @private
         */
        getTranslatedText(key, fallback = '') {
            if (window.translations && window.currentLanguage && window.translations[window.currentLanguage] && window.translations[window.currentLanguage][key]) {
                return window.translations[window.currentLanguage][key];
            }
            return fallback;
        }
        
        // --- localStorage Methods for Persistent Chat History ---
        
        /**
         * Save chat history to localStorage with versioning
         * Includes timestamp for expiration handling
         * 
         * Time Complexity: O(h) where h is history size
         * @returns {void}
         * @public
         */
        saveChatHistory() {
            try {
                const historyData = {
                    messages: this.messageHistory,
                    timestamp: Date.now(),
                    version: '1.0' // For future compatibility
                };
                localStorage.setItem(this.storageKey, JSON.stringify(historyData));
                console.log('💾 Chat history saved to localStorage');
            } catch (error) {
                console.warn('⚠️ Failed to save chat history:', error);
            }
        }
        
        /**
         * Load chat history from localStorage with validation and expiration
         * Handles data migration and automatic cleanup of old history
         * 
         * Time Complexity: O(h) where h is stored history size
         * @returns {void}
         * @public
         */
        loadChatHistory() {
            try {
                const storedData = localStorage.getItem(this.storageKey);
                if (!storedData) {
                    console.log('📭 No chat history found in localStorage');
                    return;
                }
                
                const historyData = JSON.parse(storedData);
                
                // Validate data structure
                if (!historyData.messages || !Array.isArray(historyData.messages)) {
                    console.warn('⚠️ Invalid chat history format, clearing...');
                    this.clearChatHistory();
                    return;
                }
                
                // Check if history is too old (optional: clear after 30 days)
                const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                if (historyData.timestamp && historyData.timestamp < thirtyDaysAgo) {
                    console.log('🗓️ Chat history expired, clearing...');
                    this.clearChatHistory();
                    return;
                }
                
                this.messageHistory = historyData.messages;
                console.log(`📚 Loaded ${this.messageHistory.length} messages from chat history`);
                
                // Restore messages to UI if there are any
                if (this.messageHistory.length > 0) {
                    this.restoreMessagesToUI();
                    this.updateUIState();
                }
                
            } catch (error) {
                console.warn('⚠️ Failed to load chat history:', error);
                this.clearChatHistory();
            }
        }
        
        /**
         * Restore saved messages to UI without duplicating in history
         * Used during initialization to display previous conversations
         * 
         * Time Complexity: O(h) where h is message count
         * @returns {void}
         * @private
         */
        restoreMessagesToUI() {
            // Clear existing messages in UI
            if (this.messagesContainer) {
                this.messagesContainer.innerHTML = '';
            }
            
            // Restore each message to the UI
            this.messageHistory.forEach(({ type, content, isError }) => {
                this.displayMessageInUI(type, content, isError);
            });
            
            console.log('🔄 Chat history restored to UI');
        }
        
        /**
         * Display message in UI without storing in history
         * Helper method for restoring saved messages
         * 
         * @param {string} type - Message type ('user' or 'bot')
         * @param {string} content - Message content
         * @param {boolean} [isError=false] - Whether message is an error
         * @returns {void}
         * @private
         */
        displayMessageInUI(type, content, isError = false) {
            if (!this.messagesContainer) return;
            
            // Create message element (same as addMessage but without storing to history)
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}-message${isError ? ' error' : ''}`;
            
            // Avatar
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'message-avatar';
            avatarDiv.textContent = type === 'user' ? '👤' : '🤖';
            
            // Content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = content; // Use innerHTML to preserve formatting
            
            messageDiv.appendChild(avatarDiv);
            messageDiv.appendChild(contentDiv);
            this.messagesContainer.appendChild(messageDiv);
        }
        
        /**
         * Clear chat history from localStorage and UI
         * @returns {void}
         * @public
         */
        clearChatHistory() {
            try {
                localStorage.removeItem(this.storageKey);
                this.messageHistory = [];
                if (this.messagesContainer) {
                    this.messagesContainer.innerHTML = '';
                }
                console.log('🗑️ Chat history cleared');
            } catch (error) {
                console.warn('⚠️ Failed to clear chat history:', error);
            }
        }
        
        /**
         * Public method to clear history with confirmation
         * Can be called from console or UI
         * 
         * @returns {void}
         * @public
         */
        clearHistory() {
            if (confirm('Are you sure you want to clear your chat history? This cannot be undone.')) {
                this.clearChatHistory();
                this.updateUIState();
            }
        }
        
        /**
         * Update UI state based on chat history presence
         * Updates mobile button, placeholders, and other state-dependent elements
         * 
         * @returns {void}
         * @public
         */
        updateUIState() {
            const hasHistory = this.messageHistory.length > 0;
            
            // Update mobile button appearance when there's history
            if (this.isMobile && this.mobileButton) {
                if (hasHistory) {
                    this.mobileButton.classList.add('has-history');
                    this.mobileButton.title = 'View chat history';
                } else {
                    this.mobileButton.classList.remove('has-history');
                    this.mobileButton.title = 'Start chatting';
                }
            }
            
            // Update quick input placeholder for desktop
            if (!this.isMobile && this.quickInput) {
                const placeholderKey = hasHistory ? 'chat-quick-placeholder-history' : 'chat-quick-placeholder';
                const fallbackText = hasHistory ? '💬 Continue conversation...' : '💡 Ask about A New Kind of Science...';
                
                if (window.translations && window.currentLanguage && window.translations[window.currentLanguage] && window.translations[window.currentLanguage][placeholderKey]) {
                    this.quickInput.placeholder = window.translations[window.currentLanguage][placeholderKey];
                } else {
                    this.quickInput.placeholder = fallbackText;
                }
            }
        }
    }

    // --- Positioning Functions ---

    // Chat positioning now handled by pure CSS - no JavaScript needed!

    /**
     * Initialize chatbot system
     * Creates NKSChatbot instance with pure CSS positioning
     * 
     * Time Complexity: O(h) where h is chat history size
     * Space Complexity: O(1)
     * 
     * @function initChatbot
     * @returns {void}
     */
    function initChatbot() {
        console.log('🤖 Initializing NKS Chatbot...');
        window.nksChatbot = new NKSChatbot();
        console.log('✅ NKS Chatbot initialized');
        
        // No positioning needed - handled by pure CSS!
    }

    // Expose to APP namespace
    APP.Chatbot = {
        NKSChatbot,
        initChatbot
    };

})(window.APP);