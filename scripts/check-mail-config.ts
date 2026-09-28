import assert from "node:assert/strict";

// lib/mail.ts reads its configuration when an email goes out, not on import.
// No email is sent: Resend's fetch is replaced by one that records the call.
delete process.env.RESEND_API_KEY;
delete process.env.NEXT_PUBLIC_BASE_URL;

type SentEmail = { to: string | string[]; subject: string; html: string };
const sent: SentEmail[] = [];
globalThis.fetch = (async (_url: unknown, init?: { body?: unknown }) => {
  sent.push(JSON.parse(String(init?.body)) as SentEmail);
  return new Response(JSON.stringify({ id: "email_test" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

const main = async () => {
  // Importing without configuration no longer throws.
  const mail = await import("../lib/mail");

  await assert.rejects(mail.sendTwoFactorEmail("a@test.uy", "123456"), /Falta RESEND_API_KEY/);
  await assert.rejects(mail.sendPasswordResetEmail("a@test.uy", "tok"), /Falta NEXT_PUBLIC_BASE_URL/);
  process.env.NEXT_PUBLIC_BASE_URL = "https://bambu.test/";
  await assert.rejects(mail.sendVerificationEmail("a@test.uy", "tok"), /Falta RESEND_API_KEY/);
  assert.equal(sent.length, 0);

  process.env.RESEND_API_KEY = "re_test_key";
  await mail.sendPasswordResetEmail("a@test.uy", "reset_tok");
  await mail.sendVerificationEmail("b@test.uy", "verify_tok");
  await mail.sendTwoFactorEmail("c@test.uy", "654321");
  assert.equal(sent.length, 3);
  assert.match(sent[0].html, /href="https:\/\/bambu\.test\/auth\/new-password\?token=reset_tok"/);
  assert.match(sent[1].html, /href="https:\/\/bambu\.test\/auth\/new-verification\?token=verify_tok"/);
  assert.match(sent[2].html, />654321</);
  assert.deepEqual(sent.map(({ to }) => to), ["a@test.uy", "b@test.uy", "c@test.uy"]);

  console.log("Mail config checks passed");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
