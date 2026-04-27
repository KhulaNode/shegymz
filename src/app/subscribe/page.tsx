'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  bodyGoals: string;
  referralName: string;
}

export default function SubscribePage() {
  const [step, setStep] = useState<'form' | 'review' | 'processing'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    bodyGoals: '',
    referralName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    return true;
  };

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setStep('review');
  };

  const handleConfirmAndPay = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Call API to initiate checkout (provider selected server-side via PAYMENTS_PROVIDER)
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          bodyGoals: formData.bodyGoals,
          referralName: formData.referralName || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'Failed to initiate payment');
      }

      const { redirectUrl } = await response.json();

      // Redirect to the hosted Paystack checkout
      setStep('processing');
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation />

      <main className="flex-grow">
        {/* STEP 1: FORM */}
        {step === 'form' && (
          <section className="min-h-screen bg-neutral-50 py-20">
            <div className="max-w-2xl mx-auto px-6">
              <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-plum-900 mb-4">
                  Subscription Form
                </h1>
                <p className="text-lg text-warmgray-700">
                  Complete the form below. We&apos;ll review your request and reach out to confirm access.
                </p>
              </div>

              <form onSubmit={handleSubmitForm}>
                <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 border border-warmgray-200">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-plum-900 mb-2">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-warmgray-300 rounded focus:outline-none focus:ring-2 focus:ring-plum-700 focus:border-transparent text-sm sm:text-base"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-plum-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-warmgray-300 rounded focus:outline-none focus:ring-2 focus:ring-plum-700 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-plum-900 mb-2">
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+27 (0)123 456 789"
                      className="w-full px-4 py-3 border border-warmgray-300 rounded focus:outline-none focus:ring-2 focus:ring-plum-700 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Body Goals */}
                  <div>
                    <label htmlFor="bodyGoals" className="block text-sm font-semibold text-plum-900 mb-2">
                      Body Goals (Optional)
                    </label>
                    <textarea
                      id="bodyGoals"
                      name="bodyGoals"
                      value={formData.bodyGoals}
                      onChange={handleInputChange}
                      placeholder="Tell us about your fitness goals and what you'd like to achieve..."
                      className="w-full px-4 py-3 border border-warmgray-300 rounded focus:outline-none focus:ring-2 focus:ring-plum-700 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Referral Name (Optional) */}
                  <div>
                    <label htmlFor="referralName" className="block text-sm font-semibold text-plum-900 mb-2">
                      Referred by (Optional)
                    </label>
                    <input
                      id="referralName"
                      name="referralName"
                      type="text"
                      value={formData.referralName}
                      onChange={handleInputChange}
                      placeholder="Who referred you to SheGymZ?"
                      className="w-full px-4 py-3 border border-warmgray-300 rounded focus:outline-none focus:ring-2 focus:ring-plum-700 focus:border-transparent"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-rose-100 border border-rose-300 text-plum-900 px-4 py-3 rounded text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full px-6 py-4 bg-plum-900 text-white font-semibold rounded hover:bg-plum-800 transition-colors"
                    >
                      Continue to Review
                    </button>
                  </div>

                  {/* Back to home */}
                  <div className="text-center text-sm">
                    <Link href="/" className="text-warmgray-600 hover:text-plum-800 transition-colors">
                      Back to home
                    </Link>
                  </div>
                </div>
              </div>
              </form>

              {/* Privacy note */}
              <div className="mt-8 p-6 bg-rose-50 border border-rose-200 rounded text-center text-sm text-warmgray-700">
                Your information is private and secure. We only contact you to confirm membership access.
              </div>
            </div>
          </section>
        )}

        {/* STEP 2: REVIEW */}
        {step === 'review' && (
          <section className="min-h-screen bg-neutral-50 py-20">
            <div className="max-w-2xl mx-auto px-6">
              <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-plum-900 mb-4">
                  Review Your Request
                </h1>
                <p className="text-lg text-warmgray-700">
                  Confirm your details below and proceed to payment.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 border border-warmgray-200 space-y-8">
                {/* Summary */}
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-warmgray-200 pb-3">
                    <span className="text-warmgray-700 font-medium">Name</span>
                    <span className="text-neutral-900 font-semibold">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-warmgray-200 pb-3">
                    <span className="text-warmgray-700 font-medium">Email</span>
                    <span className="text-neutral-900 font-semibold">{formData.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-warmgray-200 pb-3">
                    <span className="text-warmgray-700 font-medium">Phone</span>
                    <span className="text-neutral-900 font-semibold">{formData.phone}</span>
                  </div>
                  {formData.bodyGoals && (
                    <div className="flex justify-between border-b border-warmgray-200 pb-3">
                      <span className="text-warmgray-700 font-medium">Body Goals</span>
                      <span className="text-neutral-900 font-semibold text-right max-w-xs">{formData.bodyGoals}</span>
                    </div>
                  )}
                  {formData.referralName && (
                    <div className="flex justify-between border-b border-warmgray-200 pb-3">
                      <span className="text-warmgray-700 font-medium">Referred by</span>
                      <span className="text-neutral-900 font-semibold">{formData.referralName}</span>
                    </div>
                  )}
                </div>

                {/* Membership Details */}
                <div className="bg-warmgray-50 p-6 rounded">
                  <h3 className="font-semibold text-plum-900 mb-3">Membership Details</h3>
                  <ul className="space-y-2 text-sm text-warmgray-700">
                    <li>✓ Monthly billing</li>
                    <li>✓ Cancel anytime, no contracts</li>
                    <li>✓ Personal trainers included</li>
                    <li>✓ 24/7 access</li>
                    <li>✓ Member-only content space</li>
                  </ul>
                </div>

                {/* Monthly Amount */}
                <div className="border-t border-warmgray-200 pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-semibold text-neutral-900">Monthly Amount</span>
                    <span className="text-3xl font-bold text-plum-900">
                      R{(parseFloat(process.env.NEXT_PUBLIC_SUBSCRIPTION_AMOUNT || '399.00')).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-warmgray-600 mb-6">
                    Charged monthly. First payment will be processed immediately upon confirmation.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-rose-100 border border-rose-300 text-plum-900 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 px-6 py-3 border border-warmgray-300 text-neutral-900 font-semibold rounded hover:bg-warmgray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAndPay}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-plum-900 text-white font-semibold rounded hover:bg-plum-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                </div>

                {/* Terms */}
                <div className="text-xs text-center text-warmgray-600">
                  By confirming, you agree to our membership terms and privacy policy.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* STEP 3: PROCESSING */}
        {step === 'processing' && (
          <section className="min-h-screen bg-neutral-50 flex items-center justify-center py-20">
            <div className="text-center px-6">
              <div className="mb-6">
                <div className="inline-block">
                  <div className="animate-spin h-12 w-12 border-4 border-warmgray-300 border-t-plum-900 rounded-full"></div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-plum-900 mb-2">Preparing Your Checkout</h2>
              <p className="text-warmgray-700">Redirecting to secure checkout…</p>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
