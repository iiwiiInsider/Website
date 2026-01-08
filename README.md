# BurnProjects Marketplace

A Next.js marketplace application for buying and selling items. Features a modern landing page, market listings with search/filter capabilities, and detailed property views.

## Features

- Modern, responsive design with gradient animations
- Market listings browse and search functionality
- Detailed property/item views with location and pricing
- Static site generation for GitHub Pages deployment
- Sample data for demonstration purposes

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
# Build static export for GitHub Pages
npm run build

# The output will be in the 'out' directory
```

## GitHub Pages Deployment

This site is configured to deploy to GitHub Pages automatically via GitHub Actions.

### Setup

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Under "Build and deployment", select **GitHub Actions** as the source
4. The workflow will automatically build and deploy on push to main/master

### Configuration

The site is configured with:
- Base path: `/Website` (matches the GitHub Pages URL structure)
- Static HTML export enabled
- Image optimization disabled (required for static export)
- Trailing slashes enabled for proper routing

## Project Structure

```
marketplace/
├── pages/
│   ├── index.js           # Landing page
│   ├── about.js           # About page
│   ├── market.js          # Market listings with search
│   └── property/[id].js   # Property detail page
├── components/
│   └── Navbar.js          # Navigation component
├── data/
│   └── properties.js      # Sample listing data
├── styles/
│   └── globals.css        # Global styles
└── .github/workflows/
    └── deploy.yml         # GitHub Actions deployment
```

## Key Pages

- **Landing Page** (`/`) - Hero section with call-to-action
- **About Page** (`/about`) - Company values and information
- **Market Page** (`/market`) - Browse and search listings
- **Property Details** (`/property/[id]`) - Individual listing details

## Live Demo

The marketplace is deployed on multiple platforms:

- **Vercel**: [https://website-murex-rho-80.vercel.app/](https://website-murex-rho-80.vercel.app/)
- **GitHub Pages**: [https://iiwiiinsider.github.io/Website/](https://iiwiiinsider.github.io/Website/)

## Contact

For inquiries: support@burnprojects.com

---

**BurnProjects** — Buy and sell items on the live market today