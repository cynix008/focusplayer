# YT Next Player

A modern YouTube player web application built with Next.js, featuring URL-based video playback and channel video exploration.

## Features

- **URL Player**: Paste any YouTube URL (videos, shorts, live streams, embeds) and play it directly in an embedded player
- **Channel Explorer**: Discover and browse latest videos from YouTube channels using their RSS feeds
- **Custom Channels**: Add and manage your favorite channels for quick access
- **Responsive Design**: Clean, dark-themed UI that works on desktop and mobile
- **HTTPS Support**: Secure local development with self-signed certificates

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Deployment**: Docker + Nginx for production

## Prerequisites

- Node.js 20+
- npm or yarn
- Docker & Docker Compose (for containerized deployment)

## Local Development

1. **Clone the repository** (if not already done)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Generate SSL certificates** (for HTTPS):
   ```bash
   # On Windows (PowerShell)
   openssl req -x509 -newkey rsa:4096 -keyout localhost.key -out localhost.crt -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
   ```

4. **Run in development mode**:
   ```bash
   npm run dev
   ```
   The app will be available at `https://localhost:3000` (note: HTTPS required due to experimental HTTPS flag)

5. **Build for production** (optional):
   ```bash
   npm run build
   npm run start
   ```
   The app will be available at `http://localhost:3000`

## Docker Deployment

The application can be run in production using Docker Compose, which sets up the Next.js app and an Nginx reverse proxy with HTTPS.

1. **Build the Next.js application**:
   ```bash
   npm run build
   ```

2. **Ensure SSL certificates exist** in the project root:
   - `localhost.crt`
   - `localhost.key`

3. **Create Nginx configuration**:
   Create the directory `nginx/conf.d` and add a configuration file, e.g., `default.conf`:
   ```
   server {
       listen 443 ssl;
       server_name localhost;

       ssl_certificate /etc/nginx/certs/localhost.crt;
       ssl_certificate_key /etc/nginx/certs/localhost.key;

       location / {
           proxy_pass http://web:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```
   The app will be available at `https://localhost:3030`

## Usage

### Playing Videos
1. Navigate to the home page
2. Paste a YouTube URL in the input field
3. Click "Load" or press Enter
4. The video will embed and start playing

### Exploring Channels
1. Go to the "Channel Explorer" page
2. Enter a channel URL, ID (UC...), or username
3. Click "Load Latest Videos"
4. Browse the latest videos from that channel
5. Click on any video to play it

### Managing Custom Channels
- Use the "+ Add Channel" button to save frequently used channels
- Custom channels are stored in browser cookies
- Click on a channel button to quickly load its videos

## API Endpoints

- `GET /api/channel-videos?channelUrl=<url>`: Fetches latest videos from a YouTube channel's RSS feed

## Project Structure

```
├── app/
│   ├── api/channel-videos/          # API route for channel videos
│   ├── channel/                     # Channel explorer page
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home player page
├── nginx/conf.d/                    # Nginx configuration (for Docker)
├── public/                          # Static assets
├── docker-compose.yml               # Docker Compose setup
├── Dockerfile                       # Production Docker build
├── next.config.ts                   # Next.js configuration
└── package.json                     # Dependencies and scripts
```

## License

This project is private and for personal use.
