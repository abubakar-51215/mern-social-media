import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { getUser } from '../utils/auth';
import API from '../api';
import Sidebar from '../components/Sidebar';
import './CreatePost.css';

const CreatePost = () => {
    const [content, setContent] = useState('');
    const [imagePreview, setImagePreview] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const history = useHistory();

    useEffect(() => {
        const userData = getUser();
        if (userData) {
            setUser(userData);
        }
    }, []);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            alert('You can upload maximum 5 images');
            return;
        }

        setSelectedFiles(files);

        // Generate previews
        const previews = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                previews.push(reader.result);
                if (previews.length === files.length) {
                    setImagePreview(previews);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveImage = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        const newPreviews = imagePreview.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        setImagePreview(newPreviews);
        
        if (newFiles.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!content.trim() && selectedFiles.length === 0) {
            alert('Please write something or add media');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('content', content.trim() || ' ');
            
            // Append all selected images
            selectedFiles.forEach((file) => {
                formData.append('images', file);
            });

            await API.post('/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            history.push('/dashboard');
        } catch (error) {
            console.error('Error creating post:', error);
            alert(error.response?.data?.message || 'Failed to create post');
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="create-post-page">
            <Sidebar />
            <div className="create-post-container">
                <div className="create-post-header">
                    <h1>Create Post</h1>
                    <p className="create-post-subtitle">Share your thoughts with the world</p>
                </div>

                <div className="create-post-card">
                    <div className="post-author">
                        <div className="author-avatar">
                            {user.name ? user.name.substring(0, 2).toUpperCase() : 'AA'}
                        </div>
                        <div className="author-info">
                            <div className="author-name">{user.name || 'User'}</div>
                            <div className="author-username">@{user.email ? user.email.split('@')[0] : 'user'}</div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <textarea
                            className="post-textarea"
                            placeholder="What's happening?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                        />

                        {imagePreview.length > 0 && (
                            <div className="image-preview-grid">
                                {imagePreview.map((preview, index) => (
                                    <div key={index} className="image-preview-item">
                                        <img src={preview} alt={`Preview ${index + 1}`} />
                                        <button 
                                            type="button" 
                                            className="remove-image-btn"
                                            onClick={() => handleRemoveImage(index)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="post-actions">
                            <div className="post-tools">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    multiple
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    className="tool-btn"
                                    onClick={() => fileInputRef.current.click()}
                                    title="Add images (max 5)"
                                >
                                    🖼️ {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                                </button>
                            </div>

                            <button 
                                type="submit" 
                                className="publish-btn"
                                disabled={isSubmitting || !content.trim()}
                            >
                                {isSubmitting ? 'Uploading...' : 'Publish Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;