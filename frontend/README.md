# CrowdMonitor Frontend

## Project Overview

CrowdMonitor is a real-time campus cafeteria seating monitoring application with AI-powered occupancy tracking.

## Getting Started

### Prerequisites

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Local Development

Follow these steps to run the project locally:

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the frontend directory
cd seat-smart-cam-main/frontend

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## Technologies Used

This project is built with:

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React 18** - UI library
- **shadcn/ui** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time bidirectional communication
- **React Router** - Client-side routing
- **React Hook Form** - Form state management
- **Zod** - Schema validation

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   ├── types/          # TypeScript type definitions
│   └── App.tsx         # Main application component
├── public/             # Static assets
└── index.html          # HTML entry point
```

## Features

- 🔐 Role-based authentication (Manager/User)
- 📊 Real-time seat occupancy tracking
- 📈 Occupancy history and analytics
- 🏢 Multiple place management
- 🖼️ Image upload for places
- 🌓 Dark/Light theme toggle
- 💬 Chatbot interface
- 📱 Responsive design

## Backend Integration

This frontend connects to a Node.js/Express backend running on `http://localhost:3001`

See the backend README for setup instructions.
