import { ArrowUpRight, MapPin } from "lucide-react";
import "@/app/campus-visit.css";

const campusQuery = "Sanjeevan Engineering and Technology Institute, Panhala, Kolhapur, Maharashtra";
const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(campusQuery)}`;
const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(campusQuery)}&z=14&output=embed`;

export function CampusVisitSection() {
  return (
    <section className="campus-visit-section" aria-label="Visit Sanjeevan">
      <div className="page-wrap campus-visit-grid">
        <article className="campus-visit-card">
          <h2>Campus Tour</h2>
          <div className="campus-visit-frame">
            <iframe
              src="https://www.youtube-nocookie.com/embed/xf-t05WP4ws?rel=0&modestbranding=1"
              title="Sanjeevani College brand film by Incept Pictures"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </article>

        <article className="campus-visit-card">
          <h2>How to Reach</h2>
          <div className="campus-visit-frame campus-map-frame">
            <iframe
              src={mapEmbedUrl}
              title="Map to Sanjeevan Engineering and Technology Institute, Panhala"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <a className="campus-directions-link" href={directionsUrl} target="_blank" rel="noreferrer">
            <MapPin size={15} /> Get directions <ArrowUpRight size={15} />
          </a>
        </article>
      </div>
    </section>
  );
}