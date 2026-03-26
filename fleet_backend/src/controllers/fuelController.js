import db from '../utils/db.js';
import { calcFuelEstimate } from '../utils/fuelCalculator.js';

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
    const { vehicleId, driverId, tripId } = req.query;
    const filters = {};
    if (vehicleId) filters.vehicleId = vehicleId;
    if (driverId) filters.driverId = driverId;
    if (tripId) filters.tripId = tripId;
    const logs = await db.findAllFuelLogs(filters);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

// Create fuel log
export const createFuelLog = async (req, res, next) => {
  try {
    const quantity = parseFloat(req.body.quantity);
    const cost = parseFloat(req.body.cost);
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }
    if (cost == null || cost < 0) {
      return res.status(400).json({ error: 'Cost cannot be negative' });
    }
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

// Estimate fuel for a route (distance, duration, optional vehicle)
export const getFuelEstimate = async (req, res, next) => {
  try {
    const { distanceKm, durationMin, vehicleId, reservePercent } = req.body || {};
    const priceRes = await (async () => {
      if (cachedFuelPrice && cachedFuelPriceTimestamp && (Date.now() - cachedFuelPriceTimestamp) < FUEL_PRICE_CACHE_TTL) {
        return cachedFuelPrice;
      }
      try {
        const query = encodeURIComponent('Uganda petrol price per litre');
        const response = await httpFetch(`https://www.google.com/search?q=${query}&hl=en`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0 Safari/537.36' }
        });
        const html = await response.text();
        const match = html.match(/([\d,]+(?:\.\d+)?)\s*(UGX|KES|USD|SHS|UGX\/L)/i);
        const price = match ? parseFloat(match[1].replace(/,/g, '')) : 5500;
        cachedFuelPrice = { pricePerLiter: price, currency: 'UGX', fetchedAt: new Date().toISOString() };
        cachedFuelPriceTimestamp = Date.now();
        return cachedFuelPrice;
      } catch {
        cachedFuelPrice = { pricePerLiter: 5500, currency: 'UGX' };
        cachedFuelPriceTimestamp = Date.now();
        return cachedFuelPrice;
      }
    })();

    let vehicle = null;
    if (vehicleId) {
      vehicle = await db.findVehicleById(vehicleId);
    }

    const estimate = calcFuelEstimate({
      distanceKm: Number(distanceKm) || 0,
      durationMin: Number(durationMin) || 0,
      vehicle,
      pricePerLiter: priceRes?.pricePerLiter || 5500,
      reservePercent: Number(reservePercent) || 10
    });

    res.json(estimate);
  } catch (error) {
    next(error);
  }
};
