"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const fallbackPortraits = {
  Ashwin: "/team/ashwin.jpg",
  Abhay: "/team/abhay.jpg",
  Arvan: "/team/arvan.jpg",
  Dhruv: "/team/dhruv.jpg",
};

function RFTeamCard({ member }) {
  const [imageFailed, setImageFailed] = useState(false);
  const portrait = member.imageUrl || fallbackPortraits[member.name];
  const slug = member.slug || (member.name || "team-member")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <article className="rf-team-card">
      <div className="rf-team-card__image-wrap">
        {portrait && !imageFailed ? (
          <img
            className="rf-team-card__image"
            src={portrait}
            alt={member.name || "Reach Forever team member"}
            loading="eager"
            decoding="async"
            draggable="false"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="rf-team-card__image-fallback" aria-label="Image unavailable">
            RF
          </div>
        )}

        <div className="rf-team-card__shade" />

        <div className="rf-team-card__details">
          <p className="rf-team-card__role">{member.role || "Team Member"}</p>
          <h3 className="rf-team-card__name">{member.name || "Our Team"}</h3>
          <Link
            className="rf-team-card__link"
            href={"/team/" + encodeURIComponent(slug)}
            aria-label={"Read more about " + (member.name || "this team member")}
          >
            Read More <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function RFTeamCarousel({ members = [] }) {
  const validMembers = members.filter((member) => member && member.name);
  const shouldMove = validMembers.length > 1;
  const trackMembers = shouldMove
    ? [...validMembers, ...validMembers]
    : validMembers;

  useEffect(() => {
    const track = document.querySelector(".rf-team-carousel__track");
    if (!track) return;

    track.style.setProperty(
      "--rf-team-loop-duration",
      Math.max(18, validMembers.length * 5.5) + "s"
    );
  }, [validMembers.length]);

  if (!validMembers.length) {
    return (
      <div className="rf-team-carousel__empty">
        Team profiles will appear here soon.
      </div>
    );
  }

  return (
    <div
      className={"rf-team-carousel" + (shouldMove ? " rf-team-carousel--moving" : "")}
      aria-label="Reach Forever team members"
    >
      <div className="rf-team-carousel__viewport">
        <div className="rf-team-carousel__track">
          {trackMembers.map((member, index) => (
            <div
              className="rf-team-carousel__item"
              key={(member._id || member.slug || member.name) + "-" + index}
            >
              <RFTeamCard member={member} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
