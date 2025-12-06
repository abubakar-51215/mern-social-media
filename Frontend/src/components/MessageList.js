import React from 'react';
import ChatBubble from './ChatBubble';

const MessageList = ({ messages }) => {
    return (
        <div className="message-list">
            {messages.map((message, index) => (
                <ChatBubble key={index} message={message} />
            ))}
        </div>
    );
};

export default MessageList;