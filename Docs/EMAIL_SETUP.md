# Email Notifications Setup Guide

This guide explains how to set up and use Plunk email notifications in your SheGymz application.

## 📧 What's Implemented

The application now sends email notifications for:

1. **New Subscription Submissions**
   - Welcome email to the member
   - Admin notification about new subscription

2. **Payment Confirmations**
   - Payment success email to the member
   - Admin notification about received payment

3. **Generic Form Submissions** (utility function available)
   - Can be used for contact forms, feedback, etc.

## 🚀 Setup Instructions

### Step 1: Get Your Plunk API Key

1. Go to [Plunk](https://useplunk.com) and create an account (if you haven't already)
2. Navigate to your dashboard: https://useplunk.com/dashboard
3. Find your API key in the settings
4. Copy the API key

### Step 2: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist):
   ```bash
   cp .env.example .env.local
   ```

2. Add your Plunk API key to `.env.local`:
   ```env
   PLUNK_API_KEY=sk_your_actual_plunk_api_key_here
   ADMIN_EMAIL=youremail@example.com
   ```

3. **Important**: Make sure `.env.local` is in your `.gitignore` file

### Step 3: Verify Sender Email in Plunk

Before you can send emails, you need to verify your sender domain/email in Plunk:

1. Go to your [Plunk Dashboard](https://useplunk.com/dashboard)
2. Navigate to **Settings** → **Domains**
3. Add and verify your domain, OR
4. Use Plunk's default sending domain for testing

### Step 4: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the subscribe page: http://localhost:3000/subscribe

3. Fill out the subscription form and submit

4. You should receive:
   - A welcome email to the member's email address
   - An admin notification to the ADMIN_EMAIL address

## 📝 Email Flow

### Subscription Flow
```
User submits form
    ↓
1. Welcome email sent to user
2. Admin notification sent
    ↓
User redirected to PayFast
    ↓
Payment completed
    ↓
Webhook received
    ↓
3. Payment confirmation sent to user
4. Payment notification sent to admin
```

## 🔧 Customization

### Email Templates

All email templates are in `/src/lib/email.ts`. You can customize:

- Email subject lines
- HTML templates
- Sender name
- Colors and branding

Example:
```typescript
await plunk.emails.send({
  to: data.email,
  subject: 'Your Custom Subject',
  body: `<html>Your custom HTML template</html>`,
});
```

### Available Email Functions

```typescript
// Send welcome email when user submits subscription
sendSubscriptionInitiatedEmail(data)

// Send admin notification about new subscription
sendNewSubscriptionNotification(data)

// Send payment confirmation to user
sendPaymentConfirmationEmail(data)

// Send payment notification to admin
sendPaymentReceivedNotification(data)

// Send generic form data via email
sendFormSubmissionEmail(formData, formType)
```

## 🎨 Adding New Email Templates

To add a new email notification:

1. Create a new function in `/src/lib/email.ts`:
```typescript
export async function sendCustomEmail(data: YourDataType): Promise<boolean> {
  try {
    await plunk.emails.send({
      to: data.email,
      subject: 'Your Subject',
      body: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Your Custom Email</h2>
          <p>Your content here</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}
```

2. Import and use it in your API route:
```typescript
import { sendCustomEmail } from '@/lib/email';

// In your API handler
await sendCustomEmail({ email: 'user@example.com' });
```

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check API Key**: Ensure `PLUNK_API_KEY` is set correctly in `.env.local`
2. **Verify Domain**: Make sure your sender domain is verified in Plunk
3. **Check Logs**: Look for error messages in your terminal
4. **Test API Key**: Try making a test request to Plunk API

### Emails Going to Spam

1. Verify your sending domain in Plunk
2. Set up SPF, DKIM, and DMARC records
3. Use a professional email template
4. Avoid spam trigger words

### Development Testing

For development, you can use:
- Your personal email for testing
- [Mailinator](https://www.mailinator.com/) for disposable test emails
- [Mailtrap](https://mailtrap.io/) for email testing

## 📊 Email Logs

Check your email sending status in:
- **Plunk Dashboard**: View all sent emails, opens, clicks
- **Server Logs**: Console logs show email sending attempts
- **Browser DevTools**: Network tab shows API responses

## 🔐 Security Notes

- Never commit `.env.local` to git
- Keep your Plunk API key secure
- Use environment variables for all sensitive data
- Consider rate limiting for production
- Validate email addresses before sending

## 📚 Additional Resources

- [Plunk Documentation](https://docs.useplunk.com/)
- [Plunk Node.js SDK](https://www.npmjs.com/package/@plunk/node)
- [Email Best Practices](https://docs.useplunk.com/guides/best-practices)

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Plunk's documentation
3. Check your server logs for errors
4. Contact Plunk support if needed

---

Happy emailing! 📬
