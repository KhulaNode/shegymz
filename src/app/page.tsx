'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';

const CAROUSEL_VIDEOS = [
  '/video%20carousel/WhatsApp%20Video%202026-03-01%20at%2002.11.02.mp4',
  '/video%20carousel/WhatsApp%20Video%202026-03-01%20at%2002.13.23.mp4',
  '/video%20carousel/WhatsApp%20Video%202026-03-01%20at%2002.11.03.mp4',
  '/video%20carousel/WhatsApp%20Video%202026-03-01%20at%2002.11.20.mp4',
  '/video%20carousel/WhatsApp%20Video%202026-03-01%20at%2002.11.39.mp4',
  
];

export default function LandingPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % CAROUSEL_VIDEOS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);


  return (
    <>
      <Navigation />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background video carousel with overlay */}
        <div className="absolute inset-0 z-0 bg-black">
          {CAROUSEL_VIDEOS.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === carouselIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Blurred fill layer — covers the side bars on desktop */}
              <video
                src={src}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-md brightness-50"
                aria-hidden="true"
              />
              {/* Sharp centred layer — portrait video at full quality */}
              <video
                src={src}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover md:object-contain"
              />
            </div>
          ))}
          {/* Purple gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-plum-900/50 via-plum-800/30 to-plum-900/70"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto">
          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-4 sm:mb-6 whitespace-nowrap">
            Her Physique. Her Power.
          </h1>
          <p className="text-white/90 text-base sm:text-lg md:text-xl font-light leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto px-2 sm:px-0">
            24/7 Access. Personal trainers included. No contracts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/subscribe"
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-rose-300 text-plum-900 font-semibold rounded hover:bg-rose-200 transition-all duration-300 text-base sm:text-lg shadow-lg"
            >
              Subscribe Here
            </Link>
            <Link
              href="/free-trial"
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-white/20 text-white font-semibold rounded border border-white/60 hover:bg-white/30 transition-all duration-300 text-base sm:text-lg shadow-lg backdrop-blur-sm"
            >
              Try 3 Days Free
            </Link>
          </div>
        </div>
      </section>

      {/* DISCRETION NOTE SECTION */}
      <section className="py-12 md:py-16 bg-neutral-50 border-b border-warmgray-200">
        <div className="max-w-3xl mx-auto px-6 text-center">
          {/* Small logo accent */}
          <div className="mb-6">
            <Image
              src="/images/logo.png"
              alt="SheGymZ"
              width={150}
              height={75}
              className="h-16 w-auto object-contain mx-auto opacity-60"
            />
          </div>
          {/* <p className="text-sm uppercase tracking-widest text-warmgray-600 mb-4 font-semibold">
            How We Grow
          </p> */}
          <blockquote className="text-2xl md:text-3xl font-light text-plum-900 leading-relaxed">
            SheGymZ is a private wellness space for women
            <br />
            shaped by trust, privacy, and a sense of community
          </blockquote>
        </div>
      </section>

      {/* WHAT IS SHEGYMZ SECTION */}
      <section id="about" className="py-12 sm:py-16 md:py-20 lg:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-plum-900 mb-8 sm:mb-12 md:mb-16 text-center">
            What Is SheGymZ?
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
            {/* Left: Text content */}
            <div className="flex flex-col justify-center space-y-6 sm:space-y-8">
              <div>
                <div className="flex items-center gap-0 mb-3">
                  <Image
                    src="/images/bullet_point.png"
                    alt="Bullet point"
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain mr-2 sm:mr-3 flex-shrink-0"
                  />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-plum-800">
                    Gym & CrossFit
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-warmgray-700 leading-relaxed ml-10 sm:ml-15 md:ml-19">
                  Fully equipped private facility. Training on your terms. No crowds, no distractions.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-0 mb-3">
                  <Image
                    src="/images/bullet_point.png"
                    alt="Bullet point"
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain mr-2 sm:mr-3 flex-shrink-0"
                  />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-plum-800">
                    Massage & Recovery
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-warmgray-700 leading-relaxed ml-10 sm:ml-15 md:ml-19">
                  Dedicated recovery space. Professional massage therapy. Wellness is part of strength.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-0 mb-3">
                  <Image
                    src="/images/bullet_point.png"
                    alt="Bullet point"
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain mr-2 sm:mr-3 flex-shrink-0"
                  />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-plum-800">
                    Guided Training
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-warmgray-700 leading-relaxed ml-10 sm:ml-15 md:ml-19">
                  Personal trainers included in every membership. No add-ons. No upsells. Just support.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-0 mb-3">
                  <Image
                    src="/images/bullet_point.png"
                    alt="Bullet point"
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain mr-2 sm:mr-3 flex-shrink-0"
                  />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-plum-800">
                    Meditation and Pilates
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-warmgray-700 leading-relaxed ml-10 sm:ml-15 md:ml-19">
                  Serene natural spaces for reflection.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-0 mb-3">
                  <Image
                    src="/images/bullet_point.png"
                    alt="Bullet point"
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain mr-2 sm:mr-3 flex-shrink-0"
                  />
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-plum-800">
                    Member Content
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-warmgray-700 leading-relaxed ml-10 sm:ml-15 md:ml-19">
                  Private content creation spaces. For members, by members. Ownership of your narrative.
                </p>
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative h-96 md:h-full min-h-[500px] rounded overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
                 onClick={() => setSelectedImage('/images/IMG_3757.jpeg')}>
              <Image
                src="/images/IMG_3757.jpeg"
                alt="SheGymZ facility"
                fill
                className="object-cover"
                quality={85}
              />
              {/* Subtle overlay for visual interest */}
              <div className="absolute inset-0 bg-gradient-to-t from-plum-900/20 to-transparent" />
              {/* Zoom indicator */}
              <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Image Gallery Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            <div className="relative h-64 rounded overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
                 onClick={() => setSelectedImage('/images/showcase1.jpeg')}>
              <Image
                src="/images/showcase1.jpeg"
                alt="Lady training"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                quality={85}
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/90 p-2 rounded-full">
                  <svg className="w-6 h-6 text-plum-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="relative h-64 rounded overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
                 onClick={() => setSelectedImage('/images/IMG_3749.jpeg')}>
              <Image
                src="/images/IMG_3749.jpeg"
                alt="Gym equipment"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                quality={85}
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/90 p-2 rounded-full">
                  <svg className="w-6 h-6 text-plum-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="relative h-64 rounded overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
                 onClick={() => setSelectedImage('/images/showcase2.jpeg')}>
              <Image
                src="/images/showcase2.jpeg"
                alt="Wellness space"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                quality={85}
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/90 p-2 rounded-full">
                  <svg className="w-6 h-6 text-plum-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="relative h-64 rounded overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
                 onClick={() => setSelectedImage('/images/IMG_3775.jpeg')}>
              <Image
                src="/images/IMG_3775.jpeg"
                alt="Training area"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                quality={85}
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/90 p-2 rounded-full">
                  <svg className="w-6 h-6 text-plum-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW MEMBERSHIP WORKS SECTION */}
      <section id="membership" className="py-12 sm:py-16 md:py-20 lg:py-28 bg-warmgray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-plum-900 mb-8 sm:mb-12 md:mb-16 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Card 1: Monthly */}
            <div className="bg-white rounded p-6 sm:p-8 border border-warmgray-200 hover:shadow-lg transition-shadow">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📅</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-plum-900 mb-2 sm:mb-3">Monthly Billing</h3>
              <p className="text-sm sm:text-base text-warmgray-700 leading-relaxed">
                Simple monthly subscription. Charged automatically. No surprises.
              </p>
            </div>

            {/* Card 2: Flexible */}
            <div className="bg-white rounded p-6 sm:p-8 border border-warmgray-200 hover:shadow-lg transition-shadow">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🔓</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-plum-900 mb-2 sm:mb-3">Cancel Anytime</h3>
              <p className="text-sm sm:text-base text-warmgray-700 leading-relaxed">
                No contracts. No lock-in periods. Leave when you need to. Always welcome back.
              </p>
            </div>

            {/* Card 3: Invitation */}
            <div className="bg-white rounded p-8 border border-warmgray-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-2xl font-semibold text-plum-900 mb-3">Membership by Referral</h3>
              <p className="text-warmgray-700 leading-relaxed">
                We grow through word of mouth. Know someone? They can request access too.
              </p>
            </div>
          </div>

          {/* Access Revocation Note */}
          <div className="max-w-2xl mx-auto bg-rose-100 border border-rose-300 rounded p-6 text-center">
            <p className="text-sm text-warmgray-700 leading-relaxed">
              <span className="font-semibold text-plum-900">Private Club Terms:</span> SheGymZ reserves the right to revoke membership access in accordance with our private club policies. We are committed to maintaining a safe, respectful environment for all members.
            </p>
          </div>
        </div>
      </section>

      {/* PRIMARY CTA SECTION */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-plum-900 via-plum-800 to-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Logo watermark */}
          <div className="mb-8">
            <Image
              src="/images/logo.png"
              alt="SheGymZ"
              width={180}
              height={90}
              className="h-16 w-auto object-contain mx-auto opacity-40"
            />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to join a community of strength?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Request membership today. We&apos;ll review your request and reach out to confirm your access to SheGymZ.
          </p>

          <Link
            href="/subscribe"
            className="inline-block px-8 py-4 bg-rose-300 text-plum-900 font-semibold rounded hover:bg-rose-200 transition-all duration-300 text-lg shadow-lg"
          >
            Subscribe Here
          </Link>
        </div>
      </section>

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Zoomed image"
              fill
              className="object-contain"
              quality={95}
            />
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-plum-900 p-2 rounded-full transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Click anywhere to close hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm bg-black/50 px-3 py-1 rounded">
              Click anywhere to close
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
