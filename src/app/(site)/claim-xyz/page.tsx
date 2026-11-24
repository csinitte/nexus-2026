import type { Metadata } from 'next';
import Image from 'next/image';
import { XyzSponsorLogo } from '@/components/site/XyzSponsor';
import { XYZ_SPONSOR } from '@/content/xyz-sponsor';
import './claim-xyz.css';

export const metadata: Metadata = {
  title: 'Claim your .xyz domain',
  description: 'How NEXUS 2026 participants can redeem a first-year .xyz domain from our official domain sponsor.',
  robots: { index: false, follow: true },
};

export default function ClaimXyzPage() {
  return (
    <article className="section page xyz-claim">
      <header className="xyz-claim-intro">
        <div className="xyz-claim-intro-copy">
          <h1>Claim your <em>.xyz domain.</em></h1>
          <p>
            XYZ Registry is offering NEXUS 2026 participants a free first year on a .xyz domain,
            while the sponsored domains last.
          </p>
          <a href={XYZ_SPONSOR.registration} className="button" target="_blank" rel="noopener noreferrer">
            Search for a .xyz domain
          </a>
        </div>
        <aside className="xyz-claim-offer" aria-label="NEXUS participant offer">
          <dl>
            <div><dt>Promo code</dt><dd><code>{XYZ_SPONSOR.code}</code></dd></div>
            <div><dt>Code expires</dt><dd><time dateTime={XYZ_SPONSOR.expiresOn}>{XYZ_SPONSOR.expiryLabel}</time></dd></div>
          </dl>
          <p>Select a one-year term at checkout. Check the renewal price separately if you plan to keep the domain.</p>
        </aside>
      </header>

      <section className="xyz-claim-block" aria-labelledby="redeem-heading">
        <h2 id="redeem-heading">How to redeem</h2>
        <ol className="xyz-claim-steps">
          <li>
            <h3>Find an available domain</h3>
            <p>Search for your preferred .xyz name on Gen.xyz, then choose <strong>Go to checkout</strong>.</p>
          </li>
          <li>
            <h3>Set the term to one year</h3>
            <p>In <strong>Your Domains</strong>, change the <strong>Term</strong> to <strong>1 year</strong>. Continue to <strong>Recommended Add-Ons</strong>, leave the default selections as shown in the guide, then continue to <strong>Information &amp; Checkout</strong>.</p>
          </li>
          <li>
            <h3>Apply the code and check your total</h3>
            <p>Enter <code>{XYZ_SPONSOR.code}</code> in the <strong>Promotional Code</strong> field and select <strong>Apply Code</strong>. Only submit the order if the total due is <strong>$0.00 USD</strong>.</p>
          </li>
          <li>
            <h3>Enter your details and submit</h3>
            <p>Use accurate contact details and an email address you can access. If you’re under 18, ask a NEXUS organiser for help with this step. The sponsor guide recommends choosing <strong>PayPal</strong> as the default payment method so you can leave the card fields blank. Once you’ve confirmed the zero total, select <strong>Submit Order</strong>.</p>
          </li>
          <li>
            <h3>Verify your email address</h3>
            <p>Open the verification email from XYZ and follow its link promptly so your domain stays active. Check your spam folder if it doesn’t arrive.</p>
          </li>
        </ol>

        <div className="xyz-claim-examples">
          <figure>
            <a href={`${XYZ_SPONSOR.localGuide}#page=4`} aria-label="Open page 4 of the XYZ guide to see the one-year term">
              <Image src="/xyz-checkout-term.webp" alt="The Term dropdown in Your Domains with 1 year highlighted." width={1200} height={781} sizes="(max-width: 700px) 90vw, 440px" />
            </a>
            <figcaption>The one-year term in the XYZ cart</figcaption>
          </figure>
          <figure>
            <a href={`${XYZ_SPONSOR.localGuide}#page=6`} aria-label="Open page 6 of the XYZ guide to see the promotional code field">
              <Image src="/xyz-checkout-promo.webp" alt="Information and Checkout showing the Promotional Code area and a total due of zero dollars." width={1200} height={843} sizes="(max-width: 700px) 90vw, 440px" />
            </a>
            <figcaption>The promo field and zero total in XYZ’s example checkout</figcaption>
          </figure>
        </div>
      </section>

      <section className="xyz-claim-block" aria-labelledby="help-heading">
        <h2 id="help-heading">Help with your domain</h2>
        <dl className="xyz-claim-help">
          <div>
            <dt>Code rejected or order flagged?</dt>
            <dd>Check that the term is one year. If the issue persists, email <a href="mailto:support@gen.xyz">support@gen.xyz</a> with the event name, NEXUS 2026, and a screenshot of the error.</dd>
          </div>
          <div>
            <dt>Weebly unavailable?</dt>
            <dd>XYZ says Weebly availability varies by region. You can still register and use your domain with a host or website builder of your choice. See <a href="https://www.weebly.com/app/help/us/en/topics/changes-to-weebly-global-operations#which-countries-will-weebly-no-longer-be-available-in">Weebly’s regional service notice</a>.</dd>
          </div>
        </dl>
      </section>

      <section className="xyz-claim-credit" aria-labelledby="sponsor-heading">
        <XyzSponsorLogo />
        <div>
          <h2 id="sponsor-heading">Thanks to our domain sponsor</h2>
          <p>XYZ Registry provided the domains, original guide, and checkout screenshots.</p>
          <div className="xyz-claim-links">
            <a href={XYZ_SPONSOR.originalGuide}>Open the original XYZ guide</a>
            <a href={XYZ_SPONSOR.localGuide} download>Download the PDF</a>
          </div>
        </div>
      </section>
    </article>
  );
}
