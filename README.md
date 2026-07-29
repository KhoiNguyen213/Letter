# Letters — A Place for Silent Reflections

Letters is a quiet, emotional, book-like web application designed for writing private thoughts, memories, gratitude, regrets, or untold words about people you have met in your life. It emphasizes premium dark aesthetics, generous spacing, book typography (EB Garamond, Libre Baskerville, Crimson Text), and minimal micro-animations.

It is designed strictly around **emotion, simplicity, and silence** — deliberately avoiding likes, follower systems, feeds, AI assistants, or social features.

---

## 🕯️ Key Features

1. **Dashboard Index**: Displays created letters like a private table of contents in a notebook.
2. **Beautiful Markdown Editor**: Supports markdown with live debounced autosave ("Saved just now").
3. **Sealed Envelope Shares**: Generates a memorable 3-word slug (e.g. `/letter/silent-river-echo`) and a hashed passcode.
4. **Time Capsule**: Locks letters until a chosen date in the future.
5. **One-Time Opening**: Restricts reading to a single successful view. The letter is faded and locked forever after.
6. **Voice Recording**: Directly records voice note reflections inside the browser.
7. **Background Music**: Allows attaching background audio tracks that start playing only on reader consent.
8. **One Reply**: Reader can submit a single private response. No conversation loops.
9. **Private Drafts**: Keeps letters local/draft until share is activated.

---

## 🛠️ Stack & Architecture

- **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion, Lucide icons, React Markdown.
- **Backend**: Node.js, Express.
- **Database**: MongoDB (Mongoose).
- **Security**: Bcrypt password hashing, owner JWT authentication.

---

## 🚀 Getting Started

### Prerequisites
1. Ensure **Node.js** (v18 or higher) is installed.
2. Ensure **MongoDB** is running locally on the standard port `27017` (e.g., `mongodb://127.0.0.1:27017/letters`).

### 1. Installation
Install root, backend, and frontend dependencies in one go:
```bash
npm run install-all
```
*(Or run `npm install` inside both the `/backend` and `/frontend` directories).*

### 2. Configure Environment variables
The backend environment is configured in `backend/.env`:
- `PORT`: `5000`
- `MONGO_URI`: `mongodb://127.0.0.1:27017/letters`
- `JWT_SECRET`: Token secret keys
- `OWNER_PASSWORD`: Owner passcode (default: `sunflower26`)

### 3. Run Locally
To run both the backend server (`localhost:5000`) and the Vite React server (`localhost:5173`) concurrently:
```bash
npm run dev
```

Log in using the passcode: **`sunflower26`**.
