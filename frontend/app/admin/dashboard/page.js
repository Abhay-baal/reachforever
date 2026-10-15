"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

const PLATFORMS = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["tiktok", "TikTok"],
  ["linkedin", "LinkedIn"],
  ["x", "X"],
  ["threads", "Threads"],
  ["pinterest", "Pinterest"],
];

function legacyLinks(result) {
  if (Array.isArray(result.socialLinks)) return result.socialLinks;
  return result.platform && result.socialUrl
    ? [{ platform: result.platform, url: result.socialUrl, isVisible: true }]
    : [];
}

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [results, setResults] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [order, setOrder] = useState("0");
  const [image, setImage] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [founderForm, setFounderForm] = useState({
    isVisible: true,
    eyebrow: "THE PEOPLE BEHIND THE WORK",
    heading: "Good work starts with good people.",
    description: "",
    founderName: "Ansh Khatri",
    founderTitle: "Founder & CEO, Reach Forever",
    founderStory: "",
    imageUrl: "",
    buttonText: "Let's grow together",
    buttonUrl: "#contact",
  });
  const [founderImage, setFounderImage] = useState(null);
  const [founderSaving, setFounderSaving] = useState(false);
  const [resultDetails, setResultDetails] = useState({ clientName: "", category: "", description: "", growthUrl: "", mediaType: "image", videoUrl: "" });
  const [overview, setOverview] = useState({});
  const [services, setServices] = useState([]);
  const [team, setTeam] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [settings, setSettings] = useState({ email: "", phone: "", address: "", businessHours: "", footerDescription: "" });


  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToken(window.localStorage.getItem("reachforeverAdminToken") || "");
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem("reachforeverAdminToken");
    setToken("");
    setResults([]);
    router.replace("/admin");
  }, [router]);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${window.localStorage.getItem("reachforeverAdminToken") || ""}`,
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      logout();
      throw new Error(data.message || "Please sign in again.");
    }
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  }, [logout]);


  const loadFounder = useCallback(async () => {
    try {
      const data = await request("/api/admin/about-founder");
      setFounderForm((current) => ({ ...current, ...data }));
    } catch (err) {
      setError(err.message);
    }
  }, [request]);

  const loadResults = useCallback(async () => {
    try {
      setResults(await request("/api/admin/results"));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [request]);

  const loadCmsData = useCallback(async () => {
    try {
      const [summary, serviceData, teamData, enquiryData, settingsData] = await Promise.all([
        request("/api/admin/overview"),
        request("/api/admin/services"),
        request("/api/admin/team"),
        request("/api/admin/enquiries"),
        request("/api/admin/site-settings"),
      ]);
      setOverview(summary); setServices(serviceData); setTeam(teamData); setEnquiries(enquiryData); setSettings((current) => ({ ...current, ...settingsData }));
    } catch (err) { setError(err.message); }
  }, [request]);

  useEffect(() => {
    if (!ready || !token) return;

    const timer = window.setTimeout(() => {
      void loadResults();
      void loadFounder();
      void loadCmsData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [ready, token, loadResults, loadFounder, loadCmsData]);

  async function updateCms(path, method, body) {
    setError(""); setMessage("");
    try { await request(path, { method, body: JSON.stringify(body) }); await loadCmsData(); setMessage("Saved."); } catch (err) { setError(err.message); }
  }


  function updateFounderField(field, value) {
    setFounderForm((current) => ({ ...current, [field]: value }));
  }

  async function saveFounder(event) {
    event.preventDefault();
    setFounderSaving(true);
    setError("");
    setMessage("");

    try {
      const {
        imageUrl,
        imagePublicId,
        ...fields
      } = founderForm;

      await request("/api/admin/about-founder", {
        method: "PATCH",
        body: JSON.stringify(fields),
      });

      if (founderImage) {
        const formData = new FormData();
        formData.append("image", founderImage);

        await request("/api/admin/about-founder/image", {
          method: "POST",
          body: formData,
        });

        setFounderImage(null);
        const input = document.getElementById("founder-portrait");
        if (input) input.value = "";
      }

      await loadFounder();
      setMessage("Founder section saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setFounderSaving(false);
    }
  }
  function resetForm() {
    setEditing(null);
    setSocialLinks([]);
    setOrder(String(results.length));
    setImage(null);
    setResultDetails({ clientName: "", category: "", description: "", growthUrl: "", mediaType: "image", videoUrl: "" });
    const fileInput = document.getElementById("result-cover");
    if (fileInput) fileInput.value = "";
  }

  function beginEdit(result) {
    setEditing(result);
    setSocialLinks(legacyLinks(result).map((link) => ({
      platform: link.platform,
      url: link.url || "",
      isVisible: link.isVisible !== false,
    })));
    setOrder(String(result.order ?? 0));
    setImage(null);
    setResultDetails({ clientName: result.clientName || "", category: result.category || "", description: result.description || "", growthUrl: result.growthUrl || "", mediaType: result.mediaType || "image", videoUrl: result.videoUrl || "" });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateSocialLink(index, changes) {
    setSocialLinks((current) => current.map((link, i) =>
      i === index ? { ...link, ...changes } : link
    ));
  }

  async function saveResult(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const cleanLinks = socialLinks
        .filter((link) => link.url.trim())
        .map((link) => ({
          platform: link.platform,
          url: link.url.trim(),
          isVisible: link.isVisible !== false,
        }));

      for (const link of cleanLinks) {
        let parsed;
        try {
          parsed = new URL(link.url);
        } catch {
          throw new Error(`Enter a valid URL for ${link.platform}.`);
        }
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error(`Use an HTTP or HTTPS URL for ${link.platform}.`);
        }
      }

      if (editing) {
        await request(`/api/admin/results/${editing._id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...resultDetails, socialLinks: cleanLinks, order: Number(order) }),
        });

        if (image) {
          const form = new FormData();
          form.append("image", image);
          await request(`/api/admin/results/${editing._id}/image`, {
            method: "POST",
            body: form,
          });
        }
        setMessage("Result updated.");
      } else {
        if (!image) throw new Error("Choose a cover image first.");
        const form = new FormData();
        form.append("image", image);
        form.append("socialLinks", JSON.stringify(cleanLinks));
        form.append("order", order);
        Object.entries(resultDetails).forEach(([field, value]) => form.append(field, value));
        await request("/api/admin/results", { method: "POST", body: form });
        setMessage("Result added.");
      }

      resetForm();
      await loadResults();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(result) {
    setError("");
    setMessage("");
    try {
      await request(`/api/admin/results/${result._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !result.isActive }),
      });
      setMessage(result.isActive ? "Result hidden from the homepage." : "Result published.");
      await loadResults();
    } catch (err) {
      setError(err.message);
    }
  }

  async function moveResult(result, offset) {
    const sorted = [...results].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((item) => item._id === result._id);
    const target = index + offset;
    if (target < 0 || target >= sorted.length) return;

    try {
      const first = sorted[index];
      const second = sorted[target];
      await Promise.all([
        request(`/api/admin/results/${first._id}`, {
          method: "PATCH",
          body: JSON.stringify({ order: second.order }),
        }),
        request(`/api/admin/results/${second._id}`, {
          method: "PATCH",
          body: JSON.stringify({ order: first.order }),
        }),
      ]);
      await loadResults();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteResult(result) {
    if (!window.confirm("Permanently delete this result and its cover image?")) return;
    setError("");
    setMessage("");
    try {
      const response = await request(`/api/admin/results/${result._id}`, {
        method: "DELETE",
      });
      setMessage(response.imageCleanup === "failed"
        ? "Result deleted, but Cloudinary cleanup needs attention. Check backend logs."
        : "Result permanently deleted.");
      if (editing?._id === result._id) resetForm();
      await loadResults();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (ready && !token) router.replace("/admin");
  }, [ready, token, router]);

  if (!ready) return null;

  if (!token) return null;

  return (
    <main className="admin-page">
      <div className="admin-dashboard">
        <header className="admin-topbar">
          <div>
            <Link className="admin-back-link" href="/">← View website</Link>
            <h1>Results management</h1>
            <p>Upload portfolio images and choose which social account icons appear on each card.</p>
          </div>
          <button className="admin-secondary-button" onClick={logout}>Sign out</button>
        </header>

        {(error || message) && <p className={`admin-alert ${error ? "error" : "success"}`}>{error || message}</p>}

        <section className="admin-overview-grid">
          {[["Published results", overview.publishedResults], ["Published services", overview.publishedServices], ["Team members", overview.teamMembers], ["New enquiries", overview.newEnquiries]].map(([label, value]) => <div className="admin-overview-stat" key={label}><strong>{value ?? "—"}</strong><span>{label}</span></div>)}
        </section>

        <section className="admin-form-card">
          <h2>Services</h2>
          <form className="admin-result-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void updateCms("/api/admin/services", "POST", { name: form.get("name"), shortDescription: form.get("shortDescription"), order: Number(form.get("order")) || 0 }); event.currentTarget.reset(); }}>
            <label>Service name<input name="name" required maxLength={120} /></label>
            <label>Short description<textarea name="shortDescription" required maxLength={500} rows={3} /></label>
            <label>Display order<input name="order" type="number" defaultValue="0" /></label>
            <button className="admin-primary-button">Add service</button>
          </form>
          <div className="admin-simple-list">{services.map((service) => <div key={service._id}><span>{service.name} · {service.isPublished ? "Published" : "Hidden"}</span><button className="admin-secondary-button" onClick={() => void updateCms(`/api/admin/services/${service._id}`, "PATCH", { isPublished: !service.isPublished })}>{service.isPublished ? "Hide" : "Publish"}</button><button className="admin-secondary-button" onClick={() => window.confirm("Delete this service?") && void updateCms(`/api/admin/services/${service._id}`, "DELETE")}>Delete</button></div>)}</div>
        </section>

        <section className="admin-form-card">
          <h2>Team</h2>
          <form className="admin-result-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void updateCms("/api/admin/team", "POST", { name: form.get("name"), role: form.get("role"), biography: form.get("biography"), isDemo: false }); event.currentTarget.reset(); }}>
            <div className="admin-form-grid"><label>Name<input name="name" required maxLength={120} /></label><label>Role<input name="role" required maxLength={160} /></label></div>
            <label>Biography<textarea name="biography" rows={3} maxLength={3000} /></label><button className="admin-primary-button">Add team member</button>
          </form>
          <div className="admin-simple-list">{team.map((member) => <div key={member._id}><span>{member.name} · {member.role}{member.isDemo ? " · Demo" : ""}</span><button className="admin-secondary-button" onClick={() => void updateCms(`/api/admin/team/${member._id}`, "PATCH", { isPublished: !member.isPublished })}>{member.isPublished ? "Hide" : "Publish"}</button><button className="admin-secondary-button" onClick={() => window.confirm("Delete this team member?") && void updateCms(`/api/admin/team/${member._id}`, "DELETE")}>Delete</button></div>)}</div>
        </section>

        <section className="admin-form-card">
          <h2>Contact details and Site Settings</h2>
          <form className="admin-result-form" onSubmit={(event) => { event.preventDefault(); void updateCms("/api/admin/site-settings", "PATCH", settings); }}>
            {[["email", "Email"], ["phone", "Phone"], ["address", "Address"], ["businessHours", "Business hours"], ["footerDescription", "Footer description"]].map(([field, label]) => <label key={field}>{label}{field === "footerDescription" ? <textarea value={settings[field] || ""} rows={3} onChange={(event) => setSettings((current) => ({ ...current, [field]: event.target.value }))} /> : <input value={settings[field] || ""} onChange={(event) => setSettings((current) => ({ ...current, [field]: event.target.value }))} />}</label>)}<button className="admin-primary-button">Save site settings</button>
          </form>
        </section>

        <section className="admin-list-section"><div className="admin-list-heading"><h2>Enquiries <span>{enquiries.length}</span></h2><button className="admin-secondary-button" onClick={loadCmsData}>Refresh</button></div><div className="admin-simple-list">{enquiries.map((enquiry) => <div className="admin-enquiry" key={enquiry._id}><strong>{enquiry.name} · {enquiry.email}</strong><span>{enquiry.message}</span><select value={enquiry.status} onChange={(event) => void updateCms(`/api/admin/enquiries/${enquiry._id}`, "PATCH", { status: event.target.value })}><option>New</option><option>In Progress</option><option>Resolved</option></select><button className="admin-secondary-button" onClick={() => window.confirm("Delete this enquiry?") && void updateCms(`/api/admin/enquiries/${enquiry._id}`, "DELETE")}>Delete</button></div>)}</div></section>

        <section className="admin-form-card admin-founder-card">
          <h2>About the Founder</h2>
          <p className="admin-founder-intro">
            Manage the founder section displayed on your homepage.
          </p>

          <form onSubmit={saveFounder} className="admin-result-form">
            <label className="admin-founder-visibility">
              <input
                type="checkbox"
                checked={Boolean(founderForm.isVisible)}
                onChange={(e) => updateFounderField("isVisible", e.target.checked)}
              />
              Show this section on the homepage
            </label>

            <label>Eyebrow text
              <input
                value={founderForm.eyebrow || ""}
                onChange={(e) => updateFounderField("eyebrow", e.target.value)}
                maxLength={120}
              />
            </label>

            <label>Section heading
              <input
                value={founderForm.heading || ""}
                onChange={(e) => updateFounderField("heading", e.target.value)}
                required
                maxLength={200}
              />
            </label>

            <label>Short description
              <textarea
                value={founderForm.description || ""}
                onChange={(e) => updateFounderField("description", e.target.value)}
                rows={3}
                maxLength={1500}
              />
            </label>

            <div className="admin-form-grid">
              <label>Founder name
                <input
                  value={founderForm.founderName || ""}
                  onChange={(e) => updateFounderField("founderName", e.target.value)}
                  required
                  maxLength={120}
                />
              </label>

              <label>Founder title
                <input
                  value={founderForm.founderTitle || ""}
                  onChange={(e) => updateFounderField("founderTitle", e.target.value)}
                  maxLength={160}
                />
              </label>
            </div>

            <label>Founder story
              <textarea
                value={founderForm.founderStory || ""}
                onChange={(e) => updateFounderField("founderStory", e.target.value)}
                rows={5}
                maxLength={5000}
                placeholder="Share the founder's story, vision and approach."
              />
            </label>

            <label>Founder portrait
              <input
                id="founder-portrait"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => setFounderImage(e.target.files?.[0] || null)}
              />
              <small>JPG, PNG, WebP or AVIF. Maximum 5 MB.</small>
            </label>

            {founderForm.imageUrl && (
              <div className="admin-founder-preview">
                <img src={founderForm.imageUrl} alt="Current founder portrait" />
                <span>Current portrait</span>
              </div>
            )}

            {founderImage && (
              <p className="admin-founder-file">
                Selected image: {founderImage.name}
              </p>
            )}

            <div className="admin-form-grid">
              <label>Button text
                <input
                  value={founderForm.buttonText || ""}
                  onChange={(e) => updateFounderField("buttonText", e.target.value)}
                  maxLength={80}
                />
              </label>

              <label>Button destination URL
                <input
                  value={founderForm.buttonUrl || ""}
                  onChange={(e) => updateFounderField("buttonUrl", e.target.value)}
                  placeholder="#contact"
                  maxLength={500}
                />
              </label>
            </div>

            <button className="admin-primary-button" disabled={founderSaving}>
              {founderSaving ? "Saving founder section…" : "Save founder section"}
            </button>
          </form>
        </section>

        <section className="admin-form-card">
          <h2>{editing ? "Edit result" : "Add a result"}</h2>
          <form onSubmit={saveResult} className="admin-result-form">
            <label>Cover image {editing && "(optional when editing)"}
              <input
                id="result-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                required={!editing}
              />
              <small>JPG, PNG, WebP or AVIF. Maximum 5 MB.</small>
            </label>

            <div className="admin-form-grid">
              <label>Client or brand name
                <input value={resultDetails.clientName} onChange={(e) => setResultDetails((current) => ({ ...current, clientName: e.target.value }))} maxLength={160} />
              </label>
              <label>Service or category
                <input value={resultDetails.category} onChange={(e) => setResultDetails((current) => ({ ...current, category: e.target.value }))} maxLength={160} />
              </label>
            </div>

            <label>Description
              <textarea value={resultDetails.description} onChange={(e) => setResultDetails((current) => ({ ...current, description: e.target.value }))} rows={3} maxLength={3000} />
            </label>

            <div className="admin-form-grid">
              <label>View Growth URL
                <input type="url" value={resultDetails.growthUrl} onChange={(e) => setResultDetails((current) => ({ ...current, growthUrl: e.target.value }))} placeholder="https://..." maxLength={500} />
              </label>
              <label>Video URL (optional)
                <input type="url" value={resultDetails.videoUrl} onChange={(e) => setResultDetails((current) => ({ ...current, videoUrl: e.target.value }))} placeholder="https://..." maxLength={1000} />
              </label>
            </div>

            <div className="admin-form-grid">
              <label>Display order
                <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} required />
              </label>
            </div>

            <div className="admin-social-editor">
              <div>
                <h3>Social accounts</h3>
                <p>Add the accounts for this client. Only enabled icons will appear publicly.</p>
              </div>

              {socialLinks.map((link, index) => (
                <div className="admin-social-row" key={index}>
                  <label>Platform
                    <select value={link.platform} onChange={(e) => updateSocialLink(index, { platform: e.target.value })}>
                      {PLATFORMS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </label>
                  <label>Account URL
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, { url: e.target.value })}
                      placeholder="https://..."
                    />
                  </label>
                  <label className="admin-social-visible">
                    <input
                      type="checkbox"
                      checked={link.isVisible !== false}
                      onChange={(e) => updateSocialLink(index, { isVisible: e.target.checked })}
                    />
                    Show icon
                  </label>
                  <button type="button" className="admin-secondary-button" onClick={() =>
                    setSocialLinks((current) => current.filter((_, i) => i !== index))
                  }>Remove</button>
                </div>
              ))}

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setSocialLinks((current) => [
                  ...current,
                  { platform: "instagram", url: "", isVisible: true },
                ])}
              >+ Add social account</button>
            </div>

            <div className="admin-form-actions">
              <button className="admin-primary-button" disabled={busy}>
                {busy ? "Saving…" : editing ? "Save changes" : "Upload and add result"}
              </button>
              {editing && <button type="button" className="admin-secondary-button" onClick={resetForm}>Cancel edit</button>}
            </div>
          </form>
        </section>

        <section className="admin-list-section">
          <div className="admin-list-heading">
            <h2>All results <span>{results.length}</span></h2>
            <button className="admin-secondary-button" onClick={loadResults}>Refresh</button>
          </div>

          {results.length === 0 ? (
            <div className="admin-empty">No results yet. Add your first cover image above.</div>
          ) : (
            <div className="admin-results-list">
              {[...results].sort((a, b) => a.order - b.order).map((result, index) => {
                const links = legacyLinks(result);
                const shownCount = links.filter((link) => link.isVisible !== false).length;
                return (
                  <article className="admin-result-item" key={result._id}>
                    <img src={result.imageUrl} alt="" />
                    <div className="admin-result-info">
                      <strong>Portfolio result</strong>
                      <span>{links.length} social account(s) · {shownCount} icon(s) visible</span>
                      <span>Order: {result.order} · {result.isActive ? "Published" : "Hidden"}</span>
                    </div>
                    <div className="admin-result-actions">
                      <button aria-label="Move up" disabled={index === 0} onClick={() => moveResult(result, -1)}>↑</button>
                      <button aria-label="Move down" disabled={index === results.length - 1} onClick={() => moveResult(result, 1)}>↓</button>
                      <button onClick={() => beginEdit(result)}>Edit</button>
                      <button onClick={() => toggleActive(result)}>{result.isActive ? "Hide" : "Publish"}</button>
                      <button className="admin-delete-button" onClick={() => deleteResult(result)}>Delete</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
