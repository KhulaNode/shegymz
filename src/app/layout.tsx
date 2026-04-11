import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SheGymZ – Private Women\'s Wellness Club',
  description: 'A private, members-only wellness space for women. 24/7 access, personal trainers included, no contracts.',
  keywords: ['women\'s gym', 'private fitness', 'wellness', 'personal training', 'South Africa'],
  icons: {
    icon: [
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/favicon/apple-touch-icon.png',
  },
  openGraph: {
    title: 'SheGymZ – Private Women\'s Wellness Club',
    description: 'A private, members-only wellness space for women.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
