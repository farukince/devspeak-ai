# DevSpeak AI

DevSpeak AI is an AI-powered training platform that helps software developers improve their communication and professional skills.

## 🎯 About the Project

DevSpeak AI is an interactive platform focused on helping developers enhance their soft skills alongside their technical knowledge. It provides real-time feedback and practice opportunities using Amazon Nova models from AWS Bedrock.

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 15.4.4 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Theme**: next-themes (Dark/Light mode)

### Backend & AWS Services
- **Authentication**: AWS Cognito (User Pool + Identity Pool)
- **Database**: AWS DynamoDB
- **AI Models**: Amazon Bedrock
  - **Nova Pro**: For complex tasks (interviews, code reviews)
  - **Nova Lite**: For simple tasks (standups, writing)
- **Region**: eu-central-1 (Frankfurt)
- **SDK**: AWS SDK v3

### Deployment
- **Hosting**: AWS Amplify
- **CI/CD**: GitHub Actions (optional)

## 📁 Project Structure

```
devspeak-ai/
├── app/                          # Next.js App Router
│   ├── api/                      # API Route Handlers
│   │   ├── code-review/          # Code review (Nova Pro)
│   │   ├── interview/            # Interview practice (Nova Pro)
│   │   ├── pair-programming/     # Pair programming (Nova Pro)
│   │   ├── standup/              # Standup practice (Nova Lite)
│   │   ├── writing/              # Writing practice (Nova Lite)
│   │   ├── networking/           # Networking practice (Nova Lite)
│   │   ├── log-session/          # Session logging (DynamoDB)
│   │   └── progress-data/        # Progress data (DynamoDB)
│   ├── auth/
│   │   └── callback/             # OAuth callback handler
│   ├── dashboard/                # Main dashboard
│   ├── login/                    # Login page (Cognito)
│   ├── modules/                  # Training modules
│   │   ├── code-review/
│   │   ├── interview/
│   │   ├── pair-programming/
│   │   ├── progress/
│   │   ├── standup/
│   │   └── writing/
│   ├── onboarding/               # User onboarding
│   ├── profile/                  # User profile
│   ├── settings/                 # Settings
│   ├── analytics/                # Analytics dashboard
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── progress.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   ├── ActivityHeatmap.tsx       # Activity heatmap
│   ├── DashboardLayout.tsx       # Dashboard wrapper
│   ├── FeedbackPanel.tsx         # AI feedback panel
│   ├── Navigation.tsx            # Main navigation
│   ├── ThemeToggle.tsx           # Dark/Light mode toggle
│   └── theme-provider.tsx        # Theme context provider
│
├── lib/                          # Core Utilities & AWS Clients
│   ├── awsConfig.ts              # AWS general configuration
│   ├── amplifyConfig.ts          # AWS Amplify configuration
│   ├── bedrockClient.ts          # Bedrock client (Nova Pro/Lite)
│   ├── cognitoClient.ts          # Cognito helper functions
│   ├── dynamoDBClient.ts         # DynamoDB client
│   ├── authHelpers.ts            # Authentication utilities
│   └── utils.ts                  # General utility functions
│
├── hooks/                        # Custom React Hooks
│   └── useSpeechSynthesis.ts     # Speech synthesis hook
│
├── public/                       # Static files
│   └── screenshots/              # Application screenshots
│
├── middleware.ts                 # Next.js middleware (Cognito auth)
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment (not in git)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

## 🚀 Features

### 1. Code Review
- AI-powered code review practice
- Real-time feedback
- Best practice recommendations
- Model: Amazon Nova Pro

### 2. Technical Interview Practice
- Realistic interview scenarios
- Algorithm and data structure questions
- Performance evaluation
- Model: Amazon Nova Pro

### 3. Pair Programming
- Virtual pair programming experience
- Code writing and problem solving
- Collaboration skills development
- Model: Amazon Nova Pro

### 4. Daily Standup Practice
- Standup meeting simulation
- Effective communication practice
- Team collaboration skills
- Model: Amazon Nova Lite

### 5. Professional Writing
- Technical documentation writing
- Email and communication skills
- Clear expression practice
- Model: Amazon Nova Lite

### 6. Networking Practice
- Professional networking scenarios
- Conference and event simulations
- Relationship building skills
- Model: Amazon Nova Lite

### 7. Progress Tracking & Analytics
- Detailed analytics dashboard
- Activity heatmap
- Performance metrics
- Module-based progress reports
- Data storage with DynamoDB

## 🔧 Installation

### Requirements
- Node.js 20.x or higher
- npm or yarn
- AWS account
- AWS CLI (optional but recommended)

### 1. Clone the Project
```bash
git clone <repository-url>
cd devspeak-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure AWS Services

#### 3.1 Create AWS Cognito User Pool
```bash
# AWS Console → Cognito → eu-central-1
# 1. Create User Pool
# 2. Enable email sign-in
# 3. Add custom attributes:
#    - custom:onboardingCompleted (Boolean)
#    - custom:preferredModules (String)
# 4. Create App Client
# 5. Add Domain
```

#### 3.2 Create DynamoDB Tables
```bash
# Table 1: devspeak-practice-sessions
aws dynamodb create-table \
  --table-name devspeak-practice-sessions \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=sessionId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region eu-central-1 \
  --global-secondary-indexes \
    "[{\"IndexName\":\"UserCreatedAtIndex\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]"

# Table 2: devspeak-users
aws dynamodb create-table \
  --table-name devspeak-users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-central-1
```

#### 3.3 Amazon Bedrock Model Access
```bash
# AWS Console → Bedrock → eu-central-1 → Model access
# Request access:
# - Amazon Nova Pro (eu.amazon.nova-pro-v1:0)
# - Amazon Nova Lite (amazon.nova-lite-v1:0)
```

### 4. Set Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# AWS Region
NEXT_PUBLIC_AWS_REGION=eu-central-1
AWS_REGION=eu-central-1
AWS_BEDROCK_REGION=eu-central-1

# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-central-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=eu-central-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=your-domain.auth.eu-central-1.amazoncognito.com

# DynamoDB
DYNAMODB_PRACTICE_SESSIONS_TABLE=devspeak-practice-sessions
DYNAMODB_USERS_TABLE=devspeak-users

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Start Development Server
```bash
npm run dev
```

The application will run at `http://localhost:3000`.

## 🔐 AWS Configuration Details

### Cognito User Pool
- **Region**: eu-central-1
- **Sign-in**: Email
- **Password Policy**: Minimum 8 characters
- **MFA**: Optional
- **Email Verification**: Active
- **Custom Attributes**:
  - `custom:onboardingCompleted` (Boolean)
  - `custom:preferredModules` (String)

### DynamoDB Tables

#### devspeak-practice-sessions
- **Partition Key**: userId (String)
- **Sort Key**: sessionId (String)
- **GSI**: UserCreatedAtIndex (userId + createdAt)
- **Attributes**:
  - moduleType (String)
  - taskName (String)
  - userInput (String)
  - aiFeedback (String)
  - scores (Map)
  - duration (Number)
  - createdAt (String - ISO timestamp)

#### devspeak-users
- **Partition Key**: userId (String)
- **Attributes**:
  - email (String)
  - firstName (String)
  - lastName (String)
  - fullName (String)
  - jobTitle (String)
  - birthday (String)
  - englishLevel (String)
  - onboardingCompleted (Boolean)
  - createdAt (String)
  - updatedAt (String)

### Bedrock Models

#### Amazon Nova Pro
- **Model ID**: `eu.amazon.nova-pro-v1:0`
- **Usage**: Complex tasks
  - Technical interviews
  - Code review
  - Pair programming
- **Pricing**: ~€0.80/1M input tokens, ~€3.20/1M output tokens

#### Amazon Nova Lite
- **Model ID**: `amazon.nova-lite-v1:0`
- **Usage**: Simple tasks
  - Stand-up feedback
  - Writing checks
  - Networking practice
- **Pricing**: ~€0.06/1M input tokens, ~€0.24/1M output tokens

## 📊 API Endpoints

| Endpoint | Method | Model | Description |
|----------|--------|-------|-------------|
| `/api/code-review` | POST | Nova Pro | Code review session |
| `/api/interview` | POST | Nova Pro | Interview practice session |
| `/api/pair-programming` | POST | Nova Pro | Pair programming session |
| `/api/standup` | POST | Nova Lite | Standup practice session |
| `/api/writing` | POST | Nova Lite | Writing practice session |
| `/api/networking` | POST | Nova Lite | Networking practice session |
| `/api/progress-data` | GET | - | User progress data |
| `/api/log-session` | POST | - | Session logging |

## 🎨 UI/UX Features

- **Dark/Light Mode**: Synced with system theme
- **Responsive Design**: Mobile, tablet, and desktop support
- **Accessibility**: ARIA labels and keyboard navigation
- **Modern UI**: shadcn/ui and Radix UI components
- **Smooth Animations**: Tailwind CSS animations
- **Loading States**: Skeleton loaders
- **Error Handling**: User-friendly error messages

## 🔒 Security

- **Authentication**: AWS Cognito JWT tokens
- **Authorization**: Route protection with middleware
- **HTTPS**: Required in production
- **Environment Variables**: Sensitive data management
- **CORS**: Configured CORS policy
- **Input Validation**: Validation in API routes
- **Rate Limiting**: AWS API Gateway (production)

## 📈 Performance

- **Next.js 15 Optimizations**: App Router, Server Components
- **Server-Side Rendering (SSR)**: Dynamic pages
- **Static Generation (SSG)**: Landing page
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Dynamic imports
- **Caching**: AWS CloudFront (production)

## 💰 Cost Estimation (Monthly)

### AWS Services (eu-central-1)

| Service | Usage | Cost (€) |
|---------|-------|----------|
| Cognito | 1,000 MAU | €0 (free up to 50k) |
| DynamoDB | 1GB storage, 1M reads, 500k writes | €1.50 |
| Bedrock Nova Pro | 5M input, 1M output tokens | €7.20 |
| Bedrock Nova Lite | 5M input, 1M output tokens | €0.54 |
| Amplify Hosting | 1 app, 100GB bandwidth | €15 |
| **Total** | | **~€24/month** |

### Scaling (10,000 users)
- Cognito: €0 (still free)
- DynamoDB: €15
- Bedrock: €80
- Amplify: €50
- **Total: ~€145/month**

## 🧪 Testing

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Build test
npm run build
```

## 🚀 Production Deployment

### Deploy with AWS Amplify

1. **AWS Console → Amplify**
2. **"New app" → "Host web app"**
3. **Connect GitHub repository**
4. **Build settings**:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```
5. **Add environment variables** (all .env.local values)
6. **Deploy**

### Deploy with Vercel (Alternative)
```bash
npm install -g vercel
vercel
```

## 🛠️ Development Notes

- **TypeScript Strict Mode**: Active
- **ESLint**: Next.js recommended config
- **Code Formatting**: Prettier (optional)
- **Git Hooks**: Husky for pre-commit (optional)
- **Commit Convention**: Conventional Commits (optional)

## 📝 Architecture Decisions

### Why AWS?
- **Scalability**: Automatic scaling
- **Reliability**: 99.99% uptime SLA
- **Cost**: 73% cheaper (compared to previous stack)
- **GDPR**: EU data residency (eu-central-1)
- **Integration**: All services in one ecosystem

### Why Amazon Nova?
- **Cost**: 75% cheaper than Claude
- **Performance**: Optimized for AWS regions
- **Integration**: Native AWS service
- **Two Tiers**: Pro (complex) + Lite (simple)

### Why Next.js 15?
- **App Router**: Modern routing
- **Server Components**: Less JavaScript
- **Streaming**: Faster page loads
- **TypeScript**: Type safety

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This is a private project.

## 📧 Contact

Please reach out for any questions.

## 🎉 Special Thanks

This project was a semi-finalist in the **10,000 AIdeas** competition!

---

**Note**: This project is fully integrated with AWS services. Supabase and Google Gemini dependencies have been removed.

**Last Update**: March 2026 - AWS Migration completed ✅
