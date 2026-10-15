"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function SiteFooter() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/site-settings`, { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then(setSettings).catch(() => {});
  }, []);

  return (
    <footer className="site-footer">
      <div className="section-shell footer-main">
        <div>
          <Link className="brand footer-brand" href="/"><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><span className="brand-wordmark"><strong>reach forever</strong><small>DIGITAL GROWTH AGENCY</small></span></Link>
          <p>{settings?.footerDescription || "Good brands deserve to go further. We're here to help them get there."}</p>
        </div>
        <div className="footer-links"><strong>Explore</strong><Link href="/">Home</Link><Link href="/results">Results</Link><Link href="/services">Services</Link><Link href="/team">Team</Link><Link href="/contact">Contact</Link></div>
        <div className="footer-contact"><strong>Contact</strong>{settings?.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}{settings?.phone && <a href={`tel:${settings.phone}`}>{settings.phone}</a>}{settings?.socialLinks?.filter((link) => link.isVisible !== false).map((link) => <a key={link.platform} href={link.url} target="_blank" rel="noreferrer">{link.platform}</a>)}</div>
      </div>
      <div className="section-shell footer-bottom"><span>© 2026 Reach Forever. All rights reserved.</span><span>Built on trust. Focused on growth.</span></div>
    </footer>
  );
}