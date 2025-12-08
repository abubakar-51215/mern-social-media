import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { createStory } from '../api';
import MusicPicker from '../components/MusicPicker';
import './CreateStory.css';

const CreateStory = () => {
    const history = useHistory();
    const [storyType, setStoryType] = useState('text'); // 'text', 'media', 'question', 'poll'
    const [textContent, setTextContent] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('#6366f1');
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaFile, setMediaFile] = useState(null);
    const fileInputRef = useRef(null);
    
    // Music
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [selectedMusic, setSelectedMusic] = useState(null);
    
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

    const handleMusicSelect = (music) => {
        setSelectedMusic(music);
        setShowMusicPicker(false);
    };

    const handleRemoveMusic = () => {
        setSelectedMusic(null);
    };

    // Helper function to convert duration from MM:SS to seconds
    const parseDuration = (duration) => {
        if (typeof duration === 'number') return duration;
        if (!duration) return 0;
        
        // If it's in MM:SS format
        if (typeof duration === 'string' && duration.includes(':')) {
            const parts = duration.split(':');
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            return minutes * 60 + seconds;
        }
        
        return parseInt(duration) || 0;
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
                alert('Please enter a question and at least 2 options');
                return;
            }

            // Prepare story data based on type
            let requestData;
            console.log('Creating story with music:', selectedMusic);
            
            if (storyType === 'media' && mediaFile) {
                // Use FormData for media upload
                requestData = new FormData();
                requestData.append('type', 'image');
                requestData.append('media', mediaFile);
                
                // Add music if selected
                if (selectedMusic) {
                    requestData.append('music', JSON.stringify({
                        trackName: selectedMusic.title || selectedMusic.trackName,
                        artistName: selectedMusic.artist || selectedMusic.artistName,
                        previewUrl: selectedMusic.previewUrl,
                        albumArt: selectedMusic.cover || selectedMusic.albumArt,
                        duration: parseDuration(selectedMusic.duration)
                    }));
                }
            } else {
                // Use JSON for text, question, and poll stories
                requestData = {
                    type: storyType
                };

                // Add music if selected
                if (selectedMusic && selectedMusic.title && selectedMusic.artist) {
                    requestData.music = {
                        trackName: selectedMusic.title || selectedMusic.trackName || '',
                        artistName: selectedMusic.artist || selectedMusic.artistName || '',
                        previewUrl: selectedMusic.previewUrl || '',
                        albumArt: selectedMusic.cover || selectedMusic.albumArt || '',
                        duration: parseDuration(selectedMusic.duration)
                    };
                }

                if (storyType === 'text') {
                    requestData.text = textContent;
                    requestData.backgroundColor = backgroundColor;
                } else if (storyType === 'question') {
                    requestData.question = { text: questionText };
                    requestData.backgroundColor = backgroundColor;
                } else if (storyType === 'poll') {
                    const filteredOptions = pollOptions.filter(o => o.trim());
                    requestData.poll = {
                        question: pollQuestion,
                        options: filteredOptions
                    };
                    requestData.backgroundColor = '#000000';
                }
            }

            // Send to backend
            await createStory(requestData);

            // Store success notification flag
            sessionStorage.setItem('storyCreated', 'true');

            // Navigate back to dashboard
            history.push('/dashboard');
        } catch (error) {
            console.error('Error creating story:', error);
            const errorMessage = error.response?.data?.message 
                || error.message 
                || 'Failed to create story. Please try again.';
            alert(errorMessage);
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
                {/* Story Preview */}
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
                        {selectedMusic && (
                            <div className="story-music-badge instagram-style">
                                <div className="music-album-art">
                                    {selectedMusic.cover ? (
                                        <img src={selectedMusic.cover} alt="Album" />
                                    ) : (
                                        <div className="music-icon-placeholder">🎵</div>
                                    )}
                                </div>
                                <div className="music-details">
                                    <div className="music-track">{selectedMusic.title || selectedMusic.trackName || 'Unknown'}</div>
                                    <div className="music-artist">{selectedMusic.artist || selectedMusic.artistName || 'Unknown Artist'}</div>
                                </div>
                                <button className="remove-music" onClick={handleRemoveMusic}>✕</button>
                            </div>
                        )}
                    </div>
                )}

                {storyType === 'media' && (
                    <div className="story-canvas media-canvas">
                        {mediaPreview ? (
                            <>
                                <img src={mediaPreview} alt="Story preview" className="story-media-preview" />
                                {selectedMusic && (
                                    <div className="story-music-badge instagram-style">
                                        <div className="music-album-art">
                                            {selectedMusic.cover ? (
                                                <img src={selectedMusic.cover} alt="Album" />
                                            ) : (
                                                <div className="music-icon-placeholder">🎵</div>
                                            )}
                                        </div>
                                        <div className="music-details">
                                            <div className="music-track">{selectedMusic.title || selectedMusic.trackName || 'Unknown'}</div>
                                            <div className="music-artist">{selectedMusic.artist || selectedMusic.artistName || 'Unknown Artist'}</div>
                                        </div>
                                        <button className="remove-music" onClick={handleRemoveMusic}>✕</button>
                                    </div>
                                )}
                            </>
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

                {/* Color Picker for Text and Question */}
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

                {/* Poll Edit Section */}
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

                {/* Music Tools */}
                <div className="story-tools">
                    <button 
                        className="story-tool-btn"
                        onClick={() => setShowMusicPicker(true)}
                        title="Add music"
                    >
                        🎵 Music
                    </button>
                </div>

                {/* Story Type Selector */}
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

                {/* Create Button */}
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

            {/* Music Picker Modal */}
            {showMusicPicker && (
                <MusicPicker 
                    onSelect={handleMusicSelect}
                    onClose={() => setShowMusicPicker(false)}
                />
            )}
        </div>
    );
};

export default CreateStory;
