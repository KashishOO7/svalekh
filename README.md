# Svalekh (स्वलेख)

Svalekh is a 100% local, zero-server, privacy-first resume builder. It is designed to match the UI and UX of premium paid platforms without the paywalls, subscriptions, or data harvesting.

## The Problem

Modern resume builders operate on a hostage model. They force account creation, harvest your career history (often funneling it into third-party LLM training pipelines), and put standard PDF exports behind a $15/month paywall. 

## The Svalekh Approach

Svalekh is built on a strict **local-first architecture**. It has no backend. 

By eliminating the server, we eliminate the privacy risk, the hosting costs, and the paywall. Everything—from the rich-text editor to the PDF parser and ATS keyword scanner—executes directly within your browser's memory.

### SaaS Builders vs. Svalekh

| Feature | Traditional SaaS | Svalekh |
| :--- | :--- | :--- |
| **Account Required** | Yes | No |
| **Data Storage** | Remote Database | Local Browser / JSON Backup |
| **PDF Export** | Paid / Watermarked | Free & Native |
| **AI Data Harvesting** | Common | Impossible (Zero Server) |
| **Offline Support** | No | Yes (PWA) |

---

## Core Features

- 🛡️ **Absolute Privacy:** No API calls. No trackers. Your data never leaves your local machine.
- 📐 **WYSIWYG Rendering:** What you see on the canvas is exactly what the PDF engine prints. Strict layout constraints prevent page-spillover and margin clipping.
- 📄 **Local PDF Extraction:** Custom-built coordinate-mapping parser using Mozilla's `pdf.js` worker. It reconstructs structured text from uploaded PDFs entirely in the browser.
- ⬛ **Non-Destructive Redaction:** Select sensitive data (client names, metrics, phone numbers) and mask it with solid black bars (`█`) for public sharing. The real text is preserved in your private state but scrubbed from the final export.
- ⚡ **PWA Ready:** Install Svalekh directly to your desktop or mobile device. It caches the engine locally and works completely offline.
- 💾 **JSON Portability:** Export your workspace state as a `.json` file. Keep your backups on your own hard drive and drop them back in whenever you need to update your resume.

## Tech Stack

Built for durability and immediate execution using modern web primitives:

* **Framework:** React + Vite
* **State Management:** Zustand + Zundo (Temporal Undo/Redo)
* **Styling:** Tailwind CSS
* **Rich Text:** Tiptap Engine
* **PDF Parsing:** pdf.js (Local Web Worker)
* **PDF Generation:** @react-pdf/renderer

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Local Installation

1. Clone the repository:

   ```bash
   git clone [https://github.com/KashishOO7/svalekh.git](https://github.com/KashishOO7/svalekh.git)
   ```

2. Navigate to the project directory:

   ```bash
   cd svalekh
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

## PWA & Offline Usage

Svalekh is a Progressive Web App. Once you load it in your browser, the engine is cached.

**Desktop:** Click the "Install" icon in your browser's address bar (Chrome/Edge/Brave) to run Svalekh as a standalone window.

**Mobile:** Tap "Share" and select "Add to Home Screen".

**Offline:** Once cached, you can disconnect your Wi-Fi and continue to build, parse, and export resumes normally.

**License**
This project is licensed under the AGPL-3.0 License - see the LICENSE file for details.

_Svalekh_ was built to remain free and open. If you modify this software and distribute it or host it over a network, you must release your modified source code under the same license to ensure the tool remains free for everyone.