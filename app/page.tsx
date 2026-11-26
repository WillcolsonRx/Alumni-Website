import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, HeartHandshake, Mail } from "lucide-react";
import { NeuralBackground } from "@/components/neural-background";
import { Membership } from "@/components/membership";
import { Button } from "@/components/ui/button";

const contactUrl = "mailto:alumni@niperrbl.ac.in";

export default function Home() {
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
            <a href="#membership">Membership</a>
            <a href="#giving">Giving</a>
          </nav>
          <Button asChild className="header-join"><a href="#membership">Membership <ArrowUpRight aria-hidden="true" /></a></Button>
        </div>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <NeuralBackground />
          <div className="shell hero-content">
            <div className="hero-copy">
              <p className="eyebrow"><span /> NIPER-RAEBARELI ALUMNI</p>
              <h1 id="hero-title">Your NIPER story <em>continues here.</em></h1>
              <p className="intro">A home for NIPER-Raebareli graduates to reconnect, share what they’ve learned, and support the next generation of pharmaceutical scientists.</p>
              <div className="actions">
                <Button asChild size="lg" className="primary-action"><a href="#membership">Register as alumni <ArrowRight aria-hidden="true" /></a></Button>
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
            <a id="giving" href={contactUrl}><HeartHandshake aria-hidden="true" /><span>Support the association<small>Ask about giving</small></span><ArrowUpRight aria-hidden="true" /></a>
          </div>
        </section>
        <Membership />
      </main>
      <footer><div className="shell footer-inner"><span><Image className="footer-mark" src="/institute/niper-emblem.png" alt="" width={29} height={33} /> NIPER-Raebareli Alumni Association</span><a href={contactUrl}>alumni@niperrbl.ac.in</a></div></footer>
    </>
  );
}
