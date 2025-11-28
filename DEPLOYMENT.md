# Deployment Guide - UCU Fleet Management System

## Quick Deployment Options

### Option 1: Deploy to Vercel (Recommended - Easiest)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   Follow the prompts:
   - Login to Vercel (or create account)
   - Confirm project settings
   - Deploy!

3. **Your app will be live at**: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel Web Interface

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your repository or drag & drop the project folder
5. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click "Deploy"

### Option 3: Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

### Option 4: Use ngrok for Local Testing (Temporary)

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Start your dev server:
   ```bash
   npm run dev
   ```

3. In another terminal, create tunnel:
   ```bash
   ngrok http 3000
   ```

4. Use the ngrok URL provided (e.g., `https://abc123.ngrok.io`)

## Production Build

The application has been built successfully. The production files are in the `dist/` directory.

## Environment Variables

If you need to add environment variables (like API endpoints), create a `.env` file:
```
VITE_API_URL=your-api-url
```

## Notes

- Vercel provides automatic HTTPS
- Free tier includes:
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Custom domains
- The app will automatically rebuild on git push (if connected to GitHub)

















