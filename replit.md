# TidyJacks Landing Page

## Overview
A professional window cleaning service landing page built with React, Vite, TypeScript, and Tailwind CSS. This is a responsive website for an Australian window cleaning business called TidyJacks that allows users to book window cleaning services online.

## Project Architecture
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS with custom animations
- **Components**: Modular React components (BookingForm, HeroDog)
- **Assets**: Dog mascot images and branding elements

## Key Features
- Responsive design for mobile and desktop
- **Complete booking and payment system with Stripe integration (Card + Afterpay)**
- **Multi-step booking flow: form → secure payment → email confirmations**
- **Owner availability scheduling (after 3pm weekdays, all day weekends)**
- **Professional email notifications to business and customers**
- **Complete before/after photo capture system with admin dashboard**
- **Direct camera access for taking photos from admin interface**
- **Automatic customer email delivery when both photos are captured**
- **Integrated object storage system for professional photo handling**
- Interactive booking form with service selection
- Animated hero section with mascot character
- Service pricing information ($79-$249 range)
- FAQ section
- Australian location targeting
- Professional branding and trust indicators

## Development Setup
- Development server runs on port 5000
- Configured for Replit proxy environment
- Hot module replacement enabled
- Build process generates optimized static files

## Deployment Configuration
- Target: Autoscale (suitable for static frontend)
- Build: `npm run build` (generates dist/ folder)
- Serve: Uses `serve` package to serve static files from dist/
- Production port: 5000

## Recent Changes
- 2025-09-14: **Live at www.tidyjacks.com** - Custom domain deployment completed with 🐾 paw emoji branding and name change from TidyJack to TidyJacks throughout entire application
- 2024-09-14: **Complete Pricing Structure Overhaul** - New residential pricing ($150-$360) and retail storefront pricing ($25-$60) with exterior-only options at 60% of full pricing
- **Smart Deposit Logic** - Deposit option (30% min $30) automatically hidden for low-cost services to prevent negative balances, with auto-switching to full payment
- **Enhanced Service Selection** - Organized dropdown with residential (inside & out), residential (exterior only), and retail categories
- **Deposit vs Full Payment Feature Completed** - Customers can choose deposit or full payment with intelligent availability based on service cost
- **Afterpay Integration** - Added "Pay in 4" installment payment option alongside card payments
- **Enhanced Security** - Server-side price validation, payment verification, and service validation with proper error handling
- Complete Stripe payment integration implemented
- Added secure payment processing with server-side validation
- Implemented multi-step booking flow (form → payment → confirmation)
- Updated email templates with payment confirmation details showing payment type and remaining balances
- Enhanced booking availability to match owner's schedule (after 3pm weekdays)
- Configured production-ready security measures and error handling
- Imported from GitHub and configured for Replit environment
- Fixed TypeScript JSX styling syntax issues
- Configured Vite dev server for Replit proxy support
- Set up deployment configuration for production

## User Preferences
- Clean, professional design maintained
- Australian market focus preserved
- Responsive design priority
- Fast loading performance important