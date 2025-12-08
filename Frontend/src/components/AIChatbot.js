import React, { useState, useRef, useEffect } from 'react';
import './AIChatbot.css';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const messagesEndRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  ];

  // FAQ responses
  const faqResponses = {
    'how to create post': 'To create a post, click the "Create Post" button in the sidebar or go to the Create Post page. You can add text, images, and even music!',
    'how to add friends': 'Go to the Discover page to find new people, or visit someone\'s profile and click the "Follow" button to send a friend request.',
    'change password': 'Go to Settings > Security and you\'ll find the option to change your password.',
    'delete account': 'To delete your account, go to Settings > Manage Account. Please note this action is permanent.',
    'report user': 'Click on any post or profile, then click the three dots menu and select "Report". We take reports seriously and will review them promptly.',
    'dark mode': 'You can enable dark mode by clicking your profile avatar at the bottom of the sidebar, then toggle the "Dark Mode" switch.',
    'notifications': 'Manage your notifications in Settings > Notifications. You can customize which alerts you receive.',
    'privacy': 'Adjust your privacy settings in Settings > Privacy. You can control who sees your posts and profile information.',
    'qr code': 'Access your profile QR code by clicking your avatar in the sidebar and selecting "My QR Code". Others can scan it to quickly follow you!',
    'music': 'You can add music to your posts! When creating a post, look for the music icon to browse and add songs.',
  };

  const quickReplies = [
    'How to create a post?',
    'How to add friends?',
    'Enable dark mode',
    'Report a problem',
    'Privacy settings',
    'Delete my account'
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateBotResponse = (userMessage) => {
    const lowercaseMessage = userMessage.toLowerCase();

    // Check FAQ
    for (const [keyword, response] of Object.entries(faqResponses)) {
      if (lowercaseMessage.includes(keyword)) {
        return response;
      }
    }

    // Smart replies based on keywords
    if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi')) {
      return 'Hello! How can I assist you today?';
    }
    if (lowercaseMessage.includes('help')) {
      return 'I can help you with:\n• Creating posts and stories\n• Managing your account\n• Privacy and security\n• Using features\n• Troubleshooting\n\nWhat would you like to know?';
    }
    if (lowercaseMessage.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    }
    if (lowercaseMessage.includes('bye')) {
      return 'Goodbye! Feel free to reach out anytime you need help!';
    }

    // Default response
    return 'I understand you\'re asking about "' + userMessage + '". Let me connect you with our support team for detailed assistance. You can also check our FAQ section or try rephrasing your question.';
  };

  const translateText = async (text, targetLang) => {
    // In production, use real translation API (Google Translate, DeepL, etc.)
    // For now, return mock translation
    const translations = {
      'es': text + ' (traducido al español)',
      'fr': text + ' (traduit en français)',
      'de': text + ' (ins Deutsche übersetzt)',
      'ar': text + ' (مترجم إلى العربية)',
    };
    return targetLang !== 'en' ? translations[targetLang] || text : text;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(async () => {
      const botResponseText = generateBotResponse(inputText);
      const translatedResponse = await translateText(botResponseText, selectedLanguage);

      const botMessage = {
        id: messages.length + 2,
        text: translatedResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickReply = (reply) => {
    setInputText(reply);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      {!isOpen && (
        <button
          className="chatbot-float-btn"
          onClick={() => setIsOpen(true)}
          title="Open AI Assistant"
        >
          🤖
        </button>
      )}

      {/* Chatbot Modal */}
      {isOpen && (
        <div className="chatbot-overlay">
          <div className="chatbot-container">
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="bot-avatar">🤖</div>
            <div>
              <h3>AI Assistant</h3>
              <span className="bot-status">● Online</span>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="language-selector"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <button
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'bot' ? 'bot-message' : 'user-message'}`}
            >
              {message.sender === 'bot' && <div className="message-avatar">🤖</div>}
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message bot-message">
              <div className="message-avatar">🤖</div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-quick-replies">
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              className="quick-reply-btn"
              onClick={() => handleQuickReply(reply)}
            >
              {reply}
            </button>
          ))}
        </div>

        <div className="chatbot-input-area">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="chatbot-input"
          />
          <button
            className="chatbot-send-btn"
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
          >
            ➤
          </button>
        </div>
      </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
