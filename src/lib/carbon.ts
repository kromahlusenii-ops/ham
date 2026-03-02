import { MODEL_POWER } from "./model-pricing";

/** US average grid carbon intensity (kgCO2/kWh) */
export const DEFAULT_CARBON_INTENSITY = 0.385;

/** Power Usage Effectiveness — datacenter overhead */
export const PUE = 1.1;

/**
 * Estimate energy consumed by an inference session.
 * Returns watt-hours.
 */
export function calculateEnergy(durationMs: number, model: string): number {
  const power = MODEL_POWER[model] ?? MODEL_POWER["claude-sonnet-4-6"];
  const totalWatts = power.gpu_power_w * power.gpu_count;
  const hours = durationMs / 3_600_000;
  return totalWatts * hours * PUE;
}

/**
 * Estimate CO2e emissions from energy consumption.
 * Returns grams CO2e.
 */
export function calculateEmissions(
  energyWh: number,
  carbonIntensity: number = DEFAULT_CARBON_INTENSITY,
): number {
  const energyKwh = energyWh / 1000;
  return energyKwh * carbonIntensity * 1000; // convert kg back to grams
}

/**
 * Approximate number of smartphone charges equivalent to given CO2e grams.
 * ~8.22g CO2e per smartphone charge (EPA estimate).
 */
export function equivalentSmartphoneCharges(co2eGrams: number): number {
  return Math.round(co2eGrams / 8.22);
}
