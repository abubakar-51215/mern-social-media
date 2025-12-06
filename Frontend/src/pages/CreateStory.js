import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { createStory } from '../api';
import './CreateStory.css';

const CreateStory = () => {
    const history = useHistory();
    const [storyType, setStoryType] = useState('text'); // 'text', 'media', 'question', 'poll'
    const [textContent, setTextContent] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('#6366f1');
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaFile, setMediaFile] = useState(null);
    const fileInputRef = useRef(null);
    
    // Q&A Question
    const [questionText, setQuestionText] = useState('');
    
    // Poll
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

    const backgroundColors = [
        '#6366f1', // Blue
        '#a855f7', // Purple
        '#ec4899', // Pink
        '#ef4444', // Red
        '#f59e0b', // Orange
        '#14b8a6'  // Teal
    ];

    const handleMediaUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMediaFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        try {
            // Validate content based on type
            if (storyType === 'text' && !textContent.trim()) {
                alert('Please enter some text for your story');
                return;
            }
            if (storyType === 'media' && !mediaFile) {
                alert('Please select an image for your story');
                return;
            }
            if (storyType === 'question' && !questionText.trim()) {
                alert('Please enter a question');
                return;
            }
            if (storyType === 'poll' && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) {
                alert('Please enter a poll question and at least 2 options');
                return;
            }

            // Prepare story data
            const storyData = {
                type: storyType === 'media' ? 'image' : storyType
            };

            if (storyType === 'text') {
                storyData.text = textContent;
                storyData.backgroundColor = backgroundColor;
            } else if (storyType === 'media') {
                storyData.content = { mediaUrl: mediaPreview };
            } else if (storyType === 'question') {
                storyData.question = { text: questionText };
                storyData.backgroundColor = backgroundColor;
            } else if (storyType === 'poll') {
                const filteredOptions = pollOptions.filter(o => o.trim());
                storyData.poll = {
                    question: pollQuestion,
                    options: filteredOptions
                };
                storyData.backgroundColor = '#000000';
            }

            // Send to backend
            await createStory(storyData);

            // Store success notification flag
            sessionStorage.setItem('storyCreated', 'true');

            // Navigate back to dashboard
            history.push('/dashboard');
        } catch (error) {
            console.error('Error creating story:', error);
            alert(error.response?.data?.message || 'Failed to create story');
        }
    };

    const handleAddPollOption = () => {
        if (pollOptions.length < 4) {
            setPollOptions([...pollOptions, '']);
        }
    };

    const handlePollOptionChange = (index, value) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    return (
        <div className="create-story-page">
            <div className="create-story-header">
                <button className="back-btn" onClick={() => history.goBack()}>
                    ←
                </button>
                <h1>Create Story</h1>
            </div>

            <div className="create-story-content">
                {storyType === 'text' && (
                    <div 
                        className="story-canvas" 
                        style={{ backgroundColor }}
                    >
                        <textarea
                            className="story-text-input"
                            placeholder="What's on your mind?"
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            maxLength={200}
                        />
                    </div>
                )}

                {storyType === 'media' && (
                    <div className="story-canvas media-canvas">
                        {mediaPreview ? (
                            <img src={mediaPreview} alt="Story preview" className="story-media-preview" />
                        ) : (
                            <div className="media-placeholder" onClick={() => fileInputRef.current?.click()}>
                                <span className="media-icon">📷</span>
                                <p>Click to select a photo</p>
                            </div>
                        )}
                    </div>
                )}

                {storyType === 'question' && (
                    <div 
                        className="story-canvas question-canvas" 
                        style={{ backgroundColor }}
                    >
                        <div className="question-container">
                            <span className="question-label">Ask me a question</span>
                            <input
                                type="text"
                                className="question-input"
                                placeholder="Type your question..."
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                maxLength={100}
                            />
                        </div>
                    </div>
                )}

                {storyType === 'poll' && (
                    <div 
                        className="story-canvas poll-canvas" 
                        style={{ backgroundColor: '#000000' }}
                    >
                        <div className="poll-preview-container">
                            <div className="poll-preview-box">
                                <div className="poll-preview-question">
                                    {pollQuestion || 'Ask a question...'}
                                </div>
                                <div className="poll-preview-options">
                                    {pollOptions.map((option, index) => (
                                        <div key={index} className="poll-preview-option">
                                            {option || `Option ${index + 1}`}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {storyType === 'poll' && (
                    <div className="poll-edit-section">
                        <input
                            type="text"
                            className="poll-question-input"
                            placeholder="Ask a question..."
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            maxLength={80}
                        />
                        <div className="poll-options-edit">
                            {pollOptions.map((option, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    className="poll-option-input"
                                    placeholder={`Option ${index + 1}`}
                                    value={option}
                                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                                    maxLength={30}
                                />
                            ))}
                            {pollOptions.length < 4 && (
                                <button className="add-option-btn" onClick={handleAddPollOption}>
                                    + Add another option...
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {(storyType === 'text' || storyType === 'question') && (
                    <div className="color-picker">
                        {backgroundColors.map((color) => (
                            <button
                                key={color}
                                className={`color-btn ${backgroundColor === color ? 'active' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setBackgroundColor(color)}
                            />
                        ))}
                    </div>
                )}

                <div className="story-type-selector">
                    <button 
                        className={`type-btn ${storyType === 'text' ? 'active' : ''}`}
                        onClick={() => setStoryType('text')}
                    >
                        <span className="type-icon">≡</span> Text
                    </button>
                    <button 
                        className={`type-btn ${storyType === 'media' ? 'active' : ''}`}
                        onClick={() => {
                            setStoryType('media');
                            if (!mediaPreview) {
                                fileInputRef.current?.click();
                            }
                        }}
                    >
                        <span className="type-icon">📷</span> Photo
                    </button>
                    <button 
                        className={`type-btn ${storyType === 'question' ? 'active' : ''}`}
                        onClick={() => setStoryType('question')}
                    >
                        <span className="type-icon">❓</span> Q&A
                    </button>
                    <button 
                        className={`type-btn ${storyType === 'poll' ? 'active' : ''}`}
                        onClick={() => setStoryType('poll')}
                    >
                        <span className="type-icon">📊</span> Poll
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaUpload}
                        style={{ display: 'none' }}
                    />
                </div>

                <button 
                    className="create-story-btn"
                    onClick={handleSubmit}
                    disabled={
                        (storyType === 'text' && !textContent.trim()) ||
                        (storyType === 'media' && !mediaFile) ||
                        (storyType === 'question' && !questionText.trim()) ||
                        (storyType === 'poll' && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2))
                    }
                >
                    ✨ Create Story
                </button>
            </div>
        </div>
    );
};

export default CreateStory;