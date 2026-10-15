import ResultsSection from "./components/ResultsSection";
import AboutFounderSection from "./components/AboutFounderSection";
import SiteNavigation from "./components/SiteNavigation";
import SiteFooter from "./components/SiteFooter";



function ArrowIcon({ diagonal = false }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {diagonal ? (
        <path
          d="M7 17 17 7M7 7h10v10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M4 12h15m-6-6 6 6-6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function SectionEyebrow({ children, light = false }) {
  return (
    <div className={`eyebrow${light ? " eyebrow-light" : ""}`}>
      <span className="eyebrow-dot" />
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <SiteNavigation />

      <section className="hero section-shell" id="home">
        <div className="hero-copy">
          <SectionEyebrow>INDEPENDENT DIGITAL MARKETING AGENCY</SectionEyebrow>

          <h1>
            Good brands
            <br />
            deserve to go
            <br />
            <span className="gradient-text">further.</span>
          </h1>

          <p className="hero-description">
            We turn bold ideas into meaningful digital experiences — and
            meaningful experiences into measurable business growth.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#contact">
              Let&apos;s grow together <ArrowIcon />
            </a>
            <a className="text-link" href="#services">
              Discover what we do <ArrowIcon />
            </a>
          </div>

          <div className="hero-proof">
            <span className="proof-symbol">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
                <path
                  d="m5 12 4 4L19 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              <strong>Real strategy. Real people.</strong>
              <small>Growth that means something.</small>
            </span>
          </div>
        </div>

        <div
          className="hero-art hero-image-frame"
          role="img"
          aria-label="Placeholder for the ReachForever hero image"
        >
          <div className="hero-image-placeholder" aria-hidden="true">
            <span className="hero-image-letter">R</span>
          </div>
        </div>

        <div className="hero-bottom">
          <span>BUILT ON TRUST. FOCUSED ON GROWTH.</span>
          <a href="#services">
            SCROLL TO EXPLORE <span>↓</span>
          </a>
        </div>
      </section>

      <ResultsSection />
      <AboutFounderSection />

      <SiteFooter />
    </main>
  );
}
