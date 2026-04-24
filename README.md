This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Docker Deployment

To build and deploy the application using Docker locally:

### Prerequisites
- Docker Desktop installed and running
- Node.js and npm installed

### Build and Deploy Steps

1. **Build the Next.js application:**
   ```bash
   npm run build
   ```

2. **Build the Docker image:**
   ```bash
   docker-compose build
   ```

3. **Start the container:**
   ```bash
   docker-compose up -d
   ```

4. **Check if the container is running:**
   ```bash
   docker-compose ps
   ```

5. **Access the application:**
   Open `https://localhost:3030` with your browser (you may need to accept the self-signed certificate warning).

### Additional Commands

- **Stop the container:**
  ```bash
  docker-compose down
  ```

- **View logs:**
  ```bash
  docker-compose logs -f
  ```

- **Rebuild and restart:**
  ```bash
  docker-compose down && docker-compose build --no-cache && docker-compose up -d
  ```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
