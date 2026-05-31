// lib/logger.ts — Structured JSON logger for server-side instrumentation.
//
// Writes newline-delimited JSON to stdout (info) / stderr (warn, error) so log
// aggregators (Vercel Log Drains, Datadog, etc.) can parse fields without
// regex scraping.  Never use console.* in server code; import this instead.

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry extends Record<string, unknown> {
  ts:      string;
  level:   LogLevel;
  service: string;
  event:   string;
}

/**
 * Emit a structured JSON log line.
 *
 * @param level   - Severity. warn/error go to stderr; info goes to stdout.
 * @param service - Logical module name, e.g. 'orchestrator' or 'api/orchestrate'.
 * @param event   - Dot-separated event key, e.g. 'route.fallback_triggered'.
 * @param data    - Arbitrary structured fields. NEVER include raw user content (GDPR).
 */
export function slog(
  level:   LogLevel,
  service: string,
  event:   string,
  data:    Record<string, unknown> = {},
): void {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    service,
    event,
    ...data,
  };
  const line = JSON.stringify(entry) + '\n';
  if (level === 'info') {
    process.stdout.write(line);
  } else {
    process.stderr.write(line);
  }
}
