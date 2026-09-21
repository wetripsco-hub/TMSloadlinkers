/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar/navbar";
import { Footer } from "@/components/footer/footer";

export const metadata: Metadata = {
  title: "Terms of Service | FreightLink TMS",
  description:
    "Terms and conditions governing use of the FreightLink TMS software platform.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
          <header className="mb-10">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
              Terms of Service
            </h1>
            <p className="text-sm text-slate-500">
              Effective date: <strong>January 1, 2025</strong> &nbsp;·&nbsp;
              Last updated: <strong>September 2026</strong>
            </p>
          </header>

          <div className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-li:my-0.5">

            <p>
              These Terms of Service ("Terms") are a legally binding agreement
              between you ("User," "Tenant," or "you") and Loadlinkers Logistics LLC
              ("FreightLink," "we," "us," or "our") governing your access to
              and use of the FreightLink TMS software platform and any related
              services (collectively, the "Service"). By creating an account,
              accessing, or using the Service, you agree to be bound by these
              Terms. If you do not agree, do not use the Service.
            </p>

            <h2>1. Description of Service</h2>
            <p>
              FreightLink TMS is a multi-tenant, cloud-based transportation
              management system (TMS) designed for freight industry
              professionals. The platform operates in two modes:
            </p>
            <ul>
              <li>
                <strong>Broker Core</strong> — Tools for licensed property
                brokers holding FMCSA motor carrier (MC) authority: load
                management, carrier sourcing and vetting, rate confirmation
                generation, document processing, invoice management, settlement
                tracking, and customer relationship management.
              </li>
              <li>
                <strong>Dispatcher Core</strong> — Tools for independent
                dispatch agents who represent carriers: load booking, document
                handling, driver tracking, and billing support.
              </li>
            </ul>
            <p>
              <strong>
                FreightLink is a software platform only. FreightLink is NOT a
                licensed freight broker, motor carrier, or freight forwarder,
                and does not operate as one.
              </strong>{" "}
              Nothing in the Service constitutes the brokerage, transportation,
              or arrangement of freight. The Tenant organization is solely
              responsible for obtaining and maintaining any licenses, operating
              authority, bonds, or registrations (including but not limited to
              FMCSA MC authority, BOC-3 process agent filing, and surety bond)
              that their own use of the platform legally requires.
            </p>

            <h2>2. Accounts and Organizations</h2>
            <p>
              Access to the Service requires creating an account and an
              associated Tenant organization. You represent that all information
              you provide during registration is accurate, current, and
              complete. You are responsible for all activity that occurs under
              your account and must maintain the confidentiality of your login
              credentials. You must promptly notify us of any unauthorized use
              of your account.
            </p>
            <p>
              Each Tenant organization operates in an isolated data environment.
              Organization administrators may invite additional team members and
              assign role-based permissions. You are responsible for all actions
              taken by users within your organization.
            </p>

            <h2>3. Subscription, Billing, and Payment</h2>
            <h3>3.1 Subscription Tiers</h3>
            <p>
              The Service is offered under the following subscription plans
              (subject to change with notice):
            </p>
            <ul>
              <li>
                <strong>Starter</strong> — Core load management, carrier
                directory, and basic document processing for small brokerages.
              </li>
              <li>
                <strong>Growth</strong> — Expanded API access, advanced
                analytics, priority support, and higher usage limits.
              </li>
              <li>
                <strong>Enterprise</strong> — Unlimited users, custom
                integrations, dedicated support, and SLA guarantees (terms
                negotiated separately).
              </li>
            </ul>
            <h3>3.2 Free Trial</h3>
            <p>
              New Tenant organizations may access a 7-day free trial of the
              platform. No credit card is required to begin a trial. At the end
              of the trial period, you must subscribe to a paid plan to continue
              using the Service. Trial accounts may have reduced feature access.
            </p>
            <h3>3.3 Billing and Auto-Renewal</h3>
            <p>
              Paid subscriptions are billed in advance on a monthly or annual
              basis, as selected at checkout. All payments are processed through
              Stripe, Inc. By providing payment information, you authorize
              FreightLink (through Stripe) to charge your payment method on the
              applicable billing date. Subscriptions automatically renew at the
              end of each billing period unless cancelled before the renewal
              date.
            </p>
            <h3>3.4 Cancellation</h3>
            <p>
              You may cancel your subscription at any time through the billing
              settings in your account dashboard. Cancellation takes effect at
              the end of the current billing period. After cancellation, your
              account will be downgraded to a read-only state for a period of 30
              days, after which your data may be deleted in accordance with our
              data retention policy.
            </p>
            <h3>3.5 Refund Policy</h3>
            <p>
              All fees are non-refundable except as expressly required by
              applicable law. No refunds or credits are issued for partial
              billing periods, unused subscription time, or downgraded plans. If
              you believe a charge was made in error, contact us within 30 days
              of the charge.
            </p>
            <h3>3.6 Price Changes</h3>
            <p>
              We reserve the right to modify subscription pricing at any time.
              We will provide at least 30 days' advance notice of any price
              changes for existing subscribers. Continued use of the Service
              after the price change takes effect constitutes acceptance of the
              new pricing.
            </p>

            <h2>4. Carrier Verification Disclaimer</h2>
            <p>
              The Service includes a carrier vetting feature that retrieves and
              displays information about motor carriers, including FMCSA safety
              ratings, operating authority status, and insurance data. This
              information is sourced from third-party data providers and public
              databases. <strong>FreightLink does not guarantee the accuracy,
              completeness, or currency of carrier verification data and makes
              no warranty that a carrier is fit, safe, licensed, insured, or
              suitable for any particular load.</strong>
            </p>
            <p>
              Carrier verification data is provided for informational purposes
              only. You are solely responsible for conducting your own due
              diligence before engaging any carrier, including verifying the
              carrier's operating authority, insurance, safety record, and
              compliance with all applicable regulations.
            </p>

            <h2>5. OCR and Document Processing</h2>
            <p>
              The Service provides AI-assisted optical character recognition
              (OCR) and document processing for user-uploaded files, including
              rate confirmations, proofs of delivery (PODs), and invoices.
              Document images may be transmitted to third-party AI or vision
              model providers for extraction processing.
            </p>
            <p>
              <strong>
                Extracted data may contain errors, omissions, or
                misinterpretations. You are responsible for reviewing all
                extracted data via the document review queue before relying on
                it for any business purpose.
              </strong>{" "}
              FreightLink is not liable for errors in OCR output or decisions
              made based on unverified extracted data.
            </p>

            <h2>6. Driver Tracking and Location Data</h2>
            <p>
              The Service includes a driver location tracking feature that
              collects GPS/geolocation data via tokenized tracking links sent to
              drivers or shippers. Location data is collected only when a driver
              or shipper actively accesses a tracking link. This data is used
              solely for shipment tracking and operational visibility purposes
              within your organization. Location data is{" "}
              <strong>not sold, licensed, or shared with third parties</strong>{" "}
              for advertising or any purpose unrelated to the Service.
            </p>
            <p>
              Public-facing tracking pages expose only non-sensitive shipment
              status information (origin, destination, estimated arrival, and
              location ping). Rate, margin, and financial data are never exposed
              on public tracking pages.
            </p>
            <p>
              You are responsible for ensuring that any driver or shipper from
              whom you collect location data has provided appropriate consent
              under applicable law.
            </p>

            <h2>7. Data Ownership and Processing</h2>
            <p>
              You and your organization retain ownership of all operational data
              you input into the Service, including load records, carrier
              records, customer records, financial data, and uploaded documents
              ("Tenant Data"). FreightLink acts as a data processor and service
              provider with respect to Tenant Data and does not claim ownership
              of it.
            </p>
            <p>
              By using the Service, you grant FreightLink a limited,
              non-exclusive license to store, process, and transmit Tenant Data
              as necessary to provide the Service. FreightLink may also use
              anonymized, aggregated data derived from platform usage for
              product improvement and analytics purposes.
            </p>

            <h2>8. Intellectual Property</h2>
            <p>
              The Service, including its source code, design, user interface,
              trade names, logos, and all related technology (collectively,
              "Platform IP"), is the exclusive property of Loadlinkers Logistics LLC
              and is protected by applicable intellectual property laws.
              FreightLink grants you a limited, non-transferable, non-exclusive
              license to use the Service for your internal business purposes
              during your subscription term. You may not copy, modify, reverse
              engineer, sublicense, or resell any portion of the Platform IP.
            </p>
            <p>
              All content, documents, and data you upload to the Service remain
              your property. You represent that you have the right to upload and
              process such content.
            </p>

            <h2>9. Prohibited Uses</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>
                Violate any applicable federal, state, or local law or
                regulation, including FMCSA regulations;
              </li>
              <li>
                Impersonate a licensed broker or carrier without the requisite
                authority;
              </li>
              <li>
                Upload, transmit, or store any content that is unlawful,
                defamatory, fraudulent, or infringes on the rights of third
                parties;
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Service,
                other Tenants' data, or FreightLink's infrastructure;
              </li>
              <li>
                Use automated scripts, bots, or scraping tools against the
                Service without our express written consent;
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service.
              </li>
            </ul>

            <h2>10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FREIGHTLINK
              AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND SUPPLIERS
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST
              DATA, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR
              USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
              DAMAGES.
            </p>
            <p>
              IN NO EVENT SHALL FREIGHTLINK'S TOTAL LIABILITY TO YOU FOR ALL
              CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE
              EXCEED THE GREATER OF (A) THE TOTAL SUBSCRIPTION FEES PAID BY YOU
              TO FREIGHTLINK IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR
              (B) ONE HUNDRED DOLLARS ($100.00).
            </p>

            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless FreightLink and
              its affiliates, officers, directors, employees, and agents from
              and against any claims, liabilities, damages, losses, and
              expenses (including reasonable attorneys' fees) arising out of or
              related to: (a) your use of the Service; (b) your violation of
              these Terms; (c) your violation of any applicable law or
              regulation, including any freight brokerage or transportation
              regulation; (d) any load transaction facilitated using the
              Service; or (e) any claim by a third party arising from your
              operational use of the platform.
            </p>

            <h2>12. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
              WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
              LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT. FREIGHTLINK DOES NOT
              WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR
              FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>

            <h2>13. Termination</h2>
            <p>
              Either party may terminate these Terms and your access to the
              Service at any time:
            </p>
            <ul>
              <li>
                <strong>By you:</strong> Cancel your subscription through the
                account settings at any time. Termination takes effect at the
                end of the current billing period.
              </li>
              <li>
                <strong>By FreightLink:</strong> We may suspend or terminate
                your account immediately for cause if you violate these Terms,
                engage in fraudulent activity, or use the Service in a manner
                that could cause harm to FreightLink, other users, or third
                parties.
              </li>
            </ul>
            <p>
              Upon termination, your right to access the Service ceases. Tenant
              Data will be retained for 30 days post-termination to allow export,
              after which it may be permanently deleted. Provisions of these
              Terms that by their nature should survive termination (including
              Sections 10, 11, 12, 15, and 17) will survive.
            </p>

            <h2>14. Binding Arbitration and Class Action Waiver</h2>
            <p>
              <strong>
                Please read this section carefully. It affects your legal rights.
              </strong>
            </p>
            <p>
              Any dispute, claim, or controversy arising out of or relating to
              these Terms or the Service that cannot be resolved informally
              within 30 days of written notice shall be resolved by binding
              arbitration administered by JAMS (or a mutually agreed arbitration
              service) under its applicable commercial arbitration rules, with
              proceedings conducted in Cheyenne, Wyoming, unless the parties
              agree otherwise in writing.
            </p>
            <p>
              <strong>
                YOU AND FREIGHTLINK EACH WAIVE ANY RIGHT TO A JURY TRIAL AND
                ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR
                CLASS-WIDE ARBITRATION.
              </strong>{" "}
              Claims must be brought on an individual basis only.
            </p>
            <p>
              Notwithstanding the foregoing, either party may seek injunctive or
              other equitable relief in a court of competent jurisdiction to
              prevent irreparable harm.
            </p>

            <h2>15. Governing Law and Jurisdiction</h2>
            <p>
              These Terms are governed by the laws of the State of Wyoming,
              USA, without regard to its conflict of law principles. To the
              extent litigation is permitted under Section 14, you consent to
              the exclusive jurisdiction of the state and federal courts located
              in Laramie County, Wyoming, for resolution of any disputes not
              subject to arbitration.
            </p>

            <h2>16. Assignment</h2>
            <p>
              You may not assign or transfer your rights or obligations under
              these Terms, or your account, to any third party without
              FreightLink's prior written consent. FreightLink may freely assign
              these Terms in connection with a merger, acquisition, or sale of
              all or substantially all of its assets, provided that the
              assignee assumes all obligations under these Terms.
            </p>

            <h2>17. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will
              provide at least 14 days' advance notice of material changes via
              email to the primary account contact or via an in-app notice.
              Continued use of the Service after the effective date of updated
              Terms constitutes acceptance of the changes. If you disagree with
              material changes, your sole remedy is to cancel your subscription.
            </p>

            <h2>18. Contact</h2>
            <p>
              For questions regarding these Terms, contact us at:{" "}
              <a href="mailto:support@loadlinkers.co">support@loadlinkers.co</a>.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
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
