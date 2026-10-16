#!/usr/bin/env node
/**
 * Smoke-test Firebase Functions locally (emulator or deployed base URL).
 * Usage:
 *   node scripts/test-functions-local.mjs
 *   FUNCTIONS_BASE=http://127.0.0.1:5001/boatpro1-18c6d/us-central1 node scripts/test-functions-local.mjs
 */
const base = (process.env.FUNCTIONS_BASE || process.env.VITE_FUNCTIONS_BASE_URL || "")
  .replace(/\/$/, "");

if (!base.startsWith("http")) {
  console.error("Set FUNCTIONS_BASE or VITE_FUNCTIONS_BASE_URL to the functions prefix URL.");
  process.exit(1);
}

async function post(name, body = {}, token) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${base}/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text };
}

const tests = [];

tests.push(async () => {
  const res = await post("chatbotSendMessage", { message: "ما هي بوت برو؟", lang: "ar" });
  if (res.status !== 200 && res.status !== 502) {
    throw new Error(`chatbotSendMessage expected 200/502(gemini missing), got ${res.status}: ${res.text}`);
  }
  console.log(`chatbotSendMessage -> ${res.status}`);
});

tests.push(async () => {
  const res = await post("chatbotSubmitContact", {
    name: "Test User",
    email: "test@example.com",
    phone: "00966501234567",
    content: "Chatbot contact test",
    lang: "ar",
  });
  if (res.status !== 200) throw new Error(`chatbotSubmitContact failed: ${res.status} ${res.text}`);
  console.log(`chatbotSubmitContact -> ${res.status}`);
});

tests.push(async () => {
  const res = await post("aiTriggerKnowledgeSync");
  if (res.status !== 403) throw new Error(`aiTriggerKnowledgeSync unauth expected 403, got ${res.status}`);
  console.log(`aiTriggerKnowledgeSync (unauth) -> ${res.status}`);
});

tests.push(async () => {
  const res = await post("aiDeleteConversation", { conversationId: "missing" });
  if (res.status !== 403) throw new Error(`aiDeleteConversation unauth expected 403, got ${res.status}`);
  console.log(`aiDeleteConversation (unauth) -> ${res.status}`);
});

tests.push(async () => {
  const res = await post("aiDeleteAllConversations");
  if (res.status !== 403) throw new Error(`aiDeleteAllConversations unauth expected 403, got ${res.status}`);
  console.log(`aiDeleteAllConversations (unauth) -> ${res.status}`);
});

tests.push(async () => {
  const res = await post("adminSetUserPassword", { uid: "x", password: "secret1" });
  if (res.status !== 403) throw new Error(`adminSetUserPassword unauth expected 403, got ${res.status}`);
  console.log(`adminSetUserPassword (unauth) -> ${res.status}`);
});

for (const test of tests) {
  await test();
}

console.log("Function smoke tests completed.");
