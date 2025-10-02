const CreditVendorCredential = require('../models/creditVendorCredentials.model');
const User = require('../models/user.model');
const Lender = require('../models/lender.model');

// Ensure we never send encrypted secrets back
const publicSelect = '';
const secretSelect = '+usernameEnc +passwordEnc +iv +authTag';

// Create new credential (for Company or User)
exports.createCredential = async (req, res, next) => {
  try {
    const { ownerType, ownerId, username, password, vendorKey, vendorName } = req.body;

    if (!ownerType || !ownerId || !username || !password || !vendorKey || !vendorName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existingCredential = await CreditVendorCredential.findOne({ username });
    if (existingCredential) {
      return res.status(400).json({ success: false, message: 'A credential with this username already exists' });
    }

    // Access control: if ownerType is Company, user must belong to that company or be admin/company role
    if (ownerType === 'Company') {
      const user = req.user;
      const isCompanyUser = user.company && String(user.company) === String(ownerId);
      const isCompanyRole = user.role === 'company';
      if (!isCompanyUser && !isCompanyRole) {
        return res.status(403).json({ success: false, message: 'Not authorized to create company credentials for this company' });
      }
    } else if (ownerType === 'User') {
      // User can create for self; admin/company can create for users in their org
      const user = req.user;
      const isSelf = String(user._id) === String(ownerId);
      if (!isSelf) {
        return res.status(403).json({ success: false, message: 'Not authorized to create credentials for this user' });
      }
    }

    const doc = new CreditVendorCredential({ ownerType, ownerId, vendorKey, vendorName, username });
    doc.setPassword(password);
    await doc.save();

    const result = await CreditVendorCredential.findById(doc._id).select(publicSelect);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.code === 11000) {
      // duplicate key error
      if (err.keyPattern.username) {
        return res.status(400).json({ error: "Username already exists globally" });
      }
      if (err.keyPattern.userId && err.keyPattern.vendorKey) {
        return res.status(400).json({ error: "User already has credentials for this vendor" });
      }
    }
    return next(err);
  }
};

// Update existing credential (metadata and/or secrets)
exports.updateCredential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vendorKey, vendorName, username, password } = req.body;

    const doc = await CreditVendorCredential.findById(id).select(secretSelect);
    if (!doc) return res.status(404).json({ success: false, message: 'Credential not found' });

    // Authorization: user must own it or be admin/company owner
    const user = req.user;
    const isOwner = (doc.ownerType === 'User' && String(doc.ownerId) === String(user._id)) ||
      (doc.ownerType === 'Company' && user.company && String(doc.ownerId) === String(user.company));
    if ( !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this credential' });
    }

    if (vendorKey !== undefined) doc.vendorKey = String(vendorKey).toLowerCase().trim();
    if (vendorName !== undefined) doc.vendorName = String(vendorName).trim();
    if (password !== undefined) {
      doc.setPassword(password);
    }
    if (username !== undefined) {
      doc.username = String(username).trim();
    }

    await doc.save();
    const result = await CreditVendorCredential.findById(doc._id).select(publicSelect);
    return res.json({ success: true, data: result });
  } catch (err) {
    if (err.code === 11000) {
      // duplicate key error
      if (err.keyPattern.username) {
        return res.status(400).json({ error: "Username already exists globally" });
      }
      if (err.keyPattern.userId && err.keyPattern.vendorKey) {
        return res.status(400).json({ error: "User already has credentials for this vendor" });
      }
    }
    return next(err);
  }
};

// Delete credential
exports.deleteCredential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await CreditVendorCredential.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Credential not found' });

    const user = req.user;
    const isOwner = (doc.ownerType === 'User' && String(doc.ownerId) === String(user._id)) ||
      (doc.ownerType === 'Company' && user.company && String(doc.ownerId) === String(user.company));
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this credential' });
    }

    await CreditVendorCredential.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (err) {
    if (err.code === 11000) {
      // duplicate key error
      if (err.keyPattern.username) {
        return res.status(400).json({ error: "Username already exists globally" });
      }
      if (err.keyPattern.userId && err.keyPattern.vendorKey) {
        return res.status(400).json({ error: "User already has credentials for this vendor" });
      }
    }
    return next(err);
  }
};

// Get all company credentials
exports.getCompanyCredentials = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    // Authorization: requester must belong to company or be admin/company role
    const user = req.user;
    const isCompanyUser = user.company && String(user.company) === String(companyId);
    const isCompanyRole = user.role === 'company';
    if (!isCompanyUser && !isCompanyRole) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these credentials' });
    }

    const creds = await CreditVendorCredential.find({ ownerType: 'Company', ownerId: companyId }).select(publicSelect).sort({ createdAt: -1 });
    return res.json({ 
        success: true, 
        data: creds 
    });
  } catch (error) {
    return next(error);
  }
};

// Get credentials for a lender (user)
// Default: lender-only; if ?scope=both and same company, include company creds too
exports.getLenderEffectiveCredentials = async (req, res, next) => {
  try {
    const { lenderUserId } = req.params;
    const { scope } = req.query;
    console.log("SCOPE: ", scope);

    // Auth: lender can fetch own or admin/company can fetch within org
    const requester = req.user;

    const lender = await Lender.findOne({user: lenderUserId});
    if (!lender) return res.status(404).json({ success: false, message: 'Lender not found' });
    
    

    const userCreds = await CreditVendorCredential
      .find({ ownerType: 'User', ownerId: lenderUserId })
      .select(publicSelect)
      .sort({ createdAt: -1 });

    if (scope === 'both' && lender.company) {
      const companyCreds = await CreditVendorCredential
        .find({ ownerType: 'Company', ownerId: lender.company })
        .select(publicSelect)
        .sort({ createdAt: -1 });

      console.log("COMPANY CREDENTIALS: ", companyCreds);

      return res.json({ success: true, data: { user: userCreds, company: companyCreds } });
    }

    return res.json({ success: true, data: userCreds });
  } catch (error) {
    return next(error);
  }
};


