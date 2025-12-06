import React from 'react';
import MessageList from '../components/MessageList';
import './Chat.css';

const Chat = () => {
    return (
        <div className="chat-container">
            <h2>Chat</h2>
            <MessageList />
            <div className="chat-input">
                <input type="text" placeholder="Type a message..." />
                <button>Send</button>
            </div>
        </div>
    );
};

export default Chat;