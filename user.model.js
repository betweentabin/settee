const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  profileImage: {
    type: String,
    default: null
  },
  verificationStatus: {
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isStudentIdVerified: {
      type: Boolean,
      default: false
    },
    studentIdImageUrl: String,
    verificationDate: Date
  },
  points: {
    type: Number,
    default: 0
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  settings: {
    notifications: {
      messages: {
        type: Boolean,
        default: true
      },
      requests: {
        type: Boolean,
        default: true
      },
      pins: {
        type: Boolean,
        default: true
      },
      system: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'ja'
    }
  },
  inviteCode: {
    type: String,
    unique: true
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// インデックスの設定
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });
userSchema.index({ "location.coordinates": "2dsphere" });

const User = mongoose.model('User', userSchema);

module.exports = User;
