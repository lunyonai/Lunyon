// Preloaded by `npm test` before dotenv runs: tests get placeholder values instead of the real
// backend/.env, so they never reach a real Supabase project. Variables set in the shell still win.
const defaults: Record<string, string> = {
  NODE_ENV: "test",
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  INTEGRATION_ENCRYPTION_KEY: "0".repeat(64),
  WORKFLOW_SCHEDULER_ENABLED: "false",
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}
