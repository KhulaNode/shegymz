# Disable Paystack Email Notifications

Complete guide to disable Paystack's default emails and use custom SheGymz branded emails instead.

## 🎯 Problem

Paystack sends default payment receipts with **KhulaNode** branding, but you want all customer communications to come from **SheGymz**.

## ✅ Solution Implemented

Your app now sends **custom branded receipt emails** that replace Paystack's default notifications.

### New Custom Emails

1. **Payment Receipt** (replaces Paystack receipt)
   - Dark theme matching Paystack style
   - SheGymz branding
   - Transaction details (reference, date, card)
   - Professional layout

2. **Payment Failed Notification**
   - Clear failure message
   - Reason for failure
   - Next steps for customer
   - Support contact info

## 🔧 Disable Paystack Emails

### Method 1: Disable in Paystack Dashboard (Recommended)

**Important**: Paystack doesn't allow completely disabling emails globally, but you can control what they send.

1. **Log in to Paystack Dashboard**: https://dashboard.paystack.com
2. **Go to Settings → Preferences**: https://dashboard.paystack.com/#/settings/preferences
3. **Notification Settings**:
   - Look for "Customer Notifications" or "Email Notifications"
   - Disable receipt emails if option available

**Note**: As of now, Paystack may not offer complete control to disable their emails through the dashboard. If this option isn't available, use Method 2.

### Method 2: Contact Paystack Support

Since you want to disable emails **only for SheGymz** (not all KhulaNode transactions), you'll need to contact Paystack support.

**Email Template**:

```
Subject: Request to Disable Email Notifications for Specific Plan/Customer Segment

Hi Paystack Support,

I'd like to request disabling automatic email notifications for transactions 
related to a specific plan or merchant identifier.

Business: KhulaNode
Plan/Reference Pattern: SUB_* (or specific plan code)
Reason: We're sending custom branded emails from our application

Specifically, I need:
- Payment receipt emails disabled for SheGymz subscriptions
- Payment failed notifications disabled for SheGymz subscriptions
- We'll handle all customer communications through our app

Our webhook is properly configured and we're sending custom receipts.

Please let me know if this is possible and what information you need.

Thank you!
```

**Send to**: support@paystack.com

### Method 3: Use Metadata to Identify

Since you can't fully disable Paystack emails, ensure your custom emails are **more prominent and professional** than Paystack's defaults.

Your custom email:
- ✅ Arrives first (sent immediately from webhook)
- ✅ Branded as SheGymz
- ✅ Includes all transaction details
- ✅ Professional dark theme design
- ✅ Clear call-to-action buttons

## 📧 Your Custom Email System

### Email Flow

```
Payment Success:
1. Paystack processes payment
2. Webhook triggered immediately
3. Your app sends custom receipt ⚡ (FAST)
4. Paystack sends their email (slower, can be ignored)

Payment Failed:
1. Paystack payment fails
2. Webhook triggered
3. Your app sends failure notification ⚡
4. Includes helpful next steps
```

### Email Templates Location

All email templates are in:
- **File**: `/src/lib/email.ts`
- **Functions**:
  - `sendPaymentConfirmationEmail()` - Custom receipt
  - `sendPaymentFailedEmail()` - Failed payment notification
  - `sendPaymentReceivedNotification()` - Admin notification

### Customize Receipt Email

Edit `/src/lib/email.ts`:

```typescript
// Change colors
background-color: #2d2d2d;  // Dark background
background-color: #4a90e2;  // Blue accent
background-color: #d32f2f;  // Red banner

// Change branding
<span style="font-size: 32px;">💪</span>  // Emoji icon

// Change contact email
${process.env.ADMIN_EMAIL || 'support@shegymz.com'}
```

## 🎨 Email Comparison

### Paystack Default
- ❌ Shows KhulaNode branding
- ❌ Generic template
- ❌ May arrive later
- ❌ Can't customize

### Your Custom Email
- ✅ Shows SheGymz branding
- ✅ Custom dark theme design
- ✅ Arrives immediately
- ✅ Fully customizable
- ✅ Matches your brand

## 🧪 Testing

### Test Custom Receipts

1. Make a test payment
2. Check your inbox
3. You should receive:
   - **Custom SheGymz receipt** (from your app)
   - Paystack receipt (if still enabled)

### Verify Email Content

Your custom email includes:
- ✅ SheGymz branding
- ✅ Transaction reference
- ✅ Payment date
- ✅ Card details (last 4 digits)
- ✅ Amount in ZAR
- ✅ Support contact info

## 📊 Monitor Emails

### Check Email Logs

```bash
# Your app logs
Payment receipt sent to: user@example.com
Payment failed notification sent to: user@example.com

# Webhook logs
Payment confirmed for user@example.com - R399.00
```

### Verify in Plunk Dashboard

1. Go to https://useplunk.com/dashboard
2. Check **Emails** section
3. Verify emails are being sent
4. Check delivery status

## 🚨 Important Notes

1. **Can't fully disable Paystack emails** - They may still send some notifications
2. **Your emails arrive first** - Webhook triggers immediately
3. **More professional** - Your custom emails are better branded
4. **Full control** - You can customize everything

## 💡 Best Practice

Since you can't completely disable Paystack emails:

1. **Make your emails more prominent**
   - Send immediately via webhook
   - Professional design
   - Clear branding

2. **Educate customers**
   - "You may receive additional receipt from our payment processor"
   - Point them to your branded email as official receipt

3. **Monitor feedback**
   - See if customers are confused
   - Adjust messaging if needed

## 🔄 Alternative: Email Suppression

If Paystack allows it, you could:

1. Add metadata to identify SheGymz transactions
2. Request Paystack to suppress emails based on metadata
3. They filter by `metadata.subscription_type: 'recurring'`

Current metadata sent:
```typescript
metadata: {
  subscription_type: 'recurring',
  first_name: '...',
  last_name: '...',
  // ...
}
```

## 📞 Support

**Paystack Support**:
- Email: support@paystack.com
- Slack: https://paystack.com/slack
- Docs: https://paystack.com/docs/

**Your Custom Emails**:
- Code: `/src/lib/email.ts`
- Webhook: `/src/app/api/webhook/paystack/route.ts`

## ✅ Current Status

- ✅ Custom receipt email implemented
- ✅ Payment failed notification implemented
- ✅ Card details included in receipt
- ✅ SheGymz branding throughout
- ✅ Professional dark theme design
- ⏳ Waiting on Paystack to disable their emails (optional)

---

**Bottom Line**: Your custom emails are better and arrive first. Customers will use these as their official receipts! 🎉
