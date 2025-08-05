# 📚 Bookbook — Swap Smarter, Read Better

Bookbook is a full-stack web application that lets users discover, swap, and chat about books in their local area.  
It’s built for people who love reading and hate clutter. 🧠💥

- 🔐 JWT-based auth
- 💬 Real-time chat via Socket.io
- 🗺️ Location-aware book discovery
- 🕵️ Moderation tools + cron jobs
- ☁️ Cloudinary for book images
- ✨ Sass-powered UI, React frontend



## 🔧 Tech Stack

| Frontend         | Backend              | Other                  |
|------------------|----------------------|------------------------|
| React (Vite)     | Node.js + Express    | MongoDB Atlas          |
| React Router     | Mongoose             | Socket.io              |
| Leaflet + GeoJSON| Nodemailer           | Cloudinary             |
| SCSS/Sass        | JWT Auth             | Node-cron              |



## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (or local MongoDB)
- [Cloudinary Account](https://cloudinary.com/)
- A keyboard and curiosity 🤓



## 🚀 Getting Started

### 📁 Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your keys
npm run dev  # or: node server.js
```

Make sure your `MONGO_URL` is in full URI form, e.g.:

```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/bookswap?retryWrites=true&w=majority
```

### 🌐 Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# set VITE_API_URL (e.g. http://localhost:5000)
npm run dev
```

Visit: [`http://localhost:5173`](http://localhost:5173)


## 🧠 Project Features

- 🔒 Secure login/signup with hashed passwords
- 📸 Upload and preview book covers (via Cloudinary)
- 💌 Propose swaps and exchange (encrypted) messages 
- 🧭 Discover users near you (map-based search)
- 🕐 Daily maintenance via cron (cleans stale swaps, resets flags)
- 📊 Stats, metrics, and moderation tools
- 📫 Email notifications (swap responses, daily logs)

## 📬 Cron Jobs

You can manually run scheduled jobs:

```bash
node backend/scripts/swapCron.js
```

It handles:
- Expired swap cleanup
- Auto-unflagging of reported users
- Daily metric snapshots
- Emailing logs to your inbox (if configured)

## 🌍 Environment Variables

Both frontend and backend use `.env` files.  
Examples are provided: `backend/.env.example` and `frontend/.env.example`.

Backend keys include:

```env
MONGO_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
EMAIL_USER=
EMAIL_PASS=
NOTIFY_EMAIL=
FRONTEND_URL=
GEONAMES_USER=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MESSAGE_SECRET=
ENCRYPT_MESSAGES=
TZ=
```

Frontend keys:

```env
VITE_GEONAMES_USER=
VITE_SOCKET_URL=
VITE_API_URL=
```

## 🧪 Testing

_(Optional)_ You can write unit tests and integration tests using your preferred tools:  
- Jest, Mocha, Cypress, etc.

Coming soon: `tests/` folder with seeds and mocks.

## 🛠️ Scripts

Backend:

```bash
npm run dev             # starts server with nodemon
npm start               # runs server normally
npm run generate-integrity  # hashes env values
npm run check-integrity     # verifies env matches expected values
```

Frontend:

```bash
npm run dev             # Vite dev server
npm run build           # production build
npm run preview         # preview production
```

## 📽️ Demo

![BookBook Demo](./assets/bookbook-demo.gif)

## 📖 License

MIT.  
Just don't sell this as an NFT or claim it's AI-generated enlightenment.


*Built with too much coffee, not enough sleep, and an irrational love for books.*