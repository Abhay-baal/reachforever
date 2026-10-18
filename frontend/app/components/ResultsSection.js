"use client";

import { useEffect, useState } from "react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function ArrowIcon({ direction = "right" }) {
  const path =
    direction === "left"
      ? "M19 12H5m6 6-6-6 6-6"
      : "M5 12h14m-6-6 6 6-6 6";

  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getProjectName(result) {
  return (
    result.clientName ||
    result.brandName ||
    result.title ||
    result.name ||
    "Featured project"
  );
}

function getProjectSlug(result, name) {
  return (
    result.slug ||
    String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export default function ResultsSection() {
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [readyImageUrls, setReadyImageUrls] = useState(() => new Set());
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(API_URL + "/api/results", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load results.");
        return response.json();
      })
      .then((data) => {
        const projects = Array.isArray(data)
          ? data.filter((item) => item && item.imageUrl)
          : [];

        setResults(projects);
        setActiveIndex(0);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!results.length) return undefined;

    let cancelled = false;
    const preloadedImages = [];

    results.forEach((item) => {
      if (!item.imageUrl) return;

      const image = new window.Image();
      preloadedImages.push(image);

      const markReady = () => {
        if (cancelled) return;

        setReadyImageUrls((current) => {
          if (current.has(item.imageUrl)) return current;
          const next = new Set(current);
          next.add(item.imageUrl);
          return next;
        });
      };

      image.onload = markReady;
      image.onerror = markReady;
      image.src = item.imageUrl;

      if (image.complete) markReady();
    });

    return () => {
      cancelled = true;
      preloadedImages.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [results]);

  useEffect(() => {
    if (results.length < 2 || paused) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % results.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [results.length, paused]);

  function moveSlide(direction) {
    setActiveIndex((current) => {
      if (!results.length) return 0;
      return (current + direction + results.length) % results.length;
    });
  }

  const project = results[activeIndex];
  const brandName = project ? getProjectName(project) : "";
  const category = project
    ? project.category || project.categoryName || project.industry || project.type || "Featured project"
    : "";
  const slug = project ? getProjectSlug(project, brandName) : "";
  const projectHref = slug ? "/results/" + encodeURIComponent(slug) : "/results";

  return (
    <section className="results-section" id="results">
      <div className="section-shell">
        <div className="results-heading">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            REAL WORK. REAL RESULTS.
          </span>
          <h2>
            Built on trust. <span>Focused on growth.</span>
          </h2>
          <p>A closer look at the work and results we share.</p>
        </div>

        {project ? (
          <div
            className="featured-results"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setPaused(false);
              }
            }}
          >
            <a
              className="featured-results-cover"
              href={projectHref}
              aria-label={"Explore project: " + brandName}
            >
              <span className="featured-results-cover-frame">
                <img
                  key={project._id || slug}
                  src={project.imageUrl}
                  alt={brandName + " project cover"}
                  className={
                    "featured-results-image" +
                    (readyImageUrls.has(project.imageUrl) ? " is-ready" : "")
                  }
                  loading="eager"
                  decoding="async"
                  onLoad={() => {
                    setReadyImageUrls((current) => {
                      if (current.has(project.imageUrl)) return current;
                      const next = new Set(current);
                      next.add(project.imageUrl);
                      return next;
                    });
                  }}
                  onError={() => {
                    setReadyImageUrls((current) => {
                      if (current.has(project.imageUrl)) return current;
                      const next = new Set(current);
                      next.add(project.imageUrl);
                      return next;
                    });
                  }}
                />
                <span className="featured-results-cover-shine" aria-hidden="true" />
              </span>
            </a>

            <div className="featured-results-details">
              <span className="featured-results-kicker">A PROJECT WE'RE PROUD OF</span>

              <div className="featured-results-copy" aria-live="polite" aria-atomic="true">
                <h3 key={slug + "-title"}>{brandName}</h3>
                <p key={slug + "-category"}>{category}</p>
              </div>

              <a className="featured-results-cta" href={projectHref}>
                Explore project
                <ArrowIcon />
              </a>

              <div className="featured-results-navigation">
                <button
                  type="button"
                  className="featured-results-arrow"
                  onClick={() => moveSlide(-1)}
                  aria-label="Previous project"
                  disabled={results.length < 2}
                >
                  <ArrowIcon direction="left" />
                </button>

                <span className="featured-results-counter" aria-live="off">
                  {String(activeIndex + 1).padStart(2, "0")}
                  <span aria-hidden="true"> / </span>
                  {String(results.length).padStart(2, "0")}
                </span>

                <button
                  type="button"
                  className="featured-results-arrow"
                  onClick={() => moveSlide(1)}
                  aria-label="Next project"
                  disabled={results.length < 2}
                >
                  <ArrowIcon />
                </button>
              </div>

              <div className="featured-results-progress" aria-hidden="true">
                <span
                  key={activeIndex}
                  className={paused ? "is-paused" : ""}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="featured-results-empty">
            <div className="featured-results-empty-art" aria-hidden="true">
              <span>RF</span>
            </div>
            <p>
              {loaded
                ? "Our latest projects will appear here soon."
                : "Discovering our latest work…"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
