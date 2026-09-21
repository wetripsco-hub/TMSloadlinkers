/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar/navbar";
import { Footer } from "@/components/footer/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | FreightLink TMS",
  description:
    "How FreightLink TMS collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
          <header className="mb-10">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500">
              Effective date: <strong>January 1, 2025</strong> &nbsp;·&nbsp;
              Last updated: <strong>September 2026</strong>
            </p>
          </header>

          <div className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-li:my-0.5">

            <p>
              Loadlinkers Logistics LLC ("FreightLink," "we," "us," or "our")
              operates the FreightLink TMS software platform. This Privacy
              Policy explains what personal data we collect, how we use it,
              who we share it with, and the choices available to you. This
              policy applies to all users of the Service, including account
              administrators, team members, and any individuals whose data is
              entered into the platform by a Tenant organization.
            </p>
            <p>
              This policy should be read alongside our{" "}
              <Link href="/terms">Terms of Service</Link>, which governs your
              overall use of the platform.
            </p>

            <h2>1. Data We Collect</h2>

            <h3>1.1 Account and Profile Information</h3>
            <p>
              When you register for an account, we collect your name, email
              address, password (stored as a salted hash — we never store
              plaintext passwords), and any optional profile information you
              provide. Organization administrators also provide organization
              name and billing contact information.
            </p>

            <h3>1.2 Organization and Operational Data</h3>
            <p>
              In the course of using the Service, Tenant organizations input
              and generate operational data including: load records and shipment
              details, carrier records (including DOT numbers, MC authority
              numbers, insurance certificates, and contact information), customer
              records (shipper and consignee names, addresses, and contacts),
              rate confirmations and financial records (shipper rates, carrier
              rates, broker margins), invoice and settlement records, and
              facility directory entries.
            </p>
            <p>
              This operational data is owned by the Tenant organization.
              FreightLink stores and processes it solely to provide the Service.
            </p>

            <h3>1.3 Driver Information (Entered by Tenants)</h3>
            <p>
              Tenant organizations may enter driver names and phone numbers when
              creating loads for tracking purposes. This information is provided
              by the Tenant, not collected directly from drivers. FreightLink
              processes it on behalf of the Tenant.
            </p>

            <h3>1.4 GPS and Location Data</h3>
            <p>
              The driver tracking feature uses tokenized links. When a driver
              or shipper opens a tracking link and grants location permission in
              their browser or device, the Service records GPS coordinates
              (latitude, longitude, and timestamp). Location pings are associated
              with the specific load record and visible to the Tenant's team.
            </p>
            <p>
              Location data is used exclusively for shipment tracking. We do not
              aggregate location data across drivers or tenants, use it for
              advertising, or sell it to third parties.
            </p>

            <h3>1.5 Uploaded Documents</h3>
            <p>
              Users may upload documents such as rate confirmations, proofs of
              delivery (PODs), invoices, and carrier insurance certificates.
              These documents may contain personal data belonging to third
              parties (e.g., driver signatures on PODs, shipper contact names on
              rate confirmations). By uploading such documents, you represent
              that you have the right to process this data and that doing so is
              consistent with your legal obligations.
            </p>

            <h3>1.6 Payment Information</h3>
            <p>
              Subscription payments are processed by{" "}
              <a
                href="https://stripe.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe, Inc.
              </a>{" "}
              FreightLink does not receive or store your full credit card
              number, CVV, or bank account details. We receive from Stripe only
              a tokenized payment method reference, the last four digits of the
              card, the card type, and the billing name. Stripe's own privacy
              policy governs its handling of payment data.
            </p>

            <h3>1.7 Usage and Analytics Data</h3>
            <p>
              We collect information about how you interact with the Service,
              including pages visited, features used, session timestamps, IP
              addresses, browser type, and device information. This data is used
              to monitor platform health, debug issues, and improve the Service.
            </p>

            <h3>1.8 API Keys and Credentials (Encrypted)</h3>
            <p>
              If you configure third-party integrations or API keys within your
              account, those values are encrypted at rest using AES-256-GCM
              encryption with per-organization encryption keys before storage.
              FreightLink staff cannot read plaintext API key values.
            </p>

            <h2>2. How We Use Your Data</h2>
            <ul>
              <li>
                <strong>Providing the Service</strong> — Storing, displaying,
                and processing your operational data to enable load management,
                carrier vetting, document handling, invoicing, and all other
                platform features.
              </li>
              <li>
                <strong>OCR and Document Processing</strong> — Uploaded
                documents are sent to a third-party AI/vision model provider for
                optical character recognition and structured data extraction. See
                Section 4 for disclosure of this sharing.
              </li>
              <li>
                <strong>Billing</strong> — Processing subscription payments and
                sending billing notifications through Stripe.
              </li>
              <li>
                <strong>Email Communications</strong> — Sending transactional
                emails (trial expiration notices, billing receipts, password
                reset emails, load tracking notifications, and system alerts).
                We do not send marketing emails without your opt-in consent.
              </li>
              <li>
                <strong>Platform Improvement</strong> — Analyzing anonymized,
                aggregated usage data to improve features, fix bugs, and
                understand how the platform is used.
              </li>
              <li>
                <strong>Legal Compliance and Safety</strong> — Responding to
                valid legal process, enforcing our Terms of Service, or
                protecting the rights and safety of FreightLink and its users.
              </li>
            </ul>

            <h2>3. Cookies and Tracking</h2>
            <p>
              The Service uses cookies and similar tracking technologies for
              the following purposes:
            </p>
            <ul>
              <li>
                <strong>Session cookies</strong> — To maintain your
                authenticated session while you are logged in. These are
                required for the Service to function.
              </li>
              <li>
                <strong>Preference cookies</strong> — To remember settings such
                as UI preferences (stored in browser local storage).
              </li>
              <li>
                <strong>Analytics cookies</strong> — To collect anonymized
                usage statistics. You may opt out of analytics tracking via
                your browser's Do Not Track signal or cookie settings.
              </li>
            </ul>
            <p>
              The Service does not use third-party advertising cookies or
              cross-site behavioral tracking.
            </p>

            <h2>4. Third-Party Data Sharing</h2>
            <p>
              We share data with third parties only as described below. We do
              not sell personal data.
            </p>
            <ul>
              <li>
                <strong>Stripe, Inc.</strong> (Payment Processing) — Receives
                billing contact and payment method data to process subscription
                charges. Governed by{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe's Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Supabase, Inc.</strong> (Database and Infrastructure)
                — Our primary database, authentication, and file storage
                provider. Tenant data is stored on Supabase-managed
                infrastructure. Governed by Supabase's Data Processing
                Agreement.
              </li>
              <li>
                <strong>AI/Vision OCR Provider</strong> — Uploaded document
                images are transmitted to a third-party AI vision model provider
                for OCR extraction. The specific provider may change as the
                platform evolves; the relevant vendor is identified in our
                sub-processor list available upon request.
              </li>
              <li>
                <strong>Carrier Verification Data Provider</strong> — Carrier
                DOT/MC numbers may be submitted to a third-party data provider
                (currently FMCSA public data APIs or a contracted commercial
                safety data provider) to retrieve authority status, safety
                ratings, and insurance information.
              </li>
              <li>
                <strong>Legal and Compliance</strong> — We may disclose data to
                law enforcement or regulatory authorities in response to valid
                legal process, or to protect the rights, property, or safety of
                FreightLink, its users, or the public.
              </li>
            </ul>

            <h2>5. Tracking Links and Public-Facing Pages</h2>
            <p>
              The platform generates tokenized public tracking links that can
              be shared with drivers or shippers. These pages expose only
              non-sensitive shipment information: the load reference number,
              origin and destination (city/state level), status, and estimated
              arrival. <strong>Rate, carrier rate, broker margin, customer
              contact details, and internal notes are never visible on public
              tracking pages.</strong>
            </p>
            <p>
              Tracking links are time-limited and associated with a single
              load. Accessing a tracking link may result in location data being
              collected as described in Section 1.4.
            </p>

            <h2>6. Data Retention and Deletion</h2>
            <p>
              We retain your data for as long as your account is active. Upon
              cancellation of your subscription:
            </p>
            <ul>
              <li>
                Your account enters a 30-day post-cancellation window during
                which you may export your data.
              </li>
              <li>
                After 30 days, your operational data (loads, carriers, financial
                records, documents) will be permanently deleted from our active
                databases.
              </li>
              <li>
                Backup copies may persist for up to 90 days before automatic
                deletion.
              </li>
              <li>
                We may retain certain records longer if required by applicable
                law or to resolve open disputes.
              </li>
            </ul>
            <p>
              To request early deletion of your data or to submit a data
              deletion request, contact us at{" "}
              <a href="mailto:support@loadlinkers.co">
                support@loadlinkers.co
              </a>.
            </p>

            <h2>7. Security Measures</h2>
            <p>We implement the following security practices:</p>
            <ul>
              <li>
                <strong>Encryption at rest</strong> — Sensitive fields (API
                keys, credentials) are encrypted using AES-256-GCM with
                per-organization keys. Database storage is managed by Supabase,
                which uses encrypted storage volumes.
              </li>
              <li>
                <strong>Encryption in transit</strong> — All data transmitted
                between your browser and the Service is encrypted via TLS 1.2+.
              </li>
              <li>
                <strong>Row-level security (RLS)</strong> — The database
                enforces tenant data isolation at the database layer. Each
                organization's data is inaccessible to other organizations.
              </li>
              <li>
                <strong>Access controls</strong> — Role-based access control
                limits team member access to only the features and data their
                role permits. Organization administrators control team
                permissions.
              </li>
              <li>
                <strong>Authentication</strong> — Passwords are never stored
                in plaintext. Authentication is handled via Supabase Auth with
                support for email/password and OAuth (Google) sign-in.
              </li>
            </ul>
            <p>
              No system is perfectly secure. If you become aware of a security
              vulnerability in the Service, please contact us at{" "}
              <a href="mailto:support@loadlinkers.co">
                support@loadlinkers.co
              </a>.
            </p>

            <h2>8. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the following rights
              with respect to your personal data:
            </p>
            <ul>
              <li>
                <strong>Access</strong> — Request a copy of the personal data
                we hold about you.
              </li>
              <li>
                <strong>Correction</strong> — Request correction of inaccurate
                personal data.
              </li>
              <li>
                <strong>Deletion</strong> — Request deletion of your personal
                data, subject to legal retention obligations.
              </li>
              <li>
                <strong>Portability</strong> — Request your operational data in
                a machine-readable format. Organization administrators can
                export most data from the account dashboard.
              </li>
              <li>
                <strong>Opt-out of marketing communications</strong> — Use the
                unsubscribe link in any marketing email or contact us directly.
              </li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:support@loadlinkers.co">
                support@loadlinkers.co
              </a>
              . We will respond within 30 days. We may need to verify your
              identity before fulfilling requests.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              The Service is not directed at individuals under the age of 16
              (or 13 in jurisdictions where that is the applicable minimum
              age). We do not knowingly collect personal data from children. If
              you believe a minor has provided us with personal data, please
              contact us immediately at{" "}
              <a href="mailto:support@loadlinkers.co">
                support@loadlinkers.co
              </a>{" "}
              and we will take steps to delete that information.
            </p>

            <h2>10. International Data Transfers</h2>
            <p>
              FreightLink is based in the United States and the Service
              operates primarily on US-based infrastructure. If you are
              accessing the Service from outside the United States, your data
              will be transferred to and processed in the United States. By
              using the Service, you consent to this transfer. If you have
              concerns about cross-border data transfers (including GDPR
              compliance for EU users), please contact us to discuss data
              processing agreements.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              This Privacy Policy is governed by the laws of the State of
              Wyoming, USA, consistent with our{" "}
              <Link href="/terms">Terms of Service</Link>.
            </p>

            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by sending an email to your
              account's primary contact address and/or displaying an in-app
              notice at least 14 days before the changes take effect. The
              updated policy will be posted at this URL with a revised effective
              date. Continued use of the Service after the effective date
              constitutes acceptance of the updated policy.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              For any privacy-related questions, data requests, or concerns,
              contact our privacy team at:
            </p>
            <p>
              <a href="mailto:support@loadlinkers.co">
                support@loadlinkers.co
              </a>
            </p>
            <p>
              Loadlinkers Logistics LLC
              <br />
              Wyoming, USA
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>
            <Link href="/" className="text-slate-500 hover:text-slate-700 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
