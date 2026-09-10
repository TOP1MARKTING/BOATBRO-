import type { CmsPageId } from "./page-content";

/** Single bilingual string field in the page content document (ar/en roots). */
export type CmsStringField = {
  kind: "string";
  path: string[];
  label: string;
  multiline?: boolean;
};

/** Bilingual [title, description] pair at path. */
export type CmsTupleField = {
  kind: "tuple";
  path: string[];
  label: string;
};

export type CmsImageField = {
  kind: "image";
  key: string;
  label: string;
};

export type CmsEditorField = CmsStringField | CmsTupleField;

export type CmsEditorSection = {
  title: string;
  hint?: string;
  fields: CmsEditorField[];
  images?: CmsImageField[];
};

export type CmsPageEditorSchema = {
  sections: CmsEditorSection[];
};

function str(path: string[], label: string, multiline?: boolean): CmsStringField {
  const field: CmsStringField = { kind: "string", path, label };
  if (multiline) field.multiline = true;
  return field;
}

function pair(path: string[], label: string): CmsTupleField {
  return { kind: "tuple", path, label };
}

function image(key: string, label: string): CmsImageField {
  return { kind: "image", key, label };
}

/** Section-oriented admin editor — paths match Firestore pageContent ar/en slices (unchanged schema). */
export const CMS_EDITOR_SCHEMAS: Record<CmsPageId, CmsPageEditorSchema> = {
  home: {
    sections: [
      {
        title: "Hero",
        fields: [
          str(["home", "hero", "tagline"], "Tagline"),
          str(["home", "hero", "title1"], "Title — Line 1"),
          str(["home", "hero", "title2"], "Title — Line 2"),
          str(["home", "hero", "title3"], "Title — Line 3"),
          str(["home", "hero", "body"], "Description", true),
          str(["home", "hero", "imageAlt"], "Image Alt Text"),
        ],
        images: [image("hero", "Hero Image")],
      },
      {
        title: "What We Do",
        fields: [
          str(["home", "what", "chip"], "Section Label"),
          str(["home", "what", "title"], "Title"),
          str(["home", "what", "body"], "Description", true),
        ],
        images: [image("what", "What We Do Image")],
      },
      {
        title: "Audiences",
        fields: [
          str(["home", "audiences", "chip"], "Section Label"),
          str(["home", "audiences", "title"], "Title"),
          str(["home", "audiences", "body"], "Description", true),
        ],
      },
      {
        title: "Guest Card",
        fields: [
          str(["home", "audiences", "cards", "0", "kicker"], "Kicker"),
          str(["home", "audiences", "cards", "0", "title"], "Title"),
          str(["home", "audiences", "cards", "0", "body"], "Description", true),
        ],
        images: [image("audience0", "Guest Card Image")],
      },
      {
        title: "Owner Card",
        fields: [
          str(["home", "audiences", "cards", "1", "kicker"], "Kicker"),
          str(["home", "audiences", "cards", "1", "title"], "Title"),
          str(["home", "audiences", "cards", "1", "body"], "Description", true),
        ],
        images: [image("audience1", "Owner Card Image")],
      },
      {
        title: "Marina Card",
        fields: [
          str(["home", "audiences", "cards", "2", "kicker"], "Kicker"),
          str(["home", "audiences", "cards", "2", "title"], "Title"),
          str(["home", "audiences", "cards", "2", "body"], "Description", true),
        ],
        images: [image("audience2", "Marina Card Image")],
      },
      {
        title: "Services",
        hint: "Home page services preview. Full services live on the Services page.",
        fields: [
          str(["home", "features", "chip"], "Section Label"),
          str(["home", "features", "title"], "Title"),
          str(["home", "features", "body"], "Description", true),
          pair(["home", "features", "items", "0"], "Service 1"),
          pair(["home", "features", "items", "1"], "Service 2"),
          pair(["home", "features", "items", "2"], "Service 3"),
          pair(["home", "features", "items", "3"], "Service 4"),
        ],
      },
      {
        title: "Partnership",
        fields: [
          str(["home", "partner", "chip"], "Section Label"),
          str(["home", "partner", "title"], "Title"),
          str(["home", "partner", "body"], "Description", true),
        ],
        images: [image("partner", "Partnership Image")],
      },
      {
        title: "Trust / Contact",
        hint: "Phone, WhatsApp, and email values are managed under Admin → Settings.",
        fields: [
          str(["home", "trust", "chip"], "Section Label"),
          str(["home", "trust", "title"], "Title"),
          str(["home", "trust", "body"], "Description", true),
        ],
      },
      {
        title: "Final CTA",
        fields: [
          str(["home", "final", "title"], "Title"),
          str(["home", "final", "body"], "Description", true),
        ],
      },
      {
        title: "SEO",
        fields: [
          str(["seo", "homeTitle"], "SEO Title"),
          str(["seo", "homeDesc"], "Meta Description", true),
        ],
      },
    ],
  },

  about: {
    sections: [
      {
        title: "Hero",
        fields: [
          str(["aboutPage", "chip"], "Section Label"),
          str(["aboutPage", "h1"], "Title"),
          str(["aboutPage", "lead"], "Lead Text", true),
        ],
        images: [image("hero", "Hero Image")],
      },
      {
        title: "Story",
        fields: [
          str(["aboutPage", "storyChip"], "Section Label"),
          str(["aboutPage", "storyTitle"], "Title"),
          str(["aboutPage", "story"], "Description", true),
        ],
        images: [image("story", "Story Image")],
      },
      {
        title: "The Problem",
        fields: [
          str(["aboutPage", "problemChip"], "Section Label"),
          str(["aboutPage", "problemTitle"], "Title"),
          pair(["aboutPage", "problems", "0"], "Problem 1"),
          pair(["aboutPage", "problems", "1"], "Problem 2"),
          pair(["aboutPage", "problems", "2"], "Problem 3"),
        ],
      },
      {
        title: "Vision",
        fields: [
          str(["aboutPage", "visionChip"], "Section Label"),
          str(["aboutPage", "visionTitle"], "Title"),
          str(["aboutPage", "visionBody"], "Description", true),
        ],
      },
      {
        title: "Mission",
        fields: [
          str(["aboutPage", "missionChip"], "Section Label"),
          str(["aboutPage", "missionTitle"], "Title"),
          str(["aboutPage", "loversLabel"], "For Sea Lovers — Label"),
          str(["aboutPage", "loversBody"], "For Sea Lovers — Description", true),
          str(["aboutPage", "ownersLabel"], "For Owners — Label"),
          str(["aboutPage", "ownersBody"], "For Owners — Description", true),
        ],
      },
      {
        title: "Who We Serve",
        fields: [
          str(["aboutPage", "servesChip"], "Section Label"),
          str(["aboutPage", "servesTitle"], "Title"),
          pair(["aboutPage", "serves", "0"], "Audience 1"),
          pair(["aboutPage", "serves", "1"], "Audience 2"),
          pair(["aboutPage", "serves", "2"], "Audience 3"),
        ],
      },
      {
        title: "Market Position",
        fields: [
          str(["aboutPage", "marketChip"], "Section Label"),
          str(["aboutPage", "marketTitle"], "Title"),
          str(["aboutPage", "marketBody"], "Description", true),
        ],
      },
      {
        title: "Office",
        hint: "Contact phone and email are managed under Admin → Settings. Address labels below appear on About and Contact pages.",
        fields: [
          str(["aboutPage", "officeChip"], "Section Label"),
          str(["aboutPage", "officeTitle"], "Title"),
          str(["aboutPage", "close"], "Closing Text", true),
        ],
      },
      {
        title: "SEO",
        fields: [
          str(["seo", "aboutTitle"], "SEO Title"),
          str(["seo", "aboutDesc"], "Meta Description", true),
        ],
      },
    ],
  },

  features: {
    sections: [
      {
        title: "Hero",
        fields: [
          str(["featuresPage", "chip"], "Section Label"),
          str(["featuresPage", "h1"], "Title"),
          str(["featuresPage", "lead"], "Lead Text", true),
          str(["featuresPage", "tabsLabel"], "Tabs Navigation Label"),
          str(["featuresPage", "loginCta"], "Login Button Label"),
        ],
        images: [image("hero", "Hero Image")],
      },
      {
        title: "Guests / Adventure",
        fields: [
          str(["featuresPage", "guests", "tab"], "Tab Label"),
          str(["featuresPage", "guests", "kicker"], "Section Label"),
          str(["featuresPage", "guests", "title"], "Title"),
          str(["featuresPage", "guests", "intro"], "Introduction", true),
          str(["featuresPage", "guests", "closing"], "Closing Text", true),
          str(["featuresPage", "guests", "downloadTitle"], "Download Block Title"),
          pair(["featuresPage", "guests", "items", "0"], "Service 1"),
          pair(["featuresPage", "guests", "items", "1"], "Service 2"),
          pair(["featuresPage", "guests", "items", "2"], "Service 3"),
        ],
        images: [
          image("guest0", "Service 1 Image"),
          image("guest1", "Service 2 Image"),
          image("guest2", "Service 3 Image"),
        ],
      },
      {
        title: "Owners",
        fields: [
          str(["featuresPage", "owners", "tab"], "Tab Label"),
          str(["featuresPage", "owners", "kicker"], "Section Label"),
          str(["featuresPage", "owners", "title"], "Title"),
          str(["featuresPage", "owners", "intro"], "Introduction", true),
          str(["featuresPage", "owners", "closing"], "Closing Text", true),
          str(["featuresPage", "owners", "downloadTitle"], "Download Block Title"),
          pair(["featuresPage", "owners", "items", "0"], "Service 1"),
          pair(["featuresPage", "owners", "items", "1"], "Service 2"),
          pair(["featuresPage", "owners", "items", "2"], "Service 3"),
          pair(["featuresPage", "owners", "items", "3"], "Service 4"),
        ],
        images: [
          image("owner0", "Service 1 Image"),
          image("owner1", "Service 2 Image"),
          image("owner2", "Service 3 Image"),
          image("owner3", "Service 4 Image"),
        ],
      },
      {
        title: "Marinas",
        hint: "Marina login URL is managed under Admin → Settings.",
        fields: [
          str(["featuresPage", "marinas", "tab"], "Tab Label"),
          str(["featuresPage", "marinas", "kicker"], "Section Label"),
          str(["featuresPage", "marinas", "title"], "Title"),
          str(["featuresPage", "marinas", "intro"], "Introduction", true),
          str(["featuresPage", "marinas", "closing"], "Closing Line", true),
          str(["featuresPage", "marinas", "siteChip"], "Site Box Chip"),
          str(["featuresPage", "marinas", "siteTitle"], "Site Box Title"),
          str(["featuresPage", "marinas", "siteBody"], "Site Box Body", true),
          str(["featuresPage", "marinas", "siteCta"], "Visit Website Button"),
          pair(["featuresPage", "marinas", "items", "0"], "Service 1"),
          pair(["featuresPage", "marinas", "items", "1"], "Service 2"),
          pair(["featuresPage", "marinas", "items", "2"], "Service 3"),
          pair(["featuresPage", "marinas", "items", "3"], "Service 4"),
        ],
        images: [
          image("marina0", "Service 1 Image"),
          image("marina1", "Service 2 Image"),
          image("marina2", "Service 3 Image"),
          image("marina3", "Service 4 Image"),
        ],
      },
      {
        title: "Bottom CTA",
        fields: [
          str(["featuresPage", "ctaTitle"], "Title"),
          str(["featuresPage", "ctaBody"], "Description", true),
        ],
      },
      {
        title: "SEO",
        fields: [
          str(["seo", "featuresTitle"], "SEO Title"),
          str(["seo", "featuresDesc"], "Meta Description", true),
        ],
      },
    ],
  },

  app: {
    sections: [
      {
        title: "Hero",
        hint: "App preview screenshots are static assets — only text is editable here.",
        fields: [
          str(["appPage", "chip"], "Section Label"),
          str(["appPage", "h1"], "Title"),
          str(["appPage", "lead"], "Description", true),
        ],
      },
      {
        title: "What Is the App",
        fields: [
          str(["appPage", "whatTitle"], "Title"),
          str(["appPage", "whatBody"], "Description", true),
        ],
      },
      {
        title: "Guest Experience",
        fields: [
          str(["appPage", "guestTitle"], "Title"),
          str(["appPage", "guestBody"], "Description", true),
        ],
      },
      {
        title: "Owner Experience",
        fields: [
          str(["appPage", "ownerTitle"], "Title"),
          str(["appPage", "ownerBody"], "Description", true),
        ],
      },
      {
        title: "Screenshot Tour",
        fields: [
          str(["appPage", "screensTitle"], "Section Title"),
          str(["appPage", "screensLead"], "Introduction", true),
          str(["appPage", "scrollHint"], "Scroll Hint"),
          pair(["appPage", "screens", "0"], "Screen 1 — Home"),
          pair(["appPage", "screens", "1"], "Screen 2 — Featured Deals"),
          pair(["appPage", "screens", "2"], "Screen 3 — Categories"),
          pair(["appPage", "screens", "3"], "Screen 4 — Featured Vessels"),
          pair(["appPage", "screens", "4"], "Screen 5 — Explore"),
        ],
      },
      {
        title: "App Stores",
        hint: "Store URLs are managed under Admin → Settings.",
        fields: [
          str(["appPage", "storesTitle"], "Title"),
          str(["appPage", "storesBody"], "Description", true),
        ],
      },
      {
        title: "Partnership CTA",
        fields: [
          str(["appPage", "ctaTitle"], "Title"),
          str(["appPage", "ctaBody"], "Description", true),
        ],
      },
      {
        title: "SEO",
        fields: [
          str(["seo", "appTitle"], "SEO Title"),
          str(["seo", "appDesc"], "Meta Description", true),
        ],
      },
    ],
  },

  contact: {
    sections: [
      {
        title: "Hero",
        fields: [
          str(["contact", "chip"], "Section Label"),
          str(["contact", "h1"], "Title"),
          str(["contact", "lead"], "Lead Text", true),
        ],
        images: [image("hero", "Hero Image")],
      },
      {
        title: "Intro",
        fields: [
          str(["contact", "title1"], "Title — Line 1"),
          str(["contact", "title2"], "Title — Line 2"),
          str(["contact", "body"], "Description", true),
        ],
      },
      {
        title: "Contact Channels",
        hint: "Phone, WhatsApp, and email values are managed under Admin → Settings.",
        fields: [
          str(["contact", "whatsapp"], "WhatsApp Label"),
          str(["contact", "whatsappHint"], "WhatsApp Hint"),
          str(["contact", "email"], "Email Label"),
          str(["contact", "emailHint"], "Email Hint"),
          str(["contact", "office"], "Office Label"),
          str(["contact", "officeHint"], "Office Hint"),
          str(["contact", "address"], "Address", true),
          str(["contact", "country"], "Country"),
        ],
      },
      {
        title: "Contact Paths",
        fields: [
          pair(["contact", "paths", "0"], "Path 1"),
          pair(["contact", "paths", "1"], "Path 2"),
          pair(["contact", "paths", "2"], "Path 3"),
        ],
      },
      {
        title: "Contact Form",
        fields: [
          str(["contact", "partnerType"], "Form Title"),
          str(["contact", "formBody"], "Form Intro", true),
          str(["contact", "formAudience"], "Form Audience Badge"),
          str(["contact", "name"], "Name Label"),
          str(["contact", "phone"], "Phone Label"),
          str(["contact", "phoneInvalid"], "Phone Validation Message", true),
          str(["contact", "phoneCountrySearch"], "Country Search Placeholder"),
          str(["contact", "phoneNumberHint"], "Phone Number Placeholder"),
          str(["contact", "mail"], "Email Label"),
          str(["contact", "boatsField"], "Boats Count Label"),
          str(["contact", "addressField"], "Location Field Label"),
          str(["contact", "addressHint"], "Location Field Hint"),
          str(["contact", "content"], "Details Label"),
        ],
      },
      {
        title: "SEO",
        fields: [
          str(["seo", "contactTitle"], "SEO Title"),
          str(["seo", "contactDesc"], "Meta Description", true),
        ],
      },
    ],
  },

  blog: {
    sections: [
      {
        title: "Hero",
        fields: [
          str(["blog", "chip"], "Section Label"),
          str(["blog", "title"], "Title"),
          str(["blog", "body"], "Description", true),
        ],
        images: [image("hero", "Hero Image")],
      },
      {
        title: "Listing Page",
        fields: [
          str(["blog", "loading"], "Loading Message"),
          str(["blog", "empty"], "Empty State Message"),
          str(["blog", "read"], "Read Article Label"),
          str(["blog", "minRead"], "Minutes Read Label"),
          str(["blog", "featuredBadge"], "Featured Badge"),
        ],
      },
      {
        title: "Article Page",
        hint: "Article bodies are managed under Admin → Posts.",
        fields: [
          str(["blog", "back"], "Back to Blog Label"),
          str(["blog", "related"], "Related Posts Title"),
          str(["blog", "faqTitle"], "FAQ Section Title"),
          str(["blog", "author"], "Author Label"),
          str(["blog", "published"], "Published Label"),
          str(["blog", "updated"], "Updated Label"),
          str(["blog", "unpublished"], "Unpublished Message"),
          str(["blog", "missing"], "Missing Article Message"),
        ],
      },
      {
        title: "SEO",
        fields: [
          str(["blog", "seoTitle"], "SEO Title"),
          str(["blog", "seoDesc"], "Meta Description", true),
        ],
      },
    ],
  },

  shared: {
    sections: [
      {
        title: "Navigation",
        fields: [
          str(["nav", "home"], "Home"),
          str(["nav", "about"], "About"),
          str(["nav", "features"], "Services"),
          str(["nav", "app"], "App"),
          str(["nav", "blog"], "Blog"),
          str(["nav", "contact"], "Contact"),
        ],
      },
      {
        title: "Footer",
        fields: [
          str(["footer", "viewLicenses"], "View Licenses Button"),
          str(["footer", "licensesTitle"], "Licenses Modal Title"),
          str(["footer", "licensesProtectNote"], "Licenses Protect Note", true),
          str(["footer", "links"], "Links Section Title"),
          str(["footer", "app"], "App Section Title"),
          str(["footer", "available"], "App Availability Text"),
          str(["footer", "copy"], "Copyright Line"),
        ],
      },
      {
        title: "CTA Buttons",
        hint: "Shared button labels used across marketing pages.",
        fields: [
          str(["cta", "download"], "Download / App CTA"),
          str(["cta", "talk"], "Contact Us"),
          str(["cta", "whatsapp"], "WhatsApp"),
          str(["cta", "callUs"], "Call Us"),
          str(["cta", "more"], "Learn More"),
          str(["cta", "readStory"], "Read Our Story"),
          str(["cta", "allFeatures"], "All Services"),
          str(["cta", "contactPartners"], "Contact Partnerships"),
          str(["cta", "readMore"], "Read More"),
          str(["cta", "send"], "Send Request"),
          str(["cta", "sending"], "Sending…"),
          str(["cta", "sent"], "Sent Confirmation"),
          str(["cta", "sendError"], "Send Error Message"),
          str(["cta", "menu"], "Mobile Menu"),
        ],
      },
      {
        title: "App Store Badges",
        hint: "Store URLs are managed under Admin → Settings.",
        fields: [
          str(["stores", "comingChip"], "Coming Soon — Chip"),
          str(["stores", "comingTitle"], "Coming Soon — Title"),
          str(["stores", "comingBody"], "Coming Soon — Body", true),
          str(["stores", "appleKicker"], "Apple — Kicker"),
          str(["stores", "appleName"], "Apple — Store Name"),
          str(["stores", "appleAria"], "Apple — Accessibility Label"),
          str(["stores", "googleKicker"], "Google — Kicker"),
          str(["stores", "googleName"], "Google — Store Name"),
          str(["stores", "googleAria"], "Google — Accessibility Label"),
        ],
      },
      {
        title: "Breadcrumbs",
        fields: [
          str(["crumbs", "home"], "Home"),
          str(["crumbs", "about"], "About"),
          str(["crumbs", "features"], "Services"),
          str(["crumbs", "app"], "App"),
          str(["crumbs", "blog"], "Blog"),
          str(["crumbs", "contact"], "Contact"),
        ],
      },
    ],
  },
};
