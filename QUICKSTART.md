# Quick Start Guide

## Start Development Server

```bash
cd "c:\new new 2025\bnbohara"
npm run dev
```

Visit **http://localhost:3000**

## Initial Setup Steps

1. **Configure Firebase**:
   - Copy `.env.local.example` to `.env.local`
   - Add your Firebase credentials
   - See [SETUP.md](SETUP.md) for detailed instructions

2. **Create Admin User**:
   - Go to http://localhost:3000/login
   - Sign up with email from `ADMIN_EMAILS` in `.env.local`
   - Access admin dashboard at http://localhost:3000/admin

3. **Test Customer Flow**:
   - Browse products at http://localhost:3000/products
   - Add items to cart
   - Test checkout flow

## Key Pages

| Page | URL | Status |
|------|-----|--------|
| Home | / | ✅ Complete |
| Products | /products | ✅ Complete |
| Product Detail | /products/[id] | ✅ Complete |
| Cart | /cart | ✅ Complete |
| Checkout | /checkout | ✅ Complete |
| Login | /login | ✅ Complete |
| Account | /account | ✅ Complete |
| Admin Dashboard | /admin | ✅ Complete |

## Verified

✅ Next.js 14 builds successfully  
✅ Development server starts in ~5.5s  
✅ All dependencies installed  
✅ No build errors  
✅ Mobile-responsive  
✅ PWA ready  

## Next: Phase 2 Development

See [walkthrough.md](walkthrough.md) for full feature list and implementation details.

Continue development with:
- Admin product management (CRUD)
- Order management system
- Razorpay payment integration
- Customer order tracking
