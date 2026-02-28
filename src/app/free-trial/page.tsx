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

export default function FreeTrialPage() {
  const [step, setStep] = useState<'form' | 'review' | 'submitted'>('form');
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) setStep('review');
  };

  const handleConfirmRequest = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/free-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          bodyGoals: formData.bodyGoals || undefined,
          referralName: formData.referralName || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Something went wrong. Please try again.');
      }

      setStep('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation />

      <main className="flex-grow">
        {/* ── STEP 1: FORM ──────────────────────────────────────────────── */}
        {step === 'form' && (
          <section className="min-h-screen bg-neutral-50 py-20">
            <div className="max-w-2xl mx-auto px-6">
              <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-plum-900 mb-4">
                  Free Trial
                </h1>
                <p className="text-lg text-warmgray-700">
                  Fill in your details and we&apos;ll reach out to get you started — no payment needed.
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

                    {/* Referral Name */}
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

                    {/* Error */}
                    {error && (
                      <div className="bg-rose-100 border border-rose-300 text-plum-900 px-4 py-3 rounded text-sm">
                        {error}
                      </div>
                    )}

                    {/* Submit */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full px-6 py-4 bg-plum-900 text-white font-semibold rounded hover:bg-plum-800 transition-colors"
                      >
                        Continue to Review
                      </button>
                    </div>

                    <div className="text-center text-sm">
                      <Link href="/" className="text-warmgray-600 hover:text-plum-800 transition-colors">
                        Back to home
                      </Link>
                    </div>
                  </div>
                </div>
              </form>

              <div className="mt-8 p-6 bg-rose-50 border border-rose-200 rounded text-center text-sm text-warmgray-700">
                Your information is private and secure. We only contact you to arrange your free trial.
              </div>
            </div>
          </section>
        )}

        {/* ── STEP 2: REVIEW ────────────────────────────────────────────── */}
        {step === 'review' && (
          <section className="min-h-screen bg-neutral-50 py-20">
            <div className="max-w-2xl mx-auto px-6">
              <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-plum-900 mb-4">
                  Review Your Request
                </h1>
                <p className="text-lg text-warmgray-700">
                  Confirm your details and submit — we&apos;ll be in touch to schedule your free trial.
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

                {/* What to expect */}
                <div className="bg-warmgray-50 p-6 rounded">
                  <h3 className="font-semibold text-plum-900 mb-3">What Happens Next</h3>
                  <ul className="space-y-2 text-sm text-warmgray-700">
                    <li>✓ We&apos;ll review your request within 24 hours</li>
                    <li>✓ Someone from SheGymZ will contact you to schedule your trial</li>
                    <li>✓ No payment required for the free trial</li>
                    <li>✓ Experience all facilities and classes firsthand</li>
                  </ul>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-rose-100 border border-rose-300 text-plum-900 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 px-6 py-3 border border-warmgray-300 text-neutral-900 font-semibold rounded hover:bg-warmgray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmRequest}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-plum-900 text-white font-semibold rounded hover:bg-plum-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>

                <div className="text-xs text-center text-warmgray-600">
                  By submitting, you agree to our privacy policy. We&apos;ll only use your details to contact you about your trial.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── STEP 3: SUBMITTED ─────────────────────────────────────────── */}
        {step === 'submitted' && (
          <section className="min-h-screen bg-neutral-50 flex items-center justify-center py-20">
            <div className="max-w-lg mx-auto px-6 text-center">
              {/* Check icon */}
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 bg-plum-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-plum-900 mb-4">Request Submitted!</h1>
              <p className="text-lg text-warmgray-700 mb-2">
                Thanks, <span className="font-semibold">{formData.fullName}</span>!
              </p>
              <p className="text-warmgray-600 mb-10">
                We&apos;ve received your free trial request and will be in touch within 24 hours to arrange your session.
              </p>

              <div className="bg-white rounded-lg shadow p-6 border border-warmgray-200 text-left mb-8 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-warmgray-600">Name</span>
                  <span className="font-medium text-neutral-900">{formData.fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warmgray-600">Email</span>
                  <span className="font-medium text-neutral-900">{formData.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warmgray-600">Phone</span>
                  <span className="font-medium text-neutral-900">{formData.phone}</span>
                </div>
              </div>

              <Link
                href="/"
                className="inline-block px-8 py-3 bg-plum-900 text-white font-semibold rounded hover:bg-plum-800 transition-colors"
              >
                Return Home
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
