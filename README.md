# Office Poller

A simple, single-page web application that generates fun, pop-culture-themed survey questions based on the current date to spark ideas for office whiteboard questions.

## Features

- 🎨 Beautiful, modern UI built with React and Tailwind CSS
- 🤖 Powered by OpenAI to generate creative, date-aware questions
- 📋 One-click copy to clipboard functionality
- 📱 Fully responsive design

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your OpenAI API key:**
   - Create a `.env` file in the root directory
   - Add your OpenAI API key:
     ```
     VITE_OPENAI_API_KEY=your_openai_api_key_here
     ```
   - You can get an API key from [OpenAI's website](https://platform.openai.com/api-keys)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

1. Open the application in your browser
2. Click the "✨ Generate Question" button
3. The app will generate a fun, pop-culture-themed survey question based on today's date
4. Click the copy icon to copy the question to your clipboard
5. Use it on your office whiteboard!

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **OpenAI API** - Question generation

## Notes

- The app uses OpenAI's `gpt-4o-mini` model for cost-effective question generation
- Questions are generated based on the current date to ensure relevance
- The API key is used client-side (for development), but in production you may want to use a backend proxy for security
