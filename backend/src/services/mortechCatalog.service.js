const { parseString } = require('xml2js');
const logger = require('../utils/logger');
const { MortechInvestor, MortechProduct } = require('../models/mortechCatalog.model');

const BASE_URL =
  process.env.MORTECH_BASE_URL ||
  'https://thirdparty.mortech-inc.com/mpg/servlet/mpgThirdPartyServlet';

function parseXml(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, { explicitArray: true, trim: true }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function ensureSuccess(header) {
  if (!header) throw new Error('Missing header in Mortech response');
  const errorNum = header.errorNum?.[0];
  const errorDesc = header.errorDesc?.[0] ?? 'Unknown error';
  if (errorNum === undefined) throw new Error('Missing errorNum');
  if (parseInt(String(errorNum), 10) !== 0) {
    throw new Error(`Mortech error ${errorNum}: ${errorDesc}`);
  }
}

function getMortechCredentials() {
  const customerId = process.env.MORTECH_CUSTOMER_ID;
  const thirdPartyName = process.env.MORTECH_THIRD_PARTY_NAME;
  const licenseKey = process.env.MORTECH_LICENSE_KEY;
  const emailAddress = process.env.MORTECH_EMAIL_ADDRESS;

  if (!customerId || !thirdPartyName || !licenseKey || !emailAddress) {
    throw new Error(
      'Missing Mortech env vars (MORTECH_CUSTOMER_ID, MORTECH_THIRD_PARTY_NAME, MORTECH_LICENSE_KEY, MORTECH_EMAIL_ADDRESS)'
    );
  }
  return { customerId, thirdPartyName, licenseKey, emailAddress };
}

/**
 * Fetch all investors from Mortech (request_id=2), then fetch products
 * per investor (request_id=3), and upsert into MongoDB.
 * Mirrors loan-officer-platform's syncMortechCatalogToDb.
 */
async function syncMortechCatalog() {
  const creds = getMortechCredentials();
  const startMs = Date.now();
  logger.info('[mortechCatalog] Starting catalog sync…');

  // 1) Fetch investors (request_id=2)
  const investorsUrl = `${BASE_URL}?${new URLSearchParams({
    request_id: '2',
    customerId: creds.customerId,
    thirdPartyName: creds.thirdPartyName,
    licenseKey: creds.licenseKey,
    emailAddress: creds.emailAddress,
  })}`;

  const investorsRes = await fetch(investorsUrl, {
    headers: { Accept: 'application/xml, text/xml' },
  });
  const investorsXml = await investorsRes.text();
  const investorsParsed = await parseXml(investorsXml);
  const invHeader = investorsParsed.mortech?.header?.[0];
  ensureSuccess(invHeader);

  const investorsRaw = investorsParsed.mortech?.investors?.[0]?.investor ?? [];
  const investors = investorsRaw
    .map((inv) => {
      const parentId = inv.$?.parent_id?.trim();
      const name = inv._?.trim();
      if (!parentId || !name) return null;
      return { parentId, name };
    })
    .filter(Boolean);

  logger.info(`[mortechCatalog] Fetched ${investors.length} investors from Mortech`);

  // 2) Clear existing data and re-insert (full refresh, same as loan-officer-platform)
  await MortechProduct.deleteMany({});
  await MortechInvestor.deleteMany({});

  if (investors.length === 0) {
    logger.warn('[mortechCatalog] No investors returned; catalog is now empty.');
    return { investors: 0, products: 0 };
  }

  // Bulk-insert investors
  const insertedInvestors = await MortechInvestor.insertMany(
    investors.map((inv) => ({ parentId: inv.parentId, name: inv.name, isActive: true }))
  );
  const investorByParentId = new Map(insertedInvestors.map((inv) => [inv.parentId, inv]));

  // 3) Fetch products per investor (request_id=3)
  let totalProducts = 0;
  for (const investor of investors) {
    try {
      const productsUrl = `${BASE_URL}?${new URLSearchParams({
        request_id: '3',
        customerId: creds.customerId,
        thirdPartyName: creds.thirdPartyName,
        licenseKey: creds.licenseKey,
        emailAddress: creds.emailAddress,
        parent_id: investor.parentId,
      })}`;

      const productsRes = await fetch(productsUrl, {
        headers: { Accept: 'application/xml, text/xml' },
      });
      const productsXml = await productsRes.text();
      const productsParsed = await parseXml(productsXml);
      const prodHeader = productsParsed.mortech?.header?.[0];
      ensureSuccess(prodHeader);

      const productsRaw = productsParsed.mortech?.products?.[0]?.product ?? [];
      const dbInv = investorByParentId.get(investor.parentId);

      const productDocs = [];
      for (const product of productsRaw) {
        const productId = product.$?.product_id?.trim();
        const parentId = product.$?.parent_id?.trim() || investor.parentId;
        const vendorProductCode = product.$?.vendor_product_code?.trim();
        const name = product._?.trim();
        if (!productId || !name) continue;

        productDocs.push({
          investor: dbInv?._id || null,
          parentId,
          productId,
          name,
          vendorProductCode: vendorProductCode || null,
          isActive: true,
        });
      }

      if (productDocs.length > 0) {
        await MortechProduct.insertMany(productDocs);
        totalProducts += productDocs.length;
      }

      logger.info(
        `[mortechCatalog] Investor ${investor.name} (${investor.parentId}): ${productDocs.length} products`
      );
    } catch (err) {
      logger.error(
        `[mortechCatalog] Failed to fetch products for investor ${investor.name} (${investor.parentId}): ${err.message}`
      );
    }
  }

  const elapsed = Date.now() - startMs;
  logger.info(
    `[mortechCatalog] Catalog sync complete: ${investors.length} investors, ${totalProducts} products in ${elapsed}ms`
  );

  return { investors: investors.length, products: totalProducts };
}

/**
 * Get all unique products from the catalog, optionally filtered.
 * Returns deduplicated products (unique by productId + name).
 */
async function getCatalogProducts(filter = {}) {
  const query = { isActive: true };

  const products = await MortechProduct.find(query)
    .populate('investor', 'parentId name')
    .sort({ name: 1 })
    .lean();

  // Deduplicate by productId — same product appears under multiple investors
  const seen = new Map();
  const unique = [];
  for (const p of products) {
    if (!seen.has(p.productId)) {
      seen.set(p.productId, true);
      unique.push({
        id: `${p.parentId}:${p.productId}`,
        productId: p.productId,
        parentId: p.parentId,
        name: p.name,
        vendorProductCode: p.vendorProductCode || undefined,
        investorName: p.investor?.name || '',
      });
    }
  }

  return unique;
}

/**
 * Get distinct, deduplicated products grouped for the frontend.
 * Each unique productId+name pair appears once.
 */
async function getUniqueProducts() {
  const products = await MortechProduct.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$productId',
        name: { $first: '$name' },
        vendorProductCode: { $first: '$vendorProductCode' },
        parentId: { $first: '$parentId' },
      },
    },
    { $sort: { name: 1 } },
  ]);

  return products.map((p) => ({
    productId: p._id,
    name: p.name,
    vendorProductCode: p.vendorProductCode || undefined,
    parentId: p.parentId,
  }));
}

module.exports = {
  syncMortechCatalog,
  getCatalogProducts,
  getUniqueProducts,
};
