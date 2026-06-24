# 🕵️ Among Us — Find the Imposter

A real-time multiplayer **word deduction party game** inspired by Among Us. One player gets a different word — everyone else must figure out who the imposter is!

![Game Preview](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20NestJS-blueviolet?style=for-the-badge)
![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-black?style=for-the-badge)

---

## 🎮 How to Play

1. **Host** creates a room and shares the code
2. **Players** join using the room code (3–15 players)
3. Everyone gets a **secret word** — except the **Imposter**, who gets nothing
4. Players discuss and try to figure out who doesn't know the word
5. **Vote** for who you think the imposter is
6. Scores are tracked across rounds — most points wins!

---

## ✨ Features

- 🔴 **Real-time multiplayer** via Socket.IO
- 🎭 **Single imposter guarantee** with rotation (everyone takes a turn)
- 🗳️ **Voting system** with live vote progress
- 📊 **Scoreboard** persisted across rounds
- 🔄 **Auto-rejoin** — refresh the page and come right back
- 🌐 **Cloudflare tunnel** support for instant LAN/internet sharing
- 📱 **Mobile friendly** — no downloads needed
- 🎨 **13 word categories** — Animals, Food, Countries, Movies & more
- 👑 **Host controls** — kick players, change room code, pick category
- 💤 **Render cold-start screen** — shows waking status when server is sleeping

---

## 🗂️ Project Structure

```
among-us-for-fun/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/   # UI components (Home, Lobby, GamePlay, Voting, Results…)
│       ├── context/      # GameContext — global state & socket events
│       ├── hooks/        # useSocket — connection management
│       └── utils/        # constants, session helpers
│
├── server/          # NestJS backend
│   └── src/
│       ├── game/         # Gateway (WebSocket), Service, DTOs
│       └── words/        # Word lists & random word service
│
├── start.js         # 🚀 One-command launcher (server + client + Cloudflare tunnels)
└── package.json     # Root scripts
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- `cloudflared` (optional — for public sharing)

### Run everything with one command
```bash
npm start
```
This will:
1. Kill any processes on ports 3001 / 5173
2. Start the **NestJS backend** on `:3001`
3. Open a **Cloudflare tunnel** for the backend
4. Start the **Vite frontend** on `:5173` (with backend URL injected)
5. Open a **Cloudflare tunnel** for the frontend
6. Print the **shareable play link** 🎉

### Or run separately
```bash
# Terminal 1 — Backend
cd server
npm install
npm run dev

# Terminal 2 — Frontend
cd client
npm install
npm run dev
```

---

## 🌐 Deployment

| Service | What | Free Tier |
|---------|------|-----------|
| **Render** | NestJS backend (WebSocket) | ✅ (sleeps after 15 min inactivity) |
| **Vercel** | React frontend | ✅ |

### Environment Variables

**Frontend (`client/.env`):**
```env
VITE_SERVER_URL=https://your-backend.onrender.com
```

**Backend:** No env vars needed — runs on port `3001` by default.

### Render cold-start
The free tier server sleeps when inactive. The client shows a **"Server Waking Up"** screen with a progress bar and live timer until the connection is established — usually **20–50 seconds**.

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 6, Vanilla CSS |
| Backend | NestJS, Socket.IO, TypeScript |
| Realtime | WebSocket / Socket.IO |
| Hosting | Render (backend) + Vercel (frontend) |
| Tunneling | Cloudflare Tunnel (`cloudflared`) |

---

## 📋 Word Categories

🎲 Anything · 🍎 Fruits · 🐾 Animals · 📱 Electronics · 🚗 Vehicles  
⚽ Sports · 🎨 Colors · 🌍 Countries · 🍕 Food · 👕 Clothing  
🎵 Instruments · 🔧 Objects · 🎬 Movies

---

## 🧑‍💻 Development Notes

- **Imposter rotation** — each player is guaranteed to be imposter once before anyone repeats
- **Session persistence** — `playerId` + `roomCode` saved to `localStorage` for auto-rejoin
- **Host authority** — all privileged actions (start game, kick, restart) are server-verified
- **No auto-redirect** — results screen stays until host manually proceeds

---

## 📄 License

MIT — have fun with it! 🎉
