const AppError = require('../utils/AppError');
const { isWithinMaseruDistrict } = require('../utils/maseruDistrict');

const PHOTON_API = 'https://photon.komoot.io/api/';
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const COMMON_LOCATION_WORDS = new Set([
  'address', 'africa', 'city', 'district', 'lesotho', 'maseru', 'place', 'road',
  'south', 'street', 'town', 'the', 'village',
]);

function formatPlace(feature) {
  const properties = feature.properties || {};
  const [longitude, latitude] = feature.geometry.coordinates;
  const street = [properties.housenumber, properties.street].filter(Boolean).join(' ');
  const locality = properties.suburb || properties.district || properties.city ||
    properties.town || properties.village || properties.county;
  const label = [...new Set([street, properties.name, locality, 'Maseru District', 'Lesotho'].filter(Boolean))]
    .join(', ');

  return { label, latitude, longitude };
}

function distanceInMeters(latitude1, longitude1, latitude2, longitude2) {
  const radians = degrees => (degrees * Math.PI) / 180;
  const latitudeDifference = radians(latitude2 - latitude1);
  const longitudeDifference = radians(longitude2 - longitude1);
  const arc = Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(latitude1)) * Math.cos(radians(latitude2)) *
    Math.sin(longitudeDifference / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

function queryMatchesPlace(query, label) {
  const queryWords = query.toLowerCase().match(/[a-z0-9]+/g) || [];
  const labelWords = new Set(label.toLowerCase().match(/[a-z0-9]+/g) || []);
  const specificWords = queryWords.filter(word =>
    word.length > 2 && !/^\d+$/.test(word) && !COMMON_LOCATION_WORDS.has(word));

  if (specificWords.length) return specificWords.every(word => labelWords.has(word));
  return /\b(maseru|lesotho)\b/i.test(query);
}

async function getSuggestions(query) {
  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.places;

  const url = new URL(PHOTON_API);
  url.search = new URLSearchParams({
    q: query,
    lat: '-29.31',
    lon: '27.48',
    zoom: '10',
    location_bias_scale: '0.1',
    limit: '20',
    lang: 'en',
    countrycode: 'LS',
    bbox: '27.2946647,-29.9636369,28.3147438,-29.2820101',
  }).toString();

  let response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': 'BatloungFarmDistribution/1.0' },
      signal: AbortSignal.timeout(6000),
    });
  } catch (error) {
    throw new AppError(502, 'Place suggestions are temporarily unavailable. Try again or enter the address and coordinates manually.');
  }

  if (!response.ok) {
    throw new AppError(502, 'Place suggestions are temporarily unavailable. Try again or enter the address and coordinates manually.');
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new AppError(502, 'The place suggestion service returned an invalid response.');
  }

  const places = (Array.isArray(result.features) ? result.features : [])
    .filter(feature => {
      const coordinates = feature.geometry && feature.geometry.coordinates;
      return Array.isArray(coordinates) && coordinates.length >= 2 &&
        isWithinMaseruDistrict(Number(coordinates[1]), Number(coordinates[0]));
    })
    .map(formatPlace)
    .slice(0, 8);

  if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(cacheKey, { places, expiresAt: Date.now() + CACHE_DURATION });
  return places;
}

async function matchesCoordinates(query, latitude, longitude) {
  const places = await getSuggestions(query);
  return places.some(place => queryMatchesPlace(query, place.label) &&
    distanceInMeters(latitude, longitude, place.latitude, place.longitude) <= 5000);
}

module.exports = { getSuggestions, matchesCoordinates, queryMatchesPlace };
