/**
 * Calculate distance between two GCJ-02 coordinates using simplified formula.
 * Returns distance in meters.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Validate GCJ-02 coordinate range.
 * Latitude: 0-55 (China), Longitude: 72-137 (China)
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= 0 && lat <= 55 && lng >= 72 && lng <= 137;
}

/**
 * Generate Redis grid key for PostGIS query caching.
 * Rounds coordinates to 0.01 degree (~1km grid) for cache bucketing.
 */
export function locationToPoint(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

export function gridKey(lat: number, lng: number, rangeKm: number): string {
  const precision = rangeKm < 5 ? 100 : rangeKm < 20 ? 10 : 1;
  const gridLat = Math.round(lat * precision) / precision;
  const gridLng = Math.round(lng * precision) / precision;
  return `grid:${gridLat}:${gridLng}:${rangeKm}`;
}
