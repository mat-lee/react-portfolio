import { useDocumentMeta } from "../lib/useDocumentMeta";
import { CONTACT_LINKS } from "./Contact";
import { BIO_PARAGRAPHS, SKILLS } from "../data/bio";
import projectsData from "../data/projects.json";
import writeupsData from "../data/writeups.json";
import publicationsData from "../data/publications.json";
const NAV = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#publications", label: "Publications" },
  { href: "#writeups", label: "Writeups" },
  { href: "#contact", label: "Contact" },
];

// A plain, single-scroll alternative to the 3D site — GitHub-Pages-style:
// no cards, no motion, just typography and thin rules between sections.
// Triggered by the "Simple Version" text button on Home (see App.jsx).
export function SimplePage() {
  useDocumentMeta("Matthew Lee", "A simple, single-page portfolio for Matthew Lee.");

  return (
    <div className="w-full min-h-screen bg-[#FBFBF9] dark:bg-[#020617] text-slate-900 dark:text-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-20">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-1.5">
            <div className="w-64 h-64 rounded-full overflow-hidden shrink-0">
              <img
                src="/headshot.jpg"
                alt="Matthew Lee"
                className="w-full h-full object-cover"
                style={{ transform: "scale(3)", transformOrigin: "48% 48%" }}
              />
            </div>
            <h1 className="text-[28px] font-bold tracking-tight">Matthew Lee</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-base mb-5">
            Computer Science &amp; Mathematics @ UNC Chapel Hill
          </p>
          <nav className="flex flex-wrap gap-4 text-sm">
            {NAV.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-blue-700 dark:text-blue-400 hover:underline"
              >
                {label}
              </a>
            ))}
          </nav>
        </header>
        <hr className="border-t border-slate-200 dark:border-slate-800 mb-10" />

        <section id="about" className="mb-10">
          <h2 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-slate-500 dark:text-slate-400 mb-4">
            About
          </h2>
          <p className="text-base leading-relaxed mb-3.5">{BIO_PARAGRAPHS[0]}</p>
          <p className="text-base leading-relaxed mb-4">{BIO_PARAGRAPHS[1]}</p>
          <div className="font-mono text-[13px] text-slate-500 dark:text-slate-400">{SKILLS.join(" · ")}</div>
        </section>
        <hr className="border-t border-slate-200 dark:border-slate-800 mb-10" />

        <section id="projects" className="mb-10">
          <h2 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-slate-500 dark:text-slate-400 mb-4">
            Projects
          </h2>
          <ul className="list-none m-0 p-0 space-y-7">
            {projectsData.map((project) => (
              <li key={project.id}>
                <h3 className="text-[17px] font-semibold mb-1">{project.title}</h3>
                <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed mb-1.5">
                  {project.summary}
                </p>
                <div className="text-sm flex gap-4">
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline">
                      {project.linkText || "Demo"} →
                    </a>
                  )}
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline">
                      GitHub →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
        <hr className="border-t border-slate-200 dark:border-slate-800 mb-10" />

        <section id="publications" className="mb-10">
          <h2 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-slate-500 dark:text-slate-400 mb-4">
            Publications
          </h2>
          {publicationsData.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-[15px] m-0">Nothing published yet — check back soon.</p>
          ) : (
            <ul className="list-none m-0 p-0 space-y-4">
              {publicationsData.map((pub) => (
                <li key={pub.id}>
                  <h3 className="text-[15px] font-semibold">{pub.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {pub.authors}
                    {pub.venue && ` — ${pub.venue}`}
                  </p>
                  {pub.link && (
                    <a href={pub.link} target="_blank" rel="noreferrer" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">
                      Read →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <hr className="border-t border-slate-200 dark:border-slate-800 mb-10" />

        <section id="writeups" className="mb-10">
          <h2 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-slate-500 dark:text-slate-400 mb-4">
            Writeups
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-[15px] mb-3.5">Explorations and technical writeups.</p>
          <ul className="list-none m-0 p-0 space-y-2.5 text-[15px]">
            {writeupsData.map((writeup) => (
              <li key={writeup.id}>
                <a href={writeup.url} className="text-blue-700 dark:text-blue-400 hover:underline">
                  {writeup.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <hr className="border-t border-slate-200 dark:border-slate-800 mb-14" />

        <section id="contact" className="mb-14">
          <h2 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-slate-500 dark:text-slate-400 mb-4">
            Contact
          </h2>
          <ul className="list-none m-0 p-0 space-y-2 text-[15px]">
            {CONTACT_LINKS.map(({ href, text, external }) => (
              <li key={href}>
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="text-blue-700 dark:text-blue-400 hover:underline"
                >
                  {text}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
