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
  public static readonly WEIGHT_SEVERITY = 0.40;
  public static readonly WEIGHT_POPULATION = 0.35;
  public static readonly WEIGHT_LOSS_RATE = 0.25;
  public static readonly BONUS_CITIZEN_CONFIRMED = 10.0;

  public static calculatePriority(
    anomaly: AnomalyEvent,
    zone: Zone,
    hasCitizenReport: boolean = false
  ): PriorityEvaluation {
    // 1. Calculate Severity component (0-100)
    let s_sev = 25;
    switch (anomaly.severity) {
      case 'critical':
        s_sev = 100;
        break;
      case 'high':
        s_sev = 75;
        break;
      case 'medium':
        s_sev = 50;
        break;
      case 'low':
      default:
        s_sev = 25;
        break;
    }

    // 2. Calculate Population Affected component (0-100)
    // Scale against benchmark metropolitan DMA of 50,000 residents
    const pop = zone.population || 15000;
    const s_pop = Math.min(100, (pop / 45000) * 100);

    // 3. Calculate Water Loss Rate component (0-100)
    // Scale against severe 60 m3/h leak
    const lossRate = anomaly.estimated_loss_rate_m3_h || 10;
    const s_loss = Math.min(100, (lossRate / 60.0) * 100);

    // 4. Citizen verification bonus
    const b_citizen = hasCitizenReport ? this.BONUS_CITIZEN_CONFIRMED : 0;

    // 5. Weighted aggregation
    const sevPart = this.WEIGHT_SEVERITY * s_sev;
    const popPart = this.WEIGHT_POPULATION * s_pop;
    const lossPart = this.WEIGHT_LOSS_RATE * s_loss;

    let rawScore = sevPart + popPart + lossPart + b_citizen;
    const priorityScore = Number(Math.min(100, Math.max(1, rawScore)).toFixed(1));

    // Determine priority band & SLA
    let priorityBand: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let recommendedResponseTimeHours = 48;

    if (priorityScore >= 80) {
      priorityBand = 'CRITICAL';
      recommendedResponseTimeHours = 2; // Urgent emergency dispatch
    } else if (priorityScore >= 65) {
      priorityBand = 'HIGH';
      recommendedResponseTimeHours = 6;
    } else if (priorityScore >= 45) {
      priorityBand = 'MEDIUM';
      recommendedResponseTimeHours = 24;
    } else {
      priorityBand = 'LOW';
      recommendedResponseTimeHours = 72;
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
