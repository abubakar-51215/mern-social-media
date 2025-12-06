import React, { useState, useEffect, useRef } from 'react';
import { getUserProfile, uploadProfilePicture, updateUserProfile } from "../api";
import { useHistory } from 'react-router-dom';
import { toast } from '../components/Toast';
import './EditProfile.css';

const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
    "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
    "Brazil", "Bulgaria", "Canada", "Chile", "China", "Colombia", "Croatia", "Cuba", "Cyprus",
    "Czech Republic", "Denmark", "Egypt", "Estonia", "Ethiopia", "Finland", "France", "Germany",
    "Ghana", "Greece", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon",
    "Libya", "Lithuania", "Luxembourg", "Malaysia", "Maldives", "Mexico", "Monaco", "Morocco",
    "Nepal", "Netherlands", "New Zealand", "Nigeria", "Norway", "Oman", "Pakistan", "Palestine",
    "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
    "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka",
    "Sudan", "Sweden", "Switzerland", "Syria", "Taiwan", "Thailand", "Tunisia", "Turkey", "Ukraine",
    "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Venezuela", "Vietnam", "Yemen", "Zimbabwe"
];

const EditProfile = () => {
    const [userData, setUserData] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        bio: '',
        location: '',
        isPrivate: false
    });
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [locationSearch, setLocationSearch] = useState('');
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const locationRef = useRef(null);
    const history = useHistory();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = currentUser._id || currentUser.id;
                
                if (!userId) {
                    history.push('/');
                    return;
                }

                const profileData = await getUserProfile(userId);
                setUserData(profileData);
                const username = profileData.username || profileData.email?.split('@')[0] + Math.floor(Math.random() * 100000);
                setFormData({
                    name: profileData.name || '',
                    username: username,
                    bio: profileData.bio || 'Hey there! I am using PingUp.',
                    location: profileData.location || '',
                    isPrivate: profileData.isPrivate || false
                });
                setLocationSearch(profileData.location || '');
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };
        fetchUserData();
    }, [history]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (locationRef.current && !locationRef.current.contains(event.target)) {
                setShowLocationDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClose = () => {
        history.goBack();
    };

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            console.log('Uploading file:', file.name, 'Size:', file.size);
            const response = await uploadProfilePicture(file);
            console.log('Upload response:', response);
            const updatedUser = response.data.user;
            setUserData(prev => ({ ...prev, profilePicture: updatedUser.profilePicture }));
            
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.profilePicture = updatedUser.profilePicture;
            localStorage.setItem('user', JSON.stringify(storedUser));
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('profileUpdated', { 
                detail: { profilePicture: updatedUser.profilePicture } 
            }));
            
            toast.success('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            toast.error(error.response?.data?.message || 'Failed to upload profile picture');
        } finally {
            setUploading(false);
        }
    };
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleLocationInputChange = (e) => {
        const value = e.target.value;
        setLocationSearch(value);
        setFormData(prev => ({ ...prev, location: value }));
        setShowLocationDropdown(true);
    };

    const handleLocationSelect = (country) => {
        setFormData(prev => ({ ...prev, location: country }));
        setLocationSearch(country);
        setShowLocationDropdown(false);
    };

    const filteredCountries = COUNTRIES.filter(country => 
        country.toLowerCase().includes(locationSearch.toLowerCase())
    );

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const response = await updateUserProfile(null, formData);
            const updatedUser = response.data.user;
            
            setUserData(updatedUser);
            
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            Object.assign(storedUser, {
                name: updatedUser.name,
                username: updatedUser.username,
                bio: updatedUser.bio,
                location: updatedUser.location
            });
            localStorage.setItem('user', JSON.stringify(storedUser));
            
            history.goBack();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (!userData) {
        return (
            <div className="edit-profile-overlay">
                <div className="edit-profile-modal">
                    <div className="loading">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="edit-profile-overlay" onClick={handleClose}>
            <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="edit-profile-title">Edit Profile</h2>
                
                {/* Profile Picture */}
                <div className="edit-field">
                    <label className="edit-label">Profile Picture</label>
                    <div 
                        className="profile-picture-edit"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {userData.profilePicture ? (
                            <img 
                                src={userData.profilePicture.startsWith('/uploads') 
                                    ? `http://localhost:5000${userData.profilePicture}` 
                                    : userData.profilePicture} 
                                alt={userData.name} 
                                className="profile-pic-preview"
                            />
                        ) : (
                            <div className="profile-pic-placeholder">
                                {userData.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        )}
                        {uploading && <div className="uploading-overlay">Uploading...</div>}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleProfilePictureChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Cover Photo */}
                <div className="edit-field">
                    <label className="edit-label">Cover Photo</label>
                    <div 
                        className="cover-photo-edit"
                        onClick={() => coverInputRef.current?.click()}
                    >
                        {userData.coverPhoto ? (
                            <img 
                                src={userData.coverPhoto.startsWith('/uploads') 
                                    ? `http://localhost:5000${userData.coverPhoto}` 
                                    : userData.coverPhoto} 
                                alt="Cover" 
                            />
                        ) : (
                            <div className="cover-photo-gradient"></div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={coverInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Name */}
                <div className="edit-field">
                    <label className="edit-label">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="edit-input"
                        placeholder="Your name"
                    />
                </div>

                {/* Username */}
                <div className="edit-field">
                    <label className="edit-label">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="edit-input"
                        placeholder="username"
                    />
                </div>

                {/* Bio */}
                <div className="edit-field">
                    <label className="edit-label">Bio</label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="edit-textarea"
                        placeholder="Hey there! I am using PingUp."
                        rows={3}
                    />
                </div>

                {/* Location */}
                <div className="edit-field" ref={locationRef}>
                    <label className="edit-label">Location</label>
                    <div className="location-input-container">
                        <input
                            type="text"
                            value={locationSearch}
                            onChange={handleLocationInputChange}
                            onFocus={() => setShowLocationDropdown(true)}
                            className="edit-input"
                            placeholder="Please enter your location"
                        />
                        {showLocationDropdown && filteredCountries.length > 0 && (
                            <div className="location-dropdown">
                                {filteredCountries.slice(0, 6).map((country) => (
                                    <div 
                                        key={country}
                                        className="location-option"
                                        onClick={() => handleLocationSelect(country)}
                                    >
                                        {country}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Privacy Settings */}
                <div className="edit-field">
                    <div className="privacy-section">
                        <div className="privacy-info">
                            <label className="edit-label">Private Account</label>
                            <p className="privacy-description">
                                When your account is private, only your friends can see your posts, followers, and following list.
                            </p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                name="isPrivate"
                                checked={formData.isPrivate}
                                onChange={handleInputChange}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="edit-actions">
                    <button className="edit-cancel-btn" onClick={handleClose}>
                        Cancel
                    </button>
                    <button 
                        className="edit-save-btn" 
                        onClick={handleSaveProfile}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
