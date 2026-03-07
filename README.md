# DevSpeak AI

DevSpeak AI, yazılım geliştiricilerin iletişim ve profesyonel becerilerini geliştirmelerine yardımcı olan AI destekli bir eğitim platformudur.

## 🎯 Proje Hakkında

DevSpeak AI, geliştiricilerin teknik bilgilerinin yanı sıra soft skill becerilerini de geliştirmelerine odaklanan interaktif bir platformdur. AWS Bedrock'un Amazon Nova modelleri kullanarak gerçek zamanlı geri bildirim ve pratik imkanı sunar.

## 🏗️ Teknoloji Stack

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
  - **Nova Pro**: Karmaşık görevler için (mülakat, kod inceleme)
  - **Nova Lite**: Basit görevler için (standup, yazma)
- **Region**: eu-central-1 (Frankfurt)
- **SDK**: AWS SDK v3

### Deployment
- **Hosting**: AWS Amplify
- **CI/CD**: GitHub Actions (opsiyonel)

## 📁 Proje Yapısı

```
devspeak-ai/
├── app/                          # Next.js App Router
│   ├── api/                      # API Route Handlers
│   │   ├── code-review/          # Kod inceleme (Nova Pro)
│   │   ├── interview/            # Mülakat pratiği (Nova Pro)
│   │   ├── pair-programming/     # Pair programming (Nova Pro)
│   │   ├── standup/              # Standup pratiği (Nova Lite)
│   │   ├── writing/              # Yazma pratiği (Nova Lite)
│   │   ├── networking/           # Networking pratiği (Nova Lite)
│   │   ├── log-session/          # Oturum kaydetme (DynamoDB)
│   │   └── progress-data/        # İlerleme verileri (DynamoDB)
│   ├── auth/
│   │   └── callback/             # OAuth callback handler
│   ├── dashboard/                # Ana dashboard
│   ├── login/                    # Giriş sayfası (Cognito)
│   ├── modules/                  # Eğitim modülleri
│   │   ├── code-review/
│   │   ├── interview/
│   │   ├── pair-programming/
│   │   ├── progress/
│   │   ├── standup/
│   │   └── writing/
│   ├── onboarding/               # Kullanıcı onboarding
│   ├── profile/                  # Kullanıcı profili
│   ├── settings/                 # Ayarlar
│   ├── analytics/                # Analitik dashboard
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/                   # React Bileşenleri
│   ├── ui/                       # shadcn/ui bileşenleri
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
│   ├── ActivityHeatmap.tsx       # Aktivite ısı haritası
│   ├── DashboardLayout.tsx       # Dashboard wrapper
│   ├── FeedbackPanel.tsx         # AI geri bildirim paneli
│   ├── Navigation.tsx            # Ana navigasyon
│   ├── ThemeToggle.tsx           # Dark/Light mode toggle
│   └── theme-provider.tsx        # Theme context provider
│
├── lib/                          # Core Utilities & AWS Clients
│   ├── awsConfig.ts              # AWS genel yapılandırması
│   ├── amplifyConfig.ts          # AWS Amplify yapılandırması
│   ├── bedrockClient.ts          # Bedrock client (Nova Pro/Lite)
│   ├── cognitoClient.ts          # Cognito helper fonksiyonlar
│   ├── dynamoDBClient.ts         # DynamoDB client
│   ├── authHelpers.ts            # Authentication utilities
│   └── utils.ts                  # Genel utility fonksiyonlar
│
├── hooks/                        # Custom React Hooks
│   └── useSpeechSynthesis.ts     # Ses sentezi hook
│
├── public/                       # Statik dosyalar
│   └── screenshots/              # Uygulama ekran görüntüleri
│
├── middleware.ts                 # Next.js middleware (Cognito auth)
├── .env.example                  # Environment değişkenleri şablonu
├── .env.local                    # Local environment (git'e eklenmez)
├── next.config.ts                # Next.js yapılandırması
├── tailwind.config.ts            # Tailwind yapılandırması
├── tsconfig.json                 # TypeScript yapılandırması
└── package.json                  # Proje bağımlılıkları
```

## 🚀 Özellikler

### 1. Kod İnceleme (Code Review)
- AI destekli kod inceleme pratiği
- Gerçek zamanlı geri bildirim
- Best practice önerileri
- Model: Amazon Nova Pro

### 2. Teknik Mülakat Pratiği (Interview Practice)
- Gerçekçi mülakat senaryoları
- Algoritma ve veri yapıları soruları
- Performans değerlendirmesi
- Model: Amazon Nova Pro

### 3. Pair Programming
- Sanal pair programming deneyimi
- Kod yazma ve problem çözme
- İşbirliği becerileri geliştirme
- Model: Amazon Nova Pro

### 4. Daily Standup Pratiği
- Standup toplantısı simülasyonu
- Etkili iletişim pratiği
- Takım çalışması becerileri
- Model: Amazon Nova Lite

### 5. Profesyonel Yazma (Writing)
- Teknik dokümantasyon yazma
- Email ve iletişim becerileri
- Açık ve net ifade pratiği
- Model: Amazon Nova Lite

### 6. Networking Pratiği
- Profesyonel networking senaryoları
- Konferans ve etkinlik simülasyonları
- İlişki kurma becerileri
- Model: Amazon Nova Lite

### 7. İlerleme Takibi & Analitik
- Detaylı analitik dashboard
- Aktivite ısı haritası (heatmap)
- Performans metrikleri
- Modül bazlı ilerleme raporları
- DynamoDB ile veri saklama

## 🔧 Kurulum

### Gereksinimler
- Node.js 20.x veya üzeri
- npm veya yarn
- AWS hesabı
- AWS CLI (opsiyonel ama önerilen)

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd devspeak-ai
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. AWS Servislerini Yapılandırın

#### 3.1 AWS Cognito User Pool Oluşturun
```bash
# AWS Console → Cognito → eu-central-1
# 1. User Pool oluştur
# 2. Email ile giriş aktif et
# 3. Custom attributes ekle:
#    - custom:onboardingCompleted (Boolean)
#    - custom:preferredModules (String)
# 4. App Client oluştur
# 5. Domain ekle
```

#### 3.2 DynamoDB Tabloları Oluşturun
```bash
# Tablo 1: devspeak-practice-sessions
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

# Tablo 2: devspeak-users
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

### 4. Environment Değişkenlerini Ayarlayın
```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:
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

### 5. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 🔐 AWS Yapılandırması Detayları

### Cognito User Pool
- **Region**: eu-central-1
- **Sign-in**: Email
- **Password Policy**: Minimum 8 karakter
- **MFA**: Opsiyonel
- **Email Verification**: Aktif
- **Custom Attributes**:
  - `custom:onboardingCompleted` (Boolean)
  - `custom:preferredModules` (String)

### DynamoDB Tabloları

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
- **Kullanım**: Karmaşık görevler
  - Technical interviews
  - Code review
  - Pair programming
- **Pricing**: ~€0.80/1M input tokens, ~€3.20/1M output tokens

#### Amazon Nova Lite
- **Model ID**: `amazon.nova-lite-v1:0`
- **Kullanım**: Basit görevler
  - Stand-up feedback
  - Writing checks
  - Networking practice
- **Pricing**: ~€0.06/1M input tokens, ~€0.24/1M output tokens

## 📊 API Endpoints

| Endpoint | Method | Model | Açıklama |
|----------|--------|-------|----------|
| `/api/code-review` | POST | Nova Pro | Kod inceleme oturumu |
| `/api/interview` | POST | Nova Pro | Mülakat pratiği oturumu |
| `/api/pair-programming` | POST | Nova Pro | Pair programming oturumu |
| `/api/standup` | POST | Nova Lite | Standup pratiği oturumu |
| `/api/writing` | POST | Nova Lite | Yazma pratiği oturumu |
| `/api/networking` | POST | Nova Lite | Networking pratiği oturumu |
| `/api/progress-data` | GET | - | Kullanıcı ilerleme verileri |
| `/api/log-session` | POST | - | Oturum kaydetme |

## 🎨 UI/UX Özellikleri

- **Dark/Light Mode**: Sistem teması ile senkronize
- **Responsive Design**: Mobil, tablet ve desktop desteği
- **Accessibility**: ARIA etiketleri ve klavye navigasyonu
- **Modern UI**: shadcn/ui ve Radix UI bileşenleri
- **Smooth Animations**: Tailwind CSS animasyonları
- **Loading States**: Skeleton loaders
- **Error Handling**: User-friendly hata mesajları

## 🔒 Güvenlik

- **Authentication**: AWS Cognito JWT tokens
- **Authorization**: Middleware ile route protection
- **HTTPS**: Production'da zorunlu
- **Environment Variables**: Hassas bilgi yönetimi
- **CORS**: Yapılandırılmış CORS policy
- **Input Validation**: API route'larında validation
- **Rate Limiting**: AWS API Gateway ile (production)

## 📈 Performans

- **Next.js 15 Optimizations**: App Router, Server Components
- **Server-Side Rendering (SSR)**: Dynamic pages
- **Static Generation (SSG)**: Landing page
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Dynamic imports
- **Caching**: AWS CloudFront (production)

## 💰 Maliyet Tahmini (Aylık)

### AWS Services (eu-central-1)

| Servis | Kullanım | Maliyet (€) |
|--------|----------|-------------|
| Cognito | 1,000 MAU | €0 (50k'ya kadar ücretsiz) |
| DynamoDB | 1GB storage, 1M reads, 500k writes | €1.50 |
| Bedrock Nova Pro | 5M input, 1M output tokens | €7.20 |
| Bedrock Nova Lite | 5M input, 1M output tokens | €0.54 |
| Amplify Hosting | 1 app, 100GB bandwidth | €15 |
| **Toplam** | | **~€24/ay** |

### Ölçeklendirme (10,000 kullanıcı)
- Cognito: €0 (hala ücretsiz)
- DynamoDB: €15
- Bedrock: €80
- Amplify: €50
- **Toplam: ~€145/ay**

## 🧪 Test

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Build test
npm run build
```

## 🚀 Production Deployment

### AWS Amplify ile Deploy

1. **AWS Console → Amplify**
2. **"New app" → "Host web app"**
3. **GitHub repository'yi bağla**
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
5. **Environment variables ekle** (tüm .env.local değerleri)
6. **Deploy**

### Vercel ile Deploy (Alternatif)
```bash
npm install -g vercel
vercel
```

## 🛠️ Geliştirme Notları

- **TypeScript Strict Mode**: Aktif
- **ESLint**: Next.js recommended config
- **Code Formatting**: Prettier (opsiyonel)
- **Git Hooks**: Husky ile pre-commit (opsiyonel)
- **Commit Convention**: Conventional Commits (opsiyonel)

## 📝 Mimari Kararlar

### Neden AWS?
- **Ölçeklenebilirlik**: Otomatik scaling
- **Güvenilirlik**: 99.99% uptime SLA
- **Maliyet**: %73 daha ucuz (önceki stack'e göre)
- **GDPR**: EU data residency (eu-central-1)
- **Entegrasyon**: Tüm servisler tek ekosistemde

### Neden Amazon Nova?
- **Maliyet**: Claude'dan %75 daha ucuz
- **Performans**: AWS region'larında optimize
- **Entegrasyon**: Native AWS servisi
- **İki Seviye**: Pro (karmaşık) + Lite (basit)

### Neden Next.js 15?
- **App Router**: Modern routing
- **Server Components**: Daha az JavaScript
- **Streaming**: Daha hızlı sayfa yükleme
- **TypeScript**: Type safety

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje özel bir projedir.

## 📧 İletişim

Sorularınız için lütfen iletişime geçin.

## 🎉 Özel Teşekkürler

Bu proje **10,000 AIdeas** yarışmasında yarı finalist olmuştur!

---

**Not**: Bu proje AWS servislerine tam entegre edilmiştir. Supabase ve Google Gemini bağımlılıkları kaldırılmıştır.

**Son Güncelleme**: Mart 2026 - AWS Migration tamamlandı ✅
