const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const borrowerRoutes = require('./borrower.routes');
const lenderRoutes = require('./lender.routes');
const loanRoutes = require('./loan.routes');
const loanProgramRoutes = require('./loanProgram.routes');
const messageRoutes = require('./message.routes');
const documentRoutes = require('./document.routes');
const notificationRoutes = require('./notification.routes');
const noteRoutes = require('./note.routes');
const adminRoutes = require('./admin.routes');
const companyRoutes = require('./company.routes');
const creditReportRoutes = require('./creditReport.routes');

// Debug route to check uploads directory
router.get('/debug/uploads', (req, res) => {
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  
  try {
    // Check if directory exists
    const exists = fs.existsSync(uploadsDir);
    
    if (exists) {
      // List files in directory
      const files = fs.readdirSync(uploadsDir);
      
      // Get file details
      const fileDetails = files.map(file => {
        const filePath = path.join(uploadsDir, file);
        try {
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            isFile: stats.isFile(),
            created: stats.birthtime,
            accessibleUrl: `/uploads/${file}`
          };
        } catch (err) {
          return { name: file, error: err.message };
        }
      });
      
      res.json({
        success: true,
        directory: uploadsDir,
        exists: true,
        fileCount: files.length,
        files: fileDetails
      });
    } else {
      res.json({
        success: false,
        directory: uploadsDir,
        exists: false,
        message: 'Uploads directory does not exist'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      directory: uploadsDir,
      error: error.message
    });
  }
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
// Alias for legacy singular path
router.use('/user', userRoutes);
router.use('/borrower', borrowerRoutes);
router.use('/lenders', lenderRoutes);
router.use('/loans', loanRoutes);
router.use('/loan-programs', loanProgramRoutes);
router.use('/messages', messageRoutes);
router.use('/documents', documentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/notes', noteRoutes);
router.use('/admin', adminRoutes);
router.use('/companies', companyRoutes);
router.use('/credit-report', creditReportRoutes);

module.exports = router; 