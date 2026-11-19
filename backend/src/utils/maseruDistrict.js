const boundary = require('../data/maseru-district-boundary.json');
const ring = boundary.geometry.coordinates[0];
const bounds = ring.reduce((result, [longitude, latitude]) => ({
  minLongitude: Math.min(result.minLongitude, longitude),
  minLatitude: Math.min(result.minLatitude, latitude),
  maxLongitude: Math.max(result.maxLongitude, longitude),
  maxLatitude: Math.max(result.maxLatitude, latitude),
}), {
  minLongitude: Infinity,
  minLatitude: Infinity,
  maxLongitude: -Infinity,
  maxLatitude: -Infinity,
});

function isWithinMaseruDistrict(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      longitude < bounds.minLongitude || longitude > bounds.maxLongitude ||
      latitude < bounds.minLatitude || latitude > bounds.maxLatitude) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const cross = (longitude - xi) * (yj - yi) - (latitude - yi) * (xj - xi);
    const dot = (longitude - xi) * (xj - xi) + (latitude - yi) * (yj - yi);
    const lengthSquared = (xj - xi) ** 2 + (yj - yi) ** 2;

    if (Math.abs(cross) <= 1e-10 && dot >= -1e-10 && dot <= lengthSquared + 1e-10) {
      return true;
    }

    if ((yi > latitude) !== (yj > latitude) &&
        longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

module.exports = { isWithinMaseruDistrict };
