import geoip from 'geoip-lite';

const countryNames = new Intl.DisplayNames(['es', 'en'], { type: 'region' });

export function lookupCountry(ipAddress) {
  if (!ipAddress) {
    return null;
  }
  try {
    const lookup = geoip.lookup(ipAddress);
    if (!lookup || !lookup.country) {
      return null;
    }
    return lookup.country;
  } catch (error) {
    return null;
  }
}

export function getCountryName(code) {
  if (!code || code === 'ZZ') {
    return 'Desconocido';
  }
  try {
    return countryNames.of(code) || code;
  } catch (error) {
    return code;
  }
}

export function parseReferer(headerValue) {
  if (!headerValue) {
    return null;
  }
  try {
    const url = new URL(headerValue);
    return {
      source: url.origin,
      host: url.host
    };
  } catch (error) {
    return {
      source: headerValue,
      host: headerValue
    };
  }
}
