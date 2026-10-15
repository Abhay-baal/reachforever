"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  SiInstagram,
  SiFacebook,
  SiYoutube,
  SiTiktok,
  SiX,
  SiThreads,
  SiPinterest,
} from "@icons-pack/react-simple-icons";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

function LinkedinMark({ size = 19 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize: size * 0.85,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "-1px",
      }}
    >
      in
    </span>
  );
}

const SOCIAL_ICONS = {
  instagram: SiInstagram,
  facebook: SiFacebook,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  linkedin: LinkedinMark,
  x: SiX,
  threads: SiThreads,
  pinterest: SiPinterest,
};

function getSocialLinks(result) {
  if (Array.isArray(result.socialLinks)) return result.socialLinks;
  if (result.platform && result.socialUrl) {
    return [{ platform: result.platform, url: result.socialUrl, isVisible: true }];
  }
  return [];
}

function ResultCard({ result }) {
  const category =
    result.category ||
    result.categoryName ||
    result.industry ||
    result.type ||
    "";

  const brandName =
    result.brandName ||
    result.clientName ||
    result.title ||
    result.name ||
    "Brand Name";

  const growthUrl =
    result.growthUrl ||
    result.caseStudyUrl ||
    result.projectUrl ||
    result.websiteUrl ||
    "#";

  return (
    <article className="clean-results-card">
      <div className="clean-results-card-media">
        <img
          src={result.imageUrl}
          alt={`${brandName} — ReachForever project`}
          loading="lazy"
          draggable="false"
        />

        <div className="clean-results-card-overlay">
          <p className="clean-results-card-category">{category}</p>
          <h3 className="clean-results-card-brand">{brandName}</h3>

          <a
            className="clean-results-card-link"
            href={growthUrl}
            target={growthUrl !== "#" ? "_blank" : undefined}
            rel={growthUrl !== "#" ? "noopener noreferrer" : undefined}
            aria-label={`View growth for ${brandName}`}
          >
            <span>View Growth</span>
            
          </a>
        </div>
      </div>
    </article>
  );
}

function MovingRow({ results, direction, duration }) {
  const trackRef = useRef(null);
  const pointerRef = useRef(null);
  const draggedRef = useRef(false);
  const duplicated = useMemo(() => [...results, ...results], [results]);

  function startDrag(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerRef.current = { x: event.clientX, lastX: event.clientX };
    draggedRef.current = false;
    trackRef.current?.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event) {
    if (!pointerRef.current || !trackRef.current) return;
    const delta = event.clientX - pointerRef.current.x;
    if (Math.abs(delta) > 5 && !draggedRef.current) {
      draggedRef.current = true;
      trackRef.current.classList.add("is-dragging");
      trackRef.current.style.setProperty("--drag-shift", "0px");
    }
    pointerRef.current.lastX = event.clientX;
    if (draggedRef.current) {
      trackRef.current.style.setProperty("--drag-shift", `${delta}px`);
    }
  }

  function endDrag() {
    if (trackRef.current && draggedRef.current) {
      trackRef.current.classList.remove("is-dragging");
      trackRef.current.style.removeProperty("--drag-shift");
    }
    pointerRef.current = null;
    draggedRef.current = false;
  }

  return (
    <div className="clean-results-lane">
      <div
        ref={trackRef}
        className={`clean-results-belt ${direction === "move-left" ? "clean-results-belt--left" : "clean-results-belt--right"}`}
        style={{ "--results-duration": duration }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {duplicated.map((result, index) => (
          <div className="clean-results-tile" key={`${result._id}-${index}`}>
            <ResultCard result={result} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsSection() {
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 9;

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/api/results`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load results.");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
          setCurrentPage(1);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));
  const pageResults = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    return results.slice(start, start + RESULTS_PER_PAGE);
  }, [results, currentPage]);

  const mobileRows = [
    pageResults.slice(0, 3),
    pageResults.slice(3, 6),
    pageResults.slice(6, 9),
  ];

  function changePage(nextPage) {
    setCurrentPage(Math.min(totalPages, Math.max(1, nextPage)));
  }

  return (
    <section className="results-section" id="results">
      <div className="section-shell">
        <div className="results-heading">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            REAL WORK. REAL RESULTS.
          </span>
          <h2>Built on trust. <span>Focused on growth.</span></h2>
          <p>A closer look at the work and results we share.</p>
        </div>

        {pageResults.length > 0 ? (
          <>
            <div className="results-desktop-grid" aria-label="ReachForever results">
              {pageResults.map((result, index) => (
                <div
                  className="results-grid-tile"
                  key={result._id || `${result.title || result.name || "result"}-${index}`}
                >
                  <ResultCard result={result} />
                </div>
              ))}
            </div>

            <div className="results-mobile-carousels" aria-label="ReachForever results carousels">
              {mobileRows.map((rowResults, index) =>
                rowResults.length > 0 ? (
                  <MovingRow
                    key={`mobile-results-row-${currentPage}-${index}`}
                    results={rowResults}
                    direction={index === 1 ? "move-right" : "move-left"}
                    duration={index === 1 ? "42s" : "38s"}
                  />
                ) : null
              )}
            </div>

            {totalPages > 1 && (
              <nav className="results-pagination" aria-label="Results pages">
                <button
                  type="button"
                  className="results-page-arrow"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  Previous
                </button>

                <div className="results-page-numbers">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={`results-page-number${page === currentPage ? " is-active" : ""}`}
                      onClick={() => changePage(page)}
                      aria-current={page === currentPage ? "page" : undefined}
                      aria-label={`Page ${page}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="results-page-arrow"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="results-empty">
            {loaded ? "Our latest results will appear here soon." : "Loading results…"}
          </div>
        )}
      </div>
    </section>
  );
}
