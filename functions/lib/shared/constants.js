export const SUPER_ADMIN_EMAIL = "admin@boatpro.club";
export const HARD_CODED_ADMIN_EMAILS = new Set(["admin@boatpro.club", "info@boatpro.club"]);
export const COLLECTIONS = {
    conversations: "chatbotConversations",
    knowledge: "chatbotKnowledge",
    contactRequests: "contactRequests",
    posts: "posts",
    siteSettings: "siteSettings",
    users: "users",
};
export const CORS_ORIGINS = [
    "https://boatpro.club",
    "https://www.boatpro.club",
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];
