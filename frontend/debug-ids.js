/**
 * Debug script for assets checkbox behavior
 */

// Function to simulate the asset creation
function addAccount() {
  const now = Date.now();
  console.log(`Adding account with timestamp: ${now}`);
  return {
    id: `account-${now}`,
    bankName: '',
    accountType: 'Checking',
    value: '',
    isVerified: false,
    isLiquid: false
  };
}

// Add two accounts with a small delay between them
const account1 = addAccount();
setTimeout(() => {
  const account2 = addAccount();
  
  console.log('Account 1 details:');
  console.log(` - ID: ${account1.id}`);
  console.log(` - Generated at: ${account1.id.split('-')[1]}`);
  
  console.log('Account 2 details:');
  console.log(` - ID: ${account2.id}`);
  console.log(` - Generated at: ${account2.id.split('-')[1]}`);
  
  console.log('Time difference between accounts:', account2.id.split('-')[1] - account1.id.split('-')[1], 'ms');
}, 10);
