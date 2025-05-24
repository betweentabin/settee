const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pointTransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earn', 'spend'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  relatedId: {
    type: Schema.Types.ObjectId,
    default: null
  }
}, {
  timestamps: true
});

// インデックスの設定
pointTransactionSchema.index({ userId: 1 });
pointTransactionSchema.index({ type: 1 });
pointTransactionSchema.index({ createdAt: 1 });

const PointTransaction = mongoose.model('PointTransaction', pointTransactionSchema);

module.exports = PointTransaction;
