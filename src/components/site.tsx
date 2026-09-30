"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  GraduationCap,
  MapPin,
  Menu,
  Phone,
  Search,
  X,
  FileText,
  BookOpen,
  Layers,
  Zap,
} from "lucide-react";
import type { NavigationItem, NavigationMenu } from "@/lib/navigation-types";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  url: string;
  type: "page" | "menu" | "dropdown" | "quick";
  subtitle?: string;
};

function menuPath(slug: string) {
  return slug === "home" ? "/" : `/pages/${slug}`;
}

function ResultIcon({ type }: { type: SearchResult["type"] }) {
  if (type === "quick") return <Zap size={12} />;
  if (type === "menu") return <Layers size={12} />;
  if (type === "dropdown") return <BookOpen size={12} />;
  return <FileText size={12} />;
}

export function SiteNavbar({ menus }: { menus: NavigationMenu[] }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeItemPath, setActiveItemPath] = useState<string[]>([]);
  const [submenuSides, setSubmenuSides] = useState<Record<string, "left" | "right">>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMobileIds, setExpandedMobileIds] = useState<Set<string>>(() => new Set());

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load quick links when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
      if (!searchQuery) {
        fetch("/api/search")
          .then((r) => r.json())
          .then((d) => setSearchResults(d.results ?? []))
          .catch(() => {});
      }
    }
  }, [searchOpen]);

  // Debounced search
  const runSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchResults(data.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 280);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) runSearch(val.trim());
    else {
      fetch("/api/search")
        .then((r) => r.json())
        .then((d) => setSearchResults(d.results ?? []))
        .catch(() => {});
    }
  };

  // Close search on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    if (searchOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
        setActiveMenu(null);
        setActiveItemPath([]);
      }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.classList.toggle("mobile-nav-open", mobileOpen);
    return () => document.body.classList.remove("mobile-nav-open");
  }, [mobileOpen]);

  function toggleMobileItem(id: string) {
    setExpandedMobileIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openDesktopItem(
    item: NavigationItem,
    ancestors: string[],
    element: HTMLElement,
  ) {
    setActiveItemPath([...ancestors, item.id]);
    if (item.children.length) {
      const rect = element.getBoundingClientRect();
      setSubmenuSides((current) => ({
        ...current,
        [item.id]: window.innerWidth - rect.right < 330 ? "left" : "right",
      }));
    }
  }

  const renderDesktopItems = (
    items: NavigationItem[],
    ancestors: string[] = [],
  ): ReactNode => items.map((item) => {
    const itemPath = [...ancestors, item.id];
    const opened = activeItemPath.includes(item.id);
    return (
      <div
        className="nav-dropdown-node"
        data-open={opened}
        data-side={submenuSides[item.id] ?? "right"}
        key={item.id}
        onMouseEnter={(event) => openDesktopItem(item, ancestors, event.currentTarget)}
        onFocus={(event) => openDesktopItem(item, ancestors, event.currentTarget)}
      >
        <Link className="nav-dropdown-link" href={`/pages/${item.slug}`} aria-expanded={item.children.length ? opened : undefined} onClick={() => { setActiveMenu(null); setActiveItemPath([]); }}>
          <span>{item.title}</span>
          {!!item.children.length && <ArrowRight size={13} />}
        </Link>
        {!!item.children.length && opened && (
          <div className="nav-dropdown nav-dropdown-nested">
            {renderDesktopItems(item.children, itemPath)}
          </div>
        )}
      </div>
    );
  });

  const renderMobileItems = (items: NavigationItem[]): ReactNode => items.map((item) => {
    const expanded = expandedMobileIds.has(item.id);
    return (
      <div className="mobile-tree-item" key={item.id}>
        <div className="mobile-nav-main">
          <Link href={`/pages/${item.slug}`} onClick={() => setMobileOpen(false)}>{item.title}</Link>
          {!!item.children.length && (
            <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${item.title} submenu`} aria-expanded={expanded} onClick={() => toggleMobileItem(item.id)}>
              <ChevronDown size={15} className={expanded ? "rotated" : ""} />
            </button>
          )}
        </div>
        {!!item.children.length && expanded && (
          <div className="mobile-subnav mobile-subnav-nested">
            {renderMobileItems(item.children)}
          </div>
        )}
      </div>
    );
  });

  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="page-wrap utility-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <span>
              <MapPin size={11} /> Panhala, Kolhapur, Maharashtra
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                background: "rgba(196, 155, 46, 0.2)",
                border: "1px solid rgba(196, 155, 46, 0.55)",
                borderRadius: "3px",
                color: "#f3d887",
                fontSize: "10.5px",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              DTE CODE: <strong style={{ color: "#ffffff" }}>EN6315</strong>
            </span>
          </div>
          <div className="utility-links">
            <Link className="utility-phone" href="tel:9146999500">
              <Phone size={11} /> 9146999500
            </Link>
            <Link className="utility-phone" href="tel:8929893393">
              <Phone size={11} /> 8929893393
            </Link>
          </div>
        </div>
      </div>

      <div className="brand-header">
        <div className="page-wrap brand-inner">
          <Link
            href="/"
            className="brand-lockup"
            aria-label="Sanjeevan Group of Institutions home"
          >
            <span className="brand-logo" aria-hidden="true" />
            <span className="brand-name">
              <strong>
                Sanjeevan Group
                <br />
                of Institutions
              </strong>
              <small>Autonomous Engineering Institute</small>
            </span>
          </Link>

          <div className="brand-center-text" aria-label="Institution tagline">
            <span>Holy-Wood Academy Kolhapur&apos;s</span>
            <span>SANJEEVAN GROUP OF INSTITUTIONS</span>
            <span>PANHALA, KOLHAPUR</span>
            <span>An Autonomous Engineering Institute</span>
          </div>

          <Link className="apply-header" href="/admission">
            <GraduationCap size={18} /> Apply now <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      <div className="brand-info-bar" aria-label="Institution approvals and affiliations">
        <div className="page-wrap brand-info-inner">
          <div className="brand-info-list">
            <span>
              <span className="brand-info-bullet">◉</span>
              Approved by AICTE, New Delhi
            </span>
            <span>
              <span className="brand-info-bullet">◉</span>
              Recognized by Govt. of Maharashtra
            </span>
            <span>
              <span className="brand-info-bullet">◉</span>
              Affiliated to Shivaji University, Kolhapur
            </span>
            <span>
              <span className="brand-info-bullet">◉</span>
              Affiliated to MSBTE
            </span>
          </div>
        </div>
      </div>

      <nav
        className="main-nav"
        aria-label="Main navigation"
        onMouseLeave={() => { setActiveMenu(null); setActiveItemPath([]); }}
      >
        <div className="page-wrap nav-inner">
          {/* Desktop links */}
          <div className="nav-desktop">
            {menus.map((menu) => (
              <div className="nav-item-wrap" key={menu.id}>
                <Link
                  className="nav-link"
                  href={menuPath(menu.slug)}
                  onMouseEnter={() => { setActiveMenu(menu.items.length ? menu.id : null); setActiveItemPath([]); }}
                  onFocus={() => { setActiveMenu(menu.items.length ? menu.id : null); setActiveItemPath([]); }}
                  aria-expanded={
                    menu.items.length ? activeMenu === menu.id : undefined
                  }
                >
                  {menu.title}
                  {!!menu.items.length && <ChevronDown size={10} />}
                </Link>
                {activeMenu === menu.id && !!menu.items.length && (
                  <div className="nav-dropdown">
                    {renderDesktopItems(menu.items)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search button (desktop) */}
          <div className="nav-search-wrap" ref={searchRef}>
            <button
              id="site-search-btn"
              className="nav-search-btn"
              type="button"
              aria-label="Open site search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search size={15} />
              <span className="nav-search-label">Search</span>
            </button>

            {searchOpen && (
              <div className="search-panel" role="search" aria-label="Site search">
                <div className="search-input-wrap">
                  <Search size={15} className="search-icon" />
                  <input
                    ref={searchInputRef}
                    id="site-search-input"
                    className="search-input"
                    type="search"
                    placeholder="Search pages, departments, courses…"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoComplete="off"
                  />
                  {searchLoading && <span className="search-spinner" />}
                  {searchQuery && (
                    <button
                      className="search-clear"
                      type="button"
                      aria-label="Clear search"
                      onClick={() => {
                        setSearchQuery("");
                        fetch("/api/search")
                          .then((r) => r.json())
                          .then((d) => setSearchResults(d.results ?? []))
                          .catch(() => {});
                        searchInputRef.current?.focus();
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <ul className="search-results" role="listbox">
                    {!searchQuery && (
                      <li className="search-results-label">Quick links</li>
                    )}
                    {searchQuery && (
                      <li className="search-results-label">
                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
                      </li>
                    )}
                    {searchResults.map((result) => (
                      <li key={result.id}>
                        <Link
                          href={result.url}
                          className={`search-result-item search-type-${result.type}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <span className="search-result-icon">
                            <ResultIcon type={result.type} />
                          </span>
                          <span className="search-result-body">
                            <span className="search-result-title">{result.title}</span>
                            {result.subtitle && (
                              <span className="search-result-sub">{result.subtitle}</span>
                            )}
                          </span>
                          <ArrowUpRight size={11} className="search-result-arrow" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {searchQuery && searchResults.length === 0 && !searchLoading && (
                  <div className="search-empty">
                    No results for &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="mobile-toggle"
            type="button"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            <span>{mobileOpen ? "Close" : "Menu"}</span>
          </button>

        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="mobile-overlay"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`mobile-drawer ${mobileOpen ? "mobile-drawer-open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-drawer-header">
          <span className="mobile-drawer-brand">Sanjeevan</span>
          <button
            className="mobile-drawer-close"
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile search */}
        <div className="mobile-search-wrap">
          <Search size={14} className="mobile-search-icon" />
          <input
            id="mobile-search-input"
            className="mobile-search-input"
            type="search"
            placeholder="Search…"
            onChange={(e) => {
              const val = e.target.value;
              if (val.trim()) runSearch(val.trim());
            }}
          />
        </div>

        <nav className="mobile-nav" aria-label="Mobile menu">
          {menus.map((menu) => (
            <div className="mobile-nav-group" key={menu.id}>
              <div className="mobile-nav-main">
                <Link
                  href={menuPath(menu.slug)}
                  onClick={() => setMobileOpen(false)}
                >
                  {menu.title}
                </Link>
                {!!menu.items.length && (
                  <button
                    type="button"
                    aria-label={`${expandedMobileIds.has(menu.id) ? "Collapse" : "Expand"} ${menu.title} submenu`}
                    aria-expanded={expandedMobileIds.has(menu.id)}
                    onClick={() => toggleMobileItem(menu.id)}
                  >
                    <ChevronDown
                      size={15}
                      className={expandedMobileIds.has(menu.id) ? "rotated" : ""}
                    />
                  </button>
                )}
              </div>
              {!!menu.items.length && expandedMobileIds.has(menu.id) && (
                <div className="mobile-subnav">
                  {renderMobileItems(menu.items)}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mobile-drawer-footer">
          <Link href="/admission" className="mobile-apply-btn" onClick={() => setMobileOpen(false)}>
            <GraduationCap size={16} /> Apply Now <ArrowUpRight size={13} />
          </Link>
          <div className="mobile-contact-info">
            <span><Phone size={10} /> +91 231 234 5678</span>
            <span><MapPin size={10} /> Panhala, Kolhapur</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const [creditClicks, setCreditClicks] = useState(0);

  function handleCreditClick() {
    const next = creditClicks + 1;
    setCreditClicks(next);
    if (next >= 5) {
      setCreditClicks(0);
      window.location.href = "/admin/login";
    }
  }
  return (
    <footer className="site-footer">
      <div className="page-wrap footer-main">
        <div className="footer-about">
          <Link href="/" className="footer-brand">
            <span className="brand-logo footer-logo" aria-hidden="true" />
            <span>
              <strong>Sanjeevan Group of Institutions</strong>
              <small>Autonomous Engineering Institute</small>
            </span>
          </Link>
          <p>
            Curious minds, capable hands and the confidence to make a
            difference. Welcome to Sanjeevan, Panhala.
          </p>
          <div className="social-links">
            <a href="https://www.facebook.com/" aria-label="Facebook">
              f
            </a>
            <a href="https://www.instagram.com/" aria-label="Instagram">
              ig
            </a>
            <a href="https://www.linkedin.com/" aria-label="LinkedIn">
              in
            </a>
            <a href="https://www.youtube.com/" aria-label="YouTube">
              yt
            </a>
          </div>
        </div>
        <div className="footer-column">
          <h3>Discover</h3>
          <Link href="/about-us">About Sanjeevan</Link>
          <Link href="/vision-mission">Vision &amp; mission</Link>
          <Link href="/programs-offered">Programs offered</Link>
          <Link href="/departments">Departments</Link>
          <Link href="/gallery">Campus gallery</Link>
        </div>
        <div className="footer-column">
          <h3>Quick links</h3>
          <Link href="/admission">Admissions</Link>
          <Link href="/student-section">Student section</Link>
          <Link href="/research">Research</Link>
          <Link href="/training-placement">Training &amp; placement</Link>
          <Link href="/rti">RTI</Link>
        </div>
        <div className="footer-column footer-address">
          <h3>Come say hello</h3>
          <p>
            <MapPin size={14} /> Sanjeevan Engineering &amp; Technology Institute,
            Panhala, Kolhapur, Maharashtra 416201
          </p>
          <p>
            <Phone size={14} />
            <a href="tel:9146999500">9146999500</a>
            <span aria-hidden="true">·</span>
            <a href="tel:8929893393">8929893393</a>
          </p>
          <p>✉ &nbsp; info@sanjeevan.edu.in</p>
          <a
            className="map-link"
            href="https://maps.google.com/?q=Panhala+Kolhapur+Maharashtra"
            target="_blank"
            rel="noreferrer"
          >
            Open Google Maps <ArrowUpRight size={13} />
          </a>
          <div className="accreditation-list">
            <span>AICTE APPROVED</span>
            <span>BATU AFFILIATED</span>
            <span>NAAC</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="page-wrap">
          <span>
            © {new Date().getFullYear()} Sanjeevan Group of Institutions. All
            rights reserved.
          </span>
          <span
            style={{ fontSize: "11px", color: "#94a3b8", cursor: "default", userSelect: "none" }}
            onClick={handleCreditClick}
            title={creditClicks > 0 ? `${5 - creditClicks} more...` : undefined}
          >
            Design and Developed By Shubham Mapari
          </span>
          <div className="footer-legal">
            <Link href="/rti">Right to Information</Link>
            <Link href="/fra-fees">FRA Fees</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
