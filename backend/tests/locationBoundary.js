const test = require('node:test');
const assert = require('node:assert/strict');
const boundary = require('../src/data/maseru-district-boundary.json');
const { isWithinMaseruDistrict } = require('../src/utils/maseruDistrict');
const { queryMatchesPlace } = require('../src/services/locationService');

test('accepts Maseru city coordinates', () => {
  assert.equal(isWithinMaseruDistrict(-29.31, 27.48), true);
});

test('accepts a point on the district boundary', () => {
  const [longitude, latitude] = boundary.geometry.coordinates[0][0];
  assert.equal(isWithinMaseruDistrict(latitude, longitude), true);
});

test('rejects points outside Maseru District', () => {
  assert.equal(isWithinMaseruDistrict(-29.31, 27), false);
  assert.equal(isWithinMaseruDistrict(-29, 27.7), false);
});

test('rejects invalid coordinates', () => {
  assert.equal(isWithinMaseruDistrict(Number.NaN, 27.48), false);
  assert.equal(isWithinMaseruDistrict(-29.31, Infinity), false);
});

test('rejects a foreign address that only shares generic search words', () => {
  assert.equal(queryMatchesPlace(
    'Paarl, South Africa',
    'South Africa Maseru Travel Centre, Maseru District, Lesotho',
  ), false);
});

test('accepts a matching local address', () => {
  assert.equal(queryMatchesPlace(
    'Kofi Annan Road, Thetsane, Maseru District, Lesotho',
    'Kofi Annan Road, Thetsane, Lower Thetsane, Maseru District, Lesotho',
  ), true);
});

test('accepts a broad Maseru search for a nearby local result', () => {
  assert.equal(queryMatchesPlace('Maseru, Lesotho', 'Thetsane, Maseru District, Lesotho'), true);
});
