# TopRev

**TopRev** - AI-powered code review tool that provides brutal, honest code analysis by top 0.1% Principal Engineers. Get technical insights, identify bugs, security vulnerabilities, and anti-patterns with actionable fixes.

Created by **Solahudeen Babatunde Abdulrahmon**

##  Features

- **AI-Powered Code Analysis**: Powered by Google Gemini AI, trained on top-tier engineering principles
- **Brutal Honest Reviews**: Get unfiltered, technically precise feedback on your code
- **Comprehensive Analysis**: Checks for:
  - Time & space complexity (Big O)
  - Memory leaks
  - Scalability bottlenecks
  - Security vulnerabilities
  - Architectural and design anti-patterns
- **Actionable Fixes**: Each review includes specific, beginner-friendly refactoring suggestions
- **Skill Level Assessment**: Get an estimate of your coding skill level
- **Score Rating**: Receive a 0-100 score based on code quality
- **Download Reviews**: Export your code reviews as PNG images
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Luxury UI**: Beautiful dark theme with amber/gold accents

##  Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York style)
- **AI Provider**: Google Gemini API (gemini-2.5-flash)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Image Export**: html-to-image
- **Validation**: Zod
- **Fonts**: 
  - Playfair Display (headings)
  - Geist Sans (UI)
  - Geist Mono (code)

##  Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

##  Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd toprev
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

##  Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_KEY` | Your API key | Yes |

## Usage

1. **Paste your code** in the left textarea
2. **Click "Decant Code"** to analyze
3. **Review the analysis** on the right side, which includes:
   - **Title**: A sarcastic, technical title for your code
   - **Diagnosis**: Technical explanation of what's wrong (or right)
   - **Fix**: Actionable improvement with before/after examples
   - **Level**: Estimated skill level (Junior, Mid-Level, Senior, etc.)
   - **Score**: Code quality rating (0-100)
4. **Download** the review as a PNG image if needed

## API Endpoint

### POST `/api/decant`

Analyzes code and returns a review.

**Request:**
```json
{
  "code": "your code here"
}
```

**Response:**
```json
{
  "title": "The O(n²) Disaster",
  "diagnosis": "This nested loop creates quadratic time complexity...",
  "fix": "Use a HashMap to reduce complexity to O(1)...",
  "level": "Mid-Level",
  "score": 65
}
```

**Rate Limits:**
- 10 requests per minute per IP address
- Returns 429 status if exceeded

**Security Features:**
- Input validation with Zod
- Rate limiting
- Request size limits (100KB max)
- Request timeout (30 seconds)
- Secure error handling
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)

## Project Structure

```
toprev/
├── app/
│   ├── api/
│   │   └── decant/
│   │       └── route.ts          # API endpoint for code analysis
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Main page component
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── textarea.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   └── toast.tsx
│   └── TastingCard.tsx           # Code review display component
├── hooks/
│   └── use-toast.ts              # Toast notification hook
├── lib/
│   └── utils.ts                  # Utility functions
├── public/
│   └── toprev.png                # App icon/favicon
├── .env.local                    # Environment variables (not in git)
├── package.json
├── tsconfig.json
└── README.md
```

## Security

- **Input Validation**: Zod schema validation for all inputs
- **Rate Limiting**: In-memory rate limiting (10 req/min per IP)
- **Request Size Limits**: Maximum 100KB payload
- **Timeout Protection**: 30-second timeout for AI requests
- **Error Handling**: Secure error messages (no sensitive data leakage)
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Content-Type Validation**: Only accepts application/json

**Note**: For production, consider using Redis for distributed rate limiting.

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. **Add environment variables**
   - In Vercel project settings, add `API_KEY`

4. **Deploy**
   - Vercel will automatically deploy on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

Make sure to set the `API_KEY` environment variable in your deployment platform.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

##  License

This project is private and proprietary.

##  Author

**Solahudeen Babatunde Abdulrahmon**

- Software Engineer
- Code Reviewer

##  Contributing

This is a private project. Contributions are not currently accepted.

## Support

For issues or questions, please contact the author.

---

**TopRev** - Code Review by Top 0.1% Engineer
