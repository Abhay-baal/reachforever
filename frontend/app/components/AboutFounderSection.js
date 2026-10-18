"use client";

import { useEffect, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

const DEFAULT_CONTENT = {
  isVisible: true,
  eyebrow: "THE PERSON BEHIND THE WORK",
  heading: "Good work starts with good people.",
  description:
    "We help brands reach further and grow faster.",
  founderName: "Ansh Khatri",
  founderTitle: "Founder & CEO, Reach Forever",
  founderStory:
    "Passion into reach. Growth that lasts.",
  imageUrl: "",
  buttonText: "Let's grow together",
  buttonUrl: "#contact",
};

export default function AboutFounderSection() {
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/about-founder`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Founder content unavailable");
        return response.json();
      })
      .then((data) => {
        if (data) setContent({ ...DEFAULT_CONTENT, ...data });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Unable to load founder section:", error.message);
        }
      });

    return () => controller.abort();
  }, []);

  if (!content.isVisible) return null;

  return (
    <section className="founder-section" id="about-founder">
      <div className="section-shell founder-layout">
        <div className="founder-copy">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            {content.eyebrow}
          </span>
          <h2>{content.heading}</h2>
          <p className="founder-description">{content.description}</p>
          <div className="founder-story">
            <span className="founder-story-line" />
            <p>{content.founderStory}</p>
          </div>
          <div className="founder-signature">
            <strong>{content.founderName}</strong>
            <span>{content.founderTitle}</span>
          </div>
          {content.buttonText && content.buttonUrl && (
            <a
              className="button button-primary founder-cta"
              href={content.buttonUrl}
            >
              {content.buttonText}
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        <div className="founder-portrait-wrap">
          <div className="founder-portrait-glow" aria-hidden="true" />
          <div className="founder-portrait">
            {content.imageUrl ? (
              <img
                src={content.imageUrl}
                alt={`Portrait of ${content.founderName}`}
                loading="lazy"
              />
            ) : (
              <div className="founder-portrait-placeholder">
                <span className="founder-placeholder-monogram">RF</span>
                <span>Founder portrait</span>
                <small>Upload a photo in the admin panel</small>
              </div>
            )}
          </div>
          <div className="founder-portrait-caption">
            <span className="founder-caption-dot" />
            <span>
              <strong>{content.founderName}</strong>
              <small>{content.founderTitle}</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
