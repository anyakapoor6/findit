# FindIt - AI-Powered Lost & Found Platform

FindIt is a comprehensive cross-platform Lost & Found platform built with Next.js that uses AI to match lost and found items. The platform features intelligent image matching, real-time notifications, and a modern responsive interface.

## 🚀 Features

### Core Functionality
- **AI-Powered Matching**: Advanced algorithm that matches lost and found items using multiple criteria
- **Image Recognition**: OpenAI CLIP embeddings for visual similarity matching
- **Real-time Notifications**: Email, web, and SMS notifications for matches
- **Interactive Map**: Google Maps integration for location-based searching
- **User Authentication**: Secure email/password authentication with Supabase
- **Responsive Design**: Mobile-first design that works on all devices

### Listing Management
- **Create Listings**: User-friendly form with image upload, categorization, and location picking
- **Edit/Delete**: Full CRUD operations for user listings
- **Image Processing**: Automatic cropping, compression, and embedding generation
- **Category System**: Organized item categories (pets, electronics, keys, etc.) with emojis
- **Location Tracking**: GPS coordinates and address-based location system

### AI Matching System
- **Multi-factor Scoring**: Combines category, subcategory, keywords, location, date, and visual similarity
- **Visual Embeddings**: OpenAI CLIP model for image similarity (512-dimensional vectors)
- **Smart Algorithms**: PostgreSQL functions for efficient match calculation
- **Match Reasons**: Detailed explanations of why items match
- **Confidence Scoring**: Percentage-based match confidence (0-100%)

### Notification System
- **Email Notifications**: Gmail API integration for automated emails
- **Web Notifications**: Browser-based push notifications
- **SMS Notifications**: Ready for Twilio/AWS SNS integration
- **Notification Center**: In-app notification management
- **Preference Management**: User-configurable notification settings

### User Experience
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Mobile Responsive**: Optimized for all screen sizes
- **Loading States**: Smooth loading animations and skeletons
- **Error Handling**: Comprehensive error handling and user feedback
- **Accessibility**: WCAG compliant design patterns

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Styled Components**: Component-level styling
- **React Icons**: Icon library for UI elements

### Backend & Database
- **Supabase**: Backend-as-a-Service (Auth, Database, Storage)
- **PostgreSQL**: Primary database with advanced functions
- **Row Level Security**: Secure data access policies
- **Real-time Subscriptions**: Live data updates

### AI & External APIs
- **OpenAI API**: CLIP embeddings for image similarity
- **Google Maps API**: Location services and mapping
- **Gmail API**: Email notifications
- **Replicate API**: Alternative AI services

### Development Tools
- **ESLint**: Code linting and formatting
- **Node.js**: Runtime environment
- **npm**: Package management

## 📋 Database Schema

### Core Tables

#### `listings`
```sql
- id: UUID (Primary Key)
- title: TEXT
- description: TEXT
- status: TEXT ('lost' | 'found')
- location: TEXT
- location_lat: DECIMAL
- location_lng: DECIMAL
- date: DATE
- image_url: TEXT
- image_embedding: VECTOR(512)
- user_id: UUID (Foreign Key)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- item_type: TEXT (category)
- item_subtype: TEXT (subcategory)
- extra_details: JSONB
```

#### `matches`
```sql
- id: UUID (Primary Key)
- listing_id: UUID (Foreign Key)
- matched_listing_id: UUID (Foreign Key)
- score: DECIMAL(3,2)
- match_reasons: TEXT[]
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `notifications`
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- type: TEXT
- message: TEXT
- listing_id: UUID (Foreign Key)
- claim_id: UUID (Foreign Key)
- is_read: BOOLEAN
- created_at: TIMESTAMP
```

#### `users`
```sql
- id: UUID (Primary Key)
- email: TEXT
- name: TEXT
- phone_number: TEXT
- notification_preferences: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Database Functions

#### `calculate_match_score(listing1_id, listing2_id)`
Calculates match score based on:
- Category match (30% weight)
- Subcategory match (20% weight)
- Keyword similarity (25% weight)
- Location match (15% weight)
- Date proximity (10% weight)
- Visual similarity (up to 30% bonus)

#### `find_matches_for_listing(new_listing_id)`
Automatically finds matches for new listings and stores them in the matches table.

#### `get_user_matches(user_id)`
Returns all matches for a user's listings with detailed information.

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Listings
- `GET /api/listings` - Fetch all listings
- `GET /api/listings/lost` - Fetch lost listings
- `GET /api/listings/found` - Fetch found listings
- `POST /api/listings` - Create new listing
- `PUT /api/listings/[id]` - Update listing
- `DELETE /api/listings/[id]` - Delete listing

### AI & Matching
- `POST /api/generate-embedding` - Generate image embeddings
- `GET /api/matches` - Get user matches
- `POST /api/matches/trigger` - Manually trigger matching

### Notifications
- `POST /api/send-email` - Send email notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/[id]/read` - Mark notification as read

### Contact & Support
- `POST /api/contact` - Contact form submission
- `GET /api/test-gmail` - Test Gmail API connection

## 🔑 Environment Variables

### Required Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API (for image embeddings)
OPENAI_API_KEY=sk-proj-your_openai_api_key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Gmail API (for email notifications)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token

# Alternative AI Services
REPLICATE_API_TOKEN=your_replicate_token
HUGGINGFACE_API_KEY=your_huggingface_key

# Email Services
RESEND_API_KEY=your_resend_api_key

# Application
NEXT_PUBLIC_APP_URL=your_app_url
```

### Optional Variables
```env
# Development
NODE_ENV=development
# Production
NODE_ENV=production
```

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google Cloud Console account
- OpenAI API account

### 2. Clone and Install
```bash
git clone <repository-url>
cd findit
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

### 4. Database Setup
```bash
# Run database setup scripts
npm run check-db
npm run run-sql setup-matches.sql
npm run run-sql add-image-embeddings.sql
npm run setup-notifications
```

### 5. Generate Embeddings
```bash
# For development
npm run update-embeddings

# For production
npm run update-embeddings-prod
```

### 6. Start Development
```bash
npm run dev
```

## 🔧 Configuration

### Supabase Setup
1. Create new Supabase project
2. Enable Row Level Security (RLS)
3. Create storage bucket `listing-images`
4. Set up RLS policies for secure access
5. Enable vector extension for embeddings

### Google Cloud Setup
1. Create Google Cloud project
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Configure OAuth consent screen
5. Get refresh token from OAuth Playground

### OpenAI Setup
1. Create OpenAI account
2. Generate API key
3. Configure billing for API usage
4. Test embedding generation

## 📱 Pages & Components

### Pages
- `/` - Home page with featured listings and map
- `/lost` - Lost items listings
- `/found` - Found items listings
- `/create-listing` - Create new listing form
- `/matches` - AI-generated matches
- `/profile` - User profile and settings
- `/auth` - Authentication pages
- `/contact` - Contact form
- `/map` - Interactive map view

### Key Components
- `Navbar` - Navigation with user menu and notifications
- `ListingCard` - Display card for listings with actions
- `LocationPicker` - Google Maps location selector
- `EditListingModal` - Modal for editing listings
- `SignInModal` - Authentication modal
- `LoadingSpinner` - Loading states
- `Footer` - Site footer

## 🤖 AI Matching Algorithm

### Scoring System
The AI matching algorithm uses a weighted scoring system:

1. **Category Match (30%)**: Same item category (pets, electronics, etc.)
2. **Subcategory Match (20%)**: Same subcategory (dog, cat, etc.)
3. **Keyword Similarity (25%)**: Common words in titles
4. **Location Match (15%)**: Same or nearby locations
5. **Date Proximity (10%)**: Items lost/found around same time
6. **Visual Similarity (Bonus)**: Image embedding similarity (up to 30%)

### Visual Embeddings
- Uses OpenAI CLIP model for 512-dimensional embeddings
- Cosine similarity for image comparison
- Automatic embedding generation on image upload
- Batch processing for existing listings

### Match Thresholds
- Minimum score: 20% (0.2)
- High confidence: 60%+ (0.6)
- Visual bonus: 70%+ similarity adds 30% to score

## 📧 Notification System

### Email Notifications
- Gmail API integration
- HTML email templates
- Automatic sending on match creation
- Contact form email forwarding

### Web Notifications
- Browser push notifications
- Permission management
- Click-to-navigate functionality
- Notification center integration

### SMS Notifications
- Ready for Twilio/AWS SNS integration
- Configurable message templates
- User preference management

## 🗺️ Map Integration

### Google Maps Features
- Interactive map with listing pins
- Location search and autocomplete
- GPS coordinate storage
- Distance-based filtering
- Map-home page linking

### Location Services
- Address geocoding
- Reverse geocoding
- Location validation
- Mobile GPS support

## 📊 Performance & Optimization

### Image Processing
- Automatic compression and resizing
- WebP format support
- Lazy loading
- Progressive image loading

### Database Optimization
- Indexed queries for fast matching
- Vector similarity search
- Efficient match calculation
- Connection pooling

### Frontend Optimization
- Code splitting
- Lazy component loading
- Optimized bundle size
- Service worker caching

## 🔒 Security Features

### Authentication
- Supabase Auth integration
- JWT token management
- Session persistence
- Secure password handling

### Data Protection
- Row Level Security (RLS)
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### API Security
- Rate limiting
- CORS configuration
- Environment variable protection
- Error message sanitization

## 🧪 Testing & Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run check-db     # Check database setup
npm run update-embeddings # Generate embeddings for existing listings
```

### Database Scripts
- `setup-matches.sql` - Create matching system
- `add-image-embeddings.sql` - Add embedding column
- `setup-notifications.sql` - Create notification tables
- `update-old-notifications.js` - Migrate old notifications

## 🚀 Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push
4. Set up custom domain

### Production Checklist
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Image embeddings generated
- [ ] Gmail API configured
- [ ] Google Maps API enabled
- [ ] OpenAI API key configured
- [ ] SSL certificate active
- [ ] Performance monitoring enabled

## 📈 Monitoring & Analytics

### Error Tracking
- Console error logging
- API error responses
- User feedback collection
- Performance monitoring

### Usage Analytics
- Page view tracking
- User engagement metrics
- Match success rates
- Notification delivery rates

## 🔄 Future Features

### Planned Enhancements
- [ ] React Native mobile app
- [ ] Push notifications
- [ ] Advanced search filters
- [ ] Social sharing
- [ ] Community features
- [ ] Reward system
- [ ] Multi-language support
- [ ] Dark mode theme

### AI Improvements
- [ ] Better visual matching
- [ ] Natural language processing
- [ ] Predictive analytics
- [ ] Smart categorization
- [ ] Duplicate detection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Email: finditcontact6@gmail.com
- GitHub Issues: Create an issue in the repository
- Documentation: Check the scripts/README.md for detailed setup guides

---

**FindIt** - Making lost and found easier with AI-powered matching technology.
