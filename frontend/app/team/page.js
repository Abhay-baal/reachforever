"use client";

import { useEffect, useState } from "react";
import AboutFounderSection from "../components/AboutFounderSection";
import PublicShell from "../components/PublicShell";
import RFTeamCarousel from "../components/RFTeamCarousel";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

const fallbackPortraits = {
  Ashwin: "/team/ashwin.jpg",
  Abhay: "/team/abhay.jpg",
  Arvan: "/team/arvan.jpg",
  Dhruv: "/team/dhruv.jpg",
};

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  useEffect(() => { fetch(`${API_URL}/api/team`, { cache: "no-store" }).then((response) => response.ok ? response.json() : []).then(setMembers).catch(() => setMembers([])); }, []);

  return (
    <PublicShell>
      <main className="inner-page">
        <AboutFounderSection />
        <section className="section-shell team-directory">
          <div className="inner-page-heading">
            <span className="eyebrow"><span className="eyebrow-dot" />THE TEAM</span>
            <h1>People who make the work matter.</h1>
            <p>Creative minds, strategic thinkers, and people who care about the work.</p>
          </div>

          <RFTeamCarousel members={members} />
        </section>
      </main>
    </PublicShell>
  );
}