"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  ["Home", "/"],
  ["Results", "/results"],
  ["Services", "/services"],
  ["Team", "/team"],
  ["Contact", "/contact"],
];

export default function SiteNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="Reach Forever home" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="brand-wordmark"><strong>reach forever</strong><small>DIGITAL GROWTH AGENCY</small></span>
        </Link>
        <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="primary-navigation" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen((value) => !value)}>
          <span /><span />
        </button>
        <nav id="primary-navigation" className={`main-nav${open ? " main-nav-open" : ""}`} aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        </nav>
      </div>
    </header>
  );
}