# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install  # Install dependencies
bun dev      # Start development server (runs Vite)
bun build    # Build for production
```

## Architecture Overview

This is a React-based web application that displays popular anime from 2006-2024 and allows users to track what they've watched. The app generates AI prompts and shareable images based on user selections.

### Key Components

- **src/app.tsx**: Main application component containing all UI logic
  - Manages anime selection state using `usePersistState` hook
  - Handles image generation via `modern-screenshot`
  - Generates AI prompts in two modes (normal/zako)
  
- **anime-data.ts**: Static data containing anime titles and scores by year
  - Format: `{ [year: string]: { title: string; score: number }[] }`
  
- **src/hooks.ts**: Custom React hooks
  - `usePersistState`: Persists state to localStorage

### Data Flow

1. Anime data is imported statically from `anime-data.ts`
2. User selections are persisted to localStorage
3. Selected anime are used to generate AI prompts
4. DOM can be exported as image using `modern-screenshot`

### External Dependencies

- **Tailwind CSS v4**: Styling (configured via Vite plugin)
- **Sonner**: Toast notifications
- **modern-screenshot**: DOM to image conversion
- **Cheerio**: HTML parsing (used in data scraping)

### Data Scraping

The `init-data.ts` file contains a script to scrape anime data from bgm.tv. This is not part of the main application but used to update the anime data.

## Development Notes

- The app runs on Bun runtime
- TypeScript is configured with strict mode
- React 19.1.0 with new JSX transform
- Vite handles all bundling and HMR
- The app is deployed at anime-sedai.egoist.dev