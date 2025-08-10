# Stormy Video - AI Video Generator Frontend

A modern React application for generating AI-powered promotional videos with a beautiful, responsive interface.

## Features

- 🎬 **AI Video Generation**: Create stunning promotional videos in seconds
- 🎨 **Custom Branding**: Upload logos and customize brand colors
- 📝 **Voice Scripts**: Add custom voice-over scripts
- 🎥 **Screen Recording Support**: Upload app clips and screen recordings
- ✨ **Beautiful UI**: Modern, responsive design with smooth animations
- 🔄 **Real-time Progress**: Live generation progress tracking
- 📱 **Mobile Responsive**: Works perfectly on all devices

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Radix UI** for accessible components
- **Class Variance Authority** for component variants

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Project Structure

```
frontend/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── VideoGeneratorForm.tsx
│   ├── GenerationLoader.tsx
│   └── VideoResult.tsx
├── styles/
│   └── globals.css   # Global styles and Tailwind config
├── public/           # Static assets
├── App.tsx          # Main application component
└── package.json     # Dependencies and scripts
```

## Usage

1. **Upload Assets**: Upload your logo and screen recording/app clip
2. **Describe Product**: Enter a detailed description of your product or service
3. **Customize**: Add voice scripts and choose brand colors
4. **Generate**: Click generate and watch the AI create your video
5. **Download**: Download your finished video or make edits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
