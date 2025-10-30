/**
 * Example radar templates for the examples gallery
 */

export const exampleRadars = [
  {
    slug: "edtech-hs-interactive-us",
    title: "Product Manager working on interactive high school content",
    description:
      "Focus on interactive high school educational content, accessibility, and web gaming",
    profile: {
      role: "Product Manager",
      industry: "EdTech",
      productFocus: "Interactive content",
      audience: "US high school",
      geography: ["United States"],
      priorities: [
        "interactive content",
        "accessibility",
        "web gaming",
        "JavaScript libraries",
      ],
      avoid: ["policy", "textbook content"],
    },
    mermaidDiagram: `quadrantChart
    title Distribution of Topics
    x-axis Low Relevance --> High Relevance
    y-axis Low Priority --> High Priority
    quadrant-1 Core Focus
    quadrant-2 Key Topics
    quadrant-3 Watchlist
    quadrant-4 Secondary
    Interactive HS Content: [0.32, 0.88]
    Accessibility Standards: [0.25, 0.82]
    Web Gaming Platforms: [0.85, 0.87]
    JS Interactive Libraries: [0.72, 0.75]
    AR/VR Learning Tools: [0.78, 0.68]
    Student Engagement Metrics: [0.68, 0.72]
    Adaptive Learning Systems: [0.35, 0.65]
    Mobile-First Education: [0.82, 0.62]
    LMS Integrations: [0.28, 0.38]
    Assessment Automation: [0.45, 0.32]
    Teacher Dashboard APIs: [0.72, 0.42]
    Content Creator Tools: [0.62, 0.28]`,
    queryPlan: {
      queries: [
        "interactive 'high school' edtech",
        "accessibility 'interactive' classroom tools",
        "web gaming 'education' high school",
        "javascript library 'interactive learning' demo",
      ],
      finalQueries: [
        "interactive 'high school' edtech",
        "accessibility 'interactive' classroom tools",
        "web gaming 'education' high school",
        "javascript library 'interactive learning' demo",
      ],
      sourcesHint: ["company blogs", "GitHub releases", "teacher forums"],
      lastLLMPrompt: "Example radar",
    },
  },
  {
    slug: "healthcare-genai-compliance-eu",
    title: "Compliance Officer tracking GenAI regulations for EU healthcare",
    description:
      "Track AI compliance updates in European healthcare regulations",
    profile: {
      role: "Compliance Officer",
      industry: "Healthcare",
      productFocus: "GenAI platforms",
      audience: "EU healthcare providers",
      geography: ["European Union"],
      priorities: [
        "AI regulations",
        "GDPR compliance",
        "medical AI ethics",
        "EU directives",
      ],
      avoid: ["US regulations", "non-healthcare"],
    },
    mermaidDiagram: `quadrantChart
    title Distribution of Topics
    x-axis Low Relevance --> High Relevance
    y-axis Low Priority --> High Priority
    quadrant-1 Core Focus
    quadrant-2 Key Topics
    quadrant-3 Watchlist
    quadrant-4 Secondary
    EU AI Act Implementation: [0.28, 0.88]
    GDPR Data Processing Rules: [0.22, 0.83]
    Medical AI Ethics Guidelines: [0.85, 0.86]
    Clinical Decision Support Compliance: [0.82, 0.72]
    Patient Data Protection: [0.35, 0.78]
    Regulatory Sandbox Programs: [0.75, 0.65]
    Certification Requirements: [0.32, 0.68]
    Cross-Border Data Transfer: [0.38, 0.35]
    Compliance Monitoring Tools: [0.42, 0.32]
    Algorithmic Transparency: [0.78, 0.45]
    Medical Device MDR Updates: [0.62, 0.38]
    Audit Trail Requirements: [0.72, 0.28]`,
    queryPlan: {
      queries: [
        "EU AI Act healthcare compliance",
        "GDPR medical AI data processing",
        "medical AI ethics guidelines EU",
        "healthcare GenAI regulations 2024",
      ],
      finalQueries: [
        "EU AI Act healthcare compliance",
        "GDPR medical AI data processing",
        "medical AI ethics guidelines EU",
        "healthcare GenAI regulations 2024",
      ],
      sourcesHint: ["EU official sites", "healthcare news", "compliance blogs"],
      lastLLMPrompt: "Example radar",
    },
  },
  {
    slug: "retail-ecom-merchandising-na",
    title:
      "E-commerce Manager optimizing online merchandising in North America",
    description:
      "Latest experiments in e-commerce merchandising in North America",
    profile: {
      role: "E-commerce Manager",
      industry: "Retail",
      productFocus: "Online merchandising",
      audience: "North American consumers",
      geography: ["United States", "Canada"],
      priorities: [
        "personalization",
        "A/B testing",
        "product recommendations",
        "conversion optimization",
      ],
      avoid: ["offline retail", "wholesale"],
    },
    mermaidDiagram: `quadrantChart
    title Distribution of Topics
    x-axis Low Relevance --> High Relevance
    y-axis Low Priority --> High Priority
    quadrant-1 Core Focus
    quadrant-2 Key Topics
    quadrant-3 Watchlist
    quadrant-4 Secondary
    AI Personalization Engines: [0.32, 0.87]
    A/B Testing Frameworks: [0.25, 0.82]
    Product Recommendation APIs: [0.85, 0.84]
    Conversion Rate Optimization: [0.72, 0.75]
    Dynamic Pricing Algorithms: [0.78, 0.68]
    Cart Abandonment Solutions: [0.68, 0.72]
    Visual Search Technology: [0.35, 0.65]
    Customer Segmentation Tools: [0.28, 0.42]
    Marketplace Integration: [0.38, 0.35]
    Social Commerce Features: [0.75, 0.38]
    Mobile Shopping UX: [0.62, 0.28]`,
    queryPlan: {
      queries: [
        "ecommerce personalization experiments 2024",
        "A/B testing product recommendations retail",
        "merchandising conversion optimization",
        "retail AI personalization North America",
      ],
      finalQueries: [
        "ecommerce personalization experiments 2024",
        "A/B testing product recommendations retail",
        "merchandising conversion optimization",
        "retail AI personalization North America",
      ],
      sourcesHint: ["ecommerce blogs", "retail tech", "case studies"],
      lastLLMPrompt: "Example radar",
    },
  },
  {
    slug: "climate-tech-funding-global",
    title: "Investor tracking climate tech funding and startups globally",
    description: "Global climate tech funding rounds and pilot project updates",
    profile: {
      role: "Investor",
      industry: "Climate Tech",
      productFocus: "Funding & startups",
      audience: "Global market",
      geography: ["Global"],
      priorities: [
        "funding rounds",
        "startup launches",
        "pilot projects",
        "climate solutions",
      ],
      avoid: ["fossil fuels", "greenwashing"],
    },
    mermaidDiagram: `quadrantChart
    title Distribution of Topics
    x-axis Low Relevance --> High Relevance
    y-axis Low Priority --> High Priority
    quadrant-1 Core Focus
    quadrant-2 Key Topics
    quadrant-3 Watchlist
    quadrant-4 Secondary
    Series A-B Funding Rounds: [0.28, 0.88]
    Carbon Capture Pilot Projects: [0.22, 0.83]
    Climate Tech Startup Launches: [0.85, 0.86]
    Renewable Energy Solutions: [0.82, 0.74]
    Battery Storage Innovations: [0.75, 0.68]
    Green Hydrogen Projects: [0.35, 0.78]
    Climate Fintech Platforms: [0.68, 0.72]
    Grid Modernization Tech: [0.32, 0.38]
    ESG Investment Trends: [0.38, 0.32]
    Sustainable Agriculture Tech: [0.78, 0.42]
    Carbon Accounting Software: [0.62, 0.35]`,
    queryPlan: {
      queries: [
        "climate tech funding rounds 2024",
        "climate startup pilot projects",
        "carbon capture funding announcements",
        "renewable energy startup launches",
      ],
      finalQueries: [
        "climate tech funding rounds 2024",
        "climate startup pilot projects",
        "carbon capture funding announcements",
        "renewable energy startup launches",
      ],
      sourcesHint: ["tech news", "green finance", "startup blogs"],
      lastLLMPrompt: "Example radar",
    },
  },
];

/**
 * Get example radar by slug
 */
export function getExampleBySlug(slug) {
  return exampleRadars.find((radar) => radar.slug === slug);
}
