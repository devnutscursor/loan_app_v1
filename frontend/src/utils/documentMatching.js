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
  
  // Special case for identification documents
  if (reqId === 'identification') {
    // Identity document scoring
    if (docCategory.includes('identity') || docCategory.includes('id')) {
      score += 100; // Direct category match or partial match
    }
    
    if (docType.includes('license') || docType.includes('passport') || docType.includes('id')) {
      score += 100; // Direct type match or common ID types
    }
    
    if (docName.includes('id') || docName.includes('identity') || 
        docName.includes('license') || docName.includes('passport')) {
      score += 50; // Name mentions ID concepts
    }
    
    console.log(`ID document score for ${docName}: ${score}`);
    return score;
  }
  
  // Regular scoring for other document types
  
  // Exact category match is highest priority
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
  
  // Fallback to filename/title matching if the above didn't match well
  if (score < 50) {
    // Check if document name contains the requirement title or type
    if (docName.includes(reqTitle)) {
      score += 30;
    }
    
    if (docName.includes(reqType)) {
      score += 30;
    }
  }
  
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
  
  // Direct matches: first try to match by exact category and documentType (case insensitive)
  requirements.forEach(req => {
    if (assignments[req.id]) return; // Already assigned
    
    // Case-insensitive matching for more reliable results
    const reqCategory = req.category ? req.category.toLowerCase() : '';
    const reqDocType = req.documentType ? req.documentType.toLowerCase() : '';
    
    // If this is the identification requirement, add special debug
    if (req.id === 'identification') {
      console.log(`Trying to match identification document. Looking for category: ${reqCategory} and type: ${reqDocType}`);
    }
    
    const exactMatches = documents.filter(doc => {
      if (assignedDocIds.has(doc._id)) return false;
      
      const docCategory = doc.category ? doc.category.toLowerCase() : '';
      const docType = doc.documentType ? doc.documentType.toLowerCase() : '';
      
      // For identification documents specifically, be more flexible in matching
      if (req.id === 'identification') {
        // Consider it a match if either category or document type matches
        const isIdentityMatch = 
          (docCategory.includes('identity') || docCategory.includes('id')) || 
          (docType.includes('license') || docType.includes('passport') || docType.includes('id'));
          
        if (isIdentityMatch) {
          console.log(`Found potential ID document match: ${doc.name || doc.originalFilename}`);
          return true;
        }
      }
      
      return docCategory === reqCategory && docType === reqDocType;
    });
    
    if (exactMatches.length > 0) {
      const doc = exactMatches[0]; // Take the first match
      assignments[req.id] = doc;
      assignedDocIds.add(doc._id);
      console.log(`Direct match found: Requirement ${req.title} (${req.category}/${req.documentType}) matched with document ${doc.name || doc.originalFilename}`);
    }
  });
  
  // For remaining unmatched requirements, use scoring system
  const scores = [];
  
  requirements.forEach(req => {
    // Skip if this requirement already has a document assigned
    if (assignments[req.id]) return;
    
    documents.forEach(doc => {
      // Skip if this document has already been assigned
      if (assignedDocIds.has(doc._id)) return;
      
      const score = calculateMatchScore(req, doc);
      if (score > 0) {
        scores.push({ reqId: req.id, docId: doc._id, doc, score });
      }
    });
  });
  
  // Sort scores from highest to lowest
  scores.sort((a, b) => b.score - a.score);
  console.log('Match scores for remaining documents:', scores);
  
  // Assign documents to requirements based on highest scores first
  scores.forEach(score => {
    // Skip if this requirement or document has been assigned in a previous iteration
    if (assignments[score.reqId] || assignedDocIds.has(score.docId)) return;
    
    // Make the assignment
    assignments[score.reqId] = score.doc;
    assignedDocIds.add(score.docId);
    console.log(`Score-based match found: ${score.reqId} matched with document ${score.doc.name} (score: ${score.score})`);
  });
  
  return assignments;
};
