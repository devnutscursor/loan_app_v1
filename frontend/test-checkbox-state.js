// Test script to verify checkbox state independence
// This can be run in the browser console when viewing the assets form

function testCheckboxIndependence() {
  console.log('Testing checkbox independence across asset cards...');
  
  // Find all checkbox inputs in the form
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  console.log(`Found ${checkboxes.length} checkboxes on the page`);
  
  // Group checkboxes by their containing card
  const cardMap = new Map();
  let cardIndex = 0;
  
  checkboxes.forEach((checkbox) => {
    // Find the parent card (div with border and rounded corners)
    let card = checkbox.closest('.border.rounded-md');
    
    if (card) {
      // Get or create an ID for this card
      let cardId = card.getAttribute('data-card-id');
      if (!cardId) {
        cardId = `card-${cardIndex++}`;
        card.setAttribute('data-card-id', cardId);
      }
      
      // Add this checkbox to the card's collection
      if (!cardMap.has(cardId)) {
        cardMap.set(cardId, []);
      }
      cardMap.get(cardId).push(checkbox);
      
      // Add data attributes for debugging
      checkbox.setAttribute('data-card-id', cardId);
      checkbox.setAttribute('data-checkbox-type', 
        checkbox.nextElementSibling.textContent.trim());
    }
  });
  
  console.log(`Identified ${cardMap.size} distinct asset cards`);
  
  // Log each card's checkboxes
  cardMap.forEach((checkboxes, cardId) => {
    console.log(`Card ${cardId} has ${checkboxes.length} checkboxes:`);
    checkboxes.forEach(cb => {
      console.log(`  - ${cb.getAttribute('data-checkbox-type')}: ID=${cb.id}, checked=${cb.checked}`);
    });
  });
  
  console.log('Instructions for manual testing:');
  console.log('1. Check a box in one card');
  console.log('2. Verify that only that specific box is checked');
  console.log('3. Run this function again to see the updated state');
  
  return {
    cardMap,
    toggleFirstCheckbox: () => {
      const firstCard = cardMap.entries().next().value;
      if (firstCard && firstCard[1].length > 0) {
        const checkbox = firstCard[1][0];
        checkbox.checked = !checkbox.checked;
        console.log(`Toggled "${checkbox.getAttribute('data-checkbox-type')}" checkbox in card ${firstCard[0]} to ${checkbox.checked}`);
        
        // Trigger the change event
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
        
        return checkbox;
      }
      return null;
    }
  };
}

// Execute the test on page load
console.log('Ready to test checkbox independence. Run "testCheckboxIndependence()" in console.');
