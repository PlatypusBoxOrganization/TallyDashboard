# Dashboard Management System

A modern, responsive subscription management dashboard built with React, Firebase, and Tailwind CSS. This application provides comprehensive tools for managing user subscriptions, monitoring analytics, and handling user authentication.

## Features

- 📊 Real-time subscription analytics and tracking
- 👥 User management and authentication
- 💳 Subscription plan management
- 🎨 Dark/Light theme support
- 📱 Fully responsive design
- 🔍 Global search functionality
- 📈 Interactive charts and statistics
- 🔒 Secure Firebase integration

## Tech Stack

- **Frontend:** React
- **Styling:** Tailwind CSS
- **Authentication:** Firebase Auth
- **Database:** Firebase Firestore
- **Charts:** Chart.js
- **Routing:** React Router
- **State Management:** React Hooks

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account and project

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development

Run the development server:
```bash
npm run dev
```

### Production Build

Create a production build:
```bash
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Main application pages
├── services/      # API and service integrations
├── utils/         # Utility functions and helpers
├── css/          # Global styles and Tailwind config
├── charts/       # Chart configurations
└── firebaseConfig.js  # Firebase configuration
```

## Security

- Implements secure user authentication
- Uses environment variables for sensitive data
- Follows Firebase security best practices

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this project, via any medium, is strictly prohibited.
