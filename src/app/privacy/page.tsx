import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy | SheGymZ',
  description: 'How SheGymZ collects, uses, and protects information for website visitors, trial requests, subscribers, and members.',
};

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'admin@shegymz.com';

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="flex-grow bg-neutral-50">
        <section className="py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-plum-900 mb-4">Privacy Policy</h1>
            <p className="text-warmgray-600 mb-12">Last updated: May 2026</p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">1. Introduction</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  SheGymZ is shaped by trust, privacy, exclusivity, and community. This policy explains how we
                  collect and use information when you visit the website, request a trial, subscribe, or move into
                  the SheGymZ portal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">2. Information We Collect</h2>
                <ul className="space-y-2 text-warmgray-700">
                  <li>• Contact details such as name, email address, and phone number.</li>
                  <li>• Optional wellness or body-goal notes you choose to share.</li>
                  <li>• Referral details when you tell us who referred you.</li>
                  <li>• Payment status and subscription references from Paystack.</li>
                  <li>• Technical information needed to keep the website secure and reliable.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">3. How We Use Information</h2>
                <ul className="space-y-2 text-warmgray-700">
                  <li>• To respond to subscription and free-trial requests.</li>
                  <li>• To start secure payment checkout through Paystack.</li>
                  <li>• To confirm payment outcomes and send portal handoff information.</li>
                  <li>• To protect the privacy, safety, and quality of the SheGymZ community.</li>
                  <li>• To maintain the website, troubleshoot issues, and prevent abuse.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">4. Payment Information</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  Payments are processed by Paystack or another authorised third-party payment provider. SheGymZ
                  does not store card numbers, banking details, or payment credentials on this website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">5. Portal and Membership Data</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  The public website stays low-state and operationally light. The separate SheGymZ portal handles
                  authenticated member access. Portal signup and access may use your subscription email, OTP
                  checks, and Paystack membership status to confirm that you are an active member.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">6. Sharing Information</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  We share information only where needed to operate the service, including payment processing,
                  email delivery, hosting, security, and legal compliance. These providers process information
                  under their own terms and privacy policies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">7. Your Choices</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  You may ask to access, correct, or delete personal information we hold about you, subject to
                  legal, payment, security, and membership record obligations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">8. Contact</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  Questions about privacy? Contact us at{' '}
                  <a href={`mailto:${contactEmail}`} className="text-plum-800 font-semibold hover:underline">
                    {contactEmail}
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
