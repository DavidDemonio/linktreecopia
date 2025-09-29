export function isValidUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
      throw new Error('Only HTTPS URLs are permitted (except localhost).');
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function normalizeUrl(value) {
  if (!/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }
  return value;
}
