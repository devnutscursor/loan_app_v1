/**
 * Conforming Loan Limits - Used for MCR classification (Conforming vs Jumbo)
 * 
 * Updated annually by FHFA. These are the 2025/2026 limits.
 * The MCR needs this to classify loans as Conforming vs Jumbo in:
 *   - RMLA Section II (I010–I080): Product type breakdown
 *   - Tab 2: Closed Loan Data bucketing
 * 
 * Source: Federal Housing Finance Agency (FHFA)
 * https://www.fhfa.gov/conforming-loan-limits
 */

const CONFORMING_LIMITS = {
  // Default (most counties)
  default: {
    oneUnit: 766550,
    twoUnit: 981500,
    threeUnit: 1186350,
    fourUnit: 1474400
  },
  // High-cost areas (Alaska, Hawaii, and certain high-cost metropolitan areas)
  highCost: {
    oneUnit: 1149825,
    twoUnit: 1472250,
    threeUnit: 1779525,
    fourUnit: 2211600
  }
};

// High-cost area counties (FIPS codes) — most common
// Full list should be loaded from FHFA data
const HIGH_COST_AREAS = {
  // California
  CA: ['06037', '06075', '06081', '06085', '06041'],  // LA, SF, San Mateo, Santa Clara, Marin
  // New York
  NY: ['36061', '36047', '36081', '36005', '36085'],  // Manhattan, Brooklyn, Queens, Bronx, Staten Island
  // DC Metro
  DC: ['11001'],
  VA: ['51013', '51059', '51107', '51153', '51510'],  // Arlington, Fairfax, Loudoun, Prince William, Alexandria
  MD: ['24031', '24033', '24017'],                      // Montgomery, Prince George's, Charles
  // Colorado
  CO: ['08031', '08005', '08013', '08014', '08035'],  // Denver, Arapahoe, Boulder, Broomfield, Douglas
  // Hawaii (entire state)
  HI: ['15001', '15003', '15005', '15007', '15009'],
  // Alaska (entire state)
  AK: ['02000'],
  // Massachusetts
  MA: ['25025', '25017', '25021', '25023'],            // Suffolk, Middlesex, Norfolk, Plymouth
  // Washington
  WA: ['53033'],                                        // King County (Seattle)
  // New Jersey
  NJ: ['34013', '34017', '34023', '34025', '34027', '34029', '34031', '34035', '34037', '34039']
};

/**
 * Determine if a loan amount exceeds the conforming limit
 * @param {Number} loanAmount - The loan amount
 * @param {Number} units - Number of units (1-4)
 * @param {String} stateCode - 2-letter state code
 * @param {String} countyFips - 5-digit FIPS county code (optional)
 * @returns {Boolean} true if Jumbo (exceeds conforming limit)
 */
function isJumbo(loanAmount, units = 1, stateCode = null, countyFips = null) {
  const unitKey = ['oneUnit', 'twoUnit', 'threeUnit', 'fourUnit'][Math.min(units, 4) - 1];
  
  // Check if the area is high-cost
  let isHighCost = false;
  if (stateCode === 'AK' || stateCode === 'HI') {
    isHighCost = true;
  } else if (stateCode && countyFips && HIGH_COST_AREAS[stateCode]) {
    isHighCost = HIGH_COST_AREAS[stateCode].includes(countyFips);
  }
  
  const limit = isHighCost ? CONFORMING_LIMITS.highCost[unitKey] : CONFORMING_LIMITS.default[unitKey];
  return loanAmount > limit;
}

/**
 * Get the conforming limit for a specific area
 * @param {Number} units - Number of units (1-4)
 * @param {String} stateCode - 2-letter state code
 * @param {String} countyFips - 5-digit FIPS county code (optional)
 * @returns {Number} The conforming limit
 */
function getConformingLimit(units = 1, stateCode = null, countyFips = null) {
  const unitKey = ['oneUnit', 'twoUnit', 'threeUnit', 'fourUnit'][Math.min(units, 4) - 1];
  
  let isHighCost = false;
  if (stateCode === 'AK' || stateCode === 'HI') {
    isHighCost = true;
  } else if (stateCode && countyFips && HIGH_COST_AREAS[stateCode]) {
    isHighCost = HIGH_COST_AREAS[stateCode].includes(countyFips);
  }
  
  return isHighCost ? CONFORMING_LIMITS.highCost[unitKey] : CONFORMING_LIMITS.default[unitKey];
}

// US States list for MCR state selection
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  // Territories
  { code: 'AS', name: 'American Samoa' }, { code: 'GU', name: 'Guam' },
  { code: 'MP', name: 'Northern Mariana Islands' },
  { code: 'PR', name: 'Puerto Rico' }, { code: 'VI', name: 'US Virgin Islands' }
];

module.exports = {
  CONFORMING_LIMITS,
  HIGH_COST_AREAS,
  isJumbo,
  getConformingLimit,
  US_STATES
};
