const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:         { type: String, required: true, trim: true },
  brand:        { type: String, required: true, trim: true },
  model:        { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Computer', 'Mobile', 'Appliance', 'Network', 'Vehicle', 'TV/Display', 'Audio', 'Other'],
    default: 'Other'
  },
  // UPGRADE 2: Custom category field (shown when user picks "Other")
  customCategory: { type: String, trim: true, default: '' },
  serialNumber: { type: String, trim: true, default: '' },
  purchaseDate:    { type: Date },
  warrantyPeriod:  { type: Number, default: 12 },
  warrantyExpiry:  { type: Date },
  condition:    { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor'], default: 'Good' },
  usageHours:   { type: Number, default: 0 },
  notes:  { type: String, default: '' },
  image:  { type: String, default: '' },
  // UPGRADE 1: Track auto-reminder generation
  smartRemindersGenerated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

DeviceSchema.pre('save', function(next) {
  if (this.purchaseDate && this.warrantyPeriod) {
    const expiry = new Date(this.purchaseDate);
    expiry.setMonth(expiry.getMonth() + this.warrantyPeriod);
    this.warrantyExpiry = expiry;
  }
  this.updatedAt = new Date();
  next();
});

// Virtual: shows customCategory name if category is "Other"
DeviceSchema.virtual('displayCategory').get(function() {
  if (this.category === 'Other' && this.customCategory) return this.customCategory;
  return this.category;
});

DeviceSchema.virtual('warrantyActive').get(function() {
  if (!this.warrantyExpiry) return false;
  return new Date() < this.warrantyExpiry;
});

DeviceSchema.virtual('ageMonths').get(function() {
  if (!this.purchaseDate) return 0;
  const diff = new Date() - new Date(this.purchaseDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
});

DeviceSchema.set('toJSON', { virtuals: true });
DeviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Device', DeviceSchema);
