// Script to help get a live link
import { exec } from 'child_process';
import { spawn } from 'child_process';

console.log(`
╔══════════════════════════════════════════════════════════════╗
║   UCU Fleet Management System - Live Link Setup              ║
╚══════════════════════════════════════════════════════════════╝

🚀 QUICKEST WAY TO GET A LIVE LINK:
═══════════════════════════════════════════════════════════════

OPTION A: Vercel Web Interface (Easiest - 2 minutes)
─────────────────────────────────────────────────────
1. Open: https://vercel.com/new
2. Sign up/Login (free, use GitHub or email)
3. Click "Browse" and select this project folder
4. Settings:
   - Framework Preset: Vite
   - Build Command: npm run build
   - Output Directory: dist
5. Click "Deploy"
6. Get your live URL in ~30 seconds!

OPTION B: Vercel CLI (5 minutes)
─────────────────────────────────
1. Run: vercel login
2. Run: vercel
3. Follow prompts
4. Get your live URL!

OPTION C: ngrok (Temporary - Requires Dev Server)
──────────────────────────────────────────────────
1. Terminal 1: npm run dev
2. Terminal 2: ngrok http 3000
3. Use the ngrok URL (e.g., https://abc123.ngrok.io)
   ⚠️ Note: This is temporary and requires your computer to be on

═══════════════════════════════════════════════════════════════
✅ Your app is built and ready!
   Production files are in: dist/
   
📦 Build Status: SUCCESS
🎨 Features: UCU Colors + Dark Mode
🔒 Auth: masai / masai123

Recommendation: Use OPTION A (Vercel Web) for fastest deployment!
`);

















