/**
 * The two-line strip at the foot of the profile card, styled after the
 * machine-readable zone on a passport data page. It is decoration derived from
 * real profile data, so it is hidden from assistive technology.
 */

const LINE_LENGTH = 44;
const FILLER = "<";

function toLatinLetters(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function pad(value: string): string {
  return value.slice(0, LINE_LENGTH).padEnd(LINE_LENGTH, FILLER);
}

function yymmdd(isoDate: string | null): string {
  if (!isoDate) return FILLER.repeat(6);
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return FILLER.repeat(6);
  const yy = String(date.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function toMachineReadableLines(input: {
  displayName: string;
  userId: string;
  memberSince: string | null;
}): [string, string] {
  // Names written only in non-Latin scripts have nothing to transliterate here.
  const name = toLatinLetters(input.displayName).split(" ").filter(Boolean).join(FILLER) || "TRAVELLER";
  const reference = input.userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 9).padEnd(9, FILLER);
  return [
    pad(`P${FILLER}NAV${name}`),
    pad(`${reference}${FILLER}NAV${yymmdd(input.memberSince)}`),
  ];
}
