# 🏋️‍♂️ LiftLog Pro

> A modern, AI-powered fitness tracking application built with React, TypeScript, and Supabase.

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3ECF8E.svg)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI_Coach-F9AB00.svg)](https://ai.google.dev/)

LiftLog Pro is designed for serious lifters who want to track their workouts meticulously and gain insights from an intelligent AI Coach. It provides a seamless mobile-first experience for logging sets, reps, and weights directly from the gym floor.

*(Add your awesome app screenshot here later: `![App Screenshot](./docs/screenshot.png)`)*

## ✨ Key Features

- **Smart Workout Logging**: Efficiently record exercises, sets, reps, weights, and mark dropsets. Includes date customization for backlogging.
- **AI Fitness Coach (Gemini AI)**: A built-in AI assistant that reads your physique profile (weight, BMI, goals) and analyzes your **last 14 days of workout logs** to provide hyper-personalized fitness, diet, and recovery advice.
- **Custom Exercise Management**: Create, edit, delete, and categorize your own custom exercises.
- **Interactive Dashboard**: Visualize your total weight volume, weekly progress, and workout frequency with dynamic charts.
- **Secure Authentication**: Email-based authentication managed securely via Supabase.
- **Row-Level Security (RLS)**: Strict database policies ensure users can only access and modify their own personal data.
- **Mobile-Friendly UI**: Optimized for mobile devices with a convenient bottom navigation bar and touch-friendly components.

## 🛠 Tech Stack

- **Frontend Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management & Fetching**: React Query (`@tanstack/react-query`)
- **Routing**: React Router DOM
- **Database & Auth**: Supabase (PostgreSQL)
- **AI Integration**: Google Gen AI SDK (`gemini-3-flash-preview`)
- **Charts**: Recharts

## 🚀 Getting Started

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/liftlog-pro.git
cd liftlog-pro
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add your API keys. You can use `.env.example` as a reference:

```env
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_GEMINI_API_KEY="your-google-gemini-api-key"
```

### 4. Database Setup (Supabase)
Ensure your Supabase project has the required tables (`exercises`, `workouts`, `workout_sessions`, `workout_templates`) and that **Row-Level Security (RLS)** policies are properly configured for each table to restrict actions to `auth.uid() = user_id`.

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

## 🌍 Deployment (Vercel)

This project is optimized for deployment on Vercel:
1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Add the 3 environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`) in the Vercel project settings.
4. Deploy!

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
