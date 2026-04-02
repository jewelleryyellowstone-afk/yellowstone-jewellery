# YellowStone Jewellery E-commerce Platform

A comprehensive mobile-first D2C e-commerce platform built with Next.js 14, Firebase, and Razorpay.

## 🚀 Features

### Customer Website
- ✨ Mobile-first PWA (Progressive Web App)
- 🏠 Homepage with hero, categories, and bestsellers
- 🛍️ Product listing with filters and sorting
- 📦 Product detail pages with image gallery
- 🛒 Shopping cart with quantity management
- 💳 Secure checkout with Razorpay integration
- 👤 Customer account with order tracking
- 📱 WhatsApp support integration

### Admin Dashboard
- 📊 Real-time analytics dashboard
- 📦 Product management (CRUD operations)
- 🚚 Order management with status tracking
- 💰 Payment transaction logs
- 📈 Sales reports and analytics
- 🎨 Banner and CMS management
- ⚙️ Store settings configuration

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **Payments**: Razorpay
- **Logistics**: Shiprocket API (pluggable)
- **Hosting**: Firebase Hosting
- **Analytics**: Firebase Analytics

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- Razorpay account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
copy .env.local.example .env.local
```
Edit `.env.local` with your Firebase and Razorpay credentials.

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## 📱 Mobile-First Design

This platform is optimized for mobile devices with:
- Touch-friendly UI components (44px minimum touch targets)
- Mobile bottom navigation
- Sticky CTAs on product pages
- Responsive image optimization
- Fast loading and PWA capabilities

## 🔐 Security

- Firebase Authentication
- Firestore security rules
- Role-based access control (Admin/Customer)
- Secure payment processing via Razorpay

## 📄 License

Copyright © 2025 YellowStone Jewellery. All rights reserved.

## 🤝 Support

For technical support or questions, please contact: support@yellowstonejewellery.com
