# Svalekh - The Private Resume Builder

Svalekh is a 100% local, zero-server, privacy-first resume builder designed to outperform premium paid platforms. No subscriptions, no paywalls, and absolutely no data harvesting.

## The Problem
Modern resume builders hold your data hostage. They force you to create an account, harvest your personal information, and put PDF exports behind a $15/month paywall. To make matters worse, many secretly transmit your career history to third-party servers for AI processing.

## The Solution
Svalekh is built on a strict **local-first architecture**. It operates entirely within your browser's memory.

By eliminating the backend, we eliminate the privacy risk, the hosting costs, and the paywall. You get a State-of-the-Art (SOTA) layout engine, offline PWA capabilities, and enterprise-grade PDF parsing—all executing directly on your local machine.

## Core Features

- 🛡️ **Zero-Server Privacy:** No databases. No API calls. Your resume data never leaves your device.
- 📐 **WYSIWYG Layout Engine V2:** A fixed-width rendering pipeline guarantees that what you see on the screen is exactly what the printer outputs. No page-spillover. No margin clipping.
- 📄 **Local PDF Import:** Custom-built coordinate-mapping parser (via Mozilla's `pdf.js` worker) that reconstructs structured state from unstructured PDFs, directly in the browser.
- ⬛ **Granular Redaction Mode:** SOTA text redaction. Select specific metrics, client names, or sensitive data and black them out dynamically for public sharing.
- ⚡ **PWA Ready:** Install Svalekh directly to your desktop or mobile device. It works completely offline.
- 💾 **JSON Portability:** Export your entire resume state as a clean `.json` file and import it anytime to pick up exactly where you left off.

## Tech Stack

Built for speed and durability using modern web primitives:

- **Framework:** React + Vite
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Rich Text:** Tiptap Engine
- **PDF Parsing:** pdf.js (Local Worker)

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Installation

1. Clone the repository:

```bash
   git clone [https://github.com/KashishOO7/svalekh.git](https://github.com/KashishOO7/svalekh.git)

   cd open-resume-pro
   ```

2. Install dependencies:

```bash
   npm install
```

3. Start the development server:

```bash
   npm run dev
```

PWA & Offline Usage
Svalekh is a Progressive Web App (PWA). Once you visit the live site, your browser will cache the engine.

Desktop: Look for the "Install" icon in your browser's address bar (Chrome/Edge/Brave) to install Svalekh as a standalone desktop application.

Mobile: Tap "Share" and select "Add to Home Screen".

Offline: Once installed, you can disconnect from the internet and continue to build, parse, and export your resume.

License
This project is licensed under the AGPL-3.0 License - see the LICENSE file for details.

Svalekh was built to remain free and open. If you modify this software and distribute it over a network, you must release your modified source code under the same license to ensure the tool remains free for everyone.