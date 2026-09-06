const FIELD_NEEDS_QUOTING = /[",\r\n]/;

function escapeField(value: string | number | null): string {
  if (value === null) {
    return "";
  }

  const str = String(value);
  if (!FIELD_NEEDS_QUOTING.test(str)) {
    return str;
  }

  return `"${str.replace(/"/g, '""')}"`;
}

// RFC 4180: CRLF line endings, fields containing a comma/quote/newline are
// quoted with internal quotes doubled. No external CSV library -- plain
// string building only.
export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers, ...rows].map((line) => line.map(escapeField).join(","));
  return lines.join("\r\n");
}
