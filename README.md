# MERN Social Media Application

A full-stack social media platform built with MongoDB, Express.js, React, and Node.js with comprehensive admin panel and analytics.

## Features

### User Features
- 🔐 User Authentication (Email/Password & Google OAuth)
- 👤 User Profiles with customization
- 📝 Create, Edit, Delete Posts
- 💬 Real-time Messaging (Direct & Group)
- 🎥 Voice Messages & Media Sharing
- 👥 Friend System (Add, Accept, Block)
- 🔔 Real-time Notifications
- 📖 Stories with 24-hour expiry
- 👍 Like, Comment, Save Posts
- 🔒 End-to-End Message Encryption
- 🔍 User Search & Discovery
- 🌐 Activity Status & Online Indicators
- 🔐 Two-Factor Authentication
- ⚙️ Account Settings & Privacy Controls
- 🎵 Music Integration (Spotify)
- 📱 QR Code Profile Sharing

### Admin Features
- 📊 **Analytics Dashboard**
  - Platform statistics (users, posts, messages, stories)
  - User growth analytics with charts
  - Post engagement metrics
  - Real-time active users monitoring
  - Storage usage tracking
  - Most reported content analysis
  
- 👥 **User Management**
  - View all users with pagination
  - User activity monitoring
  - Ban/unban users
  - Filter by role and status
  - User statistics overview

- 🚨 **Content Moderation**
  - Report management system
  - Review reported posts
  - Approve/reject/delete reports
  - Filter by status and severity
  - Bulk actions support

- ⚙️ **Platform Settings**
  - General settings (platform name, description)
  - Security configuration (2FA, password policies, rate limiting)
  - Moderation settings (auto-moderation, content filters)
  - Email notifications setup
  - Feature toggles (stories, groups, messaging, reports)
  - Maintenance mode with admin bypass
  - Data & backup management

- 💾 **Backup & Restore**
  - Database export to JSON
  - Automated backup creation
  - Backup restoration
  - Backup history management

## Tech Stack

### Frontend
- React.js
- React Router
- Socket.io Client
- Axios
- CSS3

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io
- JWT Authentication
- Multer (File uploads)
- Nodemailer
- Passport.js (OAuth)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the Backend folder:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the Backend folder with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ENCRYPTION_KEY=your_32_character_encryption_key
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the Frontend folder:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the Frontend folder (if needed):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
mern/
├── Backend/
│   ├── backups/                    # Database backups (JSON format)
│   ├── config/
│   │   ├── db.js                   # MongoDB connection
│   │   ├── email.js                # Email configuration
│   │   └── passport.js             # OAuth strategies
│   ├── controllers/
│   │   ├── adminController.js      # Admin user management
│   │   ├── adminSettingsController.js  # Platform settings
│   │   ├── analyticsController.js  # Analytics & statistics
│   │   ├── authController.js       # Authentication
│   │   ├── backupController.js     # Backup & restore
│   │   ├── blockController.js      # User blocking
│   │   ├── friendController.js     # Friend system
│   │   ├── groupController.js      # Group chats
│   │   ├── messageController.js    # Messaging
│   │   ├── settingsController.js   # User settings
│   │   ├── storyController.js      # Stories
│   │   └── userController.js       # User profiles
│   ├── middleware/
│   │   ├── auth.js                 # JWT & admin auth
│   │   ├── maintenance.js          # Maintenance mode
│   │   └── upload.js               # File upload
│   ├── models/
│   │   ├── AdminSettings.js        # Platform settings
│   │   ├── Connection.js           # DB connector
│   │   ├── Conversation.js         # Direct messages
│   │   ├── GroupConversation.js    # Group chats
│   │   ├── Message.js              # Messages
│   │   ├── Notification.js         # Notifications
│   │   ├── Post.js                 # Posts
│   │   ├── Story.js                # Stories
│   │   └── User.js                 # Users
│   ├── routes/
│   │   ├── admin.js                # Admin user routes
│   │   ├── adminSettings.js        # Settings routes
│   │   ├── analytics.js            # Analytics routes
│   │   ├── auth.js                 # Auth routes
│   │   ├── backup.js               # Backup routes
│   │   ├── block.js                # Block routes
│   │   ├── friends.js              # Friend routes
│   │   ├── groups.js               # Group routes
- `SESSION_SECRET` - Session secret for OAuth

### Optional Variables:
- `PORT` - Server port (default: 5000)
- `CLIENT_URL` - Frontend URL (default: http://localhost:3000)
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `ENABLE_MONGOTOOLS` - Set to 'true' to use mongodump/mongorestore (default: JSON backups)routes
│   ├── uploads/                    # User uploaded files
│   │   ├── documents/
│   │   ├── groups/
│   │   ├── messages/
│   │   ├── posts/
│   │   ├── profiles/
│   │   └── stories/
│   ├── utils/                      # Utility functions
│   ├── index.js                    # Server entry point
│   ├── nodemon.json                # Nodemon config
│   └── package.json
│
└── Frontend/
    ├── public/
    │   ├── console-filter.js       # Console filtering
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── AIChatbot.js        # AI chat assistant
    │   │   ├── ChatBubble.js       # Chat messages
    │   │   ├── CreateGroupModal.js # Group creation
    │   │   ├── ForwardModal.js     # Message forwarding
    │   │   ├── GlobalSearch.js     # Global search
    │   │   ├── GroupInfoModal.js   # Group details
    │   │   ├── ManageAccount.js    # Account management
    │   │   ├── MusicPicker.js      # Spotify integration
    │   │   ├── NotificationCenter.js # Notifications
    │   │   ├── PeopleCard.js       # User cards
    │   │   ├── PostCard.js         # Post display
    │   │   ├── QRCodeModal.js      # QR profile sharing
    │   │   ├── QRScanner.js        # QR scanning
    │   │   ├── Sidebar.js          # Navigation
    │   │   ├── StoryViewer.js      # Story viewer
    │   │   ├── ThemeToggle.js      # Dark/light mode
    │   │   ├── Toast.js            # Notifications
    │   │   ├── UserProfileModal.js # User profiles
    │   │   ├── VoiceMessageModal.js # Voice messages
    │   │   └── VoiceRecorder.js    # Voice recording
    │   ├── pages/
    │   │   ├── AdminDashboard.js   # Admin overview
    │   │   ├── AdminPosts.js       # Post management
    │   │   ├── AdminReports.js     # Report management
    │   │   ├── AdminSettings.js    # Platform settings
    │   │   ├── AdminUsers.js       # User management
    │   │   ├── Analytics.js        # Analytics dashboard
    │   │   ├── AuthPage.js         # Login/signup
    │   │   ├── Chat.js             # Chat interface
    │   │   ├── Groups.js           # Groups page
    │   │   ├── Home.js             # Home feed
    │   │   ├── People.js           # Find friends
    │   │   ├── Profile.js          # User profile
    │   │   └── Settings.js         # User settings
    │   ├── utils/
    │   │   └── auth.js             # Auth utilities
    │   ├── api.js                  # API client
    │   ├── App.js                  # Main component
    │   ├── App.css                 # Global styles
    │   └── index.js                # Entry point
    └── package.json
```

## Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Environment Variables

### Backend Required Variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `EMAIL_USER` - Email for sending notifications
- `EMAIL_PASSWORD` - Email app password
- `ENCRYPTION_KEY` - 32-character key for message encryption

### Optional Variables:
- `PORT` - Server port (default: 5000)
- `CLIENT_URL` - Frontend URL (default: http://localhost:3000)
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth

## Features in Detail

### Real-time Communication
- Socket.io for instant messaging
- Typing indicators
- Online/offline status
- Voice messages with playback controls
- File attachments (images, videos, documents)

### Security
- JWT authentication
- Password hashing with bcrypt
- End-to-end message encryption
- Two-factor authentication
- Secure file upload validation
- Rate limiting
- Maintenance mode
- Admin-only routes protection
- Session timeout management

### Admin Panel
- **Analytics Dashboard**: Real-time metrics, user growth charts, engagement statistics
- **User Management**: View, ban, unban users with role-based filtering
- **Content Moderation**: Report review system with bulk actions
- **Platform Settings**: Configure platform behavior, security, features
- **Backup System**: Export/import database with JSON format support

### User Experience
- Responsive design
- Toast notifications
- Dark/light theme toggle
- Image/video support
- Voice messages
- File sharing (documents)
- Story viewer with 24h expiry
- EAPI Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/auth/google` - Google OAuth

### Admin Routes
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id/ban` - Ban/unban user
- `GET /api/analytics/*` - Analytics endpoints
- `GET /api/admin-settings` - Get platform settings
- `PUT /api/admin-settings` - Update settings
- `POST /api/backup/create` - Create backup
- `GET /api/backup/export` - Export database

### User Routes
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `POST /api/posts` - Create post
- `POST /api/messages` - Send message
- `POST /api/stories` - Create story
- `GET /api/notifications` - Get notifications

## Admin Access

To create an admin user, manually update a user document in MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin", isAdmin: true } }
)
```

Or use the admin registration endpoint with proper authentication.

## Backup & Restore

The platform includes automatic backup functionality:
- **JSON Backups**: Human-readable, works on all platforms
- **Backup Location**: `Backend/backups/`
- **Restoration**: Use admin settings panel to restore from backup
- **Export**: Download database as JSON via admin panel

## Support

For support, open an issue in the repository.

## Acknowledgments

- Socket.io for real-time communication
- MongoDB for database
- React.js for frontend framework
- Express.js for backend frameworktant (documents)
- Story viewer
- Emoji picker

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email your-email@example.com or open an issue in the repository.

## Acknowledgments

- Socket.io for real-time features
- MongoDB for database
- React.js for the frontend framework
- Express.js for the backend framework
