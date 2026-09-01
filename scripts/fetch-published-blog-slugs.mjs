/**
 * Fetches published blog post slugs from Firestore at build time (public read rules).
 * Used by vite.config.ts to prerender /blog/$slug pages and include them in sitemap.xml.
 */
export async function fetchPublishedBlogSlugs() {
  const projectId =
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() || "boatpro1-18c6d";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

  const body = {
    structuredQuery: {
      from: [{ collectionId: "posts" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "published" },
          op: "EQUAL",
          value: { booleanValue: true },
        },
      },
      limit: 48,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn(
        `[build] Could not fetch blog slugs (${res.status}). Blog pages will rely on client-side rendering until the next build.`,
      );
      return [];
    }

    const rows = await res.json();
    if (!Array.isArray(rows)) return [];

    const slugs = [];
    for (const row of rows) {
      const doc = row.document;
      if (!doc?.name) continue;
      const id = doc.name.split("/").pop() ?? "";
      const slugField = doc.fields?.slug?.stringValue;
      const slug = slugField?.trim() || id;
      if (slug) slugs.push(slug);
    }

    return [...new Set(slugs)];
  } catch (error) {
    console.warn(
      "[build] Blog slug fetch failed. Blog pages will rely on client-side rendering until the next build.",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
