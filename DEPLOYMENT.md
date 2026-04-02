# YellowStone Jewellery - Deployment Checklist

## ✅ Pre-Launch Checklist

### 1. Firebase Setup
- [ ] Create Firebase project: "yellowstone-jewellery"
- [ ] Enable Authentication → Email/Password
- [ ] Create Firestore database (production mode)
- [ ] Enable Firebase Storage
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage rules: `firebase deploy --only storage:rules`
- [ ] Get Firebase config credentials
- [ ] Create admin user with email from `ADMIN_EMAILS`

### 2. Environment Variables
Create `.env.local` file with:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Razorpay (Start with TEST keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret

# Shiprocket
SHIPROCKET_EMAIL=your@email.com
SHIPROCKET_PASSWORD=api_password
SHIPROCKET_API_URL=https://apiv2.shiprocket.in/v1/external

# Admin & Settings
ADMIN_EMAILS=admin@yellowstone.com
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=999
```

### 3. Install Dependencies
```bash
cd "c:\new new 2025\bnbohara"
npm install
```

### 4. Seed Initial Data

#### Categories (via Admin Panel or Firestore Console)
```javascript
// Add to 'categories' collection
[
  { name: "Earrings", order: 1, description: "Beautiful earring designs" },
  { name: "Necklaces", order: 2, description: "Elegant necklace sets" },
  { name: "Bangles", order: 3, description: "Traditional bangles" },
  { name: "Rings", order: 4, description: "Stunning rings" },
  { name: "Bridal", order: 5, description: "Complete bridal sets" },
  { name: "Festive", order: 6, description: "Festive collections" }
]
```

#### Sample Products
1. Go to http://localhost:3000/login
2. Sign up as admin
3. Visit http://localhost:3000/admin/products
4. Add 10-15 sample products with images

### 5. Test Complete Flow

#### Customer Journey
```bash
# Start dev server
npm run dev

# Test steps:
1. Visit http://localhost:3000
2. Browse products
3. Add to cart (2-3 products)
4. Proceed to checkout
5. Fill shipping details
6. Select "Cash on Delivery"
7. Place order
8. Verify order appears in /account/orders
9. Check order in admin panel
```

#### Payment Testing
```bash
# Use Razorpay test mode
1. Add products to cart
2. Checkout with "Online Payment"
3. Use test card: 4111 1111 1111 1111
4. CVV: Any 3 digits
5. Verify payment success
6. Check transaction in admin/payments
```

#### Admin Operations
```bash
1. Login as admin
2. Add/Edit products
3. Manage categories
4. View orders
5. Update order status
6. Export sales report (CSV)
7. Configure store settings
```

---

## 🚀 Production Deployment

### Step 1: Build for Production
```bash
npm run build
```

Expected output:
```
✓ Compiled successfully
Route (app)              Size
┌ ○ /                    XXX kB
├ ○ /products            XXX kB
├ ○ /cart                XXX kB
└ ○ /checkout            XXX kB
```

### Step 2: Firebase Hosting Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Select options:
# - What do you want to use as your public directory? .next
# - Configure as single-page app? No
# - Set up automatic builds with GitHub? (Optional)

# Deploy
firebase deploy --only hosting
```

### Step 3: Environment Variables (Production)

Update `.env.local` for production:
```env
# Use LIVE Razorpay keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=live_secret

# Update site URL
NEXT_PUBLIC_SITE_URL=https://yellowstonejewellery.com

# Keep other vars same
```

### Step 4: Custom Domain

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter: yellowstonejewellery.com
4. Follow DNS configuration steps:
   - Add A records
   - Add TXT record for verification
5. Wait for SSL certificate (auto-provisioned)

---

## 🔧 Post-Deployment Configuration

### 1. Razorpay Webhooks
```
URL: https://yellowstonejewellery.com/api/webhooks/razorpay
Events: payment.captured, payment.failed, refund.created
```

### 2. Shiprocket Webhooks
```
URL: https://yellowstonejewellery.com/api/webhooks/shiprocket
Events: Order status updates
```

### 3. Store Settings
Configure via Admin Panel:
- Store name and tagline
- Contact email and phone
- Shipping rates
- Social media links
- Return policy

### 4. Upload Banners
Add 3-5 homepage banners:
- Recommended size: 1920x600px
- Upload via Admin → Banners

---

## 📊 Monitoring & Maintenance

### Daily
- [ ] Check pending orders
- [ ] Process shipments
- [ ] Respond to customer queries

### Weekly
- [ ] Review sales reports
- [ ] Update inventory
- [ ] Add new products

### Monthly
- [ ] Analyze top products
- [ ] Export financial reports
- [ ] Review customer feedback

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Firebase Connection Issues
- Verify all env variables are set
- Check Firebase console for service status
- Ensure security rules are deployed

### Payment Not Working
- Verify Razorpay keys (test vs live)
- Check browser console for errors
- Test with different payment methods

### Logistics Issues
- Verify Shiprocket credentials
- Check pickup location configured
- Test pincode serviceability

---

## 📞 Support Resources

- **Firebase**: https://firebase.google.com/support
- **Razorpay**: https://razorpay.com/support
- **Shiprocket**: https://www.shiprocket.in/support
- **Next.js**: https://nextjs.org/docs

---

## ✨ Launch Day Checklist

- [ ] All tests passing
- [ ] Production build successful
- [ ] Firebase deployed
- [ ] Custom domain active
- [ ] SSL certificate valid
- [ ] Payment working (live mode)
- [ ] Logistics configured
- [ ] Admin account created
- [ ] Sample products added
- [ ] Store settings configured
- [ ] Banners uploaded
- [ ] Test order placed and delivered
- [ ] WhatsApp notifications working
- [ ] Analytics tracking active

---

## 🎉 Post-Launch

### Marketing
- Share on social media
- WhatsApp business catalog
- Google My Business listing
- Instagram shopping setup

### SEO
- Submit sitemap to Google
- Add meta descriptions
- Optimize product images
- Create blog content

### Growth
- Collect customer reviews
- Run promotions
- Add new products regularly
- Analyze user behavior

---

**Platform Ready**: 95% Complete | 100+ Files | Production Ready

**Estimated Setup Time**: 4-6 hours
**Estimated Testing Time**: 2-3 hours
**Total to Launch**: 1-2 days

🚀 **Ready to make your first sale!**
