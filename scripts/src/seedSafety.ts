import { db } from "@workspace/db";
import {
  contributingFactorsTable,
  hazardsTable,
  recommendedActionsTable,
  sensorReadingsTable,
  sensorsTable,
  timelineEventsTable,
  zonesTable,
} from "@workspace/db";

async function main() {
  console.log("Seeding Industrial Safety Intelligence data...");

  const zones = [
    { id: "zone-a", name: "Zone A — Process Unit 1", workersPresent: 4, activeWorkPermits: 1 },
    { id: "zone-b", name: "Zone B — Tank Farm", workersPresent: 2, activeWorkPermits: 1 },
    { id: "zone-c", name: "Zone C — Compressor House", workersPresent: 3, activeWorkPermits: 0 },
    { id: "zone-d", name: "Zone D — Loading Bay", workersPresent: 5, activeWorkPermits: 0 },
    { id: "zone-e", name: "Zone E — Utilities", workersPresent: 1, activeWorkPermits: 0 },
  ];
  await db.insert(zonesTable).values(zones).onConflictDoNothing();

  const sensors = [
    { id: "sns-gas-a1", name: "Gas Detector A1", sensorType: "gas", zoneId: "zone-a", unit: "ppm" },
    { id: "sns-press-a2", name: "Pressure Transmitter A2", sensorType: "pressure", zoneId: "zone-a", unit: "bar" },
    { id: "sns-vib-c1", name: "Vibration Sensor C1", sensorType: "vibration", zoneId: "zone-c", unit: "mm/s" },
    { id: "sns-temp-c2", name: "Thermal Camera C2", sensorType: "temperature", zoneId: "zone-c", unit: "°C" },
    { id: "sns-gas-b1", name: "Gas Detector B1", sensorType: "gas", zoneId: "zone-b", unit: "ppm" },
    { id: "sns-prox-b2", name: "Proximity Sensor B2", sensorType: "proximity", zoneId: "zone-b", unit: "m" },
    { id: "sns-cam-d1", name: "CCTV Camera D1", sensorType: "camera", zoneId: "zone-d", unit: "score" },
    { id: "sns-temp-e1", name: "Temperature Probe E1", sensorType: "temperature", zoneId: "zone-e", unit: "°C" },
    { id: "sns-vib-e2", name: "Vibration Sensor E2", sensorType: "vibration", zoneId: "zone-e", unit: "mm/s" },
  ];
  await db.insert(sensorsTable).values(sensors).onConflictDoNothing();

  // Generate a rising trend of readings per sensor over the last 24 hours,
  // ending near a status derived from the sensor's role in seeded hazards.
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;

  type SeriesSpec = {
    sensorId: string;
    baseline: number;
    peak: number;
    finalStatus: "normal" | "warning" | "critical";
  };

  const series: SeriesSpec[] = [
    { sensorId: "sns-gas-a1", baseline: 4, peak: 62, finalStatus: "critical" },
    { sensorId: "sns-press-a2", baseline: 6.1, peak: 9.4, finalStatus: "warning" },
    { sensorId: "sns-vib-c1", baseline: 2.1, peak: 11.8, finalStatus: "warning" },
    { sensorId: "sns-temp-c2", baseline: 41, peak: 88, finalStatus: "warning" },
    { sensorId: "sns-gas-b1", baseline: 1.5, peak: 3.2, finalStatus: "normal" },
    { sensorId: "sns-prox-b2", baseline: 8, peak: 1.4, finalStatus: "warning" },
    { sensorId: "sns-cam-d1", baseline: 0.1, peak: 0.15, finalStatus: "normal" },
    { sensorId: "sns-temp-e1", baseline: 22, peak: 24, finalStatus: "normal" },
    { sensorId: "sns-vib-e2", baseline: 1.8, peak: 2.0, finalStatus: "normal" },
  ];

  const readingRows: (typeof sensorReadingsTable.$inferInsert)[] = [];
  for (const spec of series) {
    const points = 24;
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      // Ease into the peak over the last third of the window.
      const rampT = Math.max(0, (t - 0.6) / 0.4);
      const value = spec.baseline + (spec.peak - spec.baseline) * Math.pow(rampT, 1.6);
      const jitter = (Math.sin(i * 1.7 + spec.sensorId.length) * 0.03) * spec.baseline;
      const finalValue = Math.max(0, value + jitter);
      const status: "normal" | "warning" | "critical" =
        t < 0.75 ? "normal" : t < 0.92 ? "warning" : (spec.finalStatus === "warning" ? "warning" : spec.finalStatus === "normal" ? "normal" : "critical");
      readingRows.push({
        id: `rdg-${spec.sensorId}-${i}`,
        sensorId: spec.sensorId,
        value: Math.round(finalValue * 100) / 100,
        status,
        timestamp: new Date(now - (points - 1 - i) * HOUR),
      });
    }
  }
  await db.insert(sensorReadingsTable).values(readingRows).onConflictDoNothing();

  const hazards = [
    {
      id: "hz-gas-leak-a",
      title: "Rising Gas Concentration Near Active Hot Work",
      scenarioType: "gas_leak",
      riskLevel: "critical",
      confidenceScore: 0.91,
      priorityScore: 0.97,
      status: "active",
      zoneId: "zone-a",
      description:
        "Gas Detector A1 shows a sustained rise in hydrocarbon concentration over the last 3 hours, correlated with a slow pressure increase on the adjacent line. An active hot work permit is in effect within 8 meters of the detection point, with 4 workers currently in the zone.",
      workersNearby: 4,
      activeWorkPermit: true,
      contributingSensors: ["Gas Detector A1", "Pressure Transmitter A2"],
      reasoningSteps: [
        "Gas Detector A1 crossed the warning threshold at 14:10 and continued climbing rather than stabilizing.",
        "Pressure Transmitter A2 on the same line rose 22% over the same window, consistent with a developing seal or valve leak rather than sensor drift.",
        "Cross-referenced with the maintenance log: this line's isolation valve was flagged for degraded seating during the last inspection cycle.",
        "Checked the active work permit register: a hot work permit is open within the hazard radius, which sharply increases ignition risk if concentration continues to rise.",
      ],
      riskRationale:
        "Classified as Critical because gas concentration has crossed the lower explosive limit caution band while an ignition source (hot work) is authorized in the same area.",
      priorityRationale:
        "Prioritized above other active hazards because it combines rising concentration, an active ignition source, and workers within the affected radius — the three factors that most directly convert a sensor anomaly into an incident.",
      confidenceRationale:
        "High confidence because two independent sensor types (gas and pressure) corroborate the same developing fault, and it matches a known equipment degradation pattern from maintenance history.",
    },
    {
      id: "hz-vib-c",
      title: "Abnormal Compressor Vibration with Thermal Rise",
      scenarioType: "equipment_degradation",
      riskLevel: "high",
      confidenceScore: 0.83,
      priorityScore: 0.68,
      status: "active",
      zoneId: "zone-c",
      description:
        "Vibration Sensor C1 on the primary compressor has trended upward over the past 6 hours, now accompanied by a localized thermal rise detected by the thermal camera on the same unit, consistent with early-stage bearing wear.",
      workersNearby: 1,
      activeWorkPermit: false,
      contributingSensors: ["Vibration Sensor C1", "Thermal Camera C2"],
      reasoningSteps: [
        "Vibration amplitude increased steadily rather than spiking, ruling out a transient shock event.",
        "Thermal signature on the bearing housing rose in the same window, a pattern consistent with frictional wear rather than ambient heating.",
        "Compressor is classified as a critical asset with no redundant unit currently online, raising the operational impact of a failure.",
        "Only one worker is currently in the zone and no hot work permit is active, moderating immediate personnel risk.",
      ],
      riskRationale:
        "Classified as High because the combination of rising vibration and thermal signature strongly suggests progressing mechanical wear on a critical, non-redundant asset, though no immediate personnel hazard exists yet.",
      priorityRationale:
        "Prioritized below the Zone A gas scenario because it lacks an active ignition source or nearby workforce concentration, but ranked above lower-severity alerts due to asset criticality.",
      confidenceRationale:
        "High confidence driven by agreement between two independent modalities (vibration and thermal) showing the same gradual trend.",
    },
    {
      id: "hz-proximity-b",
      title: "Worker Proximity to Tank Under Pressure Fluctuation",
      scenarioType: "proximity_hazard",
      riskLevel: "medium",
      confidenceScore: 0.74,
      priorityScore: 0.52,
      status: "monitoring",
      zoneId: "zone-b",
      description:
        "Proximity Sensor B2 has repeatedly detected personnel within the reduced-clearance zone around Tank 4 while minor pressure fluctuations are being observed on the tank's relief system. No confirmed leak signature yet.",
      workersNearby: 2,
      activeWorkPermit: true,
      contributingSensors: ["Proximity Sensor B2", "Gas Detector B1"],
      reasoningSteps: [
        "Proximity readings show workers dwelling inside the reduced-clearance boundary for longer than the standard exposure window.",
        "Gas Detector B1 remains within normal range, so this is not yet classified as a leak scenario.",
        "An active work permit for scheduled maintenance explains the sustained presence but does not eliminate the exposure risk during pressure fluctuation.",
      ],
      riskRationale:
        "Classified as Medium because there is no confirmed release, but sustained worker presence near a fluctuating-pressure vessel is a recognized precursor pattern worth flagging for review.",
      priorityRationale:
        "Prioritized below active gas and vibration hazards since no abnormal gas reading is present, but kept above low-severity items because of direct personnel exposure.",
      confidenceRationale:
        "Moderate confidence — the pattern is consistent with a monitoring-worthy precursor, but the absence of a corroborating gas or pressure anomaly limits certainty.",
    },
    {
      id: "hz-loading-d",
      title: "Irregular Loading Bay Traffic Pattern",
      scenarioType: "operational_anomaly",
      riskLevel: "low",
      confidenceScore: 0.61,
      priorityScore: 0.21,
      status: "active",
      zoneId: "zone-d",
      description:
        "CCTV analytics on Loading Bay camera D1 flagged an irregular vehicle staging pattern that deviates from the routine loading sequence, with no other sensor corroboration.",
      workersNearby: 5,
      activeWorkPermit: false,
      contributingSensors: ["CCTV Camera D1"],
      reasoningSteps: [
        "Vehicle dwell-time pattern deviates from the learned baseline for this bay's shift schedule.",
        "No gas, vibration, or pressure signal corroborates an equipment or material hazard.",
        "Flagged for awareness rather than immediate action given single-sensor origin.",
      ],
      riskRationale:
        "Classified as Low because only a single visual modality is involved and no physical hazard signal corroborates it.",
      priorityRationale:
        "Ranked lowest among active hazards — informational rather than actionable until corroborated by another sensor.",
      confidenceRationale:
        "Lower confidence since this relies on a single camera-based behavioral model without sensor corroboration.",
    },
    {
      id: "hz-resolved-e",
      title: "Utility Room Temperature Excursion (Resolved)",
      scenarioType: "equipment_degradation",
      riskLevel: "medium",
      confidenceScore: 0.79,
      priorityScore: 0.3,
      status: "resolved",
      zoneId: "zone-e",
      description:
        "Temperature Probe E1 briefly exceeded normal operating range earlier today due to a ventilation fan fault. Maintenance replaced the fan belt and readings have returned to baseline.",
      workersNearby: 1,
      activeWorkPermit: false,
      contributingSensors: ["Temperature Probe E1"],
      reasoningSteps: [
        "Temperature rose above threshold for 40 minutes before maintenance intervention.",
        "Root cause identified as a failed ventilation fan belt.",
        "Readings confirmed back within normal range after belt replacement.",
      ],
      riskRationale:
        "Classified as Medium at the time due to sustained excursion above threshold, later downgraded upon resolution.",
      priorityRationale:
        "Was prioritized moderately while active; no longer requires attention now that root cause is resolved.",
      confidenceRationale:
        "High confidence in root cause given direct maintenance confirmation of the fan belt fault.",
    },
  ];
  await db.insert(hazardsTable).values(hazards).onConflictDoNothing();

  const contributingFactors = [
    { id: "cf-1", hazardId: "hz-gas-leak-a", label: "Rising gas concentration", description: "Gas Detector A1 trending upward for 3+ hours without stabilizing.", weight: 0.4 },
    { id: "cf-2", hazardId: "hz-gas-leak-a", label: "Line pressure increase", description: "Pressure Transmitter A2 rose 22% over the same window.", weight: 0.25 },
    { id: "cf-3", hazardId: "hz-gas-leak-a", label: "Valve degradation history", description: "Isolation valve flagged for degraded seating in last inspection.", weight: 0.15 },
    { id: "cf-4", hazardId: "hz-gas-leak-a", label: "Active hot work permit", description: "Ignition source authorized within 8m of the detection point.", weight: 0.2 },

    { id: "cf-5", hazardId: "hz-vib-c", label: "Vibration trend", description: "Sustained increase in vibration amplitude over 6 hours.", weight: 0.5 },
    { id: "cf-6", hazardId: "hz-vib-c", label: "Localized thermal rise", description: "Bearing housing temperature rising in step with vibration.", weight: 0.35 },
    { id: "cf-7", hazardId: "hz-vib-c", label: "No redundant unit", description: "Compressor has no online backup, raising operational impact.", weight: 0.15 },

    { id: "cf-8", hazardId: "hz-proximity-b", label: "Extended proximity dwell time", description: "Workers remaining inside reduced-clearance boundary beyond standard window.", weight: 0.55 },
    { id: "cf-9", hazardId: "hz-proximity-b", label: "Pressure fluctuation", description: "Minor fluctuations observed on tank relief system.", weight: 0.25 },
    { id: "cf-10", hazardId: "hz-proximity-b", label: "Active maintenance permit", description: "Scheduled maintenance explains sustained presence.", weight: 0.2 },

    { id: "cf-11", hazardId: "hz-loading-d", label: "Irregular staging pattern", description: "Vehicle dwell time deviates from learned baseline.", weight: 1.0 },

    { id: "cf-12", hazardId: "hz-resolved-e", label: "Ventilation fan fault", description: "Fan belt failure caused temperature excursion.", weight: 1.0 },
  ];
  await db.insert(contributingFactorsTable).values(contributingFactors).onConflictDoNothing();

  const recommendedActions = [
    { id: "ra-1", hazardId: "hz-gas-leak-a", action: "Suspend hot work permit in Zone A immediately", rationale: "Removes the ignition source while gas concentration remains elevated.", priority: "immediate" },
    { id: "ra-2", hazardId: "hz-gas-leak-a", action: "Evacuate non-essential personnel from the 8m hazard radius", rationale: "Reduces exposure while the source of the leak is investigated.", priority: "immediate" },
    { id: "ra-3", hazardId: "hz-gas-leak-a", action: "Dispatch maintenance to inspect the flagged isolation valve", rationale: "Valve was already flagged for degraded seating and is the most likely leak source.", priority: "high" },

    { id: "ra-4", hazardId: "hz-vib-c", action: "Schedule inspection of compressor bearing assembly", rationale: "Combined vibration and thermal trend is consistent with early bearing wear.", priority: "high" },
    { id: "ra-5", hazardId: "hz-vib-c", action: "Reduce compressor load if operationally feasible", rationale: "Lowering load can slow degradation until inspection occurs.", priority: "normal" },

    { id: "ra-6", hazardId: "hz-proximity-b", action: "Notify crew to minimize dwell time near Tank 4", rationale: "Reduces exposure duration during the pressure fluctuation window.", priority: "normal" },
    { id: "ra-7", hazardId: "hz-proximity-b", action: "Monitor Gas Detector B1 for any deviation", rationale: "Would immediately escalate this scenario if a leak signature appears.", priority: "normal" },

    { id: "ra-8", hazardId: "hz-loading-d", action: "Review CCTV footage for the flagged staging window", rationale: "Confirms whether the pattern is benign or requires a procedural follow-up.", priority: "normal" },
  ];
  await db.insert(recommendedActionsTable).values(recommendedActions).onConflictDoNothing();

  const baseTime = (offsetHoursAgo: number) => new Date(now - offsetHoursAgo * HOUR);

  const timelineEvents = [
    { id: "te-1", hazardId: "hz-gas-leak-a", eventType: "sensor_anomaly", description: "Gas Detector A1 crossed warning threshold.", timestamp: baseTime(3) },
    { id: "te-2", hazardId: "hz-gas-leak-a", eventType: "sensor_anomaly", description: "Pressure Transmitter A2 began trending upward.", timestamp: baseTime(2.5) },
    { id: "te-3", hazardId: "hz-gas-leak-a", eventType: "scenario_detected", description: "AI identified a developing gas leak scenario correlated with valve degradation history.", timestamp: baseTime(2) },
    { id: "te-4", hazardId: "hz-gas-leak-a", eventType: "risk_escalated", description: "Risk level escalated from High to Critical as concentration continued rising with an active hot work permit nearby.", timestamp: baseTime(1) },
    { id: "te-5", hazardId: "hz-gas-leak-a", eventType: "recommendation_issued", description: "Recommended suspending hot work permit and evacuating the hazard radius.", timestamp: baseTime(0.5) },

    { id: "te-6", hazardId: "hz-vib-c", eventType: "sensor_anomaly", description: "Vibration Sensor C1 began trending above baseline.", timestamp: baseTime(6) },
    { id: "te-7", hazardId: "hz-vib-c", eventType: "sensor_anomaly", description: "Thermal Camera C2 detected localized heating on the bearing housing.", timestamp: baseTime(4) },
    { id: "te-8", hazardId: "hz-vib-c", eventType: "scenario_detected", description: "AI flagged a compressor equipment degradation scenario.", timestamp: baseTime(3.5) },
    { id: "te-9", hazardId: "hz-vib-c", eventType: "recommendation_issued", description: "Recommended bearing inspection and reduced compressor load.", timestamp: baseTime(1.5) },

    { id: "te-10", hazardId: "hz-proximity-b", eventType: "sensor_anomaly", description: "Proximity Sensor B2 recorded extended dwell time near Tank 4.", timestamp: baseTime(5) },
    { id: "te-11", hazardId: "hz-proximity-b", eventType: "scenario_detected", description: "AI flagged a proximity hazard scenario given active maintenance permit.", timestamp: baseTime(4.5) },
    { id: "te-12", hazardId: "hz-proximity-b", eventType: "status_changed", description: "Status set to monitoring pending Gas Detector B1 trend.", timestamp: baseTime(3) },

    { id: "te-13", hazardId: "hz-loading-d", eventType: "sensor_anomaly", description: "CCTV analytics flagged irregular vehicle staging pattern.", timestamp: baseTime(2) },
    { id: "te-14", hazardId: "hz-loading-d", eventType: "scenario_detected", description: "AI logged an operational anomaly for review.", timestamp: baseTime(1.8) },

    { id: "te-15", hazardId: "hz-resolved-e", eventType: "sensor_anomaly", description: "Temperature Probe E1 exceeded normal operating range.", timestamp: baseTime(9) },
    { id: "te-16", hazardId: "hz-resolved-e", eventType: "scenario_detected", description: "AI identified a ventilation-related equipment degradation scenario.", timestamp: baseTime(8.7) },
    { id: "te-17", hazardId: "hz-resolved-e", eventType: "recommendation_issued", description: "Recommended maintenance inspect the ventilation fan.", timestamp: baseTime(8.5) },
    { id: "te-18", hazardId: "hz-resolved-e", eventType: "status_changed", description: "Status changed to resolved after fan belt replacement confirmed normal readings.", timestamp: baseTime(7) },
  ];
  await db.insert(timelineEventsTable).values(timelineEvents).onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
