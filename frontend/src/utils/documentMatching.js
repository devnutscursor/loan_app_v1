// src/utils/documentMatching.js

// Calculate match score between a requirement and document
export const calculateMatchScore = (requirement, document) => {
  let score = 0;
  
  // Get normalized values for comparison (case insensitive)
  const docCategory = document.category ? document.category.toLowerCase() : '';
  const docType = document.documentType ? document.documentType.toLowerCase() : '';
  const reqCategory = requirement.category ? requirement.category.toLowerCase() : '';
  const reqType = requirement.documentType ? requirement.documentType.toLowerCase() : '';
  const docName = (document.name || document.originalFilename || '').toLowerCase();
  const reqTitle = (requirement.title || '').toLowerCase();
  const reqId = requirement.id;
  
  // Check for exact matches by ID - most precise identification
  if (reqId === 'identification' && 
      (docCategory.includes('identity') || docType.includes('license') || docType.includes('passport'))) {
    return 200; // Give highest score for identification documents
  }
  
  if (reqId === 'proofOfIncome' && 
      (docCategory.includes('income') || docType.includes('pay stub') || docType.includes('w-2'))) {
    return 200; // High score for income documents
  }
  
  if (reqId === 'selfEmployedPL' && 
      (docName.includes('business') || docName.includes('tax') || docName.includes('k-1'))) {
    return 200; // High score for business tax returns
  }
  
  if (reqId === 'scheduleC' && 
      (docName.includes('schedule c') || docName.includes('profit') || docName.includes('loss'))) {
    return 200; // High score for Schedule C
  }
  
  if (reqId === 'bankStatements' && 
      (docCategory.includes('financial') || docType.includes('bank') || docName.includes('bank'))) {
    return 200; // High score for bank statements
  }
  
  if (reqId === 'retirementAccount' && 
      (docName.includes('retirement') || docName.includes('401k') || docName.includes('ira'))) {
    return 200; // High score for retirement accounts
  }
  
  if (reqId === 'mortgageStatement' && 
      (docName.includes('mortgage') || docType.includes('mortgage'))) {
    return 200; // High score for mortgage statements
  }
  
  if (reqId === 'taxes' && 
      (docName.includes('tax') || docName.includes('property tax'))) {
    return 200; // High score for property taxes
  }
  
  if (reqId === 'insurance' && 
      (docName.includes('insurance') || docName.includes('policy'))) {
    return 200; // High score for insurance documents
  }
  
  if (reqId === 'employmentVerification' && 
      (docCategory.includes('employment') || docName.includes('employ'))) {
    return 200; // High score for employment verification
  }
  
  if (reqId === 'addressVerification' && 
      (docCategory.includes('address') || docName.includes('utility') || docName.includes('bill'))) {
    return 200; // High score for address verification
  }
  
  // Exact category match is highest priority for general matches
  if (docCategory === reqCategory) {
    score += 100;
  } else if (docCategory.includes(reqCategory) || reqCategory.includes(docCategory)) {
    // Partial category match
    score += 50;
  }
  
  // Exact document type match is also high priority
  if (docType === reqType) {
    score += 100;
  } else if (docType.includes(reqType) || reqType.includes(docType)) {
    // Partial document type match
    score += 50;
  }
  
  // Title matching is important
  if (reqTitle && docName) {
    // Check for exact title matches
    if (docName.includes(reqTitle)) {
      score += 80;
    }
    
    // Check for key words in title
    const titleWords = reqTitle.split(' ');
    for (const word of titleWords) {
      if (word.length > 3 && docName.includes(word)) {
        score += 20; // Add points for each significant matching word
      }
    }
  }
  
  console.log(`Score for ${reqId} with doc ${docName}: ${score}`);
  return score;
};

// Assign documents to requirements based on scoring
export const assignDocumentsToRequirements = (requirements, documents) => {
  const assignments = {};
  const assignedDocIds = new Set();
  
  // Log what we're working with
  console.log('Assigning documents to requirements:', { 
    requirements: requirements.map(r => ({ id: r.id, title: r.title, category: r.category, documentType: r.documentType })),
    documents: documents.map(d => ({ id: d._id, name: d.name, category: d.category, documentType: d.documentType }))
  });
  
  // First pass: check if documents have explicit requirement tags
  // This would be the most reliable method if available
  documents.forEach(doc => {
    if (assignedDocIds.has(doc._id)) return;
    
    // Check if document has an explicit requirementId field
    if (doc.requirementId) {
      const matchingReq = requirements.find(req => req.id === doc.requirementId);
      if (matchingReq && !assignments[matchingReq.id]) {
        assignments[matchingReq.id] = doc;
        assignedDocIds.add(doc._id);
        console.log(`Direct ID match found: Document ${doc.name || doc.originalFilename} assigned to ${matchingReq.title}`);
      }
    }
  });
  
  // Second pass: try to match by specific document types
  // This ensures we correctly map specific document types like property taxes and mortgage statements
  requirements.forEach(req => {
    if (assignments[req.id]) return; // Already assigned
    
    // Define criteria for matching based on document type, category, and filename
    const findSpecificMatch = (doc) => {
      if (assignedDocIds.has(doc._id)) return false;
      
      const docName = (doc.name || doc.originalFilename || '').toLowerCase();
      const docCategory = (doc.category || '').toLowerCase();
      const docType = (doc.documentType || '').toLowerCase();
      
      // Specific document type matching for clarity and reliability
      switch (req.id) {
        case 'mortgageStatement':
          return docName.includes('mortgage') || docType.includes('mortgage');
          
        case 'taxes':
          return docName.includes('tax') || docName.includes('property tax') ||
                 docType.includes('tax') || docCategory === 'property';
                 
        case 'retirementAccount':
          return docName.includes('retirement') || docName.includes('401') || 
                 docName.includes('ira') || docType.includes('retirement');
                 
        case 'insurance':
          return docName.includes('insurance') || docType.includes('insurance') ||
                 docCategory === 'insurance';
                 
        case 'identification':
          return docCategory === 'identity' || docType.includes('license') || 
                 docType.includes('passport') || docName.includes('id');
                 
        case 'bankStatements':
          return docName.includes('bank') || docType.includes('bank') || 
                 docCategory === 'financial';
                 
        case 'proofOfIncome':
          return docName.includes('income') || docType.includes('pay stub') || 
                 docType.includes('w-2') || docCategory === 'income';
                 
        case 'selfEmployedPL':
          return docName.includes('business') || docName.includes('tax return') || 
                 docName.includes('k-1');
                 
        case 'scheduleC':
          return docName.includes('schedule') || docName.includes('profit') || 
                 docName.includes('loss');
                 
        case 'employmentVerification':
          return docCategory === 'employment' || docName.includes('employment') ||
                 docName.includes('verification');
                 
        case 'addressVerification':
          return docCategory === 'address' || docName.includes('utility') ||
                 docName.includes('bill') || docType.includes('utility');
                 
        default:
          return false;
      }
    };
    
    // Find documents matching our specific criteria
    const specificMatches = documents.filter(findSpecificMatch);
    
    if (specificMatches.length > 0) {
      const doc = specificMatches[0];
      assignments[req.id] = doc;
      assignedDocIds.add(doc._id);
      console.log(`Specific match: ${req.id} (${req.title}) matched with ${doc.name || doc.originalFilename}`);
    }
  });
  
  // Third pass: Direct category and document type matching
  requirements.forEach(req => {
    if (assignments[req.id]) return; // Already assigned
    
    const reqCategory = (req.category || '').toLowerCase();
    const reqDocType = (req.documentType || '').toLowerCase();
    
    const exactMatches = documents.filter(doc => {
      if (assignedDocIds.has(doc._id)) return false;
      
      const docCategory = (doc.category || '').toLowerCase();
      const docType = (doc.documentType || '').toLowerCase();
      
      return docCategory === reqCategory && (docType === reqDocType || docType.includes(reqDocType) || reqDocType.includes(docType));
    });
    
    if (exactMatches.length > 0) {
      const doc = exactMatches[0];
      assignments[req.id] = doc;
      assignedDocIds.add(doc._id);
      console.log(`Category/type match: ${req.title} matched with ${doc.name || doc.originalFilename}`);
    }
  });
  
  // Final pass: For remaining unmatched requirements, use the scoring system
  const scores = [];
  
  requirements.forEach(req => {
    // Skip if this requirement already has a document assigned
    if (assignments[req.id]) return;
    
    documents.forEach(doc => {
      // Skip if this document has already been assigned
      if (assignedDocIds.has(doc._id)) return;
      
      const score = calculateMatchScore(req, doc);
      if (score > 0) {
        scores.push({ reqId: req.id, docId: doc._id, doc, score, reqTitle: req.title });
      }
    });
  });
  
  // Sort scores from highest to lowest
  scores.sort((a, b) => b.score - a.score);
  console.log('Score-based matches for remaining documents:', 
    scores.map(s => `${s.reqTitle} with ${s.doc.name || s.doc.originalFilename}: ${s.score}`));
  
  // Assign documents to requirements based on highest scores first
  scores.forEach(score => {
    // Skip if this requirement or document has been assigned in a previous iteration
    if (assignments[score.reqId] || assignedDocIds.has(score.docId)) return;
    
    // Make the assignment
    assignments[score.reqId] = score.doc;
    assignedDocIds.add(score.docId);
    console.log(`Score-based match: ${score.reqId} matched with document ${score.doc.name || score.doc.originalFilename} (score: ${score.score})`);
  });
  
  return assignments;
};
