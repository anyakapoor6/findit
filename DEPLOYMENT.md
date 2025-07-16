# FindIt Deployment Guide

This guide explains how to manage both development and production environments for FindIt.

## 🌍 **Environment Overview**

You have **two separate environments**:

### **Development Environment**
- **Database**: Your local Supabase project
- **URL**: Local development (localhost:3000)
- **Purpose**: Testing and development

### **Production Environment** 
- **Database**: Production Supabase project (on Vercel)
- **URL**: https://findit-theta.vercel.app/
- **Purpose**: Live public site

## 🔧 **Setting Up Both Environments**

### **Step 1: Get Production Database Credentials**

1. Go to your **Vercel Dashboard**
2. Navigate to your FindIt project
3. Go to **Settings** → **Environment Variables**
4. Copy these values:
   - `NEXT_PUBLIC_SUPABASE_URL` (production)
   - `SUPABASE_SERVICE_ROLE_KEY` (production)

### **Step 2: Run Embeddings on Production Database**

Use the production script to generate embeddings for the production database:

```bash
# Method 1: Using environment variables
SUPABASE_URL=your_prod_supabase_url \
SUPABASE_SERVICE_KEY=your_prod_service_key \
OPENAI_API_KEY=your_openai_key \
npm run update-embeddings-prod

# Method 2: Create a temporary .env.production file
echo "SUPABASE_URL=your_prod_supabase_url" > .env.production
echo "SUPABASE_SERVICE_KEY=your_prod_service_key" >> .env.production
echo "OPENAI_API_KEY=your_openai_key" >> .env.production
npm run update-embeddings-prod
```

### **Step 3: Verify Both Environments**

**Development Environment:**
```bash
npm run dev
# Visit: http://localhost:3000
```

**Production Environment:**
- Visit: https://findit-theta.vercel.app/
- Test image matching functionality

## 🔄 **Workflow for Updates**

### **When Making Changes:**

1. **Develop locally** with your development database
2. **Test thoroughly** on localhost:3000
3. **Commit and push** changes to GitHub
4. **Vercel automatically deploys** to production
5. **Run production scripts** if needed (like embeddings)

### **Database Changes:**

- **Schema changes**: Run SQL scripts on both databases
- **Data migrations**: Use the production scripts
- **Embeddings**: Run on both environments separately

## 📊 **Environment Variables**

### **Development (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=your_dev_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_key
OPENAI_API_KEY=your_openai_key
# ... other dev variables
```

### **Production (Vercel Environment Variables)**
```env
NEXT_PUBLIC_SUPABASE_URL=your_prod_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key
OPENAI_API_KEY=your_openai_key
# ... other prod variables
```

## 🚀 **Deployment Checklist**

Before going live:

- [ ] **Development environment** fully tested
- [ ] **Production database** has all required tables
- [ ] **Image embeddings** generated on production
- [ ] **Environment variables** set in Vercel
- [ ] **Domain** configured (if using custom domain)
- [ ] **SSL certificate** active
- [ ] **Performance** tested on production

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"Missing environment variables"**
   - Check Vercel environment variables
   - Ensure all required variables are set

2. **"Database connection failed"**
   - Verify Supabase URL and keys
   - Check if database is accessible

3. **"Image matching not working"**
   - Run embedding script on production database
   - Check if `image_embedding` column exists

4. **"Deployment failed"**
   - Check build logs in Vercel
   - Verify all dependencies are installed

### **Useful Commands:**

```bash
# Check current environment
npm run dev          # Development
npm run build        # Test production build
npm run start        # Test production locally

# Database operations
npm run update-embeddings        # Development embeddings
npm run update-embeddings-prod   # Production embeddings

# Git operations
git status
git add .
git commit -m "your message"
git push origin main
```

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Check Supabase database logs
4. Test locally first, then on production

---

**Remember**: Always test changes locally before deploying to production! 