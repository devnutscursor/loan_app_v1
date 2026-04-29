/**
 * First-time home buyer product routing hints (documentation / API metadata).
 * Not a hard filter — catalog and pricing behavior are primarily client-driven.
 */
function applyFthbLogic(isFirstTimeBuyer, affordableFlag) {
  const products = ['CONV', 'FHA', 'VA', 'USDA'];
  if (!isFirstTimeBuyer) {
    return { products, note: 'Standard borrower' };
  }
  const withHrHp = [...products, 'HOMEREADY', 'HOMEPOSSIBLE'];
  if (affordableFlag) {
    return {
      products: ['HOMEREADY', 'HOMEPOSSIBLE'],
      note: 'FTHB + Affordable → Only affordable programs shown',
    };
  }
  return {
    products: withHrHp,
    note: 'First-Time Buyer benefits applied',
  };
}

function fthbRoutingFromBody(body) {
  const fthb = body.firstTimeHomeBuyer === 1 || body.firstTimeHomeBuyer === true;
  const affordable = body.amiIlpaWaiver === 1 || body.amiIlpaWaiver === true;
  return applyFthbLogic(fthb, affordable);
}

module.exports = {
  applyFthbLogic,
  fthbRoutingFromBody,
};
