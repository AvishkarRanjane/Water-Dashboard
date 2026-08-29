/**
 * AquaWatch Core - Priority Ranking Engine
 * 
 * Computes an objective multi-factor priority score (0 - 100) for incoming water leak events
 * to prioritize emergency dispatch and resource allocation.
 * 
 * MATHEMATICAL FORMULA & WEIGHT DISTRIBUTION:
 * -------------------------------------------------------------------------------------
 * Priority Score = (W_sev * S_sev) + (W_pop * S_pop) + (W_loss * S_loss) + B_citizen
 * 
 * Where:
 * 1. Severity Score S_sev (Weight W_sev = 0.40):
 *    - Critical (Sudden Burst / High Pressure Drop) = 100 pts
 *    - High (Night Surge / Sustained High Z-score)   = 75 pts
 *    - Medium (Moderate Creep / Slow Leak)          = 50 pts
 *    - Low (Minor baseline variation)               = 25 pts
 * 
 * 2. Population Factor S_pop (Weight W_pop = 0.35):
 *    Normalized based on district population density:
 *    S_pop = min(100, (Zone_Population / 50,000) * 100)
 *    Reflects the human and economic impact of water supply interruption in dense areas.
 * 
 * 3. Water Loss Rate Factor S_loss (Weight W_loss = 0.25):
 *    Normalized based on volumetric loss rate:
 *    S_loss = min(100, (Loss_Rate_m3_per_hr / 80.0) * 100)
 *    Directly targets environmental conservation and Non-Revenue Water (NRW) financial loss.
 * 
 * 4. Citizen Cross-Verification Bonus B_citizen (+10 Bonus Points):
 *    When physical citizen reports (visual surface pooling/geysers) correlate geographically
 *    with an acoustic or flow sensor anomaly in the same zone, confidence is 99%+.
 *    Adds up to 10 bonus points (capped at total 100).
 */

import { AnomalyEvent, AnomalySeverity, Zone } from '../../src/types';
import priorityConstants from '../../data/priority_ranking_constants.json';

const C = priorityConstants;

export interface PriorityEvaluation {
  priorityScore: number;
  priorityBand: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  breakdown: {
    severity_weight: number;
    population_weight: number;
    loss_rate_weight: number;
    citizen_bonus: number;
  };
  recommendedResponseTimeHours: number;
}

export class PriorityRankingEngine {
  // Configurable weights (sum = 1.00)
  // ORIGINAL HARDCODED: 0.40, 0.35, 0.25, 10.0
  public static readonly WEIGHT_SEVERITY = C.weight_severity;
  public static readonly WEIGHT_POPULATION = C.weight_population;
  public static readonly WEIGHT_LOSS_RATE = C.weight_loss_rate;
  public static readonly BONUS_CITIZEN_CONFIRMED = C.bonus_citizen_confirmed;

  public static calculatePriority(
    anomaly: AnomalyEvent,
    zone: Zone,
    hasCitizenReport: boolean = false
  ): PriorityEvaluation {
    // 1. Calculate Severity component (0-100)
    // ORIGINAL HARDCODED: critical=100, high=75, medium=50, low=25
    const severityScores = C.severity_scores as Record<string, number>;
    let s_sev = severityScores[anomaly.severity] ?? severityScores['low'] ?? 25;

    // 2. Calculate Population Affected component (0-100)
    // Scale against benchmark metropolitan DMA
    const pop = zone.population || 15000;
    // ORIGINAL HARDCODED: const s_pop = Math.min(100, (pop / 45000) * 100);
    const s_pop = Math.min(100, (pop / C.population_benchmark) * 100);

    // 3. Calculate Water Loss Rate component (0-100)
    // Scale against severe leak benchmark
    const lossRate = anomaly.estimated_loss_rate_m3_h || 10;
    // ORIGINAL HARDCODED: const s_loss = Math.min(100, (lossRate / 60.0) * 100);
    const s_loss = Math.min(100, (lossRate / C.loss_rate_benchmark_m3_h) * 100);

    // 4. Citizen verification bonus
    const b_citizen = hasCitizenReport ? this.BONUS_CITIZEN_CONFIRMED : 0;

    // 5. Weighted aggregation
    const sevPart = this.WEIGHT_SEVERITY * s_sev;
    const popPart = this.WEIGHT_POPULATION * s_pop;
    const lossPart = this.WEIGHT_LOSS_RATE * s_loss;

    let rawScore = sevPart + popPart + lossPart + b_citizen;
    const priorityScore = Number(Math.min(100, Math.max(1, rawScore)).toFixed(1));

    // Determine priority band & SLA
    // ORIGINAL HARDCODED: >= 80 -> CRITICAL/2h, >= 65 -> HIGH/6h, >= 45 -> MEDIUM/24h, else LOW/72h
    let priorityBand: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let recommendedResponseTimeHours = 48;

    for (const band of C.priority_bands) {
      if (priorityScore >= band.min_score) {
        priorityBand = band.band as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        recommendedResponseTimeHours = band.sla_hours;
        break;
      }
    }

    return {
      priorityScore,
      priorityBand,
      breakdown: {
        severity_weight: Number(sevPart.toFixed(1)),
        population_weight: Number(popPart.toFixed(1)),
        loss_rate_weight: Number(lossPart.toFixed(1)),
        citizen_bonus: b_citizen
      },
      recommendedResponseTimeHours
    };
  }
}
