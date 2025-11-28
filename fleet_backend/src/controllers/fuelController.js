import db from '../utils/db.js';

let cachedFuelPrice = null;
let cachedFuelPriceTimestamp = null;
const FUEL_PRICE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const httpFetch = async (...args) => {
  if (typeof fetch !== 'undefined') {
    return fetch(...args);
  }
  const { default: nodeFetch } = await import('node-fetch');
  return nodeFetch(...args);
};

// Get all fuel logs
export const getFuelLogs = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const logs = await db.findAllFuelLogs({ vehicleId });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

// Create fuel log
export const createFuelLog = async (req, res, next) => {
  try {
    const log = await db.createFuelLog(req.body);
    await db.createActivityLog({
      type: 'Fuel Logged',
      vehicleId: req.body.vehicleId,
      description: `Fuel log: ${req.body.quantity}L at ${req.body.cost} UGX`
    });
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
};

// Get fuel statistics
export const getFuelStatistics = async (req, res, next) => {
  try {
    const logs = await db.findAllFuelLogs();
    const totalFuel = logs.reduce((sum, log) => sum + (parseFloat(log.quantity) || 0), 0);
    const totalCost = logs.reduce((sum, log) => sum + (parseFloat(log.cost) || 0), 0);

    res.json({
      totals: {
        total_consumption: totalFuel,
        total_cost: totalCost,
        avg_price_per_liter: logs.length > 0 && totalFuel > 0 ? totalCost / totalFuel : 0
      },
      monthly: [],
      vehicleStats: []
    });
  } catch (error) {
    next(error);
  }
};

// Fetch live fuel price snapshot from Google search results
export const getLiveFuelPrice = async (req, res, next) => {
  try {
    const location = req.query.location || 'Uganda';

    if (cachedFuelPrice && cachedFuelPriceTimestamp && (Date.now() - cachedFuelPriceTimestamp) < FUEL_PRICE_CACHE_TTL) {
      return res.json({ ...cachedFuelPrice, cached: true });
    }

    const query = encodeURIComponent(`${location} petrol price per litre`);
    const response = await httpFetch(`https://www.google.com/search?q=${query}&hl=en`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36'
      }
    });

    const html = await response.text();
    const match = html.match(/([\d,]+(?:\.\d+)?)\s*(UGX|KES|USD|SHS|UGX\/L)/i);
    const price = match ? parseFloat(match[1].replace(/,/g, '')) : 5500;
    const currency = match ? match[2].replace('/L', '').replace('SHS', 'UGX') : 'UGX';

    cachedFuelPrice = {
      pricePerLiter: price,
      currency,
      source: 'google',
      fetchedAt: new Date().toISOString(),
      location
    };
    cachedFuelPriceTimestamp = Date.now();

    res.json(cachedFuelPrice);
  } catch (error) {
    cachedFuelPrice = {
      pricePerLiter: 5500,
      currency: 'UGX',
      source: 'fallback',
      fetchedAt: new Date().toISOString()
    };
    cachedFuelPriceTimestamp = Date.now();
    res.json(cachedFuelPrice);
  }
};
