// Test ID generation for uniqueness
// You can run this in the browser console to verify the uniqueness algorithm

function testIdGeneration() {
  console.log('Testing ID generation for uniqueness...');
  
  const ids = [];
  
  // Generate 100 IDs in quick succession
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 10);
    const id = `account-${timestamp}-${randomString}`;
    ids.push(id);
  }
  
  // Check for uniqueness
  const uniqueIds = new Set(ids);
  console.log(`Generated ${ids.length} IDs, ${uniqueIds.size} are unique`);
  
  if (uniqueIds.size !== ids.length) {
    console.error('PROBLEM: Found duplicate IDs!');
    // Find duplicates
    const seen = new Set();
    const duplicates = ids.filter(id => {
      if (seen.has(id)) {
        return true;
      }
      seen.add(id);
      return false;
    });
    console.error('Duplicate IDs:', duplicates);
  } else {
    console.log('SUCCESS: All IDs are unique!');
  }
  
  return {
    allIds: ids,
    uniqueSize: uniqueIds.size,
    success: uniqueIds.size === ids.length
  };
}

// Run the test
const result = testIdGeneration();
console.log('Test result:', result);
