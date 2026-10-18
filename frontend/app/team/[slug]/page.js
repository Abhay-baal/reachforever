"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicShell from "../../components/PublicShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function TeamMemberDetailPage({ params }) {
  const [slug, setSlug] = useState("");
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.resolve(params).then((resolved) => {
      if (active) setSlug(Array.isArray(resolved?.slug) ? resolved.slug[0] : resolved?.slug || "");
    }).catch(() => {
      if (active) setError("Unable to load this team profile.");
    });
    return () => { active = false; };
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();

    async function loadMember() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API_URL}/api/team/${encodeURIComponent(slug)}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (response.status === 404) throw new Error("We couldn't find that team profile.");
        if (!response.ok) throw new Error("Unable to load this profile right now.");
        setMember(await response.json());
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Unable to load this profile.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadMember();
    return () => controller.abort();
  }, [slug]);

  return (
    <PublicShell>
      <main className="rf-team-detail">
        <div className="rf-team-detail-inner">
          <Link className="rf-project-back" href="/team">← Meet the team</Link>
          {loading ? (
            <div className="rf-team-detail-state" role="status">Loading team profile…</div>
          ) : error ? (
            <section className="rf-team-detail-state" role="alert">
              <h1>Profile unavailable</h1>
              <p>{error}</p>
              <Link href="/team">Back to the team</Link>
            </section>
          ) : member ? (
            <article className="rf-team-profile">
              <div className="rf-team-profile-image">
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} />
                ) : (
                  <div className="rf-team-profile-placeholder">RF</div>
                )}
              </div>
              <div className="rf-team-profile-copy">
                <span className="eyebrow"><span className="eyebrow-dot" />MEET THE TEAM</span>
                <h1>{member.name}</h1>
                <p className="rf-team-profile-role">{member.role}</p>
                <div className="rf-team-profile-bio">
                  {member.biography || "More about this team member will be shared soon."}
                </div>
                {Array.isArray(member.socialLinks) && member.socialLinks.some((item) => item.url) && (
                  <nav className="rf-team-profile-socials" aria-label={`${member.name} social links`}>
                    {member.socialLinks.filter((item) => item.url).map((item, index) => (
                      <a key={`${item.platform || "social"}-${index}`} href={item.url}
                        target="_blank" rel="noopener noreferrer">
                        {item.platform || "Connect"} ↗
                      </a>
                    ))}
                  </nav>
                )}
                <Link className="rf-team-profile-cta" href="/contact">Let’s work together</Link>
              </div>
            </article>
          ) : null}
        </div>
      </main>
    </PublicShell>
  );
}
