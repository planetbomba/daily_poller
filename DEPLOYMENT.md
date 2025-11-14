# Deployment Guide

This app can be deployed to various platforms. Here are the recommended options:

## Option 1: Vercel (Recommended - Easiest)

### Prerequisites
- A GitHub account
- A Vercel account (free at vercel.com)

### Steps:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project
   - **Important:** Add your environment variable:
     - Go to Project Settings → Environment Variables
     - Add: `VITE_OPENAI_API_KEY` with your OpenAI API key value
   - Click "Deploy"

3. **Your app will be live!** Vercel will give you a URL like `your-app.vercel.app`

## Option 2: Netlify

### Steps:

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com) and sign in
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - **Add environment variable:**
     - Go to Site settings → Environment variables
     - Add: `VITE_OPENAI_API_KEY` with your OpenAI API key value
   - Click "Deploy site"

## Option 3: Cloudflare Pages

1. **Push to GitHub** (same as above)

2. **Deploy to Cloudflare Pages:**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to Pages → Create a project
   - Connect your GitHub repository
   - Build settings:
     - Framework preset: Vite
     - Build command: `npm run build`
     - Build output directory: `dist`
   - **Add environment variable:**
     - Go to Settings → Environment variables
     - Add: `VITE_OPENAI_API_KEY` with your OpenAI API key value
   - Click "Save and Deploy"

## Important Notes:

- **Never commit your `.env` file** - it's already in `.gitignore`
- **Always add `VITE_OPENAI_API_KEY` as an environment variable** in your deployment platform
- The app uses client-side OpenAI calls, so your API key will be visible in the browser. For production, consider:
  - Using a backend proxy to hide the API key
  - Setting up rate limiting
  - Using API key restrictions in OpenAI dashboard

## Quick Deploy with Vercel CLI (Alternative):

If you have Vercel CLI installed:

```bash
npm install -g vercel
vercel
```

Follow the prompts and add your environment variable when asked.

