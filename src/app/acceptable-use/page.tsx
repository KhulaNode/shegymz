import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Acceptable Use Policy | SheGymZ',
  description: 'The standards for respectful, lawful, and privacy-conscious use of SheGymZ spaces, website, and portal access.',
};

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'admin@shegymz.com';

export default function AcceptableUsePage() {
  return (
    <>
      <Navigation />
      <main className="flex-grow bg-neutral-50">
        <section className="py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-plum-900 mb-4">Acceptable Use Policy</h1>
            <p className="text-warmgray-600 mb-12">Effective date: May 2026</p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">Introduction</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  SheGymZ exists as a private, safe, and respectful wellness space for women. This policy sets the
                  standards for use of the public website, subscription flow, trial requests, private facilities,
                  and member portal access.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">1. Permitted Use</h2>
                <ul className="space-y-2 text-warmgray-700">
                  <li>• Learn about SheGymZ and its membership offering.</li>
                  <li>• Submit accurate subscription or free-trial information.</li>
                  <li>• Complete authorised payments for your own membership.</li>
                  <li>• Access portal functionality only when you are an active, authenticated member.</li>
                  <li>• Use SheGymZ facilities and digital services for lawful wellness and training purposes.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">2. Prohibited Use</h2>
                <ul className="space-y-2 text-warmgray-700">
                  <li>• Providing false, misleading, or unauthorised subscription or trial information.</li>
                  <li>• Attempting to access the portal without an active SheGymZ subscription.</li>
                  <li>• Sharing member-only access, OTPs, passwords, or account credentials.</li>
                  <li>• Harassing, threatening, recording, or exposing other members, trainers, or staff.</li>
                  <li>• Scraping, attacking, disrupting, or reverse engineering the website or portal.</li>
                  <li>• Using SheGymZ systems for fraud, spam, malware, or unlawful activity.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">3. Privacy and Safety</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  Members and visitors must respect the privacy of the SheGymZ community. Do not publish,
                  distribute, or misuse information about members, staff, trainers, facility access, or private
                  interactions without clear permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">4. Payment and Membership Abuse</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  You may not manipulate checkout flows, payment references, membership checks, portal signup,
                  or subscription status. Active Paystack subscription status is required for protected member
                  access.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">5. Enforcement</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  We may investigate suspected violations and may refuse, suspend, or revoke access to the
                  website, trial, private facility, or portal where needed to protect members, staff, systems, or
                  the SheGymZ private club environment.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-plum-900 mb-4">6. Contact</h2>
                <p className="text-warmgray-700 leading-relaxed">
                  Questions or concerns about acceptable use? Contact us at{' '}
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
