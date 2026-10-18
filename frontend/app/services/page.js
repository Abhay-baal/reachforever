"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Sparkles,
} from "lucide-react";
import PublicShell from "../components/PublicShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

const serviceVisuals = [
  {
    match: /instagram|social media/i,
    eyebrow: "SOCIAL PRESENCE",
    title: "Make your brand impossible to ignore.",
    className: "instagram",
    metric: "CONTENT THAT CONNECTS",
    chips: ["Reels", "Stories", "Carousels"],
  },
  {
    match: /facebook|paid|advertis/i,
    eyebrow: "PAID GROWTH",
    title: "Put your business in front of the right people.",
    className: "facebook",
    metric: "REACH WITH PURPOSE",
    chips: ["Audience", "Campaigns", "Retargeting"],
  },
  {
    match: /seo|search engine/i,
    eyebrow: "ORGANIC VISIBILITY",
    title: "Help the right customers find you.",
    className: "seo",
    metric: "BUILT FOR DISCOVERY",
    chips: ["Local SEO", "Keywords", "Search"],
  },
  {
    match: /software|development|website|web app/i,
    eyebrow: "DIGITAL PRODUCTS",
    title: "Turn ambitious ideas into useful digital experiences.",
    className: "development",
    metric: "IDEAS INTO REALITY",
    chips: ["Websites", "Applications", "Automation"],
  },
];

function getVisual(service, index) {
  return serviceVisuals.find((item) => item.match.test(service.name || "")) || {
    ...serviceVisuals[index % serviceVisuals.length],
  };
}

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const slideIndexRef = useRef(0);
  const transitionActiveRef = useRef(false);
  const navigationQueueRef = useRef([]);
  const processNavigationQueueRef = useRef(null);
  const resetTokenRef = useRef(0);
  const resetFrameRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/services`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        if (!cancelled) {
          setServices(Array.isArray(data) ? data : []);
          const initialIndex = Array.isArray(data) && data.length > 1 ? 1 : 0;
          slideIndexRef.current = initialIndex;
          setSlideIndex(initialIndex);
        }
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    slideIndexRef.current = slideIndex;
  }, [slideIndex]);

  const processNavigationQueue = useCallback(() => {
    if (services.length < 2 || transitionActiveRef.current || navigationQueueRef.current.length === 0) return;

    const direction = navigationQueueRef.current.shift();
    const currentIndex = slideIndexRef.current;
    const lastCloneIndex = services.length + 1;
    const isAtBoundary = direction < 0 ? currentIndex === 0 : currentIndex === lastCloneIndex;

    transitionActiveRef.current = true;
    if (isAtBoundary) {
      const resetTo = direction < 0 ? services.length : 1;
      const resetToken = ++resetTokenRef.current;

      setTransitionEnabled(false);
      slideIndexRef.current = resetTo;
      setSlideIndex(resetTo);
      resetFrameRef.current = window.requestAnimationFrame(() => {
        resetFrameRef.current = window.requestAnimationFrame(() => {
          if (resetToken !== resetTokenRef.current) return;
          resetFrameRef.current = null;
          setTransitionEnabled(true);
          transitionActiveRef.current = false;
          processNavigationQueueRef.current?.();
        });
      });
      return;
    }

    const nextIndex = currentIndex + direction;
    slideIndexRef.current = nextIndex;
    setSlideIndex(nextIndex);
  }, [services.length]);

  useEffect(() => {
    processNavigationQueueRef.current = processNavigationQueue;
    return () => {
      if (processNavigationQueueRef.current === processNavigationQueue) {
        processNavigationQueueRef.current = null;
      }
    };
  }, [processNavigationQueue]);

  const requestMove = useCallback((direction) => {
    if (services.length < 2) return;
    navigationQueueRef.current.push(direction);
    processNavigationQueue();
  }, [processNavigationQueue, services.length]);

  const goTo = useCallback((index) => {
    if (services.length < 2) return;
    navigationQueueRef.current = [];
    resetTokenRef.current += 1;
    if (resetFrameRef.current !== null) {
      window.cancelAnimationFrame(resetFrameRef.current);
      resetFrameRef.current = null;
    }

    const targetIndex = ((index % services.length) + services.length) % services.length + 1;
    if (targetIndex === slideIndexRef.current) {
      transitionActiveRef.current = false;
      setTransitionEnabled(true);
      return;
    }

    transitionActiveRef.current = true;
    setTransitionEnabled(true);
    slideIndexRef.current = targetIndex;
    setSlideIndex(targetIndex);
  }, [services.length]);

  const previous = useCallback(() => requestMove(-1), [requestMove]);
  const next = useCallback(() => requestMove(1), [requestMove]);

  useEffect(() => {
    if (services.length < 2) return undefined;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer;

    const syncAutoplay = () => {
      window.clearInterval(timer);
      timer = undefined;

      if (!motionPreference.matches) {
        timer = window.setInterval(() => requestMove(1), 6000);
      }
    };

    syncAutoplay();
    motionPreference.addEventListener("change", syncAutoplay);

    return () => {
      window.clearInterval(timer);
      motionPreference.removeEventListener("change", syncAutoplay);
    };
  }, [requestMove, services.length]);

  const activeIndex = services.length > 1
    ? (slideIndex - 1 + services.length) % services.length
    : 0;
  const activeService = services[activeIndex];
  const slides = services.length > 1
    ? [services[services.length - 1], ...services, services[0]]
    : services;

  return (
    <PublicShell>
      <main className="inner-page services-page">
        <section className="section-shell services-intro">
          <div className="services-intro-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> WHAT WE DO</span>
            <h1>Good ideas deserve <span>real growth.</span></h1>
            <p>We turn your ideas into digital experiences that drive growth.</p>
          </div>
        </section>

        <section
          className="section-shell services-carousel-section"
          aria-label="Our services carousel"
          onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
          onTouchEnd={(event) => {
            if (touchStart === null) return;
            const distance = event.changedTouches[0].clientX - touchStart;
            if (Math.abs(distance) > 45) distance < 0 ? next() : previous();
            setTouchStart(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") next();
            if (event.key === "ArrowLeft") previous();
          }}
          tabIndex={0}
        >
          {activeService ? (
            <div className="services-slides-viewport">
              <div
                className={`services-slides-track${transitionEnabled ? " is-animated" : ""}`}
                style={{
                  width: `${slides.length * 100}%`,
                  transform: `translate3d(-${slideIndex * (100 / slides.length)}%, 0, 0)`,
                }}
                onTransitionEnd={(event) => {
                  if (event.target !== event.currentTarget || services.length < 2) return;
                  const currentIndex = slideIndexRef.current;
                  const lastCloneIndex = slides.length - 1;
                  if (currentIndex === lastCloneIndex || currentIndex === 0) {
                    const resetTo = currentIndex === lastCloneIndex ? 1 : services.length;
                    const resetToken = ++resetTokenRef.current;

                    setTransitionEnabled(false);
                    slideIndexRef.current = resetTo;
                    setSlideIndex(resetTo);
                    resetFrameRef.current = window.requestAnimationFrame(() => {
                      resetFrameRef.current = window.requestAnimationFrame(() => {
                        if (resetToken !== resetTokenRef.current) return;
                        resetFrameRef.current = null;
                        setTransitionEnabled(true);
                        transitionActiveRef.current = false;
                        processNavigationQueueRef.current?.();
                      });
                    });
                    return;
                  }

                  transitionActiveRef.current = false;
                  processNavigationQueueRef.current?.();
                }}
              >
                {slides.map((service, trackIndex) => {
                  const serviceIndex = services.length > 1
                    ? trackIndex === 0
                      ? services.length - 1
                      : trackIndex === slides.length - 1
                        ? 0
                        : trackIndex - 1
                    : trackIndex;

                  return (
                    <article
                      className="services-feature"
                      key={`${trackIndex}-${service._id || service.name}`}
                      style={{ flex: `0 0 ${100 / slides.length}%` }}
                    >
                      <div className="services-feature-copy">
                        <div className="services-feature-meta">
                          <span className="services-feature-index">{String(serviceIndex + 1).padStart(2, "0")}</span>
                          <span className="services-feature-line" />
                          <span>OUR SERVICES</span>
                        </div>

                        <span className="services-feature-label">{getVisual(service, serviceIndex).eyebrow}</span>
                        <h2>{service.name}</h2>
                        <p className="services-feature-description">{service.shortDescription}</p>
                        {service.detailedDescription && (
                          <p className="services-feature-details">{service.detailedDescription}</p>
                        )}

                        {service.features?.length > 0 && (
                          <ul className="services-feature-list">
                            {service.features.map((feature) => (
                              <li key={feature}><span><Check size={14} strokeWidth={2.5} /></span>{feature}</li>
                            ))}
                          </ul>
                        )}

                        <div className="services-feature-actions">
                          <a className="services-feature-cta" href={service.ctaUrl || "/contact"}>
                            {service.ctaText || "Let's talk about your goals"} <ArrowUpRight size={18} />
                          </a>
                          <span className="services-feature-footnote">Thoughtful strategy. Meaningful progress.</span>
                        </div>
                      </div>

                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="services-carousel-empty">
              <Sparkles size={28} />
              <h2>Good work is on the way.</h2>
              <p>Services will appear here once they are published.</p>
            </div>
          )}

          {services.length > 1 && (
            <div className="services-carousel-controls">
              <div className="services-carousel-status">
                <strong>{String(activeIndex + 1).padStart(2, "0")}</strong>
                <span className="services-carousel-track"><span style={{ width: `${((activeIndex + 1) / services.length) * 100}%` }} /></span>
                <span>{String(services.length).padStart(2, "0")}</span>
              </div>
              <div className="services-carousel-dots" aria-label="Choose a service">
                {services.map((service, index) => (
                  <button
                    key={service._id || service.name}
                    type="button"
                    className={index === activeIndex ? "is-active" : ""}
                    aria-label={`Show ${service.name}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    onClick={() => goTo(index)}
                  />
                ))}
              </div>
              <div className="services-carousel-arrows">
                <button type="button" onClick={previous} aria-label="Previous service"><ArrowLeft size={19} /></button>
                <button type="button" onClick={next} aria-label="Next service"><ArrowRight size={19} /></button>
              </div>
            </div>
          )}
        </section>

        <section className="section-shell services-bottom-note">
          <span className="services-bottom-note-mark"><Sparkles size={18} /></span>
          <p><strong>Different challenges. One committed team.</strong><br />Let&apos;s find the right next step for your business.</p>
          <a href="/contact">Start a conversation <ArrowUpRight size={16} /></a>
        </section>
      </main>
    </PublicShell>
  );
}
