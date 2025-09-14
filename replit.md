# TidyJack Landing Page

## Overview
A professional window cleaning service landing page built with React, Vite, TypeScript, and Tailwind CSS. This is a responsive website for an Australian window cleaning business called TidyJack that allows users to book window cleaning services online.

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
- 2024-09-14: **Deposit vs Full Payment Feature Completed** - Customers can now choose to pay 30% deposit (minimum $30) or full amount upfront
- **Window Cleaning Specialization** - Business focus changed to window cleaning only with updated pricing tiers
- **Afterpay Integration** - Added "Pay in 4" installment payment option alongside card payments
- **Enhanced Security** - Server-side price validation and payment verification for both deposit and full amounts
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