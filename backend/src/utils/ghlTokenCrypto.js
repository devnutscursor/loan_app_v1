const crypto = require('crypto');

function getEncryptionKey() {
  const keyBase64 = process.env.GHL_TOKENS_ENC_KEY || process.env.CREDENTIALS_ENC_KEY;
  if (!keyBase64) {
    throw new Error('Missing token encryption key (GHL_TOKENS_ENC_KEY or CREDENTIALS_ENC_KEY)');
  }

  const keyBuffer = Buffer.from(keyBase64, 'base64');
  if (keyBuffer.length !== 32) {
    throw new Error('Token encryption key must be a 32-byte base64 value');
  }

  return keyBuffer;
}

function encryptToken(tokenValue) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(tokenValue, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    enc: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

function decryptToken(enc, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(enc, 'base64')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

module.exports = {
  encryptToken,
  decryptToken
};
