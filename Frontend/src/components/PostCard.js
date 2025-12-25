import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useHistory } from 'react-router-dom';
import { toast } from './Toast';
import ReportModal from './ReportModal';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MessageIcon from '@mui/icons-material/Message';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import IosShareIcon from '@mui/icons-material/IosShare';
import './PostCard.css';

const PostCard = ({ post, currentUser, onUpdate, onDelete }) => {
    const [isLiked, setIsLiked] = useState(post.likes?.some(like => like._id === currentUser?._id) || false);
    const [likesCount, setLikesCount] = useState(post.likesCount || post.likes?.length || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(post.comments || []);
    const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);
    const [commentText, setCommentText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState({});
    const [currentUserProfilePic, setCurrentUserProfilePic] = useState(currentUser?.profilePicture);
    const emojiPickerRef = useRef(null);
    const history = useHistory();

    const emojiCategories = {
        'Smileys & people': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
        'Animals & nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '🌵', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀'],
        'Food & drink': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆'],
        'Activity': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎪'],
        'Travel & places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁'],
        'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶'],
        'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳'],
        'Flags': ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏴‍☠️', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇲', '🇧🇹', '🇧🇴', '🇧🇦', '🇧🇼', '🇧🇷', '🇮🇴', '🇻🇬', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇮🇨', '🇨🇻', '🇧🇶']
    };
    const [selectedCategory, setSelectedCategory] = useState('Smileys & people');
    const [emojiSearch, setEmojiSearch] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content || '');
    const [isSaved, setIsSaved] = useState(post.saves?.some(id => id === currentUser?._id || id._id === currentUser?._id) || false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [likesUsers, setLikesUsers] = useState([]);
    const [loadingLikes, setLoadingLikes] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const shareMenuRef = useRef(null);
    
    // Music player state
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const audioRef = useRef(null);
    const postRef = useRef(null);

    // Check if post ID is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    const isRealPost = isValidObjectId(post._id);

    const isOwner = currentUser?._id === post.user?._id || currentUser?.email === post.user?.email;
    
    // Use current user's profile picture if this is their post
    const displayProfilePicture = isOwner && currentUserProfilePic 
        ? currentUserProfilePic 
        : post.user.profilePicture;

    const getFilteredEmojis = () => {
        if (emojiSearch) {
            return Object.values(emojiCategories).flat().filter(emoji => emoji.includes(emojiSearch));
        }
        return emojiCategories[selectedCategory];
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
                setShowShareMenu(false);
            }
        };
        
        const handleProfileUpdate = (e) => {
            if (e.detail?.profilePicture) {
                setCurrentUserProfilePic(e.detail.profilePicture);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('profileUpdated', handleProfileUpdate);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, []);

    // Music playback functions
    const playMusic = React.useCallback(() => {
        const musicUrl = post.music?.previewUrl || post.music?.preview_url;
        
        if (!musicUrl) {
            return;
        }

        try {
            if (!audioRef.current) {
                audioRef.current = new Audio(musicUrl);
                audioRef.current.loop = true;
                audioRef.current.volume = 0.7; // Set volume to 70%
                
                audioRef.current.addEventListener('play', () => {
                    setIsMusicPlaying(true);
                });
                audioRef.current.addEventListener('pause', () => {
                    setIsMusicPlaying(false);
                });
                audioRef.current.addEventListener('error', (e) => {
                    const mediaError = e?.target?.error;
                    // Non-fatal: remote previews may fail to load/parse depending on browser/network.
                    console.warn('Audio error:', {
                        code: mediaError?.code,
                        message: mediaError?.message,
                        src: e?.target?.currentSrc
                    });
                });
            }
            
            audioRef.current.play()
                .then(() => {
                    setIsMusicPlaying(true);
                })
                .catch(err => {
                    // Auto-play is often blocked until the user interacts.
                    if (err?.name && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
                        return;
                    }
                    console.warn('Audio play() failed:', err?.message || err);
                });
        } catch (error) {
            console.error('Error in playMusic:', error);
        }
    }, [post.music]);

    const pauseMusic = React.useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsMusicPlaying(false);
        }
    }, []);

    const toggleMusic = React.useCallback(() => {
        if (isMusicPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    }, [isMusicPlaying, playMusic, pauseMusic]);

    // Auto-play music when post is in view (like Instagram)
    useEffect(() => {
        const musicUrl = post.music?.previewUrl || post.music?.preview_url;
        if (!musicUrl) {
            return;
        }

        const currentPost = postRef.current;
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        playMusic();
                    } else {
                        pauseMusic();
                    }
                });
            },
            { 
                threshold: 0.5,
                rootMargin: '0px'
            }
        );

        if (currentPost) {
            observer.observe(currentPost);
            console.log('Observer attached to post:', post._id);
        } else {
            console.log('postRef.current is null for post:', post._id);
        }

        return () => {
            if (currentPost) {
                observer.unobserve(currentPost);
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post.music, playMusic, pauseMusic]);

    // Fetch likes when modal opens
    const handleOpenLikesModal = async () => {
        setShowLikesModal(true);
        setLoadingLikes(true);
        
        // Fetch fresh likes data from backend for real posts
        if (isRealPost) {
            try {
                const { getPostLikes } = await import('../api');
                const response = await getPostLikes(post._id);
                console.log('Fetched likes response:', response);
                console.log('Fetched likes data:', response.data);
                
                // Ensure we have an array of user objects
                let likesData = Array.isArray(response.data) ? response.data : [];
                console.log('Processed likes data:', likesData);
                
                // If API returns empty but we know there are likes, create placeholder entries
                if (likesData.length === 0 && likesCount > 0) {
                    // Check if post.likes has any populated user objects
                    const populatedLikes = (post.likes || []).filter(like => 
                        like && typeof like === 'object' && (like.name || like.username || like.email)
                    );
                    if (populatedLikes.length > 0) {
                        likesData = populatedLikes;
                    } else {
                        // Create placeholder for unpopulated likes
                        likesData = [{ _id: 'unknown', name: `${likesCount} user${likesCount > 1 ? 's' : ''} liked this`, isPlaceholder: true }];
                    }
                }
                
                setLikesUsers(likesData);
            } catch (error) {
                console.error('Error fetching likes:', error);
                // Fallback to post.likes if it has populated data
                const fallbackLikes = (post.likes || []).filter(like => like && typeof like === 'object' && (like.name || like.username));
                if (fallbackLikes.length > 0) {
                    setLikesUsers(fallbackLikes);
                } else if (likesCount > 0) {
                    // Show placeholder if we know there are likes but can't get details
                    setLikesUsers([{ _id: 'unknown', name: `${likesCount} user${likesCount > 1 ? 's' : ''} liked this`, isPlaceholder: true }]);
                } else {
                    setLikesUsers([]);
                }
            } finally {
                setLoadingLikes(false);
            }
        } else {
            // For non-real posts, use existing data - filter for valid user objects
            const sampleLikes = (post.likes || []).filter(like => like && typeof like === 'object' && (like.name || like._id));
            setLikesUsers(sampleLikes);
            setLoadingLikes(false);
        }
    };

    const handleEmojiClick = (emoji) => {
        setCommentText(commentText + emoji);
        setShowEmojiPicker(false);
    };

    const handleLike = async () => {
        const newLikedState = !isLiked;
        const prevLikesCount = likesCount;
        
        // Optimistic update
        setIsLiked(newLikedState);
        setLikesCount(newLikedState ? likesCount + 1 : likesCount - 1);
        
        // Update post likes array with full user object
        if (newLikedState) {
            if (!post.likes.some(like => (like._id || like) === currentUser._id)) {
                post.likes.push({ 
                    _id: currentUser._id, 
                    name: currentUser.name, 
                    username: currentUser.username,
                    profilePicture: currentUser.profilePicture 
                });
            }
        } else {
            post.likes = post.likes.filter(like => (like._id || like) !== currentUser._id);
        }
        
        // Update local state immediately
        if (onUpdate) onUpdate(post);
        
        // Show toast notification
        if (newLikedState) {
            toast.success('Post liked', {
                position: "top-center",
                autoClose: 2000,
            });
        } else {
            toast.success('Post unliked', {
                position: "top-center",
                autoClose: 2000,
            });
        }
        
        // Only call API for real posts
        if (!isRealPost) return;
        
        try {
            const { likePost } = await import('../api');
            await likePost(post._id);
        } catch (error) {
            console.error('Error liking post:', error);
            // For hardcoded posts, just keep the local update
            // Show error only for privacy issues
            if (error.response?.status === 403) {
                toast.error(error.response?.data?.message || 'Cannot like this post. The account may be private.', {
                    position: "top-right",
                    autoClose: 3000,
                });
                // Revert on privacy error
                setIsLiked(!newLikedState);
                setLikesCount(prevLikesCount);
                if (newLikedState) {
                    post.likes = post.likes.filter(like => (like._id || like) !== currentUser._id);
                } else {
                    post.likes.push({ _id: currentUser._id });
                }
                if (onUpdate) onUpdate(post);
            }
            // For other errors (like hardcoded posts not in backend), keep the optimistic update
        }
    };

    const handleComment = async () => {
        if (commentText.trim()) {
            const newComment = {
                _id: Date.now().toString(),
                user: {
                    _id: currentUser._id,
                    name: currentUser.name,
                    profilePicture: currentUser.profilePicture
                },
                text: commentText.trim(),
                likes: [],
                replies: [],
                createdAt: new Date().toISOString()
            };
            
            // Optimistic update
            const updatedComments = [...comments, newComment];
            setComments(updatedComments);
            setCommentsCount(commentsCount + 1);
            
            // Update post object
            post.comments = updatedComments;
            
            setCommentText('');
            
            // Update local state immediately
            if (onUpdate) onUpdate(post);
            
            // Save to backend (for real posts)
            try {
                const { addComment } = await import('../api');
                const response = await addComment(post._id, commentText.trim());
                setComments(response.data.comments);
            } catch (error) {
                console.error('Error adding comment:', error);
                // For hardcoded posts, keep the local update
                // Only revert for real backend errors
                if (error.response?.status === 403 || error.response?.status === 404) {
                    toast.error(error.response?.data?.message || 'Failed to add comment');
                }
            }
        }
    };

    const handleLikeComment = async (commentId) => {
        try {
            const { likeComment } = await import('../api');
            const response = await likeComment(post._id, commentId);
            setComments(response.data.comments);
            toast.success('Comment liked');
        } catch (error) {
            console.error('Error liking comment:', error);
            // Optimistic update for local posts
            setComments(comments.map(comment => {
                if (comment._id === commentId) {
                    const isLiked = comment.likes?.includes(currentUser._id);
                    return {
                        ...comment,
                        likes: isLiked 
                            ? comment.likes.filter(id => id !== currentUser._id)
                            : [...(comment.likes || []), currentUser._id]
                    };
                }
                return comment;
            }));
        }
    };

    const handleReplyToComment = async (commentId) => {
        if (!replyText.trim()) return;
        
        try {
            const { replyToComment } = await import('../api');
            const response = await replyToComment(post._id, commentId, replyText.trim());
            setComments(response.data.comments);
            setReplyText('');
            setReplyingTo(null);
            toast.success('Reply added');
        } catch (error) {
            console.error('Error replying to comment:', error);
            toast.error('Failed to add reply');
        }
    };

    const handleDeleteComment = async (commentId) => {
        toast.confirm('Delete this comment?', {
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    const { deleteComment } = await import('../api');
                    const response = await deleteComment(post._id, commentId);
                    setComments(response.data.comments);
                    setCommentsCount(response.data.comments.length);
                    toast.success('Comment deleted');
                } catch (error) {
                    console.error('Error deleting comment:', error);
                    toast.error('Failed to delete comment');
                }
            }
        });
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return past.toLocaleDateString();
    };

    const handleCopyLink = () => {
        setShowShareMenu(false);
        const postUrl = `${window.location.origin}/post/${post._id}`;
        const shareText = `Check out this post by ${post.user.name}:\n\n${post.content}\n\n${postUrl}`;
        
        navigator.clipboard.writeText(shareText).then(() => {
            toast.success('Post link copied to clipboard!', {
                position: "top-right",
                autoClose: 2000,
            });
        }).catch(err => {
            toast.error('Failed to copy link', {
                position: "top-right",
                autoClose: 2000,
            });
        });
    };

    const handleShareToTwitter = () => {
        setShowShareMenu(false);
        const postUrl = `${window.location.origin}/post/${post._id}`;
        const text = encodeURIComponent(`${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}`);
        const url = encodeURIComponent(postUrl);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
    };

    const handleShareToFacebook = () => {
        setShowShareMenu(false);
        const postUrl = `${window.location.origin}/post/${post._id}`;
        const url = encodeURIComponent(postUrl);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420');
    };

    const handleShareToLinkedIn = () => {
        setShowShareMenu(false);
        const postUrl = `${window.location.origin}/post/${post._id}`;
        const url = encodeURIComponent(postUrl);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=550,height=420');
    };

    const handleShareToWhatsApp = () => {
        setShowShareMenu(false);
        const postUrl = `${window.location.origin}/post/${post._id}`;
        const text = encodeURIComponent(`Check out this post by ${post.user.name}:\n\n${post.content}\n\n${postUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleShareToInstagram = async () => {
        setShowShareMenu(false);
        const postUrl = `${window.location.origin}/post/${post._id}`;
        const shareText = `Check out this post by ${post.user.name}:\n\n${post.content}\n\n${postUrl}`;
        
        try {
            await navigator.clipboard.writeText(shareText);
            toast.success('Content copied! Open Instagram to share.', {
                position: "top-right",
                autoClose: 3000,
            });
            setTimeout(() => {
                window.open('https://www.instagram.com/', '_blank');
            }, 500);
        } catch (err) {
            toast.error('Failed to copy content', {
                position: "top-right",
                autoClose: 2000,
            });
        }
    };

    const handleNativeShare = () => {
        setShowShareMenu(false);
        if (navigator.share) {
            const postUrl = `${window.location.origin}/post/${post._id}`;
            navigator.share({
                title: `${post.user.name}'s post`,
                text: post.content,
                url: postUrl
            }).catch(err => console.log('Error sharing:', err));
        } else {
            handleCopyLink();
        }
    };

    const handleDelete = async () => {
        toast.confirm('Are you sure you want to delete this post?', {
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    const { deletePost } = await import('../api');
                    await deletePost(post._id);
                    toast.success('Post deleted successfully!');
                    // Use onDelete for deletion (reloads posts) or fallback to onUpdate
                    if (onDelete) {
                        onDelete();
                    } else if (onUpdate) {
                        onUpdate();
                    }
                } catch (error) {
                    console.error('Error deleting post:', error);
                    toast.error('Failed to delete post');
                }
            }
        });
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            const { updatePost } = await import('../api');
            const response = await updatePost(post._id, { content: editedContent });
            const updatedPost = response.data || { ...post, content: editedContent, isEdited: true };
            post.content = editedContent;
            post.isEdited = true;
            setIsEditing(false);
            if (onUpdate) onUpdate(updatedPost);
            toast.success('Post updated successfully!', {
                position: "top-right",
                autoClose: 2000,
            });
        } catch (error) {
            console.error('Error updating post:', error);
            toast.error('Failed to update post', {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleCancelEdit = () => {
        setEditedContent(post.content);
        setIsEditing(false);
    };

    const handleSavePost = async () => {
        if (!isRealPost) {
            toast.info('This is a sample post and cannot be saved', {
                position: "top-center",
                autoClose: 2000,
            });
            return;
        }
        
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        
        try {
            const { savePost } = await import('../api');
            await savePost(post._id);
            toast.success(newSavedState ? 'Post saved!' : 'Post unsaved', {
                position: "top-center",
                autoClose: 2000,
            });
        } catch (error) {
            console.error('Error saving post:', error);
            setIsSaved(!newSavedState);
            toast.error('Failed to save post');
        }
    };

    const handleShareToStory = async () => {
        if (!isRealPost) {
            toast.info('This is a sample post and cannot be shared', {
                position: "top-center",
                autoClose: 2000,
            });
            return;
        }
        
        try {
            const { sharePostToStory } = await import('../api');
            await sharePostToStory(post._id);
            setShowShareMenu(false);
            toast.success('Shared to your story!', {
                position: "top-center",
                autoClose: 2000,
            });
        } catch (error) {
            console.error('Error sharing to story:', error);
            toast.error('Failed to share to story');
        }
    };

    // Parse content for hashtags and mentions
    const renderContent = (content) => {
        if (!content) return null;
        
        const parts = content.split(/(\s+)/);
        return parts.map((part, index) => {
            if (part.startsWith('#')) {
                return (
                    <span 
                        key={index} 
                        className="hashtag"
                        onClick={() => history.push(`/hashtag/${part.slice(1)}`)}
                    >
                        {part}
                    </span>
                );
            } else if (part.startsWith('@')) {
                return (
                    <span 
                        key={index} 
                        className="mention"
                        onClick={() => {
                            // Find the mentioned user and navigate to their profile
                            const username = part.slice(1);
                            history.push(`/search?q=${username}`);
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="post-card" ref={postRef}>
            <div className="post-header">
                <div className="post-user-info">
                    <div className="post-avatar" onClick={() => history.push(`/profile/${post.user._id}`)}>
                        {displayProfilePicture ? (
                            <img src={displayProfilePicture.startsWith('/uploads') ? `http://localhost:5000${displayProfilePicture}` : displayProfilePicture} alt={post.user.name} />
                        ) : (
                            <div className="avatar-placeholder">
                                {post.user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="post-user-details">
                        <h4 className="post-username">
                            {post.user.name}
                            {post.user.isVerified && (
                                <span className="verified-badge" title="Verified">✓</span>
                            )}
                        </h4>
                        <span className="post-time">{getTimeAgo(post.createdAt)}</span>
                    </div>
                </div>
                {isOwner && isRealPost && (
                    <div className="post-actions-icons">
                        <button 
                            className="icon-btn edit-icon-btn"
                            onClick={handleEdit}
                            title="Edit post"
                        >
                            ✏️
                        </button>
                        <button 
                            className="icon-btn delete-icon-btn"
                            onClick={handleDelete}
                            title="Delete post"
                        >
                            🗑️
                        </button>
                    </div>
                )}
            </div>

            <div className="post-content">
                {isEditing ? (
                    <div className="edit-post-form">
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="edit-textarea"
                            rows="4"
                        />
                        <div className="edit-actions">
                            <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                            <button onClick={handleSaveEdit} className="save-btn">Save</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p>{renderContent(post.content)}</p>
                        {post.isEdited && (
                            <span className="edited-badge">Edited</span>
                        )}
                    </>
                )}
            </div>

            {/* Handle both single image and images array */}
            {(post.image || (post.images && post.images.length > 0)) && (
                <div className="post-image">
                    <img 
                        src={post.image || (post.images[0].startsWith('/uploads') ? `http://localhost:5000${post.images[0]}` : post.images[0])} 
                        alt="Post content" 
                    />
                    {post.images && post.images.length > 1 && (
                        <div className="multi-image-indicator">+{post.images.length - 1}</div>
                    )}
                </div>
            )}

            {post.video && (
                <div className="post-video">
                    <iframe
                        width="100%"
                        height="400"
                        src={post.video}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            )}

            {/* Music Display */}
            {post.music && (
                <div className="post-music">
                    <div className="music-player">
                        <span className={`music-icon-pulse ${isMusicPlaying ? 'playing' : ''}`}><MusicNoteIcon /></span>
                        <div className="music-info-display">
                            <div className="music-title-display">{post.music.trackName || post.music.title || 'Unknown Track'}</div>
                            <div className="music-artist-display">{post.music.artistName || post.music.artist || 'Unknown Artist'}</div>
                        </div>
                        {post.music.previewUrl || post.music.preview_url ? (
                            <button 
                                className="music-play-btn"
                                onClick={toggleMusic}
                                title={isMusicPlaying ? "Pause music" : "Play music"}
                            >
                                {isMusicPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                            </button>
                        ) : (
                            <button 
                                className="music-play-btn"
                                onClick={() => window.open(`https://open.spotify.com/search/${encodeURIComponent(`${post.music.trackName || post.music.title} ${post.music.artistName || post.music.artist}`)}`, '_blank')}
                                title="Open in Spotify"
                            >
                                <MusicNoteIcon />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="post-stats">
                <span 
                    className="likes-count"
                    onClick={() => likesCount > 0 && handleOpenLikesModal()}
                    style={{ cursor: likesCount > 0 ? 'pointer' : 'default' }}
                >
                    {likesCount > 0 && `❤️ ${likesCount}`}
                </span>
                <span 
                    className="comments-count"
                    onClick={() => commentsCount > 0 && setShowComments(!showComments)}
                    style={{ cursor: commentsCount > 0 ? 'pointer' : 'default' }}
                >
                    {commentsCount > 0 && `${commentsCount} comment${commentsCount > 1 ? 's' : ''}`}
                </span>
            </div>

            {/* Likes Modal - Using Portal to render at body level */}
            {showLikesModal && ReactDOM.createPortal(
                <div className="likes-modal-overlay" onClick={() => setShowLikesModal(false)}>
                    <div className="likes-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="likes-modal-header">
                            <h3>Liked by</h3>
                            <button className="close-modal-btn" onClick={() => setShowLikesModal(false)}>×</button>
                        </div>
                        <div className="likes-modal-content">
                            {loadingLikes ? (
                                <div className="likes-loading">Loading...</div>
                            ) : likesUsers && likesUsers.length > 0 ? (
                                likesUsers.map((user, index) => {
                                    // Handle placeholder entries (when we can't get user details)
                                    if (user?.isPlaceholder) {
                                        return (
                                            <div key="placeholder" className="likes-user-item likes-placeholder">
                                                <div className="likes-user-avatar">
                                                    <div className="avatar-placeholder-small" style={{ display: 'flex' }}>
                                                        ❤️
                                                    </div>
                                                </div>
                                                <div className="likes-user-info">
                                                    <span className="likes-user-name">{user.name}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Handle different data structures
                                    const userId = user?._id || user?.id || user;
                                    const userName = user?.name || user?.username || 'Unknown User';
                                    const userUsername = user?.username;
                                    const userProfilePic = user?.profilePicture;
                                    const userInitial = userName.charAt(0).toUpperCase();
                                    
                                    // Skip invalid entries (just ObjectId strings without populated data)
                                    if (typeof user === 'string') return null;
                                    
                                    const profilePicUrl = userProfilePic 
                                        ? (userProfilePic.startsWith('http') 
                                            ? userProfilePic 
                                            : `http://localhost:5000${userProfilePic}`)
                                        : null;
                                    
                                    return (
                                        <div 
                                            key={userId || index} 
                                            className="likes-user-item"
                                            onClick={() => {
                                                setShowLikesModal(false);
                                                if (userId && isValidObjectId(userId)) {
                                                    history.push(`/profile/${userId}`);
                                                }
                                            }}
                                        >
                                            <div className="likes-user-avatar">
                                                {profilePicUrl ? (
                                                    <img 
                                                        src={profilePicUrl} 
                                                        alt={userName}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div 
                                                    className="avatar-placeholder-small"
                                                    style={{ display: profilePicUrl ? 'none' : 'flex' }}
                                                >
                                                    {userInitial}
                                                </div>
                                            </div>
                                            <div className="likes-user-info">
                                                <span className="likes-user-name">{userName}</span>
                                                {userUsername && <span className="likes-user-username">@{userUsername}</span>}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="no-likes-message">No likes yet</p>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="post-actions">
                <button 
                    className={`action-btn ${isLiked ? 'liked' : ''}`}
                    onClick={handleLike}
                >
                    <span className="action-icon">{isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}</span>
                    <span>Like</span>
                </button>
                <button 
                    className="action-btn"
                    onClick={() => setShowComments(!showComments)}
                >
                    <span className="action-icon"><MessageIcon /></span>
                    <span>Comment</span>
                </button>
                <div className="share-btn-container" ref={shareMenuRef}>
                    <button 
                        className="action-btn" 
                        onClick={() => setShowShareMenu(!showShareMenu)}
                    >
                        <span className="action-icon"><IosShareIcon /></span>
                        <span>Share</span>
                    </button>
                    {showShareMenu && (
                        <div className="share-menu">
                            <div className="share-menu-section">
                                <div className="share-menu-title">Share to</div>
                                <button onClick={handleShareToTwitter} className="share-menu-item">
                                    <span className="share-icon twitter"><XIcon fontSize="small" /></span>
                                    <span>Twitter</span>
                                </button>
                                <button onClick={handleShareToFacebook} className="share-menu-item">
                                    <span className="share-icon facebook"><FacebookIcon fontSize="small" /></span>
                                    <span>Facebook</span>
                                </button>
                                <button onClick={handleShareToLinkedIn} className="share-menu-item">
                                    <span className="share-icon linkedin"><LinkedInIcon fontSize="small" /></span>
                                    <span>LinkedIn</span>
                                </button>
                                <button onClick={handleShareToWhatsApp} className="share-menu-item">
                                    <span className="share-icon whatsapp"><WhatsAppIcon fontSize="small" /></span>
                                    <span>WhatsApp</span>
                                </button>
                                <button onClick={handleShareToInstagram} className="share-menu-item">
                                    <span className="share-icon instagram"><InstagramIcon fontSize="small" /></span>
                                    <span>Instagram</span>
                                </button>
                            </div>
                            <div className="share-menu-divider"></div>
                            <div className="share-menu-section">
                                <button onClick={handleCopyLink} className="share-menu-item">
                                    <span className="share-icon"><ContentCopyIcon fontSize="small" /></span>
                                    <span>Copy Link</span>
                                </button>
                                <button onClick={handleShareToStory} className="share-menu-item">
                                    <span className="share-icon"><AddPhotoAlternateIcon fontSize="small" /></span>
                                    <span>Share to Story</span>
                                </button>
                                {navigator.share && (
                                    <button onClick={handleNativeShare} className="share-menu-item">
                                        <span className="share-icon"><IosShareIcon fontSize="small" /></span>
                                        <span>More Options</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <button 
                    className={`action-btn ${isSaved ? 'saved' : ''}`}
                    onClick={handleSavePost}
                >
                    <span className="action-icon">{isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}</span>
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
                {!isOwner && (
                    <button 
                        className="action-btn report"
                        onClick={() => setShowReportModal(true)}
                        title="Report this post"
                    >
                        <span className="action-icon">🚩</span>
                        <span>Report</span>
                    </button>
                )}
            </div>

            {showComments && (
                <div className="comments-section">
                    {comments.length > 0 && (
                        <div className="comments-list">
                            {comments.map((comment) => (
                                <div key={comment._id} className="comment-item">
                                    <div className="comment-avatar">
                                        {comment.user?.profilePicture ? (
                                            <img src={comment.user.profilePicture} alt={comment.user.name} />
                                        ) : (
                                            <div className="avatar-placeholder-small">
                                                {comment.user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="comment-content">
                                        <div className="comment-header">
                                            <span className="comment-author">{comment.user?.name}</span>
                                            <span className="comment-time">{getTimeAgo(comment.createdAt)}</span>
                                        </div>
                                        <p className="comment-text">{comment.text}</p>
                                        
                                        <div className="comment-actions">
                                            <button 
                                                className={`comment-action-btn ${comment.likes?.includes(currentUser._id) ? 'liked' : ''}`}
                                                onClick={() => handleLikeComment(comment._id)}
                                            >
                                                ❤️ {comment.likes?.length > 0 && comment.likes.length}
                                            </button>
                                            <button 
                                                className="comment-action-btn"
                                                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                            >
                                                💬 Reply
                                            </button>
                                            {(comment.user?._id === currentUser._id || isOwner) && (
                                                <button 
                                                    className="comment-action-btn delete"
                                                    onClick={() => handleDeleteComment(comment._id)}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>

                                        {/* Reply input */}
                                        {replyingTo === comment._id && (
                                            <div className="reply-input-container">
                                                <input
                                                    type="text"
                                                    placeholder={`Reply to ${comment.user?.name}...`}
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleReplyToComment(comment._id)}
                                                />
                                                <button onClick={() => handleReplyToComment(comment._id)}>Send</button>
                                            </div>
                                        )}

                                        {/* Replies */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="comment-replies">
                                                <button 
                                                    className="view-replies-btn"
                                                    onClick={() => toggleReplies(comment._id)}
                                                >
                                                    {expandedReplies[comment._id] ? '▼' : '▶'} 
                                                    {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                                </button>
                                                
                                                {expandedReplies[comment._id] && (
                                                    <div className="replies-list">
                                                        {comment.replies.map((reply) => (
                                                            <div key={reply._id} className="reply-item">
                                                                <div className="comment-avatar">
                                                                    {reply.user?.profilePicture ? (
                                                                        <img src={reply.user.profilePicture} alt={reply.user.name} />
                                                                    ) : (
                                                                        <div className="avatar-placeholder-small">
                                                                            {reply.user?.name?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="reply-content">
                                                                    <div className="comment-header">
                                                                        <span className="comment-author">{reply.user?.name}</span>
                                                                        <span className="comment-time">{getTimeAgo(reply.createdAt)}</span>
                                                                    </div>
                                                                    <p className="comment-text">{reply.text}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="comment-input">
                        <div className="comment-avatar">
                            {currentUser?.profilePicture ? (
                                <img 
                                    src={currentUser.profilePicture.startsWith('http') 
                                        ? currentUser.profilePicture 
                                        : (currentUser.profilePicture.startsWith('/uploads')
                                            ? `http://localhost:5000${currentUser.profilePicture}`
                                            : currentUser.profilePicture
                                        )
                                    } 
                                    alt={currentUser.name} 
                                />
                            ) : (
                                <div className="avatar-placeholder-small">
                                    {currentUser?.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="comment-input-wrapper">
                            <input 
                                type="text" 
                                placeholder="Write a comment..." 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                            />
                            <div className="emoji-picker-container" ref={emojiPickerRef}>
                                <button 
                                    className="emoji-btn"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    type="button"
                                >
                                    😊
                                </button>
                                {showEmojiPicker && (
                                    <div className="emoji-picker">
                                        <div className="emoji-search">
                                            <input 
                                                type="text" 
                                                placeholder="Search emoji" 
                                                value={emojiSearch}
                                                onChange={(e) => setEmojiSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="emoji-categories">
                                            {Object.keys(emojiCategories).map(category => (
                                                <button
                                                    key={category}
                                                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                                                    onClick={() => { setSelectedCategory(category); setEmojiSearch(''); }}
                                                    type="button"
                                                >
                                                    {category === 'Smileys & people' && '😀'}
                                                    {category === 'Animals & nature' && '🐻'}
                                                    {category === 'Food & drink' && '🍔'}
                                                    {category === 'Activity' && '⚽'}
                                                    {category === 'Travel & places' && '🚗'}
                                                    {category === 'Objects' && '💡'}
                                                    {category === 'Symbols' && '❤️'}
                                                    {category === 'Flags' && '🏁'}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="emoji-grid">
                                            {getFilteredEmojis().map((emoji, index) => (
                                                <button
                                                    key={index}
                                                    className="emoji-item"
                                                    onClick={() => handleEmojiClick(emoji)}
                                                    type="button"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button 
                            className="comment-send-btn"
                            onClick={handleComment}
                            disabled={!commentText.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <ReportModal
                    isOpen={showReportModal}
                    reportType="post"
                    itemId={post._id}
                    itemName={`Post by ${post.user.name}`}
                    onClose={() => setShowReportModal(false)}
                    onSuccess={() => {
                        toast.success('Report submitted successfully');
                        setShowReportModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default PostCard;