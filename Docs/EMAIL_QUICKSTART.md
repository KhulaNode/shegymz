# Email Notifications - Quick Start

## ✅ What's Been Implemented

Your SheGymz application now has full email notification support using Plunk!

### Automated Emails

1. **When a user submits the subscription form:**
   - ✉️ Welcome email sent to the user
   - 📧 Admin notification about new subscription

2. **When payment is completed (PayFast webhook):**
   - ✅ Payment confirmation email to the user
   - 💰 Payment received notification to admin

### Features

- Beautiful HTML email templates
- Responsive design for mobile devices
- Error handling (emails won't break your app if they fail)
- Asynchronous sending (doesn't slow down your API)
- Easy to customize and extend

## 🚀 Quick Setup (3 Steps)

### 1. Get Plunk API Key
- Sign up at https://useplunk.com
- Get your API key from the dashboard

### 2. Add to Environment Variables
Create/update `.env.local`:
```env
PLUNK_API_KEY=sk_your_api_key_here
ADMIN_EMAIL=your-email@example.com
```

### 3. Verify Domain in Plunk
- Go to Plunk Dashboard → Settings → Domains
- Add and verify your sending domain
- Or use Plunk's default domain for testing

**That's it!** Your emails are ready to send. 🎉

## 📁 New Files Created

- `/src/lib/email.ts` - Email service with all email functions
- `/.env.example` - Environment variables template
- `/EMAIL_SETUP.md` - Detailed setup guide
- `/src/app/api/contact/route.ts.example` - Contact form example

## 🧪 Testing

1. Start dev server: `npm run dev`
2. Go to: http://localhost:3000/subscribe
3. Fill out and submit the form
4. Check your email inbox!

## 📧 Email Functions Available

```typescript
// For subscription flow
sendSubscriptionInitiatedEmail(data)      // Welcome email to user
sendNewSubscriptionNotification(data)      // Admin notification

// For payment confirmation
sendPaymentConfirmationEmail(data)         // Success email to user
sendPaymentReceivedNotification(data)      // Admin notification

// Generic utility
sendFormSubmissionEmail(formData, type)    // Any form data
```

## 🎨 Customizing Emails

Edit `/src/lib/email.ts` to customize:
- Email templates (HTML)
- Subject lines
- Email content
- Colors and styling

## 📚 Need More Details?

See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for:
- Detailed setup instructions
- Troubleshooting guide
- Customization examples
- Security best practices

## 🔗 Resources

- [Plunk Dashboard](https://useplunk.com/dashboard)
- [Plunk Documentation](https://docs.useplunk.com/)
- [@plunk/node SDK](https://www.npmjs.com/package/@plunk/node)

---

**Note**: Make sure to add your actual API key and test the emails before going to production!
