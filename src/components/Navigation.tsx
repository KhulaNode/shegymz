'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-neutral-50/80 border-b border-warmgray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1 sm:py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="SheGymZ Logo"
              width={200}
              height={200}
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain"
              priority
            />
          </Link>
          <div className="hidden md:block text-sm lg:text-base text-warmgray-600 font-medium tracking-widest uppercase">
            Private Wellness
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3 lg:gap-6">
          <a
            href="#about"
            className="text-sm text-neutral-700 hover:text-plum-800 transition-colors font-medium"
          >
            About 
          </a>
          <a
            href="#membership"
            className="text-sm text-neutral-700 hover:text-plum-800 transition-colors font-medium"
          >
            Subscription Details
          </a>
          <Link
            href="/free-trial"
            className="px-3 lg:px-5 py-1.5 border border-plum-900 text-plum-900 text-sm font-semibold rounded hover:bg-plum-50 transition-colors"
          >
            3-Day Free Trial
          </Link>
          <Link
            href="/subscribe"
            className="px-3 lg:px-5 py-1.5 bg-plum-900 text-white text-sm font-semibold rounded hover:bg-plum-800 transition-colors"
          >
            Subscribe Here 
          </Link>
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-3 lg:px-5 py-1.5 text-sm font-medium text-neutral-500 hover:text-plum-900 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3 lg:px-5 py-1.5 bg-white border border-plum-900 text-plum-900 text-sm font-semibold rounded hover:bg-plum-50 transition-colors"
            >
              Login
            </Link>
          )}
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
            {session ? (
              <button
                onClick={() => { setIsMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                className="block w-full py-2 text-base font-medium text-neutral-500 hover:text-plum-900 transition-colors text-center"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="block w-full px-6 py-3 bg-white border border-plum-900 text-plum-900 text-lg font-semibold rounded hover:bg-plum-50 transition-colors text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
