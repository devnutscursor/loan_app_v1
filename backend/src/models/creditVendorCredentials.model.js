// backend/src/models/creditVendorCredential.model.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const creditVendorCredentialSchema = new mongoose.Schema({
  // Who this credential belongs to
  ownerType: {
    type: String,
    enum: ['Company', 'User'],
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  vendorKey: { type: String, required: true, trim: true },
  vendorName: { type: String, required: true, trim: true },

  // Non-secret username for display and uniqueness checks
  username: { type: String, required: true, trim: true },

  // Credentials (encrypted-at-rest)
  passwordEnc: { type: String, required: true, select: false }, // ciphertext
  iv: { type: String, required: true, select: false },          // base64
  authTag: { type: String, required: true, select: false },     // base64

}, { timestamps: true });

// Indexes for quick lookups
creditVendorCredentialSchema.index({ ownerType: 1, ownerId: 1 });

function getKey() {
  const key = process.env.CREDENTIALS_ENC_KEY;
  console.log('key', key);
  if (!key || Buffer.from(key, 'base64').length !== 32) {
    throw new Error('CREDENTIALS_ENC_KEY must be a 32-byte base64 key');
  }
  return Buffer.from(key, 'base64');
}

creditVendorCredentialSchema.methods.setPassword = function(password) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);

  const payload = Buffer.from(JSON.stringify({ p: password }), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  const authTag = cipher.getAuthTag();

  this.passwordEnc = ciphertext.toString('base64');
  this.iv = iv.toString('base64');
  this.authTag = authTag.toString('base64');
};

creditVendorCredentialSchema.methods.getDecryptedPassword = function() {
  const iv = Buffer.from(this.iv, 'base64');
  const authTag = Buffer.from(this.authTag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);

  const ciphertext = Buffer.from(this.passwordEnc, 'base64');
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const { p } = JSON.parse(plaintext.toString('utf8'));
  return p;
};

creditVendorCredentialSchema.index({ username: 1 }, { unique: true });
creditVendorCredentialSchema.index({ username: 1, vendorKey: 1 }, { unique: true });

module.exports = mongoose.model('CreditVendorCredential', creditVendorCredentialSchema);