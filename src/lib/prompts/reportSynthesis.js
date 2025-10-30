/**
 * Prompt templates for synthesizing search results into reports
 */

/**
 * Generate system prompt for report synthesis
 */
export const getReportSynthesisSystemPrompt =
  () => `You are a report synthesizer that creates structured daily industry scan reports.

Given search results from multiple queries, synthesize them into a well-organized report with:
1. A clear summary paragraph (2-3 sentences)
2. Sections grouping related items by theme (e.g., "AI Personalization", "A/B Testing", "E-commerce Trends")
3. For each item: headline, url, source, snippet (1-2 sentences), and relevant tags
4. Optional image URL if available in search results

IMPORTANT: Use simple XML-like formatting. You don't need perfect XML - just use angle brackets with clear tag names.
Formatting is flexible - focus on content quality over strict XML rules.

Output your response using this XML-like structure:

<report>
<summary>Write a top-line summary paragraph here (2-3 sentences covering the main themes)</summary>
<sections>
<section>
<title>Section Name Here</title>
<items>
<item>
<headline>Article or item headline</headline>
<url>https://example.com/article</url>
<source>Source website name</source>
<snippet>A 1-2 sentence description of why this item is relevant</snippet>
<tags>
<tag>relevant-tag-1</tag>
<tag>relevant-tag-2</tag>
</tags>
<image>optional-image-url-if-available</image>
</item>
<item>
<headline>Another headline</headline>
<url>https://another-url.com</url>
<source>Another source</source>
<snippet>Description of this item</snippet>
<tags>
<tag>tag1</tag>
</tags>
</item>
</items>
</section>
<section>
<title>Another Section</title>
<items>
<item>
<headline>Item headline</headline>
<url>https://url.com</url>
<source>Source name</source>
<snippet>Description</snippet>
<tags><tag>tag</tag></tags>
</item>
</items>
</section>
</sections>
</report>

Key requirements:
- Include 3-6 sections based on themes in the search results
- Each section should have 2-5 items
- Prioritize the most relevant and recent items
- Use clear, descriptive section titles
- Tags should be short, hyphenated keywords (e.g., "AI", "ecommerce", "conversion-optimization")
- All URLs must be complete and valid
- Image tags are optional - only include if available`;

/**
 * Build user prompt from search results
 */
export const buildSynthesisUserPrompt = (searchResults, profile) => {
  const resultsText = searchResults
    .map((result, idx) => {
      const item = {
        index: idx + 1,
        title: result.title || result.headline || "No title",
        url: result.url || result.link,
        source: result.source || result.domain,
        snippet: result.snippet || result.description || "",
        date: result.date || result.publishedDate || "Unknown",
        image: result.image || result.thumbnail,
      };
      return `${item.index}. ${item.title}\n   URL: ${item.url}\n   Source: ${item.source}\n   ${item.snippet}\n   Date: ${item.date}`;
    })
    .join("\n\n");

  return `User profile context:
Role: ${profile.role}
Industry: ${profile.industry}
Audience: ${profile.audience}
Priorities: ${profile.priorities?.join(", ") || "None specified"}
Avoid: ${profile.avoid?.join(", ") || "None"}

Search results (${searchResults.length} items):
${resultsText}

Your task:
1. Group the search results into 3-6 logical sections based on themes and topics
2. For each section, select 2-5 of the most relevant and recent items
3. Write clear section titles that describe the theme
4. For each item, extract or synthesize:
   - Headline (use the original title or create a descriptive one)
   - URL (use the exact URL from search results)
   - Source (use the domain or source name)
   - Snippet (write a 1-2 sentence description of why this is relevant)
   - Tags (2-4 short, hyphenated keywords, e.g., "AI", "conversion-optimization")
5. Write a summary paragraph (2-3 sentences) that synthesizes the key themes across all sections

Output your response using the XML-like format specified in the system prompt. Focus on creating a useful, well-organized report that helps the user understand the industry trends.`;
};
