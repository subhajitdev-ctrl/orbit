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
   VITE_ADSENSE_CLIENT_ID="ca-pub-XXXXXXXXXXXXXXXX"
   VITE_ADSENSE_SLOT_ID="XXXXXXXXXX"
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

### Vercel Deployment

This project is configured for seamless deployment on **Vercel**.

1.  **Environment Variables**: In your Vercel Dashboard, add the following secrets:
    -   `GEMINI_API_KEY`: Your Google Gemini API Key.
    -   `VITE_ADSENSE_CLIENT_ID`: Your AdSense Client ID (if applicable).
    -   `VITE_ADSENSE_SLOT_ID`: Your AdSense Slot ID (if applicable).
    -   `VITE_PAYPAL_CLIENT_ID`: Your PayPal Client ID.
    -   `PAYPAL_CLIENT_SECRET`: Your PayPal Client Secret.
    -   `PAYPAL_MODE`: Set to `sandbox` or `live`.

2.  **Serverless Support**: The app uses an Express backend proxied via Vercel Functions (as defined in `/api/index.ts` and `vercel.json`). This ensures your `GEMINI_API_KEY` and `PAYPAL_CLIENT_SECRET` remain secure on the server side.

3.  **Deployment**: Connect your GitHub repository to Vercel and it will automatically build and deploy.

### Cloud Run Deployment
The app is also optimized for **Cloud Run**. Simply use the provided `Dockerfile` or rely on Cloud Build's automatic detection of the `start` script in `package.json`.

## Google Play Store Publishing

To publish ORBIT as a native Android app:

1.  **Build the production web app**:
    ```bash
    npm run build
    ```
2.  **Initialize Capacitor**:
    ```bash
    npx cap init ORBIT com.orbit.mentalhealth
    npx cap add android
    ```
3.  **Sync the build**:
    ```bash
    npx cap sync
    ```
4.  **Open in Android Studio**:
    ```bash
    npx cap open android
    ```
5.  **Digital Asset Links**:
    Update `public/.well-known/assetlinks.json` with your app's SHA256 fingerprint from the Google Play Console to enable "Trusted Web Activity" features.

6.  **Icons**:
    Ensure you provide a 512x512 PNG icon in `/public` as many app stores require it.

## License

This project is licensed under the MIT License.
