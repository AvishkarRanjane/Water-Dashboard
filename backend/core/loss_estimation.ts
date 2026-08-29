/**
 * AquaWatch Core - Water Loss & Non-Revenue Water (NRW) Estimation Engine
 * 
 * Computes volumetric physical losses (m3) and monetary losses ($) across distribution zones.
 * 
 * METHODOLOGY:
 * 1. Physical Water Loss (m3) = Duration (hours) × Flow Deviation Rate (m3/h) × Pressure Correction Factor
 * 2. Non-Revenue Water (NRW %):
 *    NRW % = ((Total System Input Volume - Billed Authorized Consumption) / Total System Input Volume) * 100
 * 3. Water Value Benchmark:
 *    Standard municipal treated water valuation (~ $1.65 per m³).
 */

import { AnomalyEvent, Zone } from '../../src/types';
import lossConstants from '../../data/loss_estimation_constants.json';

const C = lossConstants;

export interface AreaLossSummary {
  zone_id: string;
  zone_name: string;
  total_loss_24h_m3: number;
  financial_loss_24h_usd: number;
  nrw_rate_pct: number;
  loss_intensity_m3_per_km: number;
  active_leak_count: number;
  status: 'critical' | 'elevated' | 'optimal';
}

export class LossEstimationEngine {
  // Municipal treated water production & pumping cost constant ($ per m3)
  // ORIGINAL HARDCODED: public static readonly WATER_COST_PER_M3_USD = 1.65;
  public static readonly WATER_COST_PER_M3_USD = C.water_cost_per_m3_usd;

  /**
   * Estimates cumulative loss for an active anomaly event over its active duration
   */
  public static estimateAnomalyLoss(
    anomaly: AnomalyEvent,
    durationHours: number,
    zonePressureBar: number = 3.5
  ): { volumeLostM3: number; financialCostUsd: number } {
    // Torricelli orifice hydraulic pressure correction factor: flow through crack varies with sqrt(P)
    // Standard baseline is 3.0 bar
    // ORIGINAL HARDCODED: const pressureFactor = Math.sqrt(Math.max(1.0, zonePressureBar) / 3.0);
    const pressureFactor = Math.sqrt(Math.max(C.min_pressure_floor_bar, zonePressureBar) / C.baseline_pressure_bar);
    const volumeLostM3 = Number((anomaly.estimated_loss_rate_m3_h * durationHours * pressureFactor).toFixed(2));
    const financialCostUsd = Number((volumeLostM3 * this.WATER_COST_PER_M3_USD).toFixed(2));

    return {
      volumeLostM3,
      financialCostUsd
    };
  }

  /**
   * Computes comprehensive zone-level loss and Non-Revenue Water (NRW) metrics
   */
  public static computeZoneLossSummary(
    zone: Zone,
    activeAnomalies: AnomalyEvent[],
    pipeLengthKm: number = C.default_pipe_length_km /* ORIGINAL: 18.5 */
  ): AreaLossSummary {
    const zoneAnomalies = activeAnomalies.filter(a => a.zone_id === zone.zone_id && a.status !== 'resolved');
    
    // Sum hourly loss rate across all open leaks in this zone
    const currentLeakRateM3h = zoneAnomalies.reduce((sum, a) => sum + (a.estimated_loss_rate_m3_h || 0), 0);
    
    // Total daily estimated lost volume = active leak rate * 24h + background baseline unmetered leakage (3%)
    const baselineDailySupply = zone.base_demand_m3_h * 24;
    const activeLeakageDaily = currentLeakRateM3h * 24;
    // ORIGINAL HARDCODED: const backgroundUnavoidableLoss = baselineDailySupply * 0.04;
    const backgroundUnavoidableLoss = baselineDailySupply * C.background_unavoidable_loss_pct; // 4% unavoidable background loss
    
    const totalDailyLossM3 = Number((activeLeakageDaily + backgroundUnavoidableLoss).toFixed(1));
    const financialLoss24h = Number((totalDailyLossM3 * this.WATER_COST_PER_M3_USD).toFixed(2));
    
    // Non-Revenue Water % = (Losses / Total Input) * 100
    const totalInputVolume = baselineDailySupply + activeLeakageDaily;
    const nrwRatePct = Number(((totalDailyLossM3 / totalInputVolume) * 100).toFixed(1));
    
    const lossIntensity = pipeLengthKm > 0 ? Number((totalDailyLossM3 / pipeLengthKm).toFixed(2)) : 0;

    let status: 'critical' | 'elevated' | 'optimal' = 'optimal';
    // ORIGINAL HARDCODED: if (nrwRatePct > 25 ...) ... else if (nrwRatePct > 16 ...)
    if (nrwRatePct > C.nrw_critical_threshold_pct || zoneAnomalies.some(a => a.severity === 'critical')) {
      status = 'critical';
    } else if (nrwRatePct > C.nrw_elevated_threshold_pct || zoneAnomalies.length > 0) {
      status = 'elevated';
    }

    return {
      zone_id: zone.zone_id,
      zone_name: zone.name,
      total_loss_24h_m3: totalDailyLossM3,
      financial_loss_24h_usd: financialLoss24h,
      nrw_rate_pct: nrwRatePct,
      loss_intensity_m3_per_km: lossIntensity,
      active_leak_count: zoneAnomalies.length,
      status
    };
  }
}
