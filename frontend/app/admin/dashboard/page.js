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
  const [activeSection, setActiveSection] = useState("overview");
  const [showMoreNav, setShowMoreNav] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [results, setResults] = useState([]);
  const [resultsPage, setResultsPage] = useState(1);
  const RESULTS_PER_PAGE = 10;
  const [socialLinks, setSocialLinks] = useState([]);
  const [order, setOrder] = useState("0");
  const [image, setImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [founderForm, setFounderForm] = useState({
    isVisible: true,
    eyebrow: "THE PERSON BEHIND THE WORK",
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
  const [videoFile, setVideoFile] = useState(null);
  const [resultDetails, setResultDetails] = useState({ clientName: "", category: "", description: "", longDescription: "", servicesProvided: "", keyResults: "", growthUrl: "", mediaType: "image", videoUrl: "" });
  const [overview, setOverview] = useState({});
  const [services, setServices] = useState([]);
  const [team, setTeam] = useState([]);
  const [teamForm, setTeamForm] = useState({ name: "", role: "", biography: "" });
  const [teamImage, setTeamImage] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamSaving, setTeamSaving] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [settings, setSettings] = useState({ email: "", phone: "", address: "", businessHours: "", footerDescription: "" });

  useEffect(() => {
    if (!image) {
      setCoverPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(image);
    setCoverPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [image]);

  useEffect(() => {
    const previewUrls = galleryFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviews(previewUrls);
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [galleryFiles]);

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



  async function saveTeamMember(event) {
    event.preventDefault();
    setTeamSaving(true);
    setError("");
    setMessage("");

    const isEditing = Boolean(editingTeam);

    try {
      const savedMember = await request(
        isEditing ? `/api/admin/team/${editingTeam._id}` : "/api/admin/team",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(
            isEditing ? teamForm : { ...teamForm, isDemo: false }
          ),
        }
      );

      if (teamImage) {
        const formData = new FormData();
        formData.append("image", teamImage);

        await request(`/api/admin/team/${savedMember._id}/image`, {
          method: "POST",
          body: formData,
        });
      }

      setTeamForm({ name: "", role: "", biography: "" });
      setTeamImage(null);
      setEditingTeam(null);
      setShowTeamForm(false);

      const fileInput = document.getElementById("team-photo");
      if (fileInput) fileInput.value = "";

      await loadCmsData();
      setMessage(isEditing ? "Team member updated." : "Team member added.");
    } catch (err) {
      setError(err.message);
    } finally {
      setTeamSaving(false);
    }
  }

  function startEditingTeam(member) {
    setActiveSection("team");
    setShowTeamForm(true);
    setEditingTeam(member);
    setTeamForm({
      name: member.name || "",
      role: member.role || "",
      biography: member.biography || "",
    });
    setTeamImage(null);
    setError("");
    setMessage("");

    const fileInput = document.getElementById("team-photo");
    if (fileInput) fileInput.value = "";
  }

  function cancelEditingTeam() {
    setShowTeamForm(false);
    setEditingTeam(null);
    setTeamForm({ name: "", role: "", biography: "" });
    setTeamImage(null);

    const fileInput = document.getElementById("team-photo");
    if (fileInput) fileInput.value = "";
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
    setShowProjectForm(false);
    setEditing(null);
    setSocialLinks([]);
    setOrder(String(results.length));
    setImage(null);
    setGalleryFiles([]);
    setVideoFile(null);
    const videoInput = document.getElementById("result-video");
    if (videoInput) videoInput.value = "";
    const galleryInput = document.getElementById("result-gallery");
    if (galleryInput) galleryInput.value = "";
    setResultDetails({ clientName: "", category: "", description: "", longDescription: "", servicesProvided: "", keyResults: "", growthUrl: "", mediaType: "image", videoUrl: "" });
    const fileInput = document.getElementById("result-cover");
    if (fileInput) fileInput.value = "";
  }

  function beginEdit(result) {
    setActiveSection("results");
    setShowProjectForm(true);
    setEditing(result);
    setSocialLinks(legacyLinks(result).map((link) => ({
      platform: link.platform,
      url: link.url || "",
      isVisible: link.isVisible !== false,
    })));
    setOrder(String(result.order ?? 0));
    setImage(null);
    setGalleryFiles([]);
    setVideoFile(null);
    const videoInput = document.getElementById("result-video");
    if (videoInput) videoInput.value = "";
    setResultDetails({ clientName: result.clientName || "", category: result.category || "", description: result.description || "", longDescription: result.longDescription || "", servicesProvided: Array.isArray(result.servicesProvided) ? result.servicesProvided.join("\n") : "", keyResults: Array.isArray(result.keyResults) ? result.keyResults.join("\n") : "", growthUrl: result.growthUrl || "", mediaType: result.mediaType || "image", videoUrl: result.videoUrl || "" });
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
      if (galleryFiles.length > 12) throw new Error("Upload a maximum of 12 gallery images at a time.");
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

      let savedResult;
      if (editing) {
        savedResult = await request(`/api/admin/results/${editing._id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...resultDetails, socialLinks: cleanLinks, order: Number(order) }),
        });

        if (image) {
          const form = new FormData();
          form.append("image", image);
          savedResult = await request(`/api/admin/results/${editing._id}/image`, {
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
        savedResult = await request("/api/admin/results", { method: "POST", body: form });
        setMessage("Result added.");
      }

      const resultId = editing?._id || savedResult?._id || savedResult?.id;

      if (videoFile) {
        if (!resultId) throw new Error("Result saved, but its ID was missing; the video was not uploaded.");
        const videoForm = new FormData();
        videoForm.append("video", videoFile);
        await request(`/api/admin/results/${resultId}/video`, {
          method: "POST",
          body: videoForm,
        });
      }

      if (galleryFiles.length) {
        if (!resultId) throw new Error("Result saved, but its ID was missing; gallery images were not uploaded.");
        const galleryForm = new FormData();
        galleryFiles.forEach((file) => galleryForm.append("gallery", file));
        await request(`/api/admin/results/${resultId}/gallery`, {
          method: "POST",
          body: galleryForm,
        });
      }

      resetForm();
      await loadResults();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteGalleryImage(item) {
    if (!editing?._id || !item?.publicId) return;
    if (!window.confirm("Permanently delete this gallery image from the project and Cloudinary?")) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await request(
        `/api/admin/results/${editing._id}/gallery/${encodeURIComponent(item.publicId)}`,
        { method: "DELETE" }
      );
      setEditing(updated);
      setResults((current) => current.map((result) =>
        result._id === updated._id ? updated : result
      ));
      setMessage("Gallery image permanently deleted.");
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
    if (!window.confirm("Permanently delete this project, its cover image, gallery images, and uploaded video?")) return;
    setError("");
    setMessage("");
    try {
      const response = await request(`/api/admin/results/${result._id}`, {
        method: "DELETE",
      });
      setMessage(
        response.imageCleanup === "failed" || response.videoCleanup === "failed"
          ? "Project deleted, but some Cloudinary media cleanup failed. Check backend logs."
          : "Project and associated media deleted successfully."
      );
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

        <nav className="rf-admin-navigation" aria-label="Admin sections">
          <div className="rf-admin-sidebar-brand">
            <span className="rf-admin-brand-mark" aria-hidden="true">R</span>
            <span><strong>ReachForever</strong><small>ADMIN WORKSPACE</small></span>
          </div>

          <p className="rf-admin-nav-caption">WORKSPACE</p>
          {[
            ["overview", "Overview", "⌂", "rf-admin-nav-primary"],
            ["results", "Results", "▧", "rf-admin-nav-primary"],
            ["__hidden_services__", "Services", "◇", "rf-admin-nav-primary"],
            ["team", "Team", "♙", "rf-admin-nav-primary"],
            ["__hidden_settings__", "Contact Details", "✉", "rf-admin-nav-secondary"],
            ["__hidden_enquiries__", "Enquiries", "☷", "rf-admin-nav-secondary"],
          ].map(([id, label, symbol, visibility]) => (
            <button
              key={id}
              type="button"
              className={`rf-admin-nav-item ${visibility} ${activeSection === id ? "is-active" : ""}`}
              aria-current={activeSection === id ? "page" : undefined}
              onClick={() => {
                setActiveSection(id);
                setShowMoreNav(false);
                setError("");
                setMessage("");
              }}
            >
              <span className="rf-admin-nav-symbol" aria-hidden="true">{symbol}</span>
              <span>{label}</span>
            </button>
          ))}

          <button
            type="button"
            className={`rf-admin-nav-item rf-admin-nav-more ${showMoreNav ? "is-active" : ""}`}
            aria-expanded={showMoreNav}
            onClick={() => setShowMoreNav((current) => !current)}
          >
            <span className="rf-admin-nav-symbol" aria-hidden="true">•••</span>
            <span>More</span>
          </button>

          {showMoreNav && (
            <div className="rf-admin-more-menu">
              {[
                ["__hidden_settings__", "Contact Details", "✉"],
                ["__hidden_enquiries__", "Enquiries", "☷"],
              ].map(([id, label, symbol]) => (
                <button
                  key={id}
                  type="button"
                  className={`rf-admin-nav-item ${activeSection === id ? "is-active" : ""}`}
                  onClick={() => {
                    setActiveSection(id);
                    setShowMoreNav(false);
                    setError("");
                    setMessage("");
                  }}
                >
                  <span className="rf-admin-nav-symbol" aria-hidden="true">{symbol}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {(error || message) && <p className={`admin-alert ${error ? "error" : "success"}`}>{error || message}</p>}

        {/* section: activeSection === "overview" */}
{activeSection === "overview" && (
<>
<section className="admin-overview-grid">
          {[["Projects", results.length], ["Team members", team.length]].map(([label, value]) => <div className="admin-overview-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </section>

        <section className="rf-admin-quick-actions">
          <div>
            <h2>Quick actions</h2>
            <p>Manage the projects and people featured on your website.</p>
          </div>
          <div className="rf-admin-quick-action-buttons">
            <button type="button" className="admin-primary-button" onClick={() => {
              resetForm();
              setActiveSection("results");
              setShowProjectForm(true);
              setError("");
              setMessage("");
            }}>+ Add project</button>
            <button type="button" className="admin-secondary-button" onClick={() => {
              cancelEditingTeam();
              setActiveSection("team");
              setShowTeamForm(true);
              setError("");
              setMessage("");
            }}>+ Add team member</button>
            <button type="button" className="admin-secondary-button" onClick={() => setActiveSection("results")}>View projects</button>
          </div>
        </section>
        </>
        )}
{/* section: activeSection === "__hidden_services__" */}
{activeSection === "__hidden_services__" && (
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


        )}
{/* section: activeSection === "team" */}
{activeSection === "team" && (
        <section className="admin-form-card rf-admin-team-card">
          <div className="admin-list-heading">
            <h2>Team members <span>{team.length}</span></h2>
            {!showTeamForm && (
              <button type="button" className="admin-primary-button" onClick={() => {
                cancelEditingTeam();
                setShowTeamForm(true);
                setError("");
                setMessage("");
              }}>+ Add team member</button>
            )}
          </div>

          {showTeamForm && (
            <div className="rf-admin-editor-panel">
              <h3>{editingTeam ? "Edit team member" : "Add team member"}</h3>
              <form className="admin-result-form" onSubmit={saveTeamMember}>
            <div className="admin-form-grid">
              <label>
                Name
                <input
                  name="name"
                  value={teamForm.name}
                  onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  maxLength={120}
                />
              </label>
              <label>
                Role
                <input
                  name="role"
                  value={teamForm.role}
                  onChange={(event) => setTeamForm((current) => ({ ...current, role: event.target.value }))}
                  required
                  maxLength={160}
                />
              </label>
            </div>

            <label>
              Biography
              <textarea
                name="biography"
                value={teamForm.biography}
                onChange={(event) => setTeamForm((current) => ({ ...current, biography: event.target.value }))}
                rows={4}
                maxLength={3000}
              />
            </label>

            {editingTeam?.imageUrl && (
              <div>
                <p>Current profile photo</p>
                <img
                  src={editingTeam.imageUrl}
                  alt={`${editingTeam.name} profile`}
                  style={{ width: 112, height: 112, objectFit: "cover", borderRadius: 12 }}
                />
              </div>
            )}

            <label>
              {editingTeam ? "Replace profile photo (optional)" : "Profile photo (optional)"}
              <input
                id="team-photo"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) => setTeamImage(event.target.files?.[0] || null)}
              />
              <small>JPG, PNG, WebP or AVIF · Maximum 5 MB</small>
            </label>

            <div className="admin-form-actions">
              <button className="admin-primary-button" type="submit" disabled={teamSaving}>
                {teamSaving ? "Saving..." : editingTeam ? "Save changes" : "Add team member"}
              </button>
              <button className="admin-secondary-button" type="button" onClick={cancelEditingTeam} disabled={teamSaving}>
                Cancel
              </button>
            </div>
              </form>
            </div>
          )}

          <div className="admin-simple-list">
            {team.map((member) => (
              <div className="rf-admin-team-row" key={member._id}>
                <span>
                  {member.name} · {member.role}
                  {member.isDemo ? " · Existing demo record" : ""}
                </span>
                <button className="admin-secondary-button" type="button" onClick={() => startEditingTeam(member)}>
                  Edit
                </button>

                <button
                  className="admin-secondary-button"
                  type="button"
                  onClick={() => window.confirm("Delete this team member and their uploaded profile photo?") && void updateCms(`/api/admin/team/${member._id}`, "DELETE")}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>


        )}
{/* section: activeSection === "__hidden_settings__" */}
{activeSection === "__hidden_settings__" && (
        <section className="admin-form-card">
          <h2>Contact details and Site Settings</h2>
          <form className="admin-result-form" onSubmit={(event) => { event.preventDefault(); void updateCms("/api/admin/site-settings", "PATCH", settings); }}>
            {[["email", "Email"], ["phone", "Phone"], ["address", "Address"], ["businessHours", "Business hours"], ["footerDescription", "Footer description"]].map(([field, label]) => <label key={field}>{label}{field === "footerDescription" ? <textarea value={settings[field] || ""} rows={3} onChange={(event) => setSettings((current) => ({ ...current, [field]: event.target.value }))} /> : <input value={settings[field] || ""} onChange={(event) => setSettings((current) => ({ ...current, [field]: event.target.value }))} />}</label>)}<button className="admin-primary-button">Save site settings</button>
          </form>
        </section>


        )}
{/* section: activeSection === "__hidden_enquiries__" */}
{activeSection === "__hidden_enquiries__" && (
        <section className="admin-list-section"><div className="admin-list-heading"><h2>Enquiries <span>{enquiries.length}</span></h2><button className="admin-secondary-button" onClick={loadCmsData}>Refresh</button></div><div className="admin-simple-list">{enquiries.map((enquiry) => <div className="admin-enquiry" key={enquiry._id}><strong>{enquiry.name} · {enquiry.email}</strong><span>{enquiry.message}</span><select value={enquiry.status} onChange={(event) => void updateCms(`/api/admin/enquiries/${enquiry._id}`, "PATCH", { status: event.target.value })}><option>New</option><option>In Progress</option><option>Resolved</option></select><button className="admin-secondary-button" onClick={() => window.confirm("Delete this enquiry?") && void updateCms(`/api/admin/enquiries/${enquiry._id}`, "DELETE")}>Delete</button></div>)}</div></section>


        )}
{/* section: activeSection === "overview" */}
{activeSection === "overview" && (
        <details className="admin-form-card admin-founder-card rf-admin-disclosure">
          <summary>Manage homepage founder section</summary>
          <div className="rf-admin-disclosure-content">
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
        </div>
        </details>


        )}
{/* section: activeSection === "results" */}
{activeSection === "results" && (
        <section className="admin-form-card rf-admin-project-card">
          <div className="admin-list-heading">
            <h2>{editing ? "Edit project" : "Add project"}</h2>
            {!showProjectForm && (
              <button type="button" className="admin-primary-button" onClick={() => {
                resetForm();
                setShowProjectForm(true);
                setError("");
                setMessage("");
              }}>+ Add project</button>
            )}
          </div>
          {showProjectForm && (
            <div className="rf-admin-editor-panel">
              <form onSubmit={saveResult} className="admin-result-form">
            <label>Cover image {editing && "(leave empty to keep the current cover)"}
              <input
                id="result-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                required={!editing}
              />
              <small>Required for new projects. JPG, PNG, WebP or AVIF; maximum 5 MB.</small>
              {(coverPreview || editing?.imageUrl) ? (
                <div className="rf-admin-cover-preview">
                  <img
                    src={coverPreview || editing.imageUrl}
                    alt={image ? "Selected cover preview" : "Current project cover"}
                  />
                  <div>
                    <strong>{image ? "New cover selected" : "Current cover photo"}</strong>
                    <small>{image ? image.name : "Choose a file above to replace this image."}</small>
                  </div>
                </div>
              ) : (
                <small className="rf-admin-image-empty">No cover photo available.</small>
              )}
            </label>

            <label>Gallery images (optional)
              <input
                id="result-gallery"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
              />
              <small>Choose up to 12 new images per upload. Existing gallery images are kept unless deleted.</small>
            </label>

            <div className="admin-gallery-editor rf-admin-gallery-editor">
              <div className="rf-admin-gallery-heading">
                <h3>Gallery images</h3>
                <span>{(editing?.gallery?.length || 0) + galleryFiles.length} total</span>
              </div>

              {(editing?.gallery?.length || 0) + galleryFiles.length > 0 ? (
                <div className="admin-gallery-editor-grid rf-admin-gallery-grid">
                  {(editing?.gallery || []).map((item) => (
                    <div className="admin-gallery-editor-item rf-admin-gallery-item" key={item.publicId}>
                      <img src={item.url} alt={item.alt || "Project gallery"} />
                      <small>Saved</small>
                      <button
                        type="button"
                        className="admin-secondary-button"
                        disabled={busy}
                        onClick={() => deleteGalleryImage(item)}
                      >Delete</button>
                    </div>
                  ))}

                  {galleryFiles.map((file, fileIndex) => (
                    <div className="admin-gallery-editor-item rf-admin-gallery-item" key={`${file.name}-${file.size}-${file.lastModified}-${fileIndex}`}>
                      <img src={galleryPreviews[fileIndex]} alt={`New gallery image ${fileIndex + 1}`} />
                      <small>New image</small>
                      <button
                        type="button"
                        className="admin-secondary-button"
                        disabled={busy}
                        onClick={() => {
                          setGalleryFiles((current) => current.filter((_, index) => index !== fileIndex));
                          const input = document.getElementById("result-gallery");
                          if (input) input.value = "";
                        }}
                      >Remove</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rf-admin-image-empty">No gallery images added yet.</p>
              )}
            </div>

            <label>Video link (optional)
              <input
                type="url"
                value={resultDetails.videoUrl}
                onChange={(e) => setResultDetails((current) => ({
                  ...current,
                  videoUrl: e.target.value,
                  mediaType: e.target.value.trim() ? "video" : "image",
                }))}
                placeholder="https://www.youtube.com/watch?v=..."
                maxLength={1000}
              />
              <small>Paste a YouTube video URL, or leave it empty if there is no video.</small>
            </label>

            <label>Brand name
              <input
                value={resultDetails.clientName}
                onChange={(e) => setResultDetails((current) => ({ ...current, clientName: e.target.value }))}
                maxLength={160}
                required
              />
            </label>

            <label>Work we did / category
              <input
                value={resultDetails.category}
                onChange={(e) => setResultDetails((current) => ({ ...current, category: e.target.value }))}
                placeholder="e.g. Social Media Marketing"
                maxLength={160}
                required
              />
            </label>

            <label>Description
              <textarea
                value={resultDetails.description}
                onChange={(e) => setResultDetails((current) => ({
                  ...current,
                  description: e.target.value,
                  longDescription: e.target.value,
                }))}
                rows={5}
                maxLength={12000}
                placeholder="Describe the work we did for this brand..."
                required
              />
            </label>

            <div className="admin-form-actions">
              <button className="admin-primary-button" disabled={busy}>
                {busy ? "Saving…" : editing ? "Save changes" : "Upload and add result"}
              </button>
              <button type="button" className="admin-secondary-button" onClick={resetForm}>Cancel</button>
            </div>
              </form>
            </div>
          )}
        </section>


        )}
{/* section: activeSection === "results" */}
{activeSection === "results" && (
        <section className="admin-list-section">
          <div className="admin-list-heading">
            <h2>All results <span>{results.length}</span></h2>
            <button className="admin-secondary-button" onClick={loadResults}>Refresh</button>
          </div>

          {results.length === 0 ? (
            <div className="admin-empty">No results yet. Add your first cover image above.</div>
          ) : (() => {
            const sortedResults = [...results].sort((a, b) => a.order - b.order);
            const totalPages = Math.ceil(sortedResults.length / RESULTS_PER_PAGE);
            const currentPage = Math.min(resultsPage, totalPages);
            const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
            const pageResults = sortedResults.slice(startIndex, startIndex + RESULTS_PER_PAGE);

            return (
              <>
                <div className="admin-results-list">
                  {pageResults.map((result, pageIndex) => {
                    const links = legacyLinks(result);
                    const shownCount = links.filter((link) => link.isVisible !== false).length;
                    const globalIndex = startIndex + pageIndex;

                    return (
                      <article className="admin-result-item" key={result._id}>
                        <img src={result.imageUrl} alt="" />
                        <div className="admin-result-info">
                          <strong>{result.clientName || result.brandName || result.title || "Untitled project"}</strong>
                          <span>{result.category || result.type || (result.mediaType === "video" ? "Video project" : "Project")}</span>
                          <span>{links.length} social account(s) · {shownCount} icon(s) visible</span>
                          <span>Order: {result.order} · {result.isActive ? "Published" : "Hidden"}</span>
                        </div>
                        <div className="admin-result-actions">
                          <button aria-label="Move up" disabled={globalIndex === 0} onClick={() => moveResult(result, -1)}>↑</button>
                          <button aria-label="Move down" disabled={globalIndex === sortedResults.length - 1} onClick={() => moveResult(result, 1)}>↓</button>
                          <button onClick={() => beginEdit(result)}>Edit</button>
                          <button onClick={() => toggleActive(result)}>{result.isActive ? "Hide" : "Publish"}</button>
                          <button className="admin-delete-button" onClick={() => deleteResult(result)}>Delete</button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <nav className="admin-results-pagination" aria-label="Results management pages">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      disabled={currentPage === 1}
                      onClick={() => setResultsPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </button>

                    <div className="admin-results-page-numbers">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={page === currentPage ? "admin-primary-button" : "admin-secondary-button"}
                          aria-current={page === currentPage ? "page" : undefined}
                          onClick={() => setResultsPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="admin-secondary-button"
                      disabled={currentPage === totalPages}
                      onClick={() => setResultsPage((page) => Math.min(totalPages, page + 1))}
                    >
                      Next
                    </button>
                  </nav>
                )}

                <p className="admin-results-pagination-summary">
                  Showing {startIndex + 1}–{Math.min(startIndex + RESULTS_PER_PAGE, sortedResults.length)} of {sortedResults.length} results
                </p>
              </>
            );
          })()}
        </section>

        )}
      </div>
    </main>
  );
}
