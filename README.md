# FindIt - Cross-Platform Lost & Found Platform

FindIt is a cross-platform Lost & Found platform built with Next.js (web) and planned React Native (mobile) that helps users report lost or found items and reunite people with their belongings.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── create-listing/    # Create new listing form
│   ├── lost/              # Lost items page
│   ├── found/             # Found items page
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── Navbar.tsx         # Navigation bar
│   ├── Footer.tsx         # Footer component
│   ├── ListingCard.tsx    # Listing display card
│   └── LoadingSpinner.tsx # Loading spinner component
├── lib/                   # Shared logic (web + mobile)
│   ├── types.ts           # TypeScript interfaces
│   ├── auth.ts            # Authentication functions
│   ├── listings.ts        # Listings API functions
│   └── storage.ts         # File upload functions
└── utils/                 # Utility functions
    └── supabaseClient.ts  # Supabase client configuration
```

## 🚀 Features

- **Cross-Platform Architecture**: Modular code structure for easy reuse between web and mobile
- **Authentication**: Email/password sign-up and sign-in with Supabase Auth
- **Listings Management**: Create, read, update, and delete lost/found item listings
- **Create Listings**: User-friendly form to add new lost or found items
- **Image Upload**: File upload to Supabase Storage with preview
- **Responsive Design**: Modern UI with Tailwind CSS
- **Real-time Updates**: Supabase real-time subscriptions (planned)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Mobile**: React Native with Expo (planned)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## 🔧 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd findit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Supabase Setup**
   - Create a new Supabase project
   - Create the `listings` table with the following schema:
     ```sql
     id: uuid (primary key)
     title: text
     description: text
     status: text ('lost' or 'found')
     location: text
     date: date
     image_url: text (optional)
     user_id: uuid (foreign key to auth.users)
     created_at: timestamp
     ```
   - Enable Row Level Security (RLS)
   - Add appropriate RLS policies
   - Create a storage bucket called `listing-images`
   - Set storage bucket permissions to allow authenticated users to upload

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Cross-Platform Architecture

The project is designed with a modular architecture to support both web and mobile platforms:

### Shared Logic (`/lib`)
- **Types**: TypeScript interfaces used across platforms
- **Auth Functions**: Authentication logic reusable in React Native
- **API Functions**: Database operations that work on both platforms

### Platform-Specific
- **Web**: Next.js pages and components in `/app` and `/components`
- **Mobile**: React Native screens and components (planned)

## 🔄 Development Workflow

1. **Add new features** in the `/lib` folder for cross-platform compatibility
2. **Create UI components** in `/components` for web-specific implementation
3. **Build pages** in `/app` using the shared logic
4. **Test thoroughly** before implementing in mobile version

## 🚧 Planned Features

- [ ] React Native mobile app
- [ ] Image upload functionality
- [ ] Real-time notifications
- [ ] Search and filtering
- [ ] User profiles
- [ ] Claim/contact system
- [ ] Push notifications

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support, email support@findit.com or create an issue in the repository.
