import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startWorkflowScheduler } from "./services/workflowEngine.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Lunyon API running on http://localhost:${env.PORT}`);
  startWorkflowScheduler();
});
