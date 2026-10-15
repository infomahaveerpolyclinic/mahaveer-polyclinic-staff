# Mahaveer — staff website

This portal uses the shared Mahaveer backend. Install Node.js 24, run `npm ci`, copy `.env.example` to `.env` and run `npm run dev`. The local URL is `http://localhost:5174` and `/api` proxies to the backend on port 4000.

Run `npm run build` and deploy only `dist/`. For a separate API domain, set `VITE_API_URL` to its HTTPS URL ending in `/api` before the build. The build generates security-header configuration for the chosen API origin. Private keys never belong in a frontend environment variable.

The supplied logo is a traced SVG in `public/logo.svg`; its shield is also the favicon. The website is connected to real API data with empty states, not sample records. Access requires an authorized clinic account; the API checks its role on every request.

Read the included deployment, feature, security and validation notes. Use the backend package and database package from this same connected edition; these websites are not compatible with the unmodified original API.
