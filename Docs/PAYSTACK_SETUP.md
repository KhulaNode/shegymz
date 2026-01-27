# Paystack Integration Setup Guide

Complete guide for integrating Paystack payments with email notifications for SheGymz.

## 🚀 Quick Start

### 1. Get Paystack API Keys

1. Sign up at [Paystack](https://paystack.com) (if you don't have an account)
2. Go to [Settings → API Keys & Webhooks](https://dashboard.paystack.com/#/settings/developers)
3. Copy your **Test Secret Key** (starts with `sk_test_`)
4. Copy your **Test Public Key** (starts with `pk_test_`)

### 2. Configure Environment Variables

Update your `.env.local` file:

```env
# Paystack Keys
PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_actual_public_key

# Subscription Amount (in ZAR)
NEXT_PUBLIC_SUBSCRIPTION_AMOUNT=399

# Callback URL (where to redirect after payment)
NEXT_PUBLIC_PAYSTACK_CALLBACK_URL=http://localhost:3000/payment-success

# Email Configuration (from previous setup)
PLUNK_API_KEY=your_plunk_api_key
ADMIN_EMAIL=admin@shegymz.com
```

### 3. Set Up Webhook (Important!)

1. Go to [Paystack Dashboard → Settings → Webhooks](https://dashboard.paystack.com/#/settings/webhooks)
2. Click **Add Webhook Endpoint**
3. For local development, use ngrok:
   ```bash
   # Install ngrok if you haven't
   npm install -g ngrok
   
   # Start your dev server
   npm run dev
   
   # In another terminal, expose it
   ngrok http 3000
   ```
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Add webhook URL: `https://abc123.ngrok.io/api/webhook/paystack`
6. Select events: `charge.success`, `charge.failed`
7. Save webhook

### 4. Test the Integration

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000/subscribe

3. Fill out the form and submit

4. You'll be redirected to Paystack payment page

5. Use Paystack test cards:
   - **Success**: `5060666666666666666` (any CVV, future date)
   - **Declined**: `5060000000000000004`

6. Complete payment and check emails!

## 📧 Complete Flow

```
User fills form → Email sent (welcome)
       ↓
User redirected to Paystack
       ↓
User completes payment
       ↓
Paystack webhook fires → Verify payment
       ↓
Email sent (confirmation) → User redirected to success page
```

## 🔧 Files Created/Modified

### New Files
- `/src/lib/paystack.ts` - Paystack service (initialize, verify, webhooks)
- `/src/app/api/webhook/paystack/route.ts` - Webhook handler
- `/PAYSTACK_SETUP.md` - This guide

### Modified Files
- `/src/app/api/subscribe/route.ts` - Updated to use Paystack
- `/.env.example` - Updated with Paystack variables

## 🎨 Customization

### Change Subscription Amount

In `.env.local`:
```env
NEXT_PUBLIC_SUBSCRIPTION_AMOUNT=499  # Change to your price
```

### Change Currency

Edit `/src/lib/paystack.ts`:
```typescript
currency: 'ZAR', // Change to NGN, GHS, USD, etc.
```

Supported currencies: ZAR (South Africa), NGN (Nigeria), GHS (Ghana), USD, EUR, GBP

### Available Payment Channels

In `/src/lib/paystack.ts`:
```typescript
channels: ['card', 'bank', 'ussd', 'mobile_money']
```

Available channels:
- `card` - Debit/Credit cards
- `bank` - Bank transfers
- `ussd` - USSD codes
- `mobile_money` - Mobile money
- `qr` - QR codes

### Add Custom Fields

Edit the `metadata` in `/src/lib/paystack.ts`:
```typescript
metadata: {
  custom_fields: [
    {
      display_name: 'Membership Type',
      variable_name: 'membership_type',
      value: 'premium',
    },
    // Add more fields
  ],
}
```

## 🧪 Testing

### Test Cards

| Card Number | Scenario | CVV | Expiry |
|------------|----------|-----|--------|
| 5060666666666666666 | Successful payment | 123 | Future |
| 5060000000000000004 | Declined payment | 123 | Future |
| 5531886652142950 | Insufficient funds | 564 | Future |
| 4084084084084081 | Successful (Visa) | 408 | Future |

### Test Bank Accounts

Use Paystack test bank accounts from [their docs](https://paystack.com/docs/payments/test-payments/)

### Testing Webhooks Locally

1. **Option A: ngrok** (Recommended)
   ```bash
   ngrok http 3000
   # Use the https URL in Paystack webhook settings
   ```

2. **Option B: Paystack CLI**
   ```bash
   npm install -g @paystack/cli
   paystack webhooks:listen --forward-to=http://localhost:3000/api/webhook/paystack
   ```

3. **Option C: Manual Testing**
   - Make a test payment
   - Check Paystack Dashboard → Transactions
   - View webhook logs

## 🔐 Security Checklist

- [x] Secret key is in `.env.local` (not committed to git)
- [x] Webhook signature verification is enabled
- [x] Using HTTPS in production
- [ ] Rate limiting implemented (TODO)
- [ ] Database logging for transactions (TODO)
- [ ] Idempotency checks for webhooks (TODO)

## 🚨 Common Issues

### Issue: Payment initializes but no redirect

**Solution**: Check that `PAYSTACK_SECRET_KEY` is set correctly in `.env.local`

### Issue: Webhook not receiving events

**Solutions**:
1. Verify webhook URL is correct in Paystack dashboard
2. Check that ngrok is running (for local dev)
3. Check webhook signature is being validated correctly
4. Look at webhook logs in Paystack dashboard

### Issue: Email not sending after payment

**Solutions**:
1. Check `PLUNK_API_KEY` is set
2. Verify email templates in `/src/lib/email.ts`
3. Check console logs for email errors
4. Webhook might not be configured correctly

### Issue: "Invalid signature" error

**Solutions**:
1. Verify `PAYSTACK_SECRET_KEY` matches your Paystack account
2. Check webhook payload format
3. Ensure raw body is being passed to signature verification

## 📊 Monitoring

### Check Payment Status

1. **Paystack Dashboard**:
   - https://dashboard.paystack.com/#/transactions
   - View all transactions, statuses, and details

2. **Application Logs**:
   ```bash
   # Check your terminal for logs
   Payment confirmed for user@example.com
   Email sent to: user@example.com
   ```

3. **Webhook Logs**:
   - Paystack Dashboard → Settings → Webhooks
   - Click on your webhook
   - View delivery attempts and responses

## 🔄 Moving to Production

### 1. Get Production Keys

1. Complete business verification in Paystack
2. Go to Settings → API Keys
3. Toggle to **Live Mode**
4. Copy **Live Secret Key** and **Live Public Key**

### 2. Update Environment Variables

In production `.env`:
```env
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key
NEXT_PUBLIC_PAYSTACK_CALLBACK_URL=https://yourdomain.com/payment-success
NODE_ENV=production
```

### 3. Update Webhook URL

1. Go to Paystack Dashboard → Settings → Webhooks
2. Update webhook URL to: `https://yourdomain.com/api/webhook/paystack`
3. Ensure your production server is using HTTPS

### 4. Test in Production

1. Make a small real payment (e.g., R1)
2. Verify webhook is received
3. Check emails are sent
4. Confirm everything works before launching

## 📚 Additional Resources

- [Paystack Documentation](https://paystack.com/docs/)
- [Paystack API Reference](https://paystack.com/docs/api/)
- [Test Cards & Accounts](https://paystack.com/docs/payments/test-payments/)
- [Webhook Events](https://paystack.com/docs/payments/webhooks/)
- [Subscriptions Guide](https://paystack.com/docs/payments/subscriptions/)

## 🆘 Support

- **Paystack Support**: support@paystack.com
- **Paystack Slack**: [Join here](https://paystack.com/slack)
- **Status Page**: https://status.paystack.com

## 💡 Tips

1. **Always test with test keys** before going live
2. **Monitor webhook delivery** in Paystack dashboard
3. **Store transaction references** in your database
4. **Implement idempotency** for webhook handlers
5. **Log all transactions** for audit trail
6. **Set up alerts** for failed payments

---

**Ready to go live?** Make sure you've completed all security items and tested thoroughly! 🚀
