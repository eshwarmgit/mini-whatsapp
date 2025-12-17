# WhatsApp Web Clone - Full Stack Application

A complete WhatsApp Web clone built with React (Vite) frontend and Node.js/Express backend, featuring real-time messaging, group chats, and WhatsApp dark theme UI.

## 🚀 Features

### Authentication
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes

### Messaging
- One-to-one real-time messaging
- Group chat functionality
- Message timestamps (HH:MM format)
- Message alignment (right for sender, left for receiver)
- Delete for me
- Delete for everyone
- Soft-delete with placeholder messages

### Real-time Features
- Socket.IO for instant message delivery
- Typing indicators
- Online/offline status
- Real-time message deletion updates

### Group Management
- Create groups
- Add/remove members (admin only)
- Group admin privileges
- Leave group functionality
- Group message history

### UI/UX
- Exact WhatsApp dark theme colors
- Responsive design (desktop priority)
- Scrollable chat area
- Sticky header and input bar
- Auto-scroll on new messages
- Message bubble styles matching WhatsApp

## 📁 Project Structure

```
mini-whatsapp/
├── backend/
│   ├── models/
│   │   ├── user.js          # User schema
│   │   ├── message.js       # Message schema
│   │   └── group.js         # Group schema
│   ├── routes/
│   │   ├── auth.routes.js   # Authentication endpoints
│   │   ├── chat.routes.js  # 1-to-1 chat endpoints
│   │   └── group.routes.js # Group endpoints
│   ├── middleware/
│   │   └── auth.middleware.js # JWT verification
│   ├── socket.js            # Socket.IO handlers
│   ├── server.js           # Express server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── ChatHeader.jsx
    │   │   ├── MessageList.jsx
    │   │   ├── MessageBubble.jsx
    │   │   └── MessageInput.jsx
    │   ├── pages/
    │   │   ├── login.jsx
    │   │   └── chat.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   └── socket.js
    │   ├── styles/
    │   │   ├── auth.css
    │   │   ├── chat.css
    │   │   ├── sidebar.css
    │   │   └── message.css
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- React Router DOM
- Socket.IO Client
- Axios
- Plain CSS (no Tailwind/Bootstrap)

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB (Mongoose)
- JWT
- bcryptjs

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
FRONTEND_URL=http://localhost:5173
```

4. Start the server:
```bash
npm start
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🌐 Deployment

### Backend Deployment (Render)

1. **Create a Render account** at [render.com](https://render.com)

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Build command: `cd backend && npm install`
   - Start command: `cd backend && npm start`
   - Environment: Node

3. **Set Environment Variables** in Render dashboard:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string
   - `FRONTEND_URL`: Your frontend URL (e.g., `https://your-app.vercel.app`)

4. **Deploy**: Render will automatically deploy your backend

### Frontend Deployment (Vercel)

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Import your project**:
   - Connect your GitHub repository
   - Root directory: `frontend`
   - Framework preset: Vite

3. **Set Environment Variables**:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://your-backend.onrender.com`)

4. **Deploy**: Vercel will automatically deploy your frontend

### MongoDB Atlas Setup

1. **Create a MongoDB Atlas account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a new cluster** (free tier available)

3. **Create a database user**:
   - Go to Database Access
   - Add new user with username and password

4. **Whitelist IP addresses**:
   - Go to Network Access
   - Add `0.0.0.0/0` for Render deployment (or specific IPs)

5. **Get connection string**:
   - Go to Clusters
   - Click Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/users` - Get all users (contacts)

### Chat (1-to-1)
- `POST /chat/send` - Send message
- `GET /chat/messages/:userId` - Get messages with user
- `PATCH /chat/delete-for-me/:messageId` - Delete message for me
- `PATCH /chat/delete-for-everyone/:messageId` - Delete message for everyone

### Groups
- `POST /groups/create` - Create group
- `GET /groups/my` - Get user's groups
- `GET /groups/:groupId` - Get group details
- `GET /groups/:groupId/messages` - Get group messages
- `PATCH /groups/:groupId/add-members` - Add members (admin only)
- `PATCH /groups/:groupId/remove-member` - Remove member (admin only)
- `PATCH /groups/:groupId/leave` - Leave group

## 🔌 Socket.IO Events

### Client → Server
- `send-message` - Send 1-to-1 message
- `send-group-message` - Send group message
- `join-group` - Join group room
- `leave-group` - Leave group room
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator
- `delete-message-for-me` - Delete message for me
- `delete-message-for-everyone` - Delete message for everyone

### Server → Client
- `receive-message` - Receive 1-to-1 message
- `message-sent` - Message sent confirmation
- `receive-group-message` - Receive group message
- `user-typing` - User typing indicator
- `user-online` - User came online
- `user-offline` - User went offline
- `message-deleted` - Message deleted notification

## 🎨 Color Scheme (WhatsApp Dark Theme)

- Background: `#0b141a`
- Sidebar: `#111b21`
- Header: `#202c33`
- Input: `#2a3942`
- Message (sent): `#005c4b`
- Message (received): `#202c33`
- Text: `#e9edef`
- Secondary text: `#8696a0`
- Accent: `#00a884`

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token authentication
- Protected API routes
- CORS configuration
- Input validation
- SQL injection prevention (MongoDB)

## 📝 Notes

- All registered users automatically appear in contacts
- Messages are stored in MongoDB with soft-delete support
- Real-time updates via Socket.IO rooms
- Group admin has exclusive add/remove member privileges
- Admin cannot leave group (must transfer admin first)

## 🐛 Troubleshooting

### Backend Issues
- Ensure MongoDB Atlas connection string is correct
- Check that JWT_SECRET is set
- Verify CORS settings match frontend URL

### Frontend Issues
- Ensure VITE_API_URL points to correct backend
- Check browser console for errors
- Verify Socket.IO connection in Network tab

### Socket.IO Connection Issues
- Check that token is being sent in auth
- Verify backend URL is correct
- Ensure CORS allows WebSocket connections

## 📄 License

This project is for educational purposes.

## 👨‍💻 Development

### Running Locally
1. Start MongoDB (local or Atlas)
2. Start backend: `cd backend && npm start`
3. Start frontend: `cd frontend && npm run dev`
4. Open `http://localhost:5173`

### Building for Production
- Frontend: `cd frontend && npm run build`
- Backend: Already production-ready

---

Built with ❤️ using React, Node.js, and Socket.IO

