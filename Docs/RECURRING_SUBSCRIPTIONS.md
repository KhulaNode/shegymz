# Recurring Subscriptions Setup

Your SheGymz app now supports **recurring monthly subscriptions** with payment links in emails!

## 🔄 New Flow

1. **User submits form** → Welcome email sent with payment link
2. **Email received** → User can click link to pay anytime
3. **User clicks payment link** → Redirected to Paystack
4. **User completes payment** → Webhook receives notification
5. **Payment verified** → Recurring subscription enabled
6. **Confirmation emails sent** → User + Admin notified
7. **User redirected** → Success page

## ✨ What Changed

### Email Now Includes Payment Link
The welcome email now has a prominent "Complete Payment" button that takes users directly to Paystack. Users don't need to stay on your site - they can complete payment from their email anytime.

### Recurring Billing Enabled
After successful first payment, the authorization code is saved and can be used for:
- Automatic monthly charges
- Subscription management
- Payment history tracking

## 🎯 Two Ways to Handle Subscriptions

### Option 1: Using Paystack Plans (Recommended)

Create a subscription plan in Paystack Dashboard for fully automated recurring billing.

**Setup:**
1. Go to [Paystack Dashboard → Plans](https://dashboard.paystack.com/#/plans)
2. Click "Create Plan"
3. Configure:
   - **Plan Name**: SheGymz Monthly Membership
   - **Amount**: 39900 (R399 in kobo)
   - **Interval**: Monthly
   - **Currency**: ZAR
4. Copy the **Plan Code** (e.g., `PLN_xxxxxxxxxx`)
5. Add to `.env.local`:
   ```env
   PAYSTACK_PLAN_CODE=PLN_xxxxxxxxxx
   ```

**Benefits:**
- ✅ Automatic monthly charges
- ✅ Paystack handles failed payments
- ✅ Built-in subscription management
- ✅ Retry logic for failed cards
- ✅ Email notifications from Paystack

### Option 2: Authorization Code Only

If you don't set a plan code, the system stores the authorization code for manual recurring charges.

**How it works:**
- Authorization code saved after first payment
- You manually charge users monthly using the code
- More control, but requires implementation

**To charge later:**
```typescript
// Your backend code
const response = await axios.post(
  'https://api.paystack.co/transaction/charge_authorization',
  {
    authorization_code: 'AUTH_xxxxxx',
    email: 'user@example.com',
    amount: 39900, // R399 in kobo
  },
  {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  }
);
```

## 📧 Email Template

The welcome email now includes:
- Prominent payment button
- Clear call-to-action
- Step-by-step instructions
- User's body goals (if provided)

Example:
```
Welcome to SheGymz! 💪

[Big Button: Complete Payment]

What Happens Next:
1. Click the payment button above
2. Set up your recurring monthly payment (R399/month)
3. You'll receive confirmation once processed
4. Access your membership immediately
```

## 🧪 Testing Recurring Subscriptions

### Test the Flow
1. Start dev server: `npm run dev`
2. Fill subscription form
3. Check email for payment link
4. Click "Complete Payment" in email
5. Use test card: `5060666666666666666`
6. Complete payment
7. Check webhook logs for subscription creation

### Verify Subscription Created
**With Plan Code:**
- Go to [Paystack Dashboard → Subscriptions](https://dashboard.paystack.com/#/subscriptions)
- You should see the new subscription

**Without Plan Code:**
- Check webhook logs for authorization code
- Code is saved for manual charging

## ⚙️ Configuration

### Environment Variables
```env
# Required
PAYSTACK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_SUBSCRIPTION_AMOUNT=399

# Optional - for automatic recurring billing
PAYSTACK_PLAN_CODE=PLN_xxxxxxxxxx

# Email settings
PLUNK_API_KEY=your_key
ADMIN_EMAIL=admin@shegymz.com
```

## 🔧 Customization

### Change Email Button Color
Edit `/src/lib/email.ts`:
```typescript
// Find the button style
background-color: #E91E63; // Change this color
color: white;              // Button text color
```

### Change Email Copy
Edit `/src/lib/email.ts`:
```typescript
<h3>Complete Your Subscription</h3> // Change heading
<p>Click the button below...</p>      // Change description
```

### Customize Subscription Amount
`.env.local`:
```env
NEXT_PUBLIC_SUBSCRIPTION_AMOUNT=499  # Change amount
```

## 🎛️ Webhook Events

The webhook now handles these subscription events:

| Event | Description | Action |
|-------|-------------|--------|
| `charge.success` | Initial payment successful | Enable subscription, send emails |
| `subscription.create` | Subscription activated | Log subscription code |
| `subscription.disable` | User cancelled | TODO: Deactivate member |
| `charge.failed` | Payment failed | TODO: Notify user |

## 📊 Monitor Subscriptions

### Paystack Dashboard
- **Transactions**: https://dashboard.paystack.com/#/transactions
- **Subscriptions**: https://dashboard.paystack.com/#/subscriptions
- **Customers**: https://dashboard.paystack.com/#/customers

### Check Logs
```bash
# Webhook received
Paystack webhook received: charge.success

# Payment confirmed
Payment confirmed for user@example.com - R399.00

# Subscription enabled
Recurring subscription enabled for user@example.com
Subscription code: SUB_xxxxxx
```

## 🚀 Going to Production

### 1. Create Production Plan
- Go to Paystack Dashboard (Live Mode)
- Create plan with same settings
- Copy live plan code

### 2. Update Environment
```env
# Production .env
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PLAN_CODE=PLN_live_xxx
NEXT_PUBLIC_SUBSCRIPTION_AMOUNT=399
NODE_ENV=production
```

### 3. Test with Small Amount
Before going live:
- Create a test plan with R1 amount
- Complete full flow with real card
- Verify subscription created
- Check emails received
- Then switch to actual amount

## 💡 Tips

1. **Use Plan Code** - It's easier and more reliable than manual charging
2. **Test Email Links** - Make sure they work from different email clients
3. **Monitor Subscriptions** - Check Paystack dashboard regularly
4. **Handle Failed Payments** - Set up notifications for failed recurring charges
5. **Clear Communication** - Email should clearly state it's recurring billing

## 🆘 Troubleshooting

**Email doesn't have payment link?**
- Check that `paystackResult.authorizationUrl` is being passed to email
- Verify email template includes `${data.paymentLink}` check

**Subscription not created?**
- Verify `PAYSTACK_PLAN_CODE` is set correctly
- Check webhook logs for errors
- Ensure authorization code is present in payment data

**Manual charges failing?**
- Authorization code must be reusable
- Check card allows recurring charges
- Verify authorization hasn't expired

## 📚 Resources

- [Paystack Subscriptions](https://paystack.com/docs/payments/subscriptions/)
- [Paystack Plans](https://paystack.com/docs/payments/subscriptions/#create-plan)
- [Recurring Charges](https://paystack.com/docs/payments/recurring-charges/)

---

**Ready to test?** Fill out the form and check your email! 📧
