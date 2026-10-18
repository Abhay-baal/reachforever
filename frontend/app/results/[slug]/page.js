"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicShell from "../../components/PublicShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

function getYouTubeEmbed(url = "") {
  try {
    const parsed = new URL(url);
    let id = "";

    if (parsed.hostname.includes("youtu.be")) {
      id = parsed.pathname.split("/").filter(Boolean)[0] || "";
    } else if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") id = parsed.searchParams.get("v") || "";
      else if (parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/shorts/")) {
        id = parsed.pathname.split("/").filter(Boolean)[1] || "";
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : "";
  } catch {
    return "";
  }
}

export default function ProjectDetailPage({ params }) {
  const [slug, setSlug] = useState("");
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.resolve(params)
      .then((resolved) => {
        if (active) setSlug(Array.isArray(resolved?.slug) ? resolved.slug[0] : resolved?.slug || "");
      })
      .catch(() => {
        if (active) setError("Unable to load this project.");
      });
    return () => { active = false; };
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();

    async function loadProject() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API_URL}/api/results/${encodeURIComponent(slug)}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (response.status === 404) throw new Error("We couldn't find that project.");
        if (!response.ok) throw new Error("Unable to load this project right now.");
        setProject(await response.json());
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Unable to load this project.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProject();
    return () => controller.abort();
  }, [slug]);

  const videoEmbed = getYouTubeEmbed(project?.videoUrl);
  const services = Array.isArray(project?.servicesProvided) ? project.servicesProvided : [];
  const keyResults = Array.isArray(project?.keyResults) ? project.keyResults : [];
  const gallery = Array.isArray(project?.gallery) ? project.gallery : [];
  const [galleryPage, setGalleryPage] = useState(1);

  useEffect(() => {
    setGalleryPage(1);
  }, [slug]);

  return (
    <PublicShell>
      <main className="rf-project-detail">
        <div className="rf-project-detail-inner">
          <Link className="rf-project-back" href="/results">← All results</Link>

          {loading ? (
            <div className="rf-project-state" role="status">Loading project…</div>
          ) : error ? (
            <section className="rf-project-state" role="alert">
              <h1>Project unavailable</h1>
              <p>{error}</p>
              <Link href="/results">Explore all results</Link>
            </section>
          ) : project ? (
            <>
              <section className="rf-project-feature-grid" aria-label="Project overview">
                <div className="rf-project-feature">
                  {project.videoAssetUrl ? (
                    <div className="rf-project-video">
                      <video
                        src={project.videoAssetUrl}
                        controls
                        playsInline
                        preload="metadata"
                        poster={project.imageUrl || undefined}
                      />
                    </div>
                  ) : videoEmbed ? (
                    <div className="rf-project-video">
                      <iframe
                        src={videoEmbed}
                        title={`${project.clientName || "Project"} video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  ) : project.imageUrl ? (
                    <img
                      className="rf-project-cover"
                      src={project.imageUrl}
                      alt={`${project.clientName || "Project"} cover`}
                    />
                  ) : (
                    <div className="rf-project-video rf-project-video-empty">
                      Project media coming soon
                    </div>
                  )}
                </div>

                <div className="rf-project-summary">
                  <span className="rf-project-eyebrow">
                    {project.category || "PROJECT"}
                  </span>
                  <h1>{project.clientName || "Project"}</h1>
                  <span className="rf-project-summary-label">WHAT WE DID</span>
                  <p>{project.longDescription || project.description || "Project details coming soon."}</p>
                </div>
              </section>

              <div className="rf-project-content">
                {gallery.length > 0 && (
                  <section className="rf-project-gallery-section" aria-label="Project gallery">
                    <div className="rf-project-gallery">
                      {gallery
                        .slice((galleryPage - 1) * 6, galleryPage * 6)
                        .map((item, index) => {
                          const imageIndex = (galleryPage - 1) * 6 + index;
                          return (
                            <figure key={item.publicId || item.url || imageIndex}>
                              <img
                                src={item.url}
                                alt={item.alt || `${project.clientName || "Project"} image ${imageIndex + 1}`}
                                loading="lazy"
                              />
                              {item.caption && <figcaption>{item.caption}</figcaption>}
                            </figure>
                          );
                        })}
                    </div>

                    {gallery.length > 6 && (
                      <nav className="rf-project-pagination" aria-label="Gallery pages">
                        <button
                          type="button"
                          onClick={() => setGalleryPage((current) => Math.max(1, current - 1))}
                          disabled={galleryPage === 1}
                          aria-label="Previous gallery page"
                        >
                          ← Previous
                        </button>
                        <span>Page {galleryPage} of {Math.ceil(gallery.length / 6)}</span>
                        <button
                          type="button"
                          onClick={() => setGalleryPage((current) => Math.min(Math.ceil(gallery.length / 6), current + 1))}
                          disabled={galleryPage >= Math.ceil(gallery.length / 6)}
                          aria-label="Next gallery page"
                        >
                          Next →
                        </button>
                      </nav>
                    )}
                  </section>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </PublicShell>
  );
}
