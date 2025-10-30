import Link from "next/link";

const employees = [
  {
    id: "e1",
    name: "Dr. Maya Patel",
    role: "Chief Medical Informatics Officer",
    team: "Clinical Data & EHR",
    avatar: "https://i.pravatar.cc/160?img=11",
    focus: [
      "EHR Interoperability",
      "FHIR APIs",
      "Clinical Decision Support",
      "HL7",
    ],
  },
  {
    id: "e2",
    name: "Jordan Kim",
    role: "Director of AI/ML",
    team: "AI Platform",
    avatar: "https://i.pravatar.cc/160?img=32",
    focus: [
      "RAG for Radiology",
      "Model Governance",
      "PHI Redaction",
      "Edge Inference",
    ],
  },
  {
    id: "e3",
    name: "Ava Thompson",
    role: "Sr. Product Manager",
    team: "Patient Experience",
    avatar: "https://i.pravatar.cc/160?img=47",
    focus: [
      "Virtual Care",
      "Care Navigation",
      "Patient Portals",
      "Contact Center",
    ],
  },
  {
    id: "e4",
    name: "Miguel Santos",
    role: "Security & Compliance Lead",
    team: "GRC",
    avatar: "https://i.pravatar.cc/160?img=58",
    focus: ["HIPAA", "SOC 2", "Zero Trust", "PII/PHI DLP"],
  },
  {
    id: "e5",
    name: "Emily Chen",
    role: "Data Engineering Manager",
    team: "Clinical Pipelines",
    avatar: "https://i.pravatar.cc/160?img=15",
    focus: ["FHIR Bulk Data", "De-identification", "Delta Lake", "dbt"],
  },
  {
    id: "e6",
    name: "Noah Williams",
    role: "DevEx Engineer",
    team: "Platform",
    avatar: "https://i.pravatar.cc/160?img=5",
    focus: ["Preview Environments", "Observability", "Feature Flags", "SRE"],
  },
  {
    id: "e7",
    name: "Sofia Rivera",
    role: "Clinical AI Scientist",
    team: "Research",
    avatar: "https://i.pravatar.cc/160?img=21",
    focus: [
      "Cardiology AI",
      "Sepsis Alerts",
      "Bias Audits",
      "Prospective Validation",
    ],
  },
  {
    id: "e8",
    name: "Liam O'Connor",
    role: "Integration Engineer",
    team: "EHR Integrations",
    avatar: "https://i.pravatar.cc/160?img=67",
    focus: [
      "Epic App Orchard",
      "Cerner APIs",
      "Interface Engines",
      "SAML/OIDC",
    ],
  },
];

const popularArticles = [
  {
    title: "8 Breakthrough Technology Trends That Will Transform Healthcare",
    source: "Forbes",
    href: "https://www.forbes.com/sites/bernardmarr/2025/10/27/the-8-biggest-healthcare-technology-trends-to-watch-in-2026/",
    blurb:
      "From AI agents across the patient journey to quantum-assisted drug discovery.",
  },
  {
    title: "Healthcare Technology News & Trends",
    source: "HealthTech Magazine",
    href: "https://healthtechmagazine.net/",
    blurb:
      "Smart rooms, contact centers, and AI adoption grounded in data quality.",
  },
  {
    title: "Younger generations drive digital shift in U.S. healthcare",
    source: "Healthcare IT News",
    href: "https://www.healthcareitnews.com/",
    blurb:
      "Faster telehealth, data-driven ops, and scaling education with technology.",
  },
  {
    title: "Health Tech - The latest on virtual care and medical AI",
    source: "STAT News",
    href: "https://www.statnews.com/category/health-tech/",
    blurb:
      "Reporting on digital health, telemedicine, and AI shaping care delivery.",
  },
  {
    title: "Five healthcare tech trends for 2025",
    source: "Medtronic Newsroom",
    href: "https://news.medtronic.com/five-healthcare-tech-trends-for-2025-newsroom",
    blurb:
      "Personalized care, math-driven prediction, and smarter surgical tools.",
  },
  {
    title: "Top 10 Healthcare Technology Trends in 2025",
    source: "TechMagic",
    href: "https://www.techmagic.co/blog/top-health-tech-trends",
    blurb: "AI, 3D printing, VR, and telehealth—what’s practical now vs. hype.",
  },
];

function MiniRadar({ labels }) {
  return (
    <div className="w-full h-36 bg-gradient-to-br from-emerald-900/30 to-emerald-700/20 rounded-lg relative overflow-hidden">
      <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="44" fill="url(#rg)" />
        <circle
          cx="60"
          cy="60"
          r="18"
          fill="none"
          stroke="#34d399"
          strokeOpacity="0.45"
        />
        <circle
          cx="60"
          cy="60"
          r="30"
          fill="none"
          stroke="#34d399"
          strokeOpacity="0.35"
        />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#34d399"
          strokeOpacity="0.25"
        />
        {labels.slice(0, 4).map((l, i) => {
          const angle = (i / 4) * 2 * Math.PI;
          const x = 60 + Math.cos(angle) * 32;
          const y = 60 + Math.sin(angle) * 32;
          return (
            <g key={l}>
              <circle cx={x} cy={y} r="3.5" fill="#86efac" />
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
        {labels.slice(0, 3).map((t) => (
          <span
            key={t}
            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/50 text-emerald-100 border border-emerald-500/30"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CompanyOverviewPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-stone-100 mb-1">
              Company overview
            </h1>
            <p className="text-stone-300">
              Healthcare tech · Team radars and trending reads
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-emerald-300 hover:text-emerald-200"
          >
            Back to home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            {employees
              .reduce((rows, emp, idx) => {
                if (idx % 2 === 0) rows.push([]);
                rows[rows.length - 1].push(emp);
                return rows;
              }, [])
              .map((row, rIdx) => (
                <div
                  key={rIdx}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {row.map((emp) => (
                    <div key={emp.id} className="card-sleek card-hover p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-stone-100 font-semibold leading-tight">
                            {emp.name}
                          </div>
                          <div className="text-xs text-stone-400">
                            {emp.role} • {emp.team}
                          </div>
                        </div>
                      </div>
                      <MiniRadar labels={emp.focus} />
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {emp.focus.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] px-2 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>

          <aside className="space-y-4">
            <div className="card-sleek p-4">
              <h2 className="text-stone-100 font-semibold mb-2">
                Popular articles
              </h2>
              <ul className="divide-y divide-stone-800/60">
                {popularArticles.map((a) => (
                  <li key={a.href} className="py-3">
                    <a
                      href={a.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="text-sm text-stone-100 group-hover:text-emerald-300 transition-colors">
                        {a.title}
                      </div>
                      <div className="text-xs text-stone-400">{a.source}</div>
                      <p className="text-xs text-stone-300 mt-1">{a.blurb}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-sleek p-4">
              <h3 className="text-stone-100 font-semibold mb-2">Teams</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Clinical Data",
                  "AI Platform",
                  "Patient Experience",
                  "Security & Compliance",
                  "Integrations",
                  "Platform",
                ].map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-1 rounded-full bg-stone-800 text-stone-300 border border-stone-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/radar/create"
            className="btn-gradient inline-flex items-center px-4 py-2 text-sm"
          >
            Create your own radar
          </Link>
        </div>
      </div>
    </div>
  );
}
