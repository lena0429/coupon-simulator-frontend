# Coupon Simulator Frontend

A minimal Vite + React + TypeScript application for the Coupon Simulator project.

## Prerequisites

- Node.js (v18+ recommended)
- npm

## Setup

1. Install dependencies:
```bash
npm install
```

## Running the App

### Development Mode
Start the development server with hot module replacement:
```bash
npm run dev
```
The app will be available at `http://localhost:5173` by default.

### Build for Production
Create an optimized production build:
```bash
npm run build
```

### Preview Production Build
Preview the production build locally:
```bash
npm run preview
```

## Features

- **Check Backend Health**: Click the button to test connectivity with the backend API at `http://localhost:3000/health`
- Displays JSON response or error messages

## Project Structure

```
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── ...
├── package.json         # Project dependencies and scripts
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```
