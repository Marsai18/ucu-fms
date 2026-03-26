/**
 * Fuel estimation algorithm for trip planning
 * Uses distance, duration, vehicle type, and fuel price to estimate litres and cost
 */

// km per litre by vehicle type (typical Uganda fleet - diesel/petrol)
const KM_PER_LITRE_BY_TYPE = {
  Bus: 5.5,
  Van: 7.5,
  Sedan: 11,
  SUV: 8.5,
  Pickup: 8,
  Minibus: 6,
  default: 8
};

/**
 * Get fuel efficiency (km/L) for a vehicle
 * @param {Object} vehicle - { vehicleType, fuelType, make, model }
 * @returns {number} km per litre
 */
function getKmPerLitre(vehicle) {
  if (!vehicle) return KM_PER_LITRE_BY_TYPE.default;
  const type = (vehicle.vehicleType || vehicle.type || '').toLowerCase();
  if (type.includes('bus')) return KM_PER_LITRE_BY_TYPE.Bus;
  if (type.includes('van') || type.includes('hiace') || type.includes('coaster')) return KM_PER_LITRE_BY_TYPE.Van;
  if (type.includes('sedan') || type.includes('saloon')) return KM_PER_LITRE_BY_TYPE.Sedan;
  if (type.includes('suv')) return KM_PER_LITRE_BY_TYPE.SUV;
  if (type.includes('pickup') || type.includes('pick-up')) return KM_PER_LITRE_BY_TYPE.Pickup;
  if (type.includes('minibus')) return KM_PER_LITRE_BY_TYPE.Minibus;
  return KM_PER_LITRE_BY_TYPE[vehicle.vehicleType] || KM_PER_LITRE_BY_TYPE.default;
}

/**
 * Traffic factor: longer duration per km suggests congestion/idling
 * minPerKm > 3 (very slow) => +15% fuel
 * minPerKm > 2 (slow) => +8% fuel
 * minPerKm > 1.5 => +4% fuel
 */
function getTrafficFactor(distanceKm, durationMin) {
  if (!distanceKm || distanceKm <= 0) return 1;
  const minPerKm = durationMin / distanceKm;
  if (minPerKm >= 3) return 1.15;
  if (minPerKm >= 2) return 1.08;
  if (minPerKm >= 1.5) return 1.04;
  return 1;
}

/**
 * Calculate fuel estimate for a route
 * @param {Object} params
 * @param {number} params.distanceKm - Route distance in km
 * @param {number} [params.durationMin] - Route duration in minutes (for traffic factor)
 * @param {Object} [params.vehicle] - Vehicle object for consumption
 * @param {number} [params.pricePerLiter] - Fuel price per litre (UGX)
 * @param {number} [params.reservePercent] - Safety reserve % (default 10)
 * @returns {{ litres: number, cost: number, baseLitres: number, totalLitres: number, pricePerLiter: number, trafficFactor: number }}
 */
export function calcFuelEstimate({ distanceKm, durationMin = 0, vehicle = null, pricePerLiter = 5500, reservePercent = 10 }) {
  const dist = Number(distanceKm) || 0;
  const duration = Number(durationMin) || 0;
  const price = Number(pricePerLiter) || 5500;
  const reserve = Math.max(0, Math.min(30, Number(reservePercent) || 10)) / 100;

  if (dist <= 0) {
    return { litres: 0, cost: 0, baseLitres: 0, totalLitres: 0, pricePerLiter: price, trafficFactor: 1 };
  }

  const kmPerL = getKmPerLitre(vehicle);
  const trafficFactor = getTrafficFactor(dist, duration);
  const baseLitres = (dist / kmPerL) * trafficFactor;
  const totalLitres = baseLitres * (1 + reserve);
  const cost = Math.round(totalLitres * price);

  return {
    litres: Math.round(totalLitres * 100) / 100,
    cost,
    baseLitres: Math.round(baseLitres * 100) / 100,
    totalLitres: Math.round(totalLitres * 100) / 100,
    pricePerLiter: price,
    trafficFactor
  };
}
