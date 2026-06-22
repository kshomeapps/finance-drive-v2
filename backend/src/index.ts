import { config } from "./config.js";
import app from "./app.js";

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT} in ${config.nodeEnv} mode`);
  if (!config.isProduction) {
    console.log(`[CORS] Allowing origin: ${config.frontendUrl}`);
  }
});
