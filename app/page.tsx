import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, HeartHandshake, Mail } from "lucide-react";
import { Membership } from "@/components/membership";
import { Button } from "@/components/ui/button";

const octopodUrl = "https://octopod.co.in/payment/collection/4d3a15f6163b1698fead635013807d18/6ac464f5ce0b911f9fee314680d8b66c";
const contactUrl = "mailto:alumni@niperrbl.ac.in";

export default function Home() {
  const applicationsEnabled = !process.env.VERCEL && process.env.ALUMNI_APPLICATIONS_DISABLED !== "1";
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="header">
        <div className="shell header-inner">
          <Link className="wordmark" href="/" aria-label="NIPER-Raebareli Alumni Association home">
            <Image className="mark" src="/institute/niper-emblem.png" alt="" width={44} height={50} />
            <span>NIPER-Raebareli<small>ALUMNI ASSOCIATION</small></span>
          </Link>
          <nav aria-label="Main navigation">
            <a href="#community">Community</a>
            <a href={octopodUrl}>Membership</a>
            <a href="#giving">Giving</a>
          </nav>
          <Button asChild className="header-join"><a href={octopodUrl}>Membership <ArrowUpRight aria-hidden="true" /></a></Button>
        </div>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="neural-background" aria-hidden="true">
            <Image src="/neural-connections.webp" alt="" fill preload sizes="100vw" />
            <div className="neural-signal" />
          </div>
          <div className="shell hero-content">
            <div className="hero-copy">
              <p className="eyebrow"><span /> NIPER-RAEBARELI ALUMNI</p>
              <h1 id="hero-title">Your NIPER story <em>continues here.</em></h1>
              <p className="intro">A home for NIPER-Raebareli graduates to reconnect, share what they’ve learned, and support the next generation of pharmaceutical scientists.</p>
              <div className="actions">
                <Button asChild size="lg" className="primary-action"><a href={octopodUrl}>Continue to Octopod <ArrowRight aria-hidden="true" /></a></Button>
                <a className="quiet" href="#community">Explore the association <ArrowDown size={16} aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </section>

        <section id="community" className="community shell" aria-labelledby="community-title">
          <div>
            <h2 id="community-title">Connections beyond campus.</h2>
            <p>Reconnect with your cohort and stay in touch with the NIPER-Raebareli Alumni Association.</p>
          </div>
          <div className="community-links">
            <a href={contactUrl}><Mail aria-hidden="true" /><span>Contact the association<small>alumni@niperrbl.ac.in</small></span><ArrowUpRight aria-hidden="true" /></a>
            <a id="giving" href={octopodUrl}><HeartHandshake aria-hidden="true" /><span>Support the association<small>Donate through Octopod</small></span><ArrowUpRight aria-hidden="true" /></a>
          </div>
        </section>
        {applicationsEnabled ? <Membership /> : (
          <section id="membership" className="membership" aria-labelledby="membership-title">
            <div className="shell">
              <h2 id="membership-title">Alumni membership</h2>
              <p>For questions about membership and fees, <a className="underline" href={contactUrl}>contact the association</a>.</p>
              <Button asChild className="header-join mt-5"><a href={octopodUrl}>Continue to Octopod <ArrowUpRight aria-hidden="true" /></a></Button>
            </div>
          </section>
        )}
      </main>
      <footer><div className="shell footer-inner"><span><Image className="footer-mark" src="/institute/niper-emblem.png" alt="" width={29} height={33} /> NIPER-Raebareli Alumni Association</span><a href={contactUrl}>alumni@niperrbl.ac.in</a></div></footer>
    </>
  );
}
