const AppError = require('../utils/AppError');
const { isWithinMaseruDistrict } = require('../utils/maseruDistrict');
const locationService = require('../services/locationService');

exports.suggestions = async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 3 || query.length > 120) {
    throw new AppError(400, 'Search for a place using 3 to 120 characters.');
  }

  const data = await locationService.getSuggestions(query);
  res.status(200).json({ success: true, count: data.length, data });
};

exports.validateCoordinates = async (req, res) => {
  const latitudeText = typeof req.query.latitude === 'string' ? req.query.latitude.trim() : '';
  const longitudeText = typeof req.query.longitude === 'string' ? req.query.longitude.trim() : '';
  const address = typeof req.query.address === 'string' ? req.query.address.trim() : '';
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  if (!latitudeText || !longitudeText || !address ||
      !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new AppError(400, 'Provide an address and valid latitude and longitude coordinates.');
  }

  const withinMaseruDistrict = isWithinMaseruDistrict(latitude, longitude);
  const addressMatches = withinMaseruDistrict
    ? await locationService.matchesCoordinates(address, latitude, longitude)
    : false;
  res.status(200).json({
    success: true,
    data: { withinMaseruDistrict, addressMatches },
  });
};
