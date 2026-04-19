const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const Device = require('../models/Device');
const Reminder = require('../models/Reminder');
const auth = require('../middleware/auth');
const { generateSmartReminders } = require('../services/smartReminders');

// GET /api/devices
router.get('/', auth, async (req, res) => {
  try {
    const devices = await Device.find({ user: req.user._id, isActive: true }).sort('-createdAt');
    const devicesWithCounts = await Promise.all(devices.map(async (d) => {
      const reminderCount = await Reminder.countDocuments({ device: d._id, status: { $in: ['Pending', 'Overdue'] } });
      const overdueCount  = await Reminder.countDocuments({ device: d._id, status: 'Overdue' });
      return { ...d.toJSON(), pendingReminders: reminderCount, overdueReminders: overdueCount };
    }));
    res.json({ devices: devicesWithCounts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/devices/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const device = await Device.findOne({ _id: req.params.id, user: req.user._id });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ device });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/devices — UPGRADE 1+2: save customCategory, then auto-generate reminders
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Device name is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const {
      name, brand, model, category, customCategory, serialNumber,
      purchaseDate, warrantyPeriod, condition, usageHours, notes, image
    } = req.body;

    const device = await Device.create({
      user: req.user._id,
      name, brand, model, category,
      customCategory: category === 'Other' ? (customCategory || '') : '',
      serialNumber, purchaseDate, warrantyPeriod,
      condition, usageHours, notes, image
    });

    // UPGRADE 1: Auto-generate smart reminders right after device is created
    const generatedReminders = await generateSmartReminders(device, req.user._id);
    await Device.findByIdAndUpdate(device._id, { smartRemindersGenerated: true });

    res.status(201).json({
      device,
      autoRemindersGenerated: generatedReminders.length,
      message: `Device added! ${generatedReminders.length} maintenance reminders were automatically created.`
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/devices/:id — UPGRADE 4: Edit device
router.patch('/:id', auth, async (req, res) => {
  try {
    // If category is being changed away from Other, clear customCategory
    if (req.body.category && req.body.category !== 'Other') {
      req.body.customCategory = '';
    }
    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ device });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/devices/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Device.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isActive: false });
    res.json({ message: 'Device deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/devices/:id/reminders — get reminders for one device
router.get('/:id/reminders', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ device: req.params.id, user: req.user._id }).sort('dueDate');
    res.json({ reminders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
