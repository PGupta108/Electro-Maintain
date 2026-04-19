/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SMART AUTO REMINDER ENGINE  —  ElectroMaintain v2.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  When a user adds a device, this engine:
 *  1. Reads a built-in maintenance knowledge base (like a device manual)
 *  2. Generates a personalised set of reminders based on:
 *       - Device category (Laptop, AC, Car, Phone...)
 *       - Device age (older devices need more frequent checks)
 *       - Usage hours per day
 *       - Condition (Poor devices get extra reminders)
 *       - Warranty status
 *  3. Uses the Anthropic Claude API (optional) to generate additional
 *     intelligent reminders if ANTHROPIC_API_KEY is set in .env
 *
 *  If AI key is NOT set → falls back to the built-in knowledge base only.
 *  This means the system works WITHOUT an API key too.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Reminder = require('../models/Reminder');

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────
// This is like a built-in device manual database.
// Each category has a list of maintenance tasks with:
//   - title, taskType, intervalDays (how often), priority, description
// intervalDays is ADJUSTED later based on device age + usage.

const MAINTENANCE_KB = {
  Computer: [
    { title: 'Clean Laptop Fan & Vents',     taskType: 'Cleaning',         intervalDays: 90,  priority: 'High',   description: 'Dust buildup causes overheating and reduces lifespan. Clean fan vents with compressed air.' },
    { title: 'Run Antivirus Full Scan',       taskType: 'Software Update',  intervalDays: 30,  priority: 'High',   description: 'Run a complete antivirus/malware scan to keep your system secure.' },
    { title: 'Battery Health Check',          taskType: 'Battery Check',    intervalDays: 60,  priority: 'Medium', description: 'Check battery wear level. Replace if below 80% capacity.' },
    { title: 'OS & Driver Updates',           taskType: 'Software Update',  intervalDays: 30,  priority: 'Medium', description: 'Install latest OS updates and hardware drivers for security & performance.' },
    { title: 'Backup Important Data',         taskType: 'Backup',           intervalDays: 7,   priority: 'High',   description: 'Create backup of important files to external drive or cloud storage.' },
    { title: 'SSD/HDD Health Scan',           taskType: 'Hardware Check',   intervalDays: 90,  priority: 'Medium', description: 'Use CrystalDiskInfo or similar tool to check storage health status.' },
    { title: 'Thermal Paste Replacement',     taskType: 'Replacement',      intervalDays: 730, priority: 'Low',    description: 'Replace thermal paste on CPU every 2 years to maintain cooling efficiency.' },
    { title: 'RAM & Internals Inspection',    taskType: 'Inspection',       intervalDays: 180, priority: 'Low',    description: 'Open laptop and inspect RAM slots, connectors and internal components.' },
  ],
  Mobile: [
    { title: 'Phone Battery Health Check',   taskType: 'Battery Check',    intervalDays: 90,  priority: 'Medium', description: 'Check battery health in Settings. Replace if below 80%.' },
    { title: 'Clean Charging Port',          taskType: 'Cleaning',         intervalDays: 60,  priority: 'Low',    description: 'Remove lint/dust from charging port with a soft brush.' },
    { title: 'OS System Update',             taskType: 'Software Update',  intervalDays: 30,  priority: 'High',   description: 'Update to latest OS version for security patches and performance.' },
    { title: 'App & Security Updates',       taskType: 'Software Update',  intervalDays: 14,  priority: 'Medium', description: 'Update all installed apps and run security/malware scan.' },
    { title: 'Backup Phone Data',            taskType: 'Backup',           intervalDays: 7,   priority: 'High',   description: 'Backup contacts, photos, and app data to cloud or computer.' },
    { title: 'Screen & Body Cleaning',       taskType: 'Cleaning',         intervalDays: 30,  priority: 'Low',    description: 'Clean screen with microfiber cloth. Avoid harsh chemicals.' },
    { title: 'Check Screen for Damage',      taskType: 'Inspection',       intervalDays: 180, priority: 'Low',    description: 'Inspect screen for cracks, dead pixels, and touch sensitivity issues.' },
  ],
  Vehicle: [
    { title: 'Engine Oil Change',            taskType: 'Replacement',      intervalDays: 90,  priority: 'High',   description: 'Change engine oil every 3 months or 5000km for petrol, 10000km for diesel.' },
    { title: 'Tyre Pressure & Rotation',     taskType: 'Inspection',       intervalDays: 30,  priority: 'High',   description: 'Check tyre pressure (recommended PSI in manual). Rotate every 10,000km.' },
    { title: 'Air Filter Replacement',       taskType: 'Replacement',      intervalDays: 180, priority: 'Medium', description: 'Replace engine air filter every 6 months or 15,000km.' },
    { title: 'Brake Inspection',             taskType: 'Inspection',       intervalDays: 90,  priority: 'High',   description: 'Check brake pads, discs and fluid. Replace if pads below 3mm.' },
    { title: 'Battery Terminal Check',       taskType: 'Hardware Check',   intervalDays: 60,  priority: 'Medium', description: 'Check battery terminals for corrosion. Clean and tighten connections.' },
    { title: 'Full Service',                 taskType: 'Inspection',       intervalDays: 365, priority: 'High',   description: 'Complete vehicle servicing at authorised service centre.' },
    { title: 'AC Gas & Filter Service',      taskType: 'Cleaning',         intervalDays: 365, priority: 'Medium', description: 'Service car AC system including gas refill and cabin air filter.' },
    { title: 'Wiper Blade Replacement',      taskType: 'Replacement',      intervalDays: 180, priority: 'Low',    description: 'Replace wiper blades every 6 months or when streaking.' },
    { title: 'Engine Coolant Check',         taskType: 'Hardware Check',   intervalDays: 90,  priority: 'Medium', description: 'Check coolant level and quality. Top up or flush as needed.' },
  ],
  Appliance: [
    { title: 'AC Filter Cleaning',           taskType: 'Cleaning',         intervalDays: 30,  priority: 'High',   description: 'Clean AC air filter every month during summer season. Dirty filter reduces efficiency by 15%.' },
    { title: 'AC Annual Service',            taskType: 'Inspection',       intervalDays: 365, priority: 'High',   description: 'Annual professional AC servicing including gas check, coil cleaning, and electrical inspection.' },
    { title: 'Refrigerator Coil Cleaning',  taskType: 'Cleaning',         intervalDays: 180, priority: 'Medium', description: 'Clean condenser coils at back of fridge. Dirty coils increase power consumption.' },
    { title: 'Washing Machine Drum Clean',  taskType: 'Cleaning',         intervalDays: 30,  priority: 'Medium', description: 'Run empty hot wash with washing machine cleaner to remove bacteria and odours.' },
    { title: 'Check Appliance Filters',     taskType: 'Inspection',       intervalDays: 90,  priority: 'Medium', description: 'Inspect and clean all appliance filters (dishwasher, dryer, etc.).' },
    { title: 'Power Cord Safety Inspection',taskType: 'Inspection',       intervalDays: 180, priority: 'High',   description: 'Check all power cords for fraying, damage, or loose plugs. Replace damaged cords immediately.' },
  ],
  Network: [
    { title: 'Router Firmware Update',       taskType: 'Software Update',  intervalDays: 90,  priority: 'High',   description: 'Update router firmware for security patches and performance improvements.' },
    { title: 'Router Reboot',                taskType: 'Inspection',       intervalDays: 30,  priority: 'Low',    description: 'Reboot router monthly to clear memory and apply any pending updates.' },
    { title: 'Network Security Audit',       taskType: 'Inspection',       intervalDays: 90,  priority: 'High',   description: 'Review connected devices, change Wi-Fi password, check for unknown connections.' },
    { title: 'Cable & Port Inspection',      taskType: 'Hardware Check',   intervalDays: 180, priority: 'Medium', description: 'Inspect ethernet cables, ports and connectors for damage or looseness.' },
    { title: 'Backup Network Configuration', taskType: 'Backup',           intervalDays: 180, priority: 'Medium', description: 'Export and save router/switch configuration settings.' },
  ],
  'TV/Display': [
    { title: 'Screen & Vents Cleaning',      taskType: 'Cleaning',         intervalDays: 30,  priority: 'Low',    description: 'Clean screen with dry microfiber cloth. Clean rear vents to prevent overheating.' },
    { title: 'Firmware Update',              taskType: 'Software Update',  intervalDays: 60,  priority: 'Medium', description: 'Check for Smart TV firmware updates in Settings menu.' },
    { title: 'HDMI & Cable Inspection',      taskType: 'Inspection',       intervalDays: 180, priority: 'Low',    description: 'Inspect HDMI cables and ports for damage. Check all connections.' },
    { title: 'Backlight Check',              taskType: 'Hardware Check',   intervalDays: 365, priority: 'Low',    description: 'Check for uneven backlight, dark spots or colour uniformity issues.' },
  ],
  Audio: [
    { title: 'Speaker Grille Cleaning',      taskType: 'Cleaning',         intervalDays: 60,  priority: 'Low',    description: 'Remove dust from speaker grilles with soft brush. Dust reduces sound quality.' },
    { title: 'Firmware Update',              taskType: 'Software Update',  intervalDays: 90,  priority: 'Medium', description: 'Update firmware on smart speakers and audio equipment.' },
    { title: 'Cable & Connector Check',      taskType: 'Inspection',       intervalDays: 180, priority: 'Low',    description: 'Inspect audio cables, jacks and connectors for oxidation or damage.' },
    { title: 'Battery Check (Wireless)',     taskType: 'Battery Check',    intervalDays: 90,  priority: 'Medium', description: 'Check battery health on wireless/Bluetooth audio devices.' },
  ],
  Other: [
    { title: 'General Cleaning',             taskType: 'Cleaning',         intervalDays: 30,  priority: 'Low',    description: 'Clean device body, screen and ports from dust and debris.' },
    { title: 'Software/Firmware Update',     taskType: 'Software Update',  intervalDays: 60,  priority: 'Medium', description: 'Check for and install any available software or firmware updates.' },
    { title: 'General Inspection',           taskType: 'Inspection',       intervalDays: 90,  priority: 'Medium', description: 'Inspect device for physical damage, loose parts, and proper operation.' },
    { title: 'Data Backup',                  taskType: 'Backup',           intervalDays: 30,  priority: 'Medium', description: 'Backup any important data stored on the device.' },
  ]
};

// ─── INTERVAL ADJUSTMENT BASED ON DEVICE PROFILE ─────────────────────────────
// The smarter part: we adjust reminder intervals based on the actual device state.
// This is where the "intelligence" comes in — same category but different profiles
// get different reminder frequencies.
function adjustInterval(baseIntervalDays, device) {
  let multiplier = 1.0;

  // FACTOR 1: Device condition — poor condition = more frequent checks
  const conditionFactors = { Excellent: 1.3, Good: 1.0, Fair: 0.75, Poor: 0.5 };
  multiplier *= conditionFactors[device.condition] || 1.0;

  // FACTOR 2: Age — older devices need more frequent maintenance
  const ageMonths = device.ageMonths || 0;
  if (ageMonths > 60) multiplier *= 0.7;       // > 5 years: 30% more frequent
  else if (ageMonths > 36) multiplier *= 0.85;  // > 3 years: 15% more frequent
  else if (ageMonths < 6) multiplier *= 1.2;    // brand new: less frequent

  // FACTOR 3: High usage = more wear = more frequent maintenance
  const usageHours = device.usageHours || 4;
  if (usageHours >= 12) multiplier *= 0.7;      // heavy use
  else if (usageHours >= 8) multiplier *= 0.85;  // moderate-heavy
  else if (usageHours <= 2) multiplier *= 1.2;   // light use

  // FACTOR 4: Expired warranty — always increase frequency (no manufacturer safety net)
  if (device.warrantyExpiry && new Date() > new Date(device.warrantyExpiry)) {
    multiplier *= 0.85;
  }

  const adjusted = Math.round(baseIntervalDays * multiplier);
  // Clamp: no shorter than 3 days, no longer than original interval
  return Math.max(3, Math.min(adjusted, baseIntervalDays));
}

// ─── AI REMINDER GENERATION (Optional — needs GEMINI_API_KEY in .env) ─────
async function generateAIReminders(device) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const fetch = require('node-fetch');

    const prompt = `You are a device maintenance expert. A user has a device with these details:
- Name: ${device.name}
- Brand: ${device.brand}
- Model: ${device.model}
- Category: ${device.category}
- Condition: ${device.condition}
- Age: ${device.ageMonths || 0} months
- Daily usage: ${device.usageHours || 4} hours

Generate 2-3 ADDITIONAL maintenance reminders that are SPECIFIC to this exact brand/model combination (not generic ones).
Focus on known issues or manufacturer-recommended maintenance for "${device.brand} ${device.model}".

Respond ONLY with a JSON array (no markdown, no explanation):
[
  {
    "title": "...",
    "taskType": "Cleaning|Software Update|Hardware Check|Battery Check|Backup|Calibration|Replacement|Inspection|Other",
    "intervalDays": <number>,
    "priority": "High|Medium|Low",
    "description": "..."
  }
]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
        })
      }
    );

    const data = await response.json();

    // Gemini returns response in a different structure than Anthropic
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);

  } catch (err) {
    console.warn('Gemini AI reminder generation skipped:', err.message);
    return [];
  }
}






// ─── MAIN EXPORT: Generate and Save Auto Reminders ────────────────────────────
async function generateSmartReminders(device, userId) {
  try {
    const category = device.category || 'Other';
    const baseReminders = MAINTENANCE_KB[category] || MAINTENANCE_KB['Other'];

    // Build reminder objects from the knowledge base
    const remindersToCreate = baseReminders.map(task => {
      const adjustedInterval = adjustInterval(task.intervalDays, device);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + adjustedInterval);

      return {
        user: userId,
        device: device._id,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        priority: task.priority,
        dueDate,
        repeatEvery: adjustedInterval,
        repeatUnit: 'days',
        autoGenerated: true,  // flag so user knows this was auto-created
        source: 'knowledge_base'
      };
    });

    // Try AI-enhanced reminders if API key is set
    const aiReminders = await generateAIReminders(device);
    for (const air of aiReminders) {
      if (!air.title || !air.intervalDays) continue;
      const adjustedInterval = adjustInterval(air.intervalDays, device);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + adjustedInterval);
      remindersToCreate.push({
        user: userId,
        device: device._id,
        title: air.title,
        description: air.description || '',
        taskType: air.taskType || 'Other',
        priority: air.priority || 'Medium',
        dueDate,
        repeatEvery: adjustedInterval,
        repeatUnit: 'days',
        autoGenerated: true,
        source: 'ai_generated'
      });
    }

    // Save all to DB
    const saved = await Reminder.insertMany(remindersToCreate);
    console.log(`🤖 Auto-generated ${saved.length} reminders for device: ${device.name}`);
    return saved;
  } catch (err) {
    console.error('Smart reminder generation error:', err.message);
    return [];
  }
}

module.exports = { generateSmartReminders, MAINTENANCE_KB };
