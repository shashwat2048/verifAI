# VerifAI - AI-Powered Deepfake Detection

VerifAI is a Next.js application that provides AI-powered deepfake detection and media authenticity verification for images and text, powered by Google Gemini AI.

## 🚀 Tech Stack

### Core Framework
- **Next.js** `^15.5.3` - React framework with App Router
- **React** `19.1.0` - UI library
- **React DOM** `19.1.0` - React rendering
- **TypeScript** `^5` - Type-safe JavaScript
- **Node.js** `24.x` - Runtime environment (required)

### UI Libraries & Styling

#### CSS Framework
- **Tailwind CSS** `^4` - Utility-first CSS framework
- **@tailwindcss/postcss** `^4` - PostCSS plugin for Tailwind
- **tw-animate-css** `^1.3.6` - Tailwind animation utilities

#### Component Libraries
- **shadcn/ui** - Component library (configured via `components.json`)
  - Style: `new-york`
  - Base color: `neutral`
  - Icon library: `lucide`
- **Radix UI** - Headless UI primitives
  - `@radix-ui/react-dropdown-menu` `^2.1.16`
  - `@radix-ui/react-slot` `^1.2.4`

#### Icons
- **lucide-react** `^0.539.0` - Icon library (primary)
- **@tabler/icons-react** `^3.35.0` - Additional icon set

#### Animation Libraries
- **motion** `^12.23.16` - Animation library
- **gsap** `^3.14.1` - GreenSock Animation Platform

#### UI Utilities
- **class-variance-authority** `^0.7.1` - Component variant management
- **clsx** `^2.1.1` - Conditional class names
- **tailwind-merge** `^3.3.1` - Merge Tailwind classes intelligently
- **next-themes** `^0.4.6` - Dark mode theme provider

#### Notifications & Feedback
- **sonner** `^2.0.7` - Toast notification system

#### Forms & File Handling
- **react-hook-form** `^7.63.0` - Form state management
- **react-dropzone** `^14.3.8` - File drag & drop handling

### Authentication & Authorization

- **@clerk/nextjs** `6.32.0` - Authentication and user management
- **next-auth** `^4.24.11` - Additional authentication support
- **@auth/prisma-adapter** `^2.10.0` - Prisma adapter for NextAuth
- **jsonwebtoken** `^9.0.2` - JWT token generation and verification
- **@types/jsonwebtoken** `^9.0.10` - TypeScript types for JWT

### Database & ORM

- **Prisma** `^6.13.0` - Next-generation ORM
- **@prisma/client** `^6.13.0` - Prisma Client
- **mongodb** `^6.18.0` - MongoDB driver (database provider)

### API & GraphQL

- **@apollo/server** `^5.0.0` - GraphQL server
- **@as-integrations/next** `^4.0.0` - Apollo Server integration for Next.js
- **graphql-request** `^7.2.0` - GraphQL client
- **graphql-tag** `^2.12.6` - GraphQL query parsing

### AI & Machine Learning

- **@google/genai** `^1.30.0` - Google Gemini AI SDK for deepfake detection and text analysis

### Cloud Services & Storage

- **cloudinary** `^2.7.0` - Cloud-based image and video management
- **next-cloudinary** `^6.16.0` - Next.js integration for Cloudinary

### Payment Processing

- **razorpay** `^2.9.6` - Payment gateway integration

### Webhooks & Integrations

- **svix** `^1.76.1` - Webhook signature verification (used for Clerk webhooks)

### Performance & Analytics

- **@vercel/speed-insights** `^1.2.0` - Vercel Speed Insights integration

### Additional Libraries

- **ogl** `^1.0.11` - WebGL library for advanced graphics

### Development Dependencies

- **eslint** `9.39.1` - Linting tool
- **eslint-config-next** `16.0.5` - Next.js ESLint configuration
- **@types/node** `^20` - TypeScript types for Node.js
- **@types/react** `^19` - TypeScript types for React
- **@types/react-dom** `^19` - TypeScript types for React DOM
- **tsx** `^4.20.3` - TypeScript execution engine

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** `24.x` (required - specified in `engines`)
- **npm** or **yarn** or **pnpm** or **bun** (package manager)
- **MongoDB** database (local or cloud instance)

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Required Environment Variables

```env
# Database
DATABASE_URL="mongodb://localhost:27017/verifai" # or your MongoDB connection string

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
CLERK_WEBHOOK_SECRET="your_clerk_webhook_secret"

# Google Gemini AI
GOOGLE_API_KEY="your_google_api_key" # or GEMINI_API_KEY
GEMINI_API_KEY="your_gemini_api_key" # alternative name
GEMINI_API_KEY_2="your_secondary_gemini_api_key" # optional fallback
GEMINI_MODEL="gemini-2.0-flash-exp" # optional, defaults to gemini-2.0-flash-exp

# Cloudinary (Image Storage)
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
# OR use individual variables:
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# GraphQL (if using external GraphQL endpoint)
GQL_URL="your_graphql_endpoint_url" # optional

# Application URL (for metadata and social sharing)
NEXT_PUBLIC_APP_URL="https://your-domain.com" # defaults to production URL

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID="your_razorpay_key_id" # optional
RAZORPAY_KEY_SECRET="your_razorpay_key_secret" # optional
```

## 📦 Installation

### Step 1: Verify Prerequisites

Check if Node.js 24.x is installed:
```bash
node --version  # Should be v24.x.x
npm --version   # Should be 10.x.x or higher
```

If Node.js is not installed or wrong version:
```bash
# Using nvm (Node Version Manager) - Recommended
nvm install 24
nvm use 24

# Or download from https://nodejs.org/
```

### Step 2: Clone the Repository

```bash
git clone <repository-url>
cd verifAI
```

### Step 3: Install Dependencies

Choose your package manager:

**Using npm:**
```bash
npm install
```

**Using yarn:**
```bash
yarn install
```

**Using pnpm:**
```bash
pnpm install
```

**Using bun:**
```bash
bun install
```

> **Note:** The `postinstall` script will automatically run `prisma generate` after installation.

### Step 4: Set Up MongoDB

**Option A: Local MongoDB**

Install MongoDB locally:
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install -y mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

Start MongoDB service:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# MongoDB starts automatically as a service
```

**Option B: MongoDB Atlas (Cloud)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string from the Atlas dashboard

### Step 5: Create Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Create the file
touch .env.local

# Or copy from example (if exists)
cp .env.example .env.local
```

Edit `.env.local` and add all required variables (see [Environment Variables](#-environment-variables) section above).

**Quick setup command (replace with your actual values):**
```bash
cat > .env.local << EOF
DATABASE_URL="mongodb://localhost:27017/verifai"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
CLERK_WEBHOOK_SECRET="your_clerk_webhook_secret"
GOOGLE_API_KEY="your_google_api_key"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF
```

### Step 6: Set Up Database Schema

Generate Prisma Client:
```bash
npx prisma generate
```

Push schema to database (creates tables/collections):
```bash
npx prisma db push
```

**Alternative: Use migrations (for production)**
```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy
```

Verify database connection:
```bash
npx prisma studio
# Opens Prisma Studio at http://localhost:5555
```

### Step 7: Run the Development Server

**Using npm:**
```bash
npm run dev
```

**Using yarn:**
```bash
yarn dev
```

**Using pnpm:**
```bash
pnpm dev
```

**Using bun:**
```bash
bun dev
```

The server will start at [http://localhost:3000](http://localhost:3000)

### Step 8: Verify Installation

1. **Check if the server is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **Verify Prisma Client:**
   ```bash
   npx prisma validate
   ```

3. **Check for TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

4. **Run linter:**
   ```bash
   npm run lint
   ```

### Troubleshooting

**Issue: Prisma Client not found**
```bash
npx prisma generate
```

**Issue: MongoDB connection failed**
```bash
# Check if MongoDB is running
# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod

# Test connection
mongosh "mongodb://localhost:27017"
```

**Issue: Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: Port 3000 already in use**
```bash
# Kill process on port 3000
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

**Issue: Environment variables not loading**
```bash
# Ensure .env.local exists in root directory
ls -la .env.local

# Restart the dev server after adding env variables
```

## 🏗️ Project Structure

```
verifAI/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (client)/          # Client route group
│   │   ├── analyze/           # Analysis page
│   │   ├── api/               # API routes
│   │   │   ├── analyze/       # Image analysis endpoint
│   │   │   ├── graphql/       # GraphQL API
│   │   │   ├── profile/       # User profile API
│   │   │   ├── users/         # User management API
│   │   │   └── webhooks/      # Webhook handlers (Clerk, Stripe)
│   │   ├── reports/           # Reports page
│   │   └── sign-in/           # Authentication pages
│   ├── components/            # React components
│   │   ├── ui/                # UI components (shadcn/ui)
│   │   └── ...                # Other components
│   ├── lib/                   # Utility functions
│   ├── services/              # External service integrations
│   │   ├── cloudinary.ts      # Cloudinary service
│   │   ├── gql.ts            # GraphQL client
│   │   ├── jwt.ts            # JWT utilities
│   │   └── prisma.ts         # Prisma client
│   └── middleware.ts          # Next.js middleware
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── components.json            # shadcn/ui configuration
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🗄️ Database Schema

The application uses MongoDB with Prisma ORM. Key models:

- **User** - User accounts synced from Clerk
- **Scan** - Analysis results and reports

See `prisma/schema.prisma` for the complete schema definition.

## 🔑 Key Features

- **Deepfake Detection** - Analyze images for AI generation and manipulation
- **Text Analysis** - Detect AI-generated text and fact-checking
- **User Authentication** - Clerk-based authentication with webhook sync
- **GraphQL API** - Flexible API for frontend and external integrations
- **Image Storage** - Cloudinary integration for persistent image storage
- **Theme Support** - Dark/light mode with next-themes
- **Responsive Design** - Mobile-first design with Tailwind CSS

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Prisma generation)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run postinstall` - Auto-generate Prisma Client after install

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The application is configured for Vercel deployment with:
- Automatic Prisma Client generation
- Speed Insights integration
- Optimized Next.js build

### Other Platforms

Ensure:
- Node.js 24.x is available
- Environment variables are set
- MongoDB connection is accessible
- Prisma Client is generated during build (`postinstall` script handles this)

## 🔐 Security Notes

- Never commit `.env.local` or any files containing secrets
- Keep API keys secure and rotate them regularly
- Use Clerk webhook secrets to verify webhook authenticity
- JWT tokens are used for additional authentication layers

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Google Gemini AI Documentation](https://ai.google.dev/docs)

## 📝 License

[Add your license information here]

## 🤝 Contributing

[Add contributing guidelines here]

---

Built with ❤️ using Next.js, React, and Google Gemini AI
