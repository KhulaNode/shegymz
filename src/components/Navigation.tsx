'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-neutral-50/80 border-b border-warmgray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="SheGymZ Logo"
              width={200}
              height={200}
              className="h-16 sm:h-24 md:h-32 lg:h-48 w-auto object-contain"
              priority
            />
          </Link>
          <div className="hidden md:block text-sm lg:text-2xl text-warmgray-600 font-medium tracking-widest uppercase">
            Private Wellness
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-8">
          <a
            href="#about"
            className="text-sm lg:text-2xl text-neutral-700 hover:text-plum-800 transition-colors font-medium"
          >
            About 
          </a>
          <a
            href="#membership"
            className="text-sm lg:text-2xl text-neutral-700 hover:text-plum-800 transition-colors font-medium"
          >
            Subscription Details
          </a>
          <Link
            href="/free-trial"
            className="px-4 lg:px-8 py-2 lg:py-4 border border-plum-900 text-plum-900 text-sm lg:text-xl font-semibold rounded hover:bg-plum-50 transition-colors"
          >
            3-Day Free Trial
          </Link>
          <Link
            href="/subscribe"
            className="px-4 lg:px-10 py-2 lg:py-4 bg-plum-900 text-white text-sm lg:text-xl font-semibold rounded hover:bg-plum-800 transition-colors"
          >
            Subscribe Here 
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex flex-col items-center justify-center w-8 h-8 space-y-1"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-neutral-700 transition-transform ${
            isMenuOpen ? 'rotate-45 translate-y-2' : ''
          }`} />
          <span className={`block w-6 h-0.5 bg-neutral-700 transition-opacity ${
            isMenuOpen ? 'opacity-0' : ''
          }`} />
          <span className={`block w-6 h-0.5 bg-neutral-700 transition-transform ${
            isMenuOpen ? '-rotate-45 -translate-y-2' : ''
          }`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-neutral-50/95 backdrop-blur-md border-b border-warmgray-200">
          <div className="px-4 py-4 space-y-4">
            <a
              href="#about"
              className="block text-lg text-neutral-700 hover:text-plum-800 transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </a>
            <a
              href="#membership"
              className="block text-lg text-neutral-700 hover:text-plum-800 transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Subscription Details
            </a>
            <Link
              href="/free-trial"
              className="block w-full px-6 py-3 border border-plum-900 text-plum-900 text-lg font-semibold rounded hover:bg-plum-50 transition-colors text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              3-Day Free Trial
            </Link>
            <Link
              href="/subscribe"
              className="block w-full px-6 py-3 bg-plum-900 text-white text-lg font-semibold rounded hover:bg-plum-800 transition-colors text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Subscribe Here
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
