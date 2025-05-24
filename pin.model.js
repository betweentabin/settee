const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pinSchema = new Schema({
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  dateTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  requests: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// インデックスの設定
pinSchema.index({ creatorId: 1 });
pinSchema.index({ "location.coordinates": "2dsphere" });
pinSchema.index({ dateTime: 1 });
pinSchema.index({ status: 1 });

const Pin = mongoose.model('Pin', pinSchema);

module.exports = Pin;
