# PDF Audiobook Converter

Transform research papers and documents into audio summaries that you can listen to on the go. This application extracts text from PDFs, generates intelligent summaries, and uses browser text-to-speech to read them aloud with synchronized highlighting.

## Features

- **User Authentication** - Secure registration and login with JWT tokens
- **PDF Upload** - Upload and store PDF documents
- **Automatic Text Extraction** - Server-side PDF text extraction
- **Smart Summarization** - AI-powered summarization using keyword extraction
- **Audio Playback** - Browser text-to-speech with real-time highlighting
- **Position Memory** - Resume listening from where you left off
- **Document Management** - View, play, and delete your uploaded documents

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **PDF.js** for client-side PDF handling
- **Web Speech API** for text-to-speech

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **pdf-parse** for server-side PDF text extraction
- **bcryptjs** for password hashing

## Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Port 5173)   │
└────────┬────────┘
         │ REST API
         │
┌────────▼────────┐      ┌──────────────┐
│  Express API    │◄─────┤  MongoDB     │
│   (Port 5000)   │      │  Database    │
└────────┬────────┘      └──────────────┘
         │
         ▼
   File System
   (uploads/)
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Installation guide](https://docs.mongodb.com/manual/installation/)
- **Git** - [Download here](https://git-scm.com/)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/pdf-audiobook.git
cd pdf-audiobook
```

### 2. Set Up MongoDB

**Option A: Local MongoDB**

1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # macOS
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Windows
   net start MongoDB
   ```

**Option B: MongoDB Atlas (Free Cloud)**

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string

### 3. Set Up Backend

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
nano .env
```

Configure your `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pdf-audiobook
# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pdf-audiobook

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
UPLOAD_DIR=uploads
```

**Important:** Change `JWT_SECRET` to a random string in production!

### 4. Set Up Frontend

```bash
# Go back to project root
cd ..

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
nano .env
```

Configure your `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Start the Application

**Terminal 1 - Start Backend:**

```bash
cd server
npm run dev
```

You should see:
```
MongoDB Connected: localhost:27017
Server running in development mode on port 5000
```

**Terminal 2 - Start Frontend:**

```bash
# From project root
npm run dev
```

You should see:
```
  VITE ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

### 6. Open the Application

Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Usage Guide

### 1. Create an Account

- Click "Sign Up" on the landing page
- Enter your email and password (min 6 characters)
- Click "Create Account"

### 2. Upload a PDF

- Click the "Upload PDF" button
- Select a PDF file (max 10MB)
- Click "Upload"
- Wait for processing (text extraction + summarization)

### 3. Listen to Your Document

- Click on a processed document card (shows "Ready to play")
- Click the "Play" button to start audio playback
- Text highlights as it's being read
- Use Pause/Resume to control playback
- Your position is automatically saved

### 4. Manage Documents

- Click the trash icon to delete a document
- Click "Back to Library" to return to document list
- Click "Sign Out" to logout

## API Endpoints

### Authentication

```
POST   /api/auth/register    - Create new user account
POST   /api/auth/login       - Login and get JWT token
GET    /api/auth/me          - Get current user info (requires auth)
```

### Documents

```
POST   /api/documents              - Upload new PDF (requires auth)
GET    /api/documents              - Get all user's documents (requires auth)
GET    /api/documents/:id          - Get single document (requires auth)
PATCH  /api/documents/:id/position - Update listening position (requires auth)
DELETE /api/documents/:id          - Delete document (requires auth)
```

### Health Check

```
GET    /api/health            - Server health status
```

## Project Structure

```
pdf-audiobook/
├── server/                     # Backend Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── documentController.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT authentication
│   │   │   └── upload.js       # Multer file upload
│   │   ├── models/
│   │   │   ├── User.js         # User schema
│   │   │   └── Document.js     # Document schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── documentRoutes.js
│   │   ├── utils/
│   │   │   └── pdfProcessor.js # PDF extraction & summarization
│   │   └── server.js           # Express app entry point
│   ├── uploads/                # Uploaded PDF files
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── src/                        # Frontend React app
│   ├── components/
│   │   ├── AudioPlayer.tsx     # Audio playback UI
│   │   ├── AuthForm.tsx        # Login/register form
│   │   ├── DocumentLibrary.tsx # Document list view
│   │   └── UploadModal.tsx     # PDF upload modal
│   ├── hooks/
│   │   └── useSpeechSynthesis.ts # Text-to-speech hook
│   ├── lib/
│   │   └── api.ts              # API client functions
│   ├── utils/
│   │   └── pdfProcessor.ts     # Client-side PDF utilities
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # React entry point
│   └── index.css               # Global styles
│
├── .env.example
├── .gitignore
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## How It Works

### Authentication Flow

1. User registers → Server hashes password with bcrypt → Stores in MongoDB
2. User logs in → Server validates credentials → Returns JWT token
3. Client stores JWT in localStorage
4. Client sends JWT in Authorization header for protected routes
5. Server middleware validates JWT → Allows/denies access

### Document Processing Flow

1. **Upload**: User selects PDF → Client sends to server via multipart/form-data
2. **Storage**: Server saves file to `uploads/` directory → Creates DB record
3. **Extraction**: Background process extracts text using pdf-parse library
4. **Summarization**: Server analyzes text frequency → Scores sentences → Generates summary
5. **Playback**: Client fetches summary → Uses Web Speech API → Highlights text in real-time

### Summarization Algorithm

1. Split text into sentences
2. Calculate word frequency (excluding common stop words)
3. Score each sentence based on word importance
4. Select top 30% of sentences
5. Reorder by original position for coherence
6. Trim to max 500 words

## Deployment

### Frontend Deployment (Netlify/Vercel)

1. Push code to GitHub
2. Connect repository to Netlify or Vercel
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-api-url.com/api`

### Backend Deployment (Heroku/Railway/Render)

**Example: Railway**

1. Sign up at [railway.app](https://railway.app)
2. Create new project → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - Root directory: `server`
   - Start command: `npm start`
5. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-production-secret
   NODE_ENV=production
   PORT=5000
   ```
6. Deploy

**Example: Render**

1. Create new "Web Service"
2. Connect GitHub repo
3. Configure:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables (same as above)

### MongoDB Atlas (Production Database)

1. Create production cluster
2. Whitelist IP addresses (or allow from anywhere: `0.0.0.0/0`)
3. Create database user
4. Get connection string → Update `MONGODB_URI` in backend

## Troubleshooting

### Backend won't start

```bash
# Check MongoDB is running
mongosh

# Check port 5000 is available
lsof -i :5000

# View logs
cd server && npm run dev
```

### Frontend can't connect to backend

1. Check `VITE_API_URL` in `.env`
2. Verify backend is running on port 5000
3. Check browser console for CORS errors
4. Ensure JWT token is in localStorage

### PDF upload fails

1. Check file size (max 10MB)
2. Verify `uploads/` directory exists
3. Check disk space
4. View server logs for errors

### Text-to-speech not working

1. Web Speech API only works over HTTPS (or localhost)
2. Try different browser (Chrome recommended)
3. Check browser console for errors
4. Verify voices are loaded: `window.speechSynthesis.getVoices()`

### MongoDB connection issues

```bash
# Test connection string
mongosh "mongodb://localhost:27017/pdf-audiobook"

# For Atlas, ensure:
# - IP whitelist configured
# - Correct username/password
# - Database name in connection string
```

## Free Hosting Options

### Frontend
- **Netlify** - 100GB bandwidth/month
- **Vercel** - 100GB bandwidth/month
- **GitHub Pages** - Unlimited static hosting

### Backend + Database
- **Railway** - $5 free credit/month (enough for small apps)
- **Render** - Free tier (services sleep after 15 min inactivity)
- **MongoDB Atlas** - 512MB free cluster

**Total Cost:** $0-5/month for small-scale usage

## Development

### Run tests

```bash
# Backend
cd server
npm test

# Frontend
npm test
```

### Build for production

```bash
# Frontend
npm run build

# Backend (no build needed)
cd server && NODE_ENV=production node src/server.js
```

### Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Security Considerations

- **Never commit** `.env` files to Git
- **Change** `JWT_SECRET` in production
- **Use HTTPS** in production (required for Web Speech API)
- **Validate** all user inputs on backend
- **Sanitize** file uploads (PDF only)
- **Implement** rate limiting for API endpoints
- **Use** secure password policies (min 8 chars, complexity)

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review troubleshooting section above

## Acknowledgments

- PDF.js by Mozilla
- Express.js framework
- MongoDB database
- React team
- Tailwind CSS
- pdf-parse library

---

Built with ❤️ for developers who love turning text into audio
