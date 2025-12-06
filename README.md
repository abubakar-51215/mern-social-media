# MERN Social Media Application

A full-stack social media platform built with MongoDB, Express.js, React, and Node.js.

## Features

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
│   ├── config/          # Configuration files (DB, email, passport)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware (auth, upload)
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── uploads/         # User uploaded files (not in git)
│   ├── utils/           # Utility functions
│   ├── index.js         # Server entry point
│   └── package.json
│
└── Frontend/
    ├── public/          # Static files
    ├── src/
    │   ├── components/  # Reusable React components
    │   ├── pages/       # Page components
    │   ├── utils/       # Utility functions
    │   ├── api.js       # API calls
    │   ├── App.js       # Main App component
    │   └── index.js     # React entry point
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
- Message read receipts
- Real-time notifications

### Security
- JWT authentication
- Password hashing with bcrypt
- Message encryption
- Two-factor authentication
- Secure file upload validation

### User Experience
- Responsive design
- Toast notifications
- Image/video support
- Voice messages
- File sharing (documents)
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
