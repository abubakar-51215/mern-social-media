import React from 'react';
import './ChatBubble.css'; // Assuming you have a CSS file for styling

const ChatBubble = ({ message, sender }) => {
    const isSender = sender === 'me'; // Adjust this logic based on your user identification

    return (
        <div className={`chat-bubble ${isSender ? 'sent' : 'received'}`}>
            <p>{message}</p>
        </div>
    );
};

export default ChatBubble;