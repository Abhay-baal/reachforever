"use client";

import { useEffect, useState } from "react";
import PublicShell from "../components/PublicShell";
import {
  ArrowDown, ArrowRight, ArrowUpRight,
  CheckCircle2, Clock3, MapPin, MessageCircle,
  Send, Sparkles
} from "lucide-react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service: "",
  message: "",
  website: "",
  budget: "",
  timeline: "",
};

const services = [
  "Social Media Marketing",
  "Performance Marketing & Paid Ads",
  "Branding & Creative Strategy",
  "Website Design & Development",
  "SEO & Organic Growth",
  "Content Creation",
  "Influencer Marketing",
  "Full-Service Digital Marketing",
  "Other",
];

const budgets = [
  "Under ₹10,000",
  "₹10,000–₹25,000",
  "₹25,000–₹50,000",
  "₹50,000–₹1,00,000",
  "₹1,00,000+",
  "Let's discuss",
];

const timelines = [
  "Immediately",
  "Within 2–4 weeks",
  "Within 1–3 months",
  "Just exploring",
];

export default function ContactPage() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({
    busy: false,
    message: "",
    error: "",
  });

  useEffect(() => {
    let active = true;

    fetch(`${API_URL}/api/site-settings`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (active && data) setSettings(data);
      })
      .catch(() => {});

    return () => { active = false; };
  }, []);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setState({ busy: true, message: "", error: "" });

    const additionalDetails = [
      form.website && `Website / social link: ${form.website}`,
      form.budget && `Estimated budget: ${form.budget}`,
      form.timeline && `Project timeline: ${form.timeline}`,
      `Project details: ${form.message.trim()}`,
    ].filter(Boolean).join("\n");

    try {
      const response = await fetch(`${API_URL}/api/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company: form.company.trim(),
          service: form.service,
          message: additionalDetails,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to send your enquiry. Please try again.");
      }

      setForm(initialForm);
      setState({
        busy: false,
        message: data.message || "Your enquiry has been received.",
        error: "",
      });
    } catch (error) {
      setState({
        busy: false,
        message: "",
        error: error.message || "Unable to connect. Please try again later.",
      });
    }
  }

  const email = settings?.email || "";
  const phone = settings?.phone || "";
  const address = settings?.address || "Business District, Amritsar, Punjab, India";
  const hours = settings?.businessHours || "Monday–Friday, 10:00 AM–6:00 PM IST";

  return (
    <PublicShell>
      <main className="rf-contact-page">
        <section className="rf-contact-hero">
          <div className="rf-contact-hero-glow" aria-hidden="true" />
          <div className="section-shell rf-contact-hero-inner">
            <div className="rf-contact-hero-copy">
              <span className="rf-contact-eyebrow">
                <span /> LET&apos;S CONNECT
              </span>
              <h1>Let&apos;s build something <span>that lasts.</span></h1>
              <p>
                Every great partnership starts with a conversation. Tell us
                where you want to go, and let&apos;s build a strategy to help
                you get there.
              </p>
              <div className="rf-contact-hero-actions">
                <a className="rf-contact-primary" href="#contact-options">
                  Start a project <ArrowRight size={17} />
                </a>
                <a className="rf-contact-secondary" href="/services">
                  Explore services <ArrowUpRight size={17} />
                </a>
              </div>
              <div className="rf-contact-trust-line">
                <Sparkles size={16} />
                <span>Thoughtful strategy. Creative execution. Meaningful growth.</span>
              </div>
            </div>

            <div className="rf-contact-hero-art" aria-label="Reach Forever, built for meaningful growth">
              <div className="rf-contact-orbit rf-contact-orbit-one" />
              <div className="rf-contact-orbit rf-contact-orbit-two" />
              <div className="rf-contact-art-card">
                <span className="rf-contact-art-label">YOUR NEXT CHAPTER</span>
                <div className="rf-contact-art-mark">R<span>F</span></div>
                <div className="rf-contact-art-divider" />
                <h2>Turn ambition<br />into <span>reach.</span></h2>
                <p>Build a brand people remember.</p>
                <div className="rf-contact-art-bottom">
                  <span>STRATEGY</span><span>CREATIVITY</span><span>GROWTH</span>
                </div>
              </div>
              <div className="rf-contact-floating rf-contact-floating-top">
                <Sparkles size={16} /> Creative thinking
              </div>
              <div className="rf-contact-floating rf-contact-floating-bottom">
                <span className="rf-contact-status-dot" /> Focused on growth
              </div>
            </div>
          </div>
          <a className="rf-contact-scroll" href="#contact-options">
            DISCOVER MORE <ArrowDown size={14} />
          </a>
        </section>

        <section className="rf-find-us" id="contact-options">
          <div className="section-shell rf-find-us-inner">
            <div className="rf-find-us-heading">
              <span className="rf-find-us-eyebrow">
                <span /> WHERE TO FIND US
              </span>
              <h2>Let&apos;s make room for <span>what&apos;s next.</span></h2>
              <p>
                Have a question or want to talk through an idea? We&apos;re
                looking forward to hearing from you.
              </p>
            </div>

            <div className="rf-find-us-grid">
              <article className="rf-find-us-card rf-find-us-location">
                <div className="rf-find-us-icon"><MapPin size={24} /></div>
                <span className="rf-find-us-label">LOCATION</span>
                <h3>Business District, Amritsar, Punjab, India</h3>
                <p>Demo address — confirm before publishing</p>
                <span className="rf-find-us-card-number">01</span>
              </article>

              <article className="rf-find-us-card rf-find-us-hours">
                <div className="rf-find-us-icon"><Clock3 size={24} /></div>
                <span className="rf-find-us-label">OFFICE HOURS</span>
                <h3>Monday–Friday</h3>
                <p className="rf-find-us-time">10:00 AM–6:00 PM IST</p>
                <span className="rf-find-us-card-number">02</span>
              </article>
            </div>
          </div>
        </section>



        <section className="rf-contact-closing">
          <div className="section-shell rf-contact-closing-inner">
            <span>YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>Let&apos;s turn ambition into <span>lasting growth.</span></h2>
            <p>Together, let&apos;s build brands that grow beyond expectations.</p>
            <a href="#contact-options">Find our details <ArrowRight size={17} /></a>
            <div className="rf-contact-closing-mark" aria-hidden="true">RF</div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
