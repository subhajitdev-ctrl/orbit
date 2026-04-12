# ORBIT: Mental Health & Expert Mentorship

ORBIT is a high-performance, AI-driven mental health and mentorship application designed to help users manifest their goals, track their moods, and receive expert guidance through advanced AI integration.

## Features

- **AI Mentorship Chat**: Real-time expert guidance powered by Google Gemini, featuring voice synthesis and multi-modal support.
- **Vision Board**: AI-generated art for affirmations and goal visualization.
- **Mood & Bio-Insights**: Track your emotional well-being and receive data-driven insights.
- **Daily Rituals**: Build consistent habits with a gamified ritual tracker.
- **PWA Ready**: Installable on Android and iOS for a native app experience.
- **Monetization**: Integrated AdMob/AdSense support for free users.
- **Firebase Backend**: Secure, real-time data synchronization with Firestore and Firebase Auth.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS 4.
- **Animations**: Motion (formerly Framer Motion).
- **Icons**: Lucide React.
- **AI**: Google Gemini API (@google/genai).
- **Backend**: Firebase (Firestore, Authentication).
- **Charts**: Recharts.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- A Firebase project
- A Google Gemini API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/orbit-mental-health.git
   cd orbit-mental-health
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key"
   VITE_ADSENSE_CLIENT_ID="your_adsense_client_id"
   VITE_ADSENSE_SLOT_ID="your_adsense_slot_id"
   ```

4. **Firebase Configuration**:
   Ensure your `firebase-applet-config.json` contains your Firebase project credentials.

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Build for production**:
   ```bash
   npm run build
   ```

## Deployment

The app is optimized for deployment on **Cloud Run** or any static hosting provider (Vercel, Netlify, Firebase Hosting).

## License

This project is licensed under the MIT License.
