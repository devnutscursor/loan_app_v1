const Condition = require('../../models/condition.model');
const ConditionLibrary = require('../../models/conditionLibrary.model');
const Loan = require('../../models/loan.model');
const logger = require('../../utils/logger');

/**
 * Controller for managing loan conditions and condition libraries
 */

// Get conditions for a specific loan
exports.getLoanConditions = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const { status, category, priority } = req.query;
    
    const query = { loanId };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    
    const conditions = await Condition.find(query)
      .populate('borrowerId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ priority: -1, createdAt: -1 });
      
    return res.status(200).json({
      success: true,
      count: conditions.length,
      data: conditions
    });
  } catch (error) {
    logger.error(`Error in getLoanConditions: ${error.message}`);
    next(error);
  }
};

// Create a new condition for a loan
exports.createCondition = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    
    // Verify loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Create condition with current user as creator
    const condition = await Condition.create({
      ...req.body,
      loanId,
      createdBy: req.user.id,
      statusHistory: [{
        status: req.body.status || 'pending',
        changedBy: req.user.id
      }]
    });
    
    return res.status(201).json({
      success: true,
      data: condition
    });
  } catch (error) {
    logger.error(`Error in createCondition: ${error.message}`);
    next(error);
  }
};

// Update condition status
exports.updateConditionStatus = async (req, res, next) => {
  try {
    const { conditionId } = req.params;
    const { status, notes } = req.body;
    
    const condition = await Condition.findById(conditionId);
    
    if (!condition) {
      return res.status(404).json({
        success: false,
        message: 'Condition not found'
      });
    }
    
    // Add new status to history
    condition.statusHistory.push({
      status,
      changedBy: req.user.id,
      notes: notes || ''
    });
    
    // Update main status
    condition.status = status;
    
    await condition.save();
    
    return res.status(200).json({
      success: true,
      data: condition
    });
  } catch (error) {
    logger.error(`Error in updateConditionStatus: ${error.message}`);
    next(error);
  }
};

// Add note to a condition
exports.addConditionNote = async (req, res, next) => {
  try {
    const { conditionId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }
    
    const condition = await Condition.findById(conditionId);
    
    if (!condition) {
      return res.status(404).json({
        success: false,
        message: 'Condition not found'
      });
    }
    
    condition.notes.push({
      content,
      createdBy: req.user.id
    });
    
    await condition.save();
    
    return res.status(200).json({
      success: true,
      data: condition
    });
  } catch (error) {
    logger.error(`Error in addConditionNote: ${error.message}`);
    next(error);
  }
};

// Get all conditions from library
exports.getConditionLibrary = async (req, res, next) => {
  try {
    const { category, search, tag } = req.query;
    
    let query = { organizationId: req.user.organizationId, isActive: true };
    
    if (category) query.category = category;
    if (tag) query.tags = tag;
    
    let libraryItems;
    
    if (search) {
      libraryItems = await ConditionLibrary.find({
        ...query,
        $text: { $search: search }
      }).sort({ usageCount: -1 });
    } else {
      libraryItems = await ConditionLibrary.find(query).sort({ usageCount: -1 });
    }
    
    return res.status(200).json({
      success: true,
      count: libraryItems.length,
      data: libraryItems
    });
  } catch (error) {
    logger.error(`Error in getConditionLibrary: ${error.message}`);
    next(error);
  }
};

// Create a new condition library item
exports.createLibraryItem = async (req, res, next) => {
  try {
    const { title, description, category, tags, priority } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    const libraryItem = await ConditionLibrary.create({
      title,
      description,
      category,
      tags,
      priority,
      organizationId: req.user.organizationId,
      createdBy: req.user.id
    });
    
    return res.status(201).json({
      success: true,
      data: libraryItem
    });
  } catch (error) {
    logger.error(`Error in createLibraryItem: ${error.message}`);
    next(error);
  }
};

// Add conditions from library to a loan
exports.addConditionsFromLibrary = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const { conditionIds } = req.body;
    
    if (!conditionIds || !Array.isArray(conditionIds) || conditionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Condition IDs array is required'
      });
    }
    
    // Verify loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Get library conditions
    const libraryConditions = await ConditionLibrary.find({
      _id: { $in: conditionIds },
      organizationId: req.user.organizationId
    });
    
    if (libraryConditions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid condition library items found'
      });
    }
    
    // Create conditions from library items
    const conditionsToCreate = libraryConditions.map(item => ({
      title: item.title,
      description: item.description,
      category: item.category,
      tags: item.tags,
      priority: item.priority,
      loanId,
      createdBy: req.user.id,
      isFromLibrary: true,
      libraryItemId: item._id,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        changedBy: req.user.id
      }]
    }));
    
    const createdConditions = await Condition.insertMany(conditionsToCreate);
    
    // Update usage count for library items
    await Promise.all(
      libraryConditions.map(item => 
        ConditionLibrary.findByIdAndUpdate(
          item._id, 
          { $inc: { usageCount: 1 } }
        )
      )
    );
    
    return res.status(201).json({
      success: true,
      count: createdConditions.length,
      data: createdConditions
    });
  } catch (error) {
    logger.error(`Error in addConditionsFromLibrary: ${error.message}`);
    next(error);
  }
};

// Delete condition
exports.deleteCondition = async (req, res, next) => {
  try {
    const { conditionId } = req.params;
    
    const condition = await Condition.findById(conditionId);
    
    if (!condition) {
      return res.status(404).json({
        success: false,
        message: 'Condition not found'
      });
    }
    
    await condition.remove();
    
    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Error in deleteCondition: ${error.message}`);
    next(error);
  }
};

// Delete library item
exports.deleteLibraryItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    
    const libraryItem = await ConditionLibrary.findOne({
      _id: itemId,
      organizationId: req.user.organizationId
    });
    
    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        message: 'Library item not found'
      });
    }
    
    // Soft delete - mark as inactive
    libraryItem.isActive = false;
    await libraryItem.save();
    
    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Error in deleteLibraryItem: ${error.message}`);
    next(error);
  }
};

// Get all conditions across all loans with filtering options
exports.getAllConditions = async (req, res, next) => {
  try {
    const {
      status,
      priority, 
      category,
      tag,
      search,
      dueDate,
      page = 1,
      limit = 10,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;
    
    // Build query object
    const query = { organizationId: req.user.organizationId };
    
    // Apply filters if provided
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (tag) query.tags = tag;
    
    // Handle due date filtering
    if (dueDate) {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      const startOfNextWeek = new Date(endOfWeek);
      const endOfNextWeek = new Date(startOfNextWeek);
      endOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      switch (dueDate) {
        case 'overdue':
          query.dueDate = { $lt: today };
          query.status = { $nin: ['cleared', 'waived'] };
          break;
        case 'today':
          query.dueDate = { $gte: today, $lt: tomorrow };
          break;
        case 'this_week':
          query.dueDate = { $gte: today, $lt: endOfWeek };
          break;
        case 'next_week':
          query.dueDate = { $gte: startOfNextWeek, $lt: endOfNextWeek };
          break;
        case 'this_month':
          query.dueDate = { $gte: today, $lt: endOfMonth };
          break;
        case 'future':
          query.dueDate = { $gte: tomorrow };
          break;
        default:
          break;
      }
    }
    
    // Handle search (across title, description, and loan info)
    if (search) {
      const loans = await Loan.find({
        organizationId: req.user.organizationId,
        $or: [
          { loanNumber: { $regex: search, $options: 'i' } },
          { 'borrowerInfo.firstName': { $regex: search, $options: 'i' } },
          { 'borrowerInfo.lastName': { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const loanIds = loans.map(loan => loan._id);
      
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { loanId: { $in: loanIds } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const conditions = await Condition.find(query)
      .populate('loanId', 'loanNumber borrowerInfo')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalCount = await Condition.countDocuments(query);
    
    // Process conditions to include borrower name and other helpful fields
    const processedConditions = conditions.map(condition => {
      const loanData = condition.loanId;
      const borrowerName = loanData?.borrowerInfo ? 
        `${loanData.borrowerInfo.firstName} ${loanData.borrowerInfo.lastName}` : 
        '';
      
      return {
        ...condition.toObject(),
        loanNumber: loanData?.loanNumber || '',
        borrowerName
      };
    });
    
    return res.status(200).json({
      success: true,
      data: processedConditions,
      totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCount / parseInt(limit))
    });
  } catch (error) {
    logger.error(`Error in getAllConditions: ${error.message}`);
    next(error);
  }
};

// Get all unique condition tags used across the organization
exports.getConditionTags = async (req, res, next) => {
  try {
    // Aggregate to get unique tags from all conditions in the organization
    const conditionTags = await Condition.aggregate([
      { $match: { organizationId: req.user.organizationId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags' } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get tags from library items too
    const libraryTags = await ConditionLibrary.aggregate([
      { $match: { organizationId: req.user.organizationId, isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags' } },
      { $sort: { _id: 1 } }
    ]);
    
    // Combine and deduplicate tags
    const allTags = [...conditionTags, ...libraryTags]
      .map(tag => tag._id)
      .filter((tag, index, self) => self.indexOf(tag) === index)
      .sort();
    
    return res.status(200).json({
      success: true,
      data: allTags
    });
  } catch (error) {
    logger.error(`Error in getConditionTags: ${error.message}`);
    next(error);
  }
};
