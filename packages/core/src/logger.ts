import pino from "pino";

/**
 * Plain JSON-to-stdout, no transport/pretty-printing -- pm2 (production's
 * process manager, see CLAUDE.md "Pekerjaan pasca-roadmap #5") already
 * captures stdout to its own log files with pm2-logrotate handling
 * rotation, so this doesn't need to manage files itself. JSON output means
 * whatever log shipper an operator eventually points at these files (Loki,
 * Datadog, anything) gets structured fields for free without a second
 * migration later -- picking a *shipper* is still an operator preference
 * left for later, but the log FORMAT itself doesn't need to wait on that
 * choice.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info"
});
