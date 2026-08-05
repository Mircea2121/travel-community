import { isIP } from "node:net";

function normalizeIpAddress(value) {
  if (typeof value !== "string") {
    return null;
  }

  let address = value.trim();

  if (!address || address.length > 64) {
    return null;
  }

  if (address.startsWith("[")) {
    const closingBracketIndex = address.indexOf("]");

    if (closingBracketIndex > 0) {
      address = address.slice(1, closingBracketIndex);
    }
  } else if (
    address.includes(".") &&
    address.lastIndexOf(":") > address.lastIndexOf(".")
  ) {
    address = address.slice(
      0,
      address.lastIndexOf(":")
    );
  }

  const zoneIndex = address.indexOf("%");

  if (zoneIndex > 0) {
    address = address.slice(0, zoneIndex);
  }

  if (address.startsWith("::ffff:")) {
    const mappedIpv4 = address.slice(7);

    if (isIP(mappedIpv4) === 4) {
      return mappedIpv4;
    }
  }

  return isIP(address) ? address.toLowerCase() : null;
}

function getFirstForwardedAddress(headerValue) {
  if (typeof headerValue !== "string") {
    return null;
  }

  const firstAddress = headerValue.split(",", 1)[0];

  return normalizeIpAddress(firstAddress);
}

export function getRequestClientIp(request) {
  const headers = request?.headers;

  if (!headers || typeof headers.get !== "function") {
    return "unknown";
  }

  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    getFirstForwardedAddress(
      headers.get("x-forwarded-for")
    ),
  ];

  for (const candidate of candidates) {
    const normalizedAddress =
      normalizeIpAddress(candidate);

    if (normalizedAddress) {
      return normalizedAddress;
    }
  }

  return "unknown";
}
