"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

  const slug = result.slug || String(brandName).toLowerCase()
    .trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <Link
      className="clean-results-card-navigation"
      href={`/results/${encodeURIComponent(slug)}`}
      aria-label={`View project details for ${brandName}`}
    >
      <article className="clean-results-card">
      <div className="clean-results-card-media">
        {result.imageUrl ? (
          <img src={result.imageUrl} alt={`${brandName} project`} loading="lazy" />
        ) : (
          <div className="clean-results-card-placeholder" aria-hidden="true" />
        )}

        <div className="clean-results-card-overlay">
          <p className="clean-results-card-category">{category}</p>
          <h3 className="clean-results-card-brand">{brandName}</h3>

          <span className="clean-results-card-link">
            <span>View Project</span>
          </span>
        </div>
      </div>
      </article>
    </Link>
  );
}


export default function ResultsSection() {
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const resultsPerPage = isMobile ? 8 : 9;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(results.length / resultsPerPage));
  const pageResults = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    return results.slice(start, start + resultsPerPage);
  }, [results, currentPage, resultsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
