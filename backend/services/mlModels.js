/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DECISION TREE  +  RANDOM FOREST  —  ElectroMaintain v3.0
 *  Pure JavaScript — No external ML libraries required
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  WHAT IS A DECISION TREE?
 *  ─────────────────────────
 *  Imagine a flowchart of yes/no questions. Each question splits the data
 *  into two groups. At the end of each path is a prediction.
 *
 *  Example tree for "Is this reminder Critical?":
 *
 *    Is device age > 36 months?
 *    ├── YES → Is usage > 8 hrs/day?
 *    │         ├── YES → CRITICAL (90% sure)
 *    │         └── NO  → HIGH
 *    └── NO  → Is it overdue?
 *              ├── YES → HIGH
 *              └── NO  → MEDIUM
 *
 *  The tree LEARNS these split points from your actual data using
 *  an algorithm called CART (Classification And Regression Trees).
 *  It finds the split that best separates the classes at each node
 *  using "Gini Impurity" — a measure of how mixed the classes are.
 *
 *  WHAT IS RANDOM FOREST?
 *  ───────────────────────
 *  A Random Forest builds MANY decision trees (e.g. 10 trees), each:
 *    1. Trained on a random subset of your data (bootstrap sampling)
 *    2. Using only random subset of features at each split
 *
 *  Final prediction = majority vote across all trees.
 *  This makes it much more accurate and prevents overfitting.
 *
 *  TWO MODELS IN THIS FILE:
 *  ─────────────────────────
 *  Model 1 — PRIORITY CLASSIFIER (Decision Tree + Random Forest)
 *    Input:  device age, usage hours, category risk, task urgency,
 *            days until due, overdue count, warranty status, condition
 *    Output: "Critical" | "High" | "Medium" | "Low"
 *
 *  Model 2 — MAINTENANCE INTERVAL REGRESSOR (Decision Tree Regression)
 *    Input:  same device features
 *    Output: recommended maintenance interval in days (number)
 *
 *  TRAINING DATA:
 *    Generated from the same maintenance knowledge base + device profiles.
 *    As users complete tasks, real training data is collected from DB.
 *    On first run, synthetic training data is used (realistic defaults).
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

// ─── FEATURE ENCODING ─────────────────────────────────────────────────────────
// We convert string fields to numbers so the tree can split on them

const CATEGORY_RISK_MAP = {
  Vehicle: 0.90, Computer: 0.85, Network: 0.80, Mobile: 0.75,
  Appliance: 0.65, 'TV/Display': 0.55, Audio: 0.50, Other: 0.60
};

const CONDITION_MAP = { Poor: 0, Fair: 1, Good: 2, Excellent: 3 };

const TASK_URGENCY_MAP = {
  Replacement: 0.95, 'Battery Check': 0.90, 'Hardware Check': 0.85,
  Backup: 0.80, 'Software Update': 0.75, Inspection: 0.70,
  Calibration: 0.65, Cleaning: 0.60, Other: 0.60
};

const PRIORITY_LABELS = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_TO_IDX = { Low: 0, Medium: 1, High: 2, Critical: 3 };

/**
 * Convert a reminder + device object into a numeric feature vector
 * Features: [categoryRisk, taskUrgency, ageMonths_norm, usageHours_norm,
 *            daysUntilDue_norm, overdueCount_norm, conditionScore, warrantyExpired]
 */
function extractFeatures(reminder, device, overdueCount = 0) {
  const categoryRisk    = CATEGORY_RISK_MAP[device.category] || 0.60;
  const taskUrgency     = TASK_URGENCY_MAP[reminder.taskType] || 0.60;
  const ageNorm         = Math.min(1, (device.ageMonths || 0) / 60);         // normalise to 0-1 (max 5 years)
  const usageNorm       = Math.min(1, (device.usageHours || 4) / 16);        // normalise to 0-1 (max 16hrs)
  const daysUntilDue    = (new Date(reminder.dueDate) - new Date()) / 86400000;
  const daysNorm        = Math.max(-1, Math.min(1, -daysUntilDue / 30));     // negative=future, positive=overdue
  const overdueNorm     = Math.min(1, overdueCount / 5);
  const conditionScore  = (CONDITION_MAP[device.condition] || 2) / 3;        // 0-1
  const warrantyExpired = device.warrantyActive === false ? 1 : 0;

  return [
    categoryRisk,    // feature 0
    taskUrgency,     // feature 1
    ageNorm,         // feature 2
    usageNorm,       // feature 3
    daysNorm,        // feature 4
    overdueNorm,     // feature 5
    conditionScore,  // feature 6
    warrantyExpired  // feature 7
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
//  DECISION TREE IMPLEMENTATION (CART Algorithm)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate Gini Impurity for a set of labels.
 * Gini = 1 - Σ(p_i²)
 * Pure node (all same class) = 0. Perfectly mixed = 0.5.
 */
function giniImpurity(labels) {
  if (!labels.length) return 0;
  const counts = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  let gini = 1;
  for (const c of Object.values(counts)) {
    const p = c / labels.length;
    gini -= p * p;
  }
  return gini;
}

/**
 * Find the best feature + threshold to split on, minimising weighted Gini.
 * This is the core of the CART algorithm.
 */
function findBestSplit(features, labels, featureIndices) {
  let bestGini  = Infinity;
  let bestFeat  = -1;
  let bestThresh = 0;

  for (const fi of featureIndices) {
    // Get all unique values for this feature, use midpoints as candidate thresholds
    const values = [...new Set(features.map(f => f[fi]))].sort((a, b) => a - b);

    for (let i = 0; i < values.length - 1; i++) {
      const threshold = (values[i] + values[i + 1]) / 2;

      const leftLabels  = labels.filter((_, j) => features[j][fi] <= threshold);
      const rightLabels = labels.filter((_, j) => features[j][fi] >  threshold);

      if (!leftLabels.length || !rightLabels.length) continue;

      const weightedGini =
        (leftLabels.length  * giniImpurity(leftLabels) +
         rightLabels.length * giniImpurity(rightLabels)) / labels.length;

      if (weightedGini < bestGini) {
        bestGini   = weightedGini;
        bestFeat   = fi;
        bestThresh = threshold;
      }
    }
  }

  return { featureIndex: bestFeat, threshold: bestThresh, gini: bestGini };
}

/**
 * Get the majority class from a list of labels.
 * For regression: returns the mean value.
 */
function majorityClass(labels) {
  const counts = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function meanValue(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Recursively build a Decision Tree node.
 *
 * @param {Array}  features      - Array of feature vectors
 * @param {Array}  labels        - Array of class labels (or numbers for regression)
 * @param {number} depth         - Current depth
 * @param {number} maxDepth      - Maximum allowed depth
 * @param {number} minSamples    - Min samples required to split a node
 * @param {Array}  featureSubset - Indices of features to consider (Random Forest uses subset)
 * @param {string} mode          - 'classification' or 'regression'
 */
function buildTree(features, labels, depth = 0, maxDepth = 6, minSamples = 3, featureSubset = null, mode = 'classification') {
  const numFeatures = features[0]?.length || 8;
  const allIndices  = featureSubset || Array.from({ length: numFeatures }, (_, i) => i);

  // ── Stopping conditions ──
  if (labels.length <= minSamples || depth >= maxDepth) {
    return {
      isLeaf: true,
      prediction: mode === 'regression' ? meanValue(labels) : majorityClass(labels),
      samples: labels.length,
      distribution: mode === 'classification' ? countClasses(labels) : null
    };
  }

  // Check if all labels are the same → pure node
  if (new Set(labels).size === 1) {
    return {
      isLeaf: true,
      prediction: labels[0],
      samples: labels.length,
      distribution: mode === 'classification' ? countClasses(labels) : null
    };
  }

  const { featureIndex, threshold, gini } = findBestSplit(features, labels, allIndices);

  if (featureIndex === -1) {
    return {
      isLeaf: true,
      prediction: mode === 'regression' ? meanValue(labels) : majorityClass(labels),
      samples: labels.length,
      distribution: mode === 'classification' ? countClasses(labels) : null
    };
  }

  // Split data
  const leftIdx  = features.map((f, i) => i).filter(i => features[i][featureIndex] <= threshold);
  const rightIdx = features.map((f, i) => i).filter(i => features[i][featureIndex] >  threshold);

  const leftFeatures  = leftIdx.map(i => features[i]);
  const leftLabels    = leftIdx.map(i => labels[i]);
  const rightFeatures = rightIdx.map(i => features[i]);
  const rightLabels   = rightIdx.map(i => labels[i]);

  // Recursively build left and right subtrees
  return {
    isLeaf: false,
    featureIndex,
    threshold,
    gini: parseFloat(gini.toFixed(4)),
    samples: labels.length,
    featureName: getFeatureName(featureIndex),
    left:  buildTree(leftFeatures,  leftLabels,  depth + 1, maxDepth, minSamples, featureSubset, mode),
    right: buildTree(rightFeatures, rightLabels, depth + 1, maxDepth, minSamples, featureSubset, mode)
  };
}

function countClasses(labels) {
  const counts = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  return counts;
}

function getFeatureName(index) {
  const names = [
    'Category Risk', 'Task Urgency', 'Device Age',
    'Usage Hours', 'Days Until Due', 'Overdue Count',
    'Condition Score', 'Warranty Expired'
  ];
  return names[index] || `Feature ${index}`;
}

/** Predict using a single decision tree */
function predictTree(node, features) {
  if (node.isLeaf) return node.prediction;
  if (features[node.featureIndex] <= node.threshold) {
    return predictTree(node.left, features);
  }
  return predictTree(node.right, features);
}

// ─────────────────────────────────────────────────────────────────────────────
//  RANDOM FOREST IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bootstrap sampling — randomly sample N rows WITH replacement.
 * This is what makes each tree in the forest different.
 */
function bootstrapSample(features, labels) {
  const n = features.length;
  const sampledFeatures = [];
  const sampledLabels   = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * n);
    sampledFeatures.push(features[idx]);
    sampledLabels.push(labels[idx]);
  }
  return { features: sampledFeatures, labels: sampledLabels };
}

/**
 * Get random feature subset for each split.
 * Standard Random Forest: use sqrt(total_features) features per split.
 */
function randomFeatureSubset(numFeatures) {
  const subsetSize = Math.max(2, Math.floor(Math.sqrt(numFeatures)));
  const all = Array.from({ length: numFeatures }, (_, i) => i);
  const shuffled = all.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, subsetSize);
}

/**
 * Train a Random Forest classifier.
 * @param {Array}  features   - Training feature vectors
 * @param {Array}  labels     - Training labels
 * @param {number} nTrees     - Number of trees to build (10 is good for small data)
 * @param {number} maxDepth   - Max depth per tree
 * @param {string} mode       - 'classification' or 'regression'
 */
function trainRandomForest(features, labels, nTrees = 10, maxDepth = 5, mode = 'classification') {
  const trees = [];
  const numFeatures = features[0]?.length || 8;

  for (let t = 0; t < nTrees; t++) {
    const { features: bFeatures, labels: bLabels } = bootstrapSample(features, labels);
    const featureSubset = randomFeatureSubset(numFeatures);
    const tree = buildTree(bFeatures, bLabels, 0, maxDepth, 2, featureSubset, mode);
    trees.push(tree);
  }

  return { trees, numFeatures, mode, trainedOn: features.length };
}

/**
 * Predict with a trained Random Forest.
 * Classification: majority vote across all trees.
 * Regression: mean of all tree predictions.
 */
function predictForest(forest, features) {
  const predictions = forest.trees.map(tree => predictTree(tree, features));

  if (forest.mode === 'regression') {
    const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    return parseFloat(mean.toFixed(1));
  }

  // Classification: majority vote + confidence
  const votes = {};
  for (const p of predictions) votes[p] = (votes[p] || 0) + 1;
  const winner    = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  const confidence = winner[1] / predictions.length;

  return {
    label:      winner[0],
    confidence: parseFloat(confidence.toFixed(2)),
    votes,
    totalTrees: forest.trees.length
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  SYNTHETIC TRAINING DATA GENERATOR
//  Used when not enough real user data exists yet (cold start problem).
//  Generates realistic training samples based on domain knowledge.
// ─────────────────────────────────────────────────────────────────────────────

function generateSyntheticTrainingData() {
  const features = [];
  const priorityLabels   = [];
  const intervalLabels   = [];

  // Define representative device profiles
  const profiles = [
    // [categoryRisk, taskUrgency, ageNorm, usageNorm, daysNorm, overdueNorm, conditionScore, warrantyExpired, priority, intervalDays]
    // Critical scenarios
    [0.90, 0.95, 1.0,  1.0,  1.0,  1.0,  0.0, 1, 'Critical', 30],
    [0.85, 0.90, 0.9,  0.9,  0.8,  0.8,  0.0, 1, 'Critical', 45],
    [0.90, 0.85, 0.8,  1.0,  0.6,  1.0,  0.0, 1, 'Critical', 30],
    [0.85, 0.95, 1.0,  0.8,  1.0,  0.6,  0.3, 1, 'Critical', 30],
    [0.80, 0.90, 0.9,  1.0,  0.9,  0.8,  0.0, 1, 'Critical', 45],
    [0.90, 0.80, 1.0,  1.0,  0.7,  0.6,  0.0, 1, 'Critical', 60],

    // High priority scenarios
    [0.85, 0.85, 0.7,  0.7,  0.5,  0.4,  0.3, 1, 'High', 60],
    [0.80, 0.90, 0.6,  0.8,  0.3,  0.6,  0.3, 0, 'High', 60],
    [0.90, 0.70, 0.8,  0.6,  0.4,  0.4,  0.3, 1, 'High', 90],
    [0.75, 0.85, 0.7,  0.9,  0.6,  0.2,  0.3, 1, 'High', 60],
    [0.85, 0.75, 0.6,  0.7,  0.2,  0.8,  0.3, 0, 'High', 90],
    [0.80, 0.80, 0.8,  0.5,  0.7,  0.4,  0.0, 1, 'High', 60],
    [0.90, 0.75, 0.5,  0.8,  0.3,  0.6,  0.3, 0, 'High', 90],
    [0.75, 0.90, 0.8,  0.6,  0.5,  0.4,  0.3, 1, 'High', 60],

    // Medium priority scenarios
    [0.65, 0.70, 0.5,  0.5,  0.0,  0.2,  0.7, 0, 'Medium', 90],
    [0.75, 0.65, 0.4,  0.6,  -0.2, 0.2,  0.7, 0, 'Medium', 90],
    [0.80, 0.60, 0.3,  0.4,  -0.1, 0.0,  0.7, 0, 'Medium', 120],
    [0.65, 0.75, 0.5,  0.5,  0.1,  0.4,  0.7, 0, 'Medium', 90],
    [0.55, 0.75, 0.6,  0.4,  0.3,  0.2,  0.7, 0, 'Medium', 90],
    [0.70, 0.65, 0.4,  0.5,  -0.3, 0.2,  0.7, 0, 'Medium', 120],
    [0.60, 0.80, 0.4,  0.6,  0.0,  0.0,  1.0, 0, 'Medium', 90],
    [0.75, 0.60, 0.3,  0.5,  -0.2, 0.4,  0.7, 0, 'Medium', 120],

    // Low priority scenarios
    [0.50, 0.60, 0.1,  0.2,  -0.8, 0.0,  1.0, 0, 'Low', 180],
    [0.55, 0.60, 0.2,  0.3,  -0.6, 0.0,  1.0, 0, 'Low', 180],
    [0.60, 0.60, 0.1,  0.2,  -0.9, 0.0,  1.0, 0, 'Low', 180],
    [0.50, 0.65, 0.2,  0.2,  -1.0, 0.0,  1.0, 0, 'Low', 365],
    [0.55, 0.60, 0.1,  0.1,  -0.7, 0.0,  1.0, 0, 'Low', 365],
    [0.50, 0.60, 0.2,  0.3,  -0.8, 0.0,  0.7, 0, 'Low', 180],
    [0.60, 0.60, 0.1,  0.2,  -1.0, 0.0,  1.0, 0, 'Low', 365],
  ];

  // Add some random noise to prevent overfitting to exact values
  for (const p of profiles) {
    for (let repeat = 0; repeat < 3; repeat++) {
      const noisy = p.slice(0, 8).map((v, i) => {
        if (i === 7) return v; // binary feature — no noise
        const noise = (Math.random() - 0.5) * 0.08;
        return Math.max(0, Math.min(1, v + noise));
      });
      features.push(noisy);
      priorityLabels.push(p[8]);
      intervalLabels.push(p[9] + Math.round((Math.random() - 0.5) * 10));
    }
  }

  return { features, priorityLabels, intervalLabels };
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODEL STORE — holds trained models in memory (re-trained on demand)
// ─────────────────────────────────────────────────────────────────────────────

let _priorityForest   = null;  // Random Forest for priority classification
let _intervalTree     = null;  // Decision Tree for interval regression
let _priorityDTree    = null;  // Single Decision Tree for priority (for explainability)
let _lastTrainedAt    = null;
let _trainingSamples  = 0;

/** Returns true if models need to be retrained */
function needsRetraining(realSampleCount) {
  if (!_priorityForest) return true;
  if (realSampleCount !== _trainingSamples) return true;
  // Retrain every 24 hours
  if (_lastTrainedAt && (Date.now() - _lastTrainedAt) > 86400000) return true;
  return false;
}

/**
 * Train both models using real DB data + synthetic data.
 * Called automatically when needed.
 */
async function trainModels(realFeatures = [], realPriorityLabels = [], realIntervalLabels = []) {
  const { features: synth, priorityLabels: synthP, intervalLabels: synthI } = generateSyntheticTrainingData();

  // Combine real data with synthetic (real data gets 3x weight by repeating)
  const allFeatures       = [...synth, ...realFeatures, ...realFeatures, ...realFeatures];
  const allPriorityLabels = [...synthP, ...realPriorityLabels, ...realPriorityLabels, ...realPriorityLabels];
  const allIntervalLabels = [...synthI, ...realIntervalLabels, ...realIntervalLabels, ...realIntervalLabels];

  console.log(`🌲 Training ML models on ${allFeatures.length} samples (${realFeatures.length} real + ${synth.length} synthetic)...`);

  // Train Random Forest for priority (10 trees, max depth 5)
  _priorityForest = trainRandomForest(allFeatures, allPriorityLabels, 10, 5, 'classification');

  // Train single Decision Tree for priority (for human-readable explanation)
  _priorityDTree = buildTree(allFeatures, allPriorityLabels, 0, 6, 3, null, 'classification');

  // Train Decision Tree for interval regression (max depth 4 to prevent overfitting)
  _intervalTree = buildTree(allFeatures, allIntervalLabels, 0, 4, 3, null, 'regression');

  _lastTrainedAt   = Date.now();
  _trainingSamples = realFeatures.length;

  console.log(`✅ ML models trained. Forest: ${_priorityForest.trainedOn} samples, ${_priorityForest.trees.length} trees`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC API — Used by ml.js route
// ─────────────────────────────────────────────────────────────────────────────

const Reminder = require('../models/Reminder');
const Device   = require('../models/Device');

/**
 * Collect real training data from MongoDB (completed reminders with known priority)
 */
async function collectRealTrainingData() {
  try {
    const completedReminders = await Reminder.find({
      status: 'Done',
      completedAt: { $exists: true },
      mlPriorityScore: { $exists: true }
    }).populate('device').limit(500);

    const features       = [];
    const priorityLabels = [];
    const intervalLabels = [];

    for (const r of completedReminders) {
      if (!r.device) continue;

      const overdueCount = await Reminder.countDocuments({ device: r.device._id, status: 'Overdue' });
      const feat = extractFeatures(r, r.device, overdueCount);

      // Convert numeric priority score to label
      const score = r.mlPriorityScore || 50;
      let label;
      if (score >= 80)      label = 'Critical';
      else if (score >= 65) label = 'High';
      else if (score >= 45) label = 'Medium';
      else                  label = 'Low';

      // For interval: if reminder has repeatEvery, use that as ground truth
      const interval = r.repeatEvery > 0 ? r.repeatEvery : null;

      features.push(feat);
      priorityLabels.push(label);
      if (interval) intervalLabels.push(interval);
    }

    return { features, priorityLabels, intervalLabels };
  } catch (err) {
    console.warn('Could not collect real training data:', err.message);
    return { features: [], priorityLabels: [], intervalLabels: [] };
  }
}

/**
 * Ensure models are trained (called before any prediction)
 */
async function ensureTrained() {
  const { features, priorityLabels, intervalLabels } = await collectRealTrainingData();
  if (needsRetraining(features.length)) {
    await trainModels(features, priorityLabels, intervalLabels);
  }
}

/**
 * MAIN PREDICTION FUNCTION
 * Predicts priority label using Random Forest AND single Decision Tree.
 * Also predicts recommended maintenance interval.
 *
 * @returns {Object} {
 *   rfPrediction:   { label, confidence, votes, totalTrees },
 *   dtPrediction:   string label from single tree,
 *   intervalDays:   number (recommended days between maintenances),
 *   features:       the feature vector used,
 *   featureNames:   human-readable feature names
 * }
 */
async function predictWithModels(reminder, device) {
  await ensureTrained();

  const overdueCount = await Reminder.countDocuments({ device: device._id, status: 'Overdue' });
  const feat = extractFeatures(reminder, device, overdueCount);

  const rfResult       = predictForest(_priorityForest, feat);
  const dtResult       = predictTree(_priorityDTree, feat);
  const intervalResult = predictTree(_intervalTree, feat);

  return {
    rfPrediction:  rfResult,
    dtPrediction:  dtResult,
    intervalDays:  Math.max(7, Math.round(intervalResult)),
    features:      feat,
    featureNames:  [
      'Category Risk', 'Task Urgency', 'Device Age (norm)',
      'Usage Hours (norm)', 'Days Until Due (norm)', 'Overdue Count (norm)',
      'Condition Score', 'Warranty Expired'
    ],
    featureValues: feat.map((v, i) => ({
      name:  getFeatureName(i),
      value: parseFloat(v.toFixed(3))
    }))
  };
}

/**
 * Get the decision path for a sample through the Decision Tree.
 * This is the "explainability" feature — shows WHY a prediction was made.
 */
function getDecisionPath(node, features, path = []) {
  if (node.isLeaf) {
    return [...path, {
      type:       'leaf',
      prediction: node.prediction,
      samples:    node.samples,
      distribution: node.distribution
    }];
  }

  const goLeft = features[node.featureIndex] <= node.threshold;
  const step = {
    type:        'split',
    feature:     node.featureName,
    threshold:   parseFloat(node.threshold.toFixed(3)),
    actualValue: parseFloat(features[node.featureIndex].toFixed(3)),
    direction:   goLeft ? 'left (≤)' : 'right (>)',
    gini:        node.gini
  };

  return getDecisionPath(
    goLeft ? node.left : node.right,
    features,
    [...path, step]
  );
}

/**
 * Get human-readable explanation of a prediction
 */
async function explainPrediction(reminder, device) {
  await ensureTrained();
  const overdueCount = await Reminder.countDocuments({ device: device._id, status: 'Overdue' });
  const feat = extractFeatures(reminder, device, overdueCount);
  const path = getDecisionPath(_priorityDTree, feat);
  return path;
}

/**
 * Get model statistics for the ML Insights page
 */
async function getModelStats() {
  await ensureTrained();
  return {
    randomForest: {
      nTrees:       _priorityForest?.trees?.length || 0,
      trainedOn:    _priorityForest?.trainedOn || 0,
      lastTrained:  _lastTrainedAt ? new Date(_lastTrainedAt).toISOString() : null,
      mode:         'classification'
    },
    decisionTree: {
      mode:         'classification + regression',
      maxDepth:     6,
      trainedOn:    _trainingSamples
    },
    realSamples: _trainingSamples
  };
}

module.exports = {
  predictWithModels,
  explainPrediction,
  getModelStats,
  ensureTrained,
  extractFeatures,
  PRIORITY_LABELS
};
