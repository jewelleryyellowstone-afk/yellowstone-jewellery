# YellowStone Jewellery - Setup Instructions

## Prerequisites

Before getting started, ensure you have:
- Node.js 18+ installed
- A Firebase account
- Razorpay account (for payments)
- Shiprocket account (for logistics) - Optional

## Step 1: Install Dependencies

```bash
cd "c:\new new 2025\bnbohara"
npm install
```

## Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "yellowstone-jewellery"
3. Enable the following services:
   - **Authentication**: Enable Email/Password provider
   - **Firestore Database**: Create in production mode
   - **Storage**: Enable default bucket
   - **Hosting**: Initialize (optional for deployment)

4. Get your Firebase configuration:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the configuration values

5. Deploy Firestore and Storage security rules:
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Step 3: Environment Variables

1. Copy the example file:
```bash
copy .env.local.example .env.local
```

2. Edit `.env.local` and fill in your credentials:

### Firebase Configuration
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Razorpay (Test Mode First)
Get keys from: https://dashboard.razorpay.com/app/keys
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```

### Admin Configuration
```env
ADMIN_EMAILS=your_email@example.com
```

### WhatsApp
```env
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
```

## Step 4: Create Admin User

1. Run the development server:
```bash
npm run dev
```

2. Open http://localhost:3000/login
3. Sign up with the email you set in `ADMIN_EMAILS`
4. The system will automatically mark you as admin

## Step 5: Seed Initial Data (Optional)

Create initial categories and sample products through the admin panel:

1. Go to http://localhost:3000/admin
2. Add categories: Earrings, Necklaces, Bangles, Rings, Bridal, Festive
3. Add sample products with images

## Step 6: Test the Application

### Customer Flow
1. Visit homepage: http://localhost:3000
2. Browse products
3. Add to cart
4. Complete checkout (use Razorpay test payment)

### Admin Flow
1. Visit admin: http://localhost:3000/admin
2. Add/edit products
3. Manage orders
4. View reports

## Step 7: Production Deployment

### Firebase Hosting

1. Build the application:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

### Environment Variables
- Switch Razorpay keys to production mode
- Update `NEXT_PUBLIC_SITE_URL` to your domain

### Domain Configuration
1. Go to Firebase Console → Hosting
2. Add custom domain: yellowstonejewellery.com
3. Follow DNS configuration instructions

## Troubleshooting

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Firebase Permission Errors
- Ensure security rules are deployed
- Check that admin email is correct in `.env.local`

### Payment Integration
- Verify Razorpay keys are correct
- Check browser console for errors

## Next Steps

1. **Add Products**: Populate your store with real products
2. **Configure Shiprocket**: Set up logistics integration
3. **Customize Design**: Update colors, fonts, and branding
4. **Enable Analytics**: Firebase Analytics is already integrated
5. **Set up Email**: Configure email notifications for orders

## Support

For issues or questions:
- Check Firebase Console logs
- Review browser console for errors
- Verify all environment variables are set correctly

## Production Checklist

- [ ] All environment variables configured
- [ ] Firebase security rules deployed
- [ ] Admin user created
- [ ] Products added
- [ ] Razorpay in production mode
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Test complete customer journey
- [ ] Test admin order management
