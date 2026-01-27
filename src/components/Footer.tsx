'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-warmgray-200 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 mb-6 sm:mb-8">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <Link href="/" className="inline-block mb-3 sm:mb-4">
              <Image
                src="/images/logo.png"
                alt="SheGymZ Logo"
                width={200}
                height={100}
                className="h-12 sm:h-16 md:h-20 w-auto object-contain mx-auto sm:mx-0"
              />
            </Link>
            <p className="text-sm text-warmgray-600">
              A private space for women to train, restore, and belong.
            </p>
          </div>

          {/* Links */}
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest mb-3 sm:mb-4">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-sm text-warmgray-600 hover:text-plum-800 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#membership" className="text-sm text-warmgray-600 hover:text-plum-800 transition-colors">
                  Membership
                </a>
              </li>
              <li>
                <a href="/subscribe" className="text-sm text-warmgray-600 hover:text-plum-800 transition-colors">
                  Request Access
                </a>
              </li>
            </ul>
          </div>

          {/* Discretion Note */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest mb-4">
              Privacy
            </h4>
            <p className="text-xs text-warmgray-600 leading-relaxed">
              SheGymZ is a private wellness space for womenshaped by trust, privacy, and a sense of community shaped by trust, privacy, and a sense of community.
            </p>
          </div>
        </div>

        <div className="border-t border-warmgray-200 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-warmgray-600 gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p>&copy; {currentYear} SheGymZ. All rights reserved.</p>
            <p className="text-sm">
              Developed & maintained by{' '}
              <a 
                href="https://khulanode.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-plum-700 hover:text-plum-900 transition-colors font-semibold underline decoration-plum-400 hover:decoration-plum-700"
              >
                KhulaNode
              </a>
            </p>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-plum-800 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-plum-800 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-plum-800 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
