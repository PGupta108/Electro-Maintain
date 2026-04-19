/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ML ROUTES  —  ElectroMaintain v3.0
 * ═══════════════════════════════════════════════════════════════════════════
 *  Combines original WMA + scoring + anomaly detection (v2)
 *  WITH new Decision Tree + Random Forest models (v3)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const router   = require('express').Router();
const Reminder = require('../models/Reminder');
const Device   = require('../models/Device');
const auth     = require('../middleware/auth');
const {
  predictWithModels,
  explainPrediction,
  getModelStats,
  ensureTrained
} = require('../services/mlModels');

// ─── RISK TABLES (kept from v2 for WMA + scoring) ────────────────────────────
const CATEGORY_RISK = {
  Computer: 0.85, Mobile: 0.75, Network: 0.80, Vehicle: 0.90,
  Appliance: 0.65, 'TV/Display': 0.55, Audio: 0.50, Other: 0.60
};
const TASK_URGENCY = {
  'Battery Check': 0.90, 'Hardware Check': 0.85, 'Software Update': 0.75,
  Backup: 0.80, Cleaning: 0.60, Calibration: 0.65,
  Replacement: 0.95, Inspection: 0.70, Other: 0.60
};

// ─── FEATURE 1: WMA Date Prediction (unchanged from v2) ──────────────────────
async function predictNextDate(deviceId, taskType) {
  const history = await Reminder.find({
    device: deviceId, taskType,
    status: 'Done', completedAt: { $exists: true }
  }).sort('completedAt');

  if (history.length < 2) {
    const defaults = {
      'Battery Check': 90, 'Software Update': 30, Cleaning: 60,
      Backup: 7, 'Hardware Check': 180, Calibration: 365,
      Replacement: 365, Inspection: 90, Other: 30
    };
    const days = defaults[taskType] || 30;
    const predicted = new Date();
    predicted.setDate(predicted.getDate() + days);
    return { date: predicted, confidence: 0.40, method: 'default_interval', samplesUsed: 0 };
  }

  const intervals = [];
  for (let i = 1; i < history.length; i++) {
    const diff = (new Date(history[i].completedAt) - new Date(history[i-1].completedAt)) / 86400000;
    if (diff > 0) intervals.push(diff);
  }
  if (!intervals.length) return null;

  const weights     = intervals.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const wma         = intervals.reduce((sum, v, i) => sum + v * weights[i], 0) / totalWeight;
  const mean        = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance    = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
  const cv          = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const confidence  = parseFloat(Math.min(0.95, Math.max(0.50,
    (1 - cv * 0.5) * (1 - 1 / (history.length + 1))
  )).toFixed(2));

  const lastDone  = new Date(history[history.length - 1].completedAt);
  const predicted = new Date(lastDone);
  predicted.setDate(predicted.getDate() + Math.round(wma));

  return { date: predicted, confidence, method: 'weighted_moving_average', samplesUsed: history.length };
}

// ─── FEATURE 2: Priority Scoring (unchanged from v2) ─────────────────────────
async function computePriorityScore(reminder, device) {
  let score = 0;
  score += (TASK_URGENCY[reminder.taskType] || 0.6) * 25;
  score += (CATEGORY_RISK[device.category] || 0.6) * 20;
  score += Math.min(1, (device.ageMonths || 0) / 36) * 15;
  score += Math.min(1, (device.usageHours || 4) / 12) * 15;
  const overdueCount = await Reminder.countDocuments({ device: device._id, status: 'Overdue' });
  score += Math.min(1, overdueCount / 5) * 15;
  if (!device.warrantyActive) score += 10;
  const daysUntilDue = (new Date(reminder.dueDate) - new Date()) / 86400000;
  if (daysUntilDue < 0)       score += 10;
  else if (daysUntilDue <= 3) score += 7;
  else if (daysUntilDue <= 7) score += 4;
  return Math.round(Math.min(100, score));
}

// ─── FEATURE 3: Anomaly Detection (unchanged from v2) ────────────────────────
async function detectAnomalies(reminder, device) {
  const flags = [];
  const overdueCount = await Reminder.countDocuments({ device: device._id, status: 'Overdue' });
  if (overdueCount >= 3) flags.push(`High overdue count (${overdueCount} tasks) — device may be neglected`);
  const w = new Date(reminder.dueDate);
  w.setDate(w.getDate() - 7);
  const dups = await Reminder.countDocuments({
    device: device._id, taskType: reminder.taskType,
    dueDate: { $gte: w }, _id: { $ne: reminder._id }
  });
  if (dups > 0) flags.push(`Possible duplicate: "${reminder.taskType}" already scheduled nearby`);
  if (device.condition === 'Poor') flags.push('Device condition is Poor — immediate inspection recommended');
  if ((device.usageHours || 0) >= 10) {
    const recentDone = await Reminder.findOne({
      device: device._id, status: 'Done',
      completedAt: { $gte: new Date(Date.now() - 30 * 86400000) }
    });
    if (!recentDone) flags.push('High-usage device (10+ hrs/day) with no maintenance in 30 days');
  }
  if (!device.warrantyActive) {
    const inspection = await Reminder.findOne({
      device: device._id, taskType: 'Inspection',
      status: { $in: ['Pending', 'Overdue'] }
    });
    if (!inspection) flags.push('Warranty expired — no inspection scheduled');
  }
  return { isAnomaly: flags.length > 0, reasons: flags };
}

// ─── CORE: Full ML analysis — now includes DT + RF ───────────────────────────
async function runMLAnalysis(reminderId) {
  try {
    const reminder = await Reminder.findById(reminderId);
    if (!reminder) return;
    const device = await Device.findById(reminder.device);
    if (!device) return;

    // Run all models in parallel
    const [prediction, priorityScore, anomaly, mlModels] = await Promise.all([
      predictNextDate(device._id, reminder.taskType),
      computePriorityScore(reminder, device),
      detectAnomalies(reminder, device),
      predictWithModels(reminder, device)
    ]);

    const update = {
      mlPriorityScore:    priorityScore,
      mlAnomalyFlag:      anomaly.isAnomaly,
      mlAnomalyReason:    anomaly.reasons.join('; '),
      // NEW v3: store RF and DT predictions
      rfPriorityLabel:    mlModels.rfPrediction.label,
      rfConfidence:       mlModels.rfPrediction.confidence,
      dtPriorityLabel:    mlModels.dtPrediction,
      mlIntervalDays:     mlModels.intervalDays
    };

    if (prediction) {
      update.mlPredictedDate = prediction.date;
      update.mlConfidence    = prediction.confidence;
    }

    await Reminder.findByIdAndUpdate(reminderId, update);
    return { prediction, priorityScore, anomaly, mlModels };
  } catch (err) {
    console.error('ML analysis error:', err.message);
  }
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET /api/ml/insights — full dashboard with RF + DT data
router.get('/insights', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id })
      .populate('device', 'name brand model category ageMonths');

    const active = reminders.filter(r => r.status !== 'Done');

    // Agreement between RF and DT (where both have predictions)
    const withBothModels = active.filter(r => r.rfPriorityLabel && r.dtPriorityLabel);
    const agreed = withBothModels.filter(r => r.rfPriorityLabel === r.dtPriorityLabel).length;
    const modelAgreement = withBothModels.length
      ? Math.round((agreed / withBothModels.length) * 100)
      : null;

    const insights = {
      highPriority: active
        .filter(r => (r.mlPriorityScore || 0) >= 75)
        .sort((a, b) => (b.mlPriorityScore||0) - (a.mlPriorityScore||0))
        .slice(0, 10),

      anomalies: active.filter(r => r.mlAnomalyFlag).slice(0, 10),

      avgPriorityScore: reminders.length
        ? Math.round(reminders.reduce((s, r) => s + (r.mlPriorityScore || 0), 0) / reminders.length)
        : 0,

      predictions: active
        .filter(r => r.mlPredictedDate && r.mlConfidence)
        .map(r => ({
          title: r.title, device: r.device?.name,
          predictedDate: r.mlPredictedDate, confidence: r.mlConfidence,
          taskType: r.taskType
        }))
        .sort((a, b) => new Date(a.predictedDate) - new Date(b.predictedDate))
        .slice(0, 8),

      sourceBreakdown: {
        auto:   reminders.filter(r => r.autoGenerated).length,
        manual: reminders.filter(r => !r.autoGenerated).length,
        total:  reminders.length
      },

      // NEW v3: RF + DT specific insights
      rfInsights: {
        criticalCount:  active.filter(r => r.rfPriorityLabel === 'Critical').length,
        highCount:      active.filter(r => r.rfPriorityLabel === 'High').length,
        mediumCount:    active.filter(r => r.rfPriorityLabel === 'Medium').length,
        lowCount:       active.filter(r => r.rfPriorityLabel === 'Low').length,
        avgConfidence:  withBothModels.length
          ? parseFloat((active.filter(r => r.rfConfidence)
              .reduce((s, r) => s + (r.rfConfidence||0), 0) /
              Math.max(1, active.filter(r => r.rfConfidence).length)).toFixed(2))
          : null,
        modelAgreement,  // % of times RF and DT agree
        remindersWithPrediction: withBothModels.length
      }
    };

    res.json({ insights });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ml/model-stats — training info for the Insights page
router.get('/model-stats', auth, async (req, res) => {
  try {
    const stats = await getModelStats();
    res.json({ stats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ml/explain/:reminderId — decision path explanation
router.get('/explain/:reminderId', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.reminderId, user: req.user._id });
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    const device = await Device.findById(reminder.device);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    const path = await explainPrediction(reminder, device);
    res.json({ path, reminderId: req.params.reminderId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ml/analyze/:reminderId
router.get('/analyze/:reminderId', auth, async (req, res) => {
  try {
    const result = await runMLAnalysis(req.params.reminderId);
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ml/retrain — force retrain models with latest DB data
router.post('/retrain', auth, async (req, res) => {
  try {
    await ensureTrained();
    const stats = await getModelStats();
    res.json({ message: 'Models retrained successfully', stats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ml/predict/:deviceId/:taskType
router.get('/predict/:deviceId/:taskType', auth, async (req, res) => {
  try {
    const result = await predictNextDate(req.params.deviceId, req.params.taskType);
    res.json({ prediction: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ml/anomalies
router.get('/anomalies', auth, async (req, res) => {
  try {
    const anomalies = await Reminder.find({
      user: req.user._id, mlAnomalyFlag: true, status: { $ne: 'Done' }
    }).populate('device', 'name brand model category');
    res.json({ anomalies });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
module.exports.runMLAnalysis = runMLAnalysis;
