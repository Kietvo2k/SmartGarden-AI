import type {
  ExplainableFactor,
  ForecastBundle,
  IrrigationRecommendation,
  IrrigationSession,
  PlantProfile,
  RecommendationAction,
  SensorSnapshot
} from '../domain/models.js';

export interface IrrigationDecisionInput {
  plant: PlantProfile;
  latestSnapshot: SensorSnapshot | null;
  forecast: ForecastBundle | null;
  recentSessions: IrrigationSession[];
  now: Date;
}

function minutesBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

function sumForecastRain(bundle: ForecastBundle | null, now: Date, hours: number) {
  if (!bundle) return 0;
  const upperBound = now.getTime() + hours * 60 * 60 * 1000;

  return bundle.points
    .filter(point => {
      const timestamp = Date.parse(point.timestamp);
      return timestamp >= now.getTime() && timestamp <= upperBound;
    })
    .reduce((sum, point) => sum + point.rainMm, 0);
}

function buildFactor(
  code: ExplainableFactor['code'],
  severity: ExplainableFactor['severity'],
  message: string
): ExplainableFactor {
  return { code, severity, message };
}

function computeDeficitLiters(plant: PlantProfile, currentMoisturePct: number) {
  const missingPct = Math.max(0, plant.moistureTargetPct - currentMoisturePct);
  return (missingPct / 100) * plant.rootZoneVolumeLiters;
}

function hasRecentIrrigation(recentSessions: IrrigationSession[], now: Date) {
  return recentSessions.some(session => {
    if (session.status === 'failed' || session.status === 'cancelled') return false;
    return minutesBetween(now, new Date(session.startedAt)) <= 30;
  });
}

export class IrrigationDecisionEngine {
  evaluate(input: IrrigationDecisionInput): IrrigationRecommendation {
    const { plant, latestSnapshot, forecast, recentSessions, now } = input;
    const factors: ExplainableFactor[] = [];
    const rainNext6hMm = sumForecastRain(forecast, now, 6);
    const rainNext24hMm = sumForecastRain(forecast, now, 24);

    if (!latestSnapshot) {
      factors.push(buildFactor('MISSING_SOIL_SENSOR', 'critical', 'Không có snapshot cảm biến mới nhất cho cây này.'));
      return this.manualReviewRecommendation({
        plant,
        now,
        factors,
        rainNext6hMm,
        rainNext24hMm,
        currentMoisturePct: null,
        sensorAgeMinutes: null,
        rationale: 'Thiếu dữ liệu cảm biến nên hệ thống không được phép tự tưới.'
      });
    }

    const currentMoisturePct = latestSnapshot.soilMoisturePct;
    const sensorAgeMinutes = minutesBetween(now, new Date(latestSnapshot.capturedAt));

    if (currentMoisturePct === null) {
      factors.push(buildFactor('MISSING_SOIL_SENSOR', 'critical', 'Snapshot hiện tại không có giá trị độ ẩm đất.'));
      return this.manualReviewRecommendation({
        plant,
        now,
        factors,
        rainNext6hMm,
        rainNext24hMm,
        currentMoisturePct,
        sensorAgeMinutes,
        rationale: 'Thiếu độ ẩm đất nên cần kiểm tra cảm biến trước khi ra lệnh tưới.'
      });
    }

    if (latestSnapshot.deviceHealth !== 'online') {
      factors.push(buildFactor('DEVICE_OFFLINE', 'critical', `Thiết bị đang ở trạng thái ${latestSnapshot.deviceHealth}.`));
      return this.manualReviewRecommendation({
        plant,
        now,
        factors,
        rainNext6hMm,
        rainNext24hMm,
        currentMoisturePct,
        sensorAgeMinutes,
        rationale: 'Thiết bị không online nên không cho phép quyết định tự động.'
      });
    }

    if (sensorAgeMinutes > plant.minSensorFreshnessMinutes) {
      factors.push(buildFactor('STALE_SENSOR_DATA', 'critical', `Dữ liệu độ ẩm đã cũ ${sensorAgeMinutes} phút, vượt ngưỡng ${plant.minSensorFreshnessMinutes} phút.`));
      return this.manualReviewRecommendation({
        plant,
        now,
        factors,
        rainNext6hMm,
        rainNext24hMm,
        currentMoisturePct,
        sensorAgeMinutes,
        rationale: 'Dữ liệu cảm biến đã stale nên cần lấy mẫu mới trước khi tưới.'
      });
    }

    if (!forecast) {
      factors.push(buildFactor('FORECAST_UNAVAILABLE', 'warning', 'Không có forecast mới, hệ thống sẽ fallback về rule độ ẩm tại chỗ.'));
    }

    if (hasRecentIrrigation(recentSessions, now)) {
      factors.push(buildFactor('RECENT_IRRIGATION_ACTIVE', 'warning', 'Có phiên tưới gần đây, tạm hoãn quyết định mới để tránh rung lắc trạng thái.'));
      return this.buildRecommendation({
        plant,
        now,
        action: 'MONITOR_ONLY',
        confidence: 'medium',
        rationale: 'Vừa có phiên tưới gần đây, hệ thống chờ phản hồi đất trước khi ra lệnh mới.',
        factors,
        currentMoisturePct,
        estimatedDeficitLiters: 0,
        recommendedLiters: 0,
        rainNext6hMm,
        rainNext24hMm,
        sensorAgeMinutes,
        nextReviewInMinutes: 20,
        requiresHumanReview: false
      });
    }

    if (currentMoisturePct >= plant.moistureUpperBoundPct) {
      factors.push(buildFactor('MOISTURE_ABOVE_UPPER_BOUND', 'critical', `Độ ẩm ${currentMoisturePct.toFixed(1)}% đang cao hơn ngưỡng trên ${plant.moistureUpperBoundPct}%.`));
      return this.buildRecommendation({
        plant,
        now,
        action: 'BLOCK_IRRIGATION',
        confidence: 'high',
        rationale: 'Đất đang đủ ẩm hoặc quá ẩm, phải khóa tưới để tránh úng.',
        factors,
        currentMoisturePct,
        estimatedDeficitLiters: 0,
        recommendedLiters: 0,
        rainNext6hMm,
        rainNext24hMm,
        sensorAgeMinutes,
        nextReviewInMinutes: 45,
        requiresHumanReview: false
      });
    }

    if (rainNext6hMm >= plant.rainDelayThresholdMm) {
      factors.push(buildFactor('RAIN_EXPECTED', 'warning', `Dự báo có ${rainNext6hMm.toFixed(1)}mm mưa trong 6 giờ tới, vượt ngưỡng trì hoãn ${plant.rainDelayThresholdMm}mm.`));
      return this.buildRecommendation({
        plant,
        now,
        action: 'WAIT_FOR_RAIN',
        confidence: forecast ? 'high' : 'low',
        rationale: 'Mưa sắp tới đủ lớn để trì hoãn tưới, tránh lãng phí nước.',
        factors,
        currentMoisturePct,
        estimatedDeficitLiters: 0,
        recommendedLiters: 0,
        rainNext6hMm,
        rainNext24hMm,
        sensorAgeMinutes,
        nextReviewInMinutes: 120,
        requiresHumanReview: false
      });
    }

    if (currentMoisturePct > plant.moistureLowerBoundPct && currentMoisturePct < plant.moistureUpperBoundPct) {
      factors.push(buildFactor('WITHIN_HYSTERESIS_BAND', 'info', `Độ ẩm ${currentMoisturePct.toFixed(1)}% đang nằm trong vùng hysteresis an toàn.`));
      return this.buildRecommendation({
        plant,
        now,
        action: 'MONITOR_ONLY',
        confidence: 'high',
        rationale: 'Độ ẩm đang nằm trong dải ổn định, chưa nên bật tưới để tránh bật/tắt liên tục.',
        factors,
        currentMoisturePct,
        estimatedDeficitLiters: 0,
        recommendedLiters: 0,
        rainNext6hMm,
        rainNext24hMm,
        sensorAgeMinutes,
        nextReviewInMinutes: 45,
        requiresHumanReview: false
      });
    }

    factors.push(buildFactor('MOISTURE_BELOW_LOWER_BOUND', 'critical', `Độ ẩm ${currentMoisturePct.toFixed(1)}% đã thấp hơn ngưỡng dưới ${plant.moistureLowerBoundPct}%.`));

    const estimatedDeficitLiters = computeDeficitLiters(plant, currentMoisturePct);
    let recommendedLiters = Math.min(estimatedDeficitLiters, plant.maxSingleIrrigationLiters);

    if (recommendedLiters < estimatedDeficitLiters) {
      factors.push(buildFactor('SAFE_VOLUME_CAPPED', 'warning', `Lượng tưới được cap ở ${plant.maxSingleIrrigationLiters.toFixed(2)}L để giữ an toàn root zone.`));
    }

    return this.buildRecommendation({
      plant,
      now,
      action: 'IRRIGATE_NOW',
      confidence: forecast ? 'high' : 'medium',
      rationale: 'Độ ẩm đã xuống dưới ngưỡng cho phép và không có tín hiệu mưa đủ lớn để trì hoãn.',
      factors,
      currentMoisturePct,
      estimatedDeficitLiters,
      recommendedLiters,
      rainNext6hMm,
      rainNext24hMm,
      sensorAgeMinutes,
      nextReviewInMinutes: 20,
      requiresHumanReview: false
    });
  }

  private manualReviewRecommendation(input: {
    plant: PlantProfile;
    now: Date;
    factors: ExplainableFactor[];
    currentMoisturePct: number | null;
    sensorAgeMinutes: number | null;
    rainNext6hMm: number;
    rainNext24hMm: number;
    rationale: string;
  }) {
    return this.buildRecommendation({
      plant: input.plant,
      now: input.now,
      action: 'MANUAL_REVIEW',
      confidence: 'low',
      rationale: input.rationale,
      factors: input.factors,
      currentMoisturePct: input.currentMoisturePct,
      estimatedDeficitLiters: 0,
      recommendedLiters: 0,
      rainNext6hMm: input.rainNext6hMm,
      rainNext24hMm: input.rainNext24hMm,
      sensorAgeMinutes: input.sensorAgeMinutes,
      nextReviewInMinutes: 10,
      requiresHumanReview: true
    });
  }

  private buildRecommendation(input: {
    plant: PlantProfile;
    now: Date;
    action: RecommendationAction;
    confidence: IrrigationRecommendation['confidence'];
    rationale: string;
    factors: ExplainableFactor[];
    currentMoisturePct: number | null;
    estimatedDeficitLiters: number;
    recommendedLiters: number;
    rainNext6hMm: number;
    rainNext24hMm: number;
    sensorAgeMinutes: number | null;
    nextReviewInMinutes: number;
    requiresHumanReview: boolean;
  }): IrrigationRecommendation {
    const nextReviewAt = new Date(input.now.getTime() + input.nextReviewInMinutes * 60000).toISOString();

    return {
      plantId: input.plant.id,
      generatedAt: input.now.toISOString(),
      action: input.action,
      confidence: input.confidence,
      recommendedLiters: Number(input.recommendedLiters.toFixed(2)),
      rationale: input.rationale,
      factors: input.factors,
      computation: {
        currentMoisturePct: input.currentMoisturePct,
        targetMoisturePct: input.plant.moistureTargetPct,
        estimatedDeficitLiters: Number(input.estimatedDeficitLiters.toFixed(2)),
        recommendedLiters: Number(input.recommendedLiters.toFixed(2)),
        forecastRainNext6hMm: Number(input.rainNext6hMm.toFixed(2)),
        forecastRainNext24hMm: Number(input.rainNext24hMm.toFixed(2)),
        sensorAgeMinutes: input.sensorAgeMinutes
      },
      nextReviewAt,
      requiresHumanReview: input.requiresHumanReview
    };
  }
}
