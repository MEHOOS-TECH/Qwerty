# 🌌 NexusVault — Student Cloud Workspace

A modern, browser-based personal cloud storage app for students. Each user gets a private password-protected vault with auto-sorted folders, file preview, and an integrated AI assistant powered by Claude.

## ✨ Features

- **Private Vaults** — any password creates an isolated vault stored locally
- **Auto-sorted Folders** — Documents, Pictures, Videos, Audio, Projects, Assignments, Downloads
- **File Preview** — images, video, audio, PDFs, and text/code files
- **AI Assistant** — Claude-powered chatbot for homework help, coding, and more
- **Admin Panel** — hidden dashboard (tap logo 17× to access)
- **Dark / Light Theme** — toggle with the 🌙/☀️ button
- **Drag & Drop Upload** — with real-time progress indicator
- **Search, Star & Sort** — global search, starred files, multiple sort modes
- **Responsive** — works on desktop and mobile

## 🚀 Deploy to GitHub Pages

1. Fork or push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)` folder
4. Visit `https://<your-username>.github.io/<repo-name>/`

No build step required — pure HTML, CSS, and JavaScript.

## 📁 Project Structure

```
nexusvault/
├── index.html      # App shell & HTML structure
├── css/
│   └── style.css   # All styles, themes, animations
├── js/
│   └── app.js      # State management, vault logic, UI, AI chat
└── README.md
```

## 🤖 AI Assistant Setup

The AI chat uses the Anthropic API directly from the browser. To enable it:

1. Obtain an Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
2. **Important:** The API key is sent directly from the browser. For production use, proxy requests through a backend server to keep your key private.

Without an API key the rest of the app (storage, upload, preview, search) works fully.

## 🔑 Default Credentials

| Role  | Password      |
|-------|---------------|
| Demo student | `student123` |
| Design vault | `design456`  |
| Code vault   | `code789`    |
| Admin panel  | `nexusadmin` (tap logo 17× to open) |

> ⚠️ Passwords are used as vault keys. All data is stored in `localStorage` — private per browser, not synced across devices.

## 🛠️ Local Development

No build tooling needed. Just open `index.html` in a browser, or serve with any static file server:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

## 📄 License

MIT
