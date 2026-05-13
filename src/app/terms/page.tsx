import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms of Service | SheGymZ',
  description: 'The terms that apply to SheGymZ website use, subscription intake, payments, and member handoff.',
};

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'admin@shegymz.com';

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main className="flex-grow bg-neutral-50">
        <section className="py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-plum-900 mb-4">Terms of Service</h1>
            <p className="text-warmgray-600 mb-12">Last updated: May 2026</p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">1. Overview</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  SheGymZ is a private women&apos;s wellness and training space. These terms govern your use of
                  the SheGymZ public website, subscription intake, free-trial requests, payment flow, and member
                  handoff into the separate SheGymZ portal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">2. Private Membership</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  SheGymZ is not operated as a generic public gym. Access is private, selective, and intended for
                  women who hold an active SheGymZ membership or who have been approved for a trial visit.
                </p>
                <p className="text-warmgray-700 leading-relaxed mt-3">
                  We may refuse, pause, or revoke access where needed to protect member safety, privacy, trust,
                  or the standards of the private wellness space.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">3. Subscription and Payment</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  Subscription payments are processed by Paystack or another authorised third-party payment
                  provider. SheGymZ does not store or process card or banking details on this website.
                </p>
                <p className="text-warmgray-700 leading-relaxed mt-3">
                  A valid paid member is a woman with an active subscription on the SheGymZ plan. Paystack is the
                  source of truth for active subscribed membership.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">4. Portal Handoff</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  After a successful subscription, members are handed off to the separate SheGymZ portal. Portal
                  signup must use the same email address used for subscription and may require OTP verification
                  and active membership validation.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">5. Free Trials</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  Free-trial requests are reviewed by SheGymZ. Submitting a request does not guarantee access.
                  Trial access may be limited, rescheduled, or withdrawn at our discretion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">6. Member Responsibilities</h2>
                <ul className="space-y-2 text-warmgray-700">
                  <li>• Provide accurate contact, subscription, and trial information.</li>
                  <li>• Use the space respectfully and only for lawful wellness and training activities.</li>
                  <li>• Respect the privacy, safety, and dignity of other members, trainers, and staff.</li>
                  <li>• Keep portal credentials private and notify us of suspected unauthorised access.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">7. Changes and Availability</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  We may update website content, membership processes, payment providers, portal handoff steps,
                  or these terms as the service evolves. Continued use after changes means you accept the
                  updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">8. Contact</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  Questions about these terms? Contact us at{' '}
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
