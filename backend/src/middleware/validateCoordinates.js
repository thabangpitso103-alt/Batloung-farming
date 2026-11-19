const AppError = require('../utils/AppError');
const { isWithinMaseruDistrict } = require('../utils/maseruDistrict');
const locationService = require('../services/locationService');

module.exports = async (req, res, next) => {
  const includesLatitude = Object.prototype.hasOwnProperty.call(req.body, 'latitude');
  const includesLongitude = Object.prototype.hasOwnProperty.call(req.body, 'longitude');
  const hasLatitude = req.body.latitude !== undefined && req.body.latitude !== null && req.body.latitude !== '';
  const hasLongitude = req.body.longitude !== undefined && req.body.longitude !== null && req.body.longitude !== '';

  if (includesLatitude !== includesLongitude || hasLatitude !== hasLongitude) {
    return next(new AppError(400, 'latitude and longitude must be provided together'));
  }
  if (hasLatitude && !isWithinMaseruDistrict(req.body.latitude, req.body.longitude)) {
    throw new AppError(400, 'Location coordinates must be inside Maseru District, Lesotho');
  }
  if (hasLatitude) {
    const address = req.body.address || req.body.location;
    if (typeof address !== 'string' || address.trim().length < 3) {
      throw new AppError(400, 'Provide a place address in Maseru District with the map pin.');
    }
    const matchesAddress = await locationService.matchesCoordinates(
      address.trim(), req.body.latitude, req.body.longitude);
    if (!matchesAddress) {
      throw new AppError(400, 'The address could not be verified near this pin in Maseru District. Choose a local place suggestion.');
    }
  }
  next();
};
