// Asset ID generation test script
// Run this in your browser console to test if IDs are being generated uniquely

function testUniqueIdGeneration() {
  // Generate some test IDs
  const ids = [];
  for (let i = 0; i < 10; i++) {
    const accountId = `account-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const stockId = `stock-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const giftId = `gift-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    ids.push(accountId, stockId, giftId);
    
    // Add some delay to ensure timestamp differences
    const start = Date.now();
    while (Date.now() - start < 10) {} // Small delay
  }
  
  // Check for duplicates
  const uniqueIds = new Set(ids);
  console.log(`Generated ${ids.length} IDs, ${uniqueIds.size} are unique`);
  console.log(`Duplicates: ${ids.length - uniqueIds.size}`);
  
  if (uniqueIds.size !== ids.length) {
    console.error('WARNING: Found duplicate IDs!');
    // Find the duplicates
    const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
    console.error('Duplicate IDs:', duplicates);
  } else {
    console.log('All IDs are unique!');
  }
  
  // Log all generated IDs
  console.log('Generated IDs:');
  ids.forEach((id, index) => {
    console.log(`${index + 1}: ${id}`);
  });
  
  return {
    allIds: ids,
    uniqueIds: uniqueIds,
    hasDuplicates: uniqueIds.size !== ids.length
  };
}

// Execute the test
const result = testUniqueIdGeneration();
console.log('Test result:', result);
