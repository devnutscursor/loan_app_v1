const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');
const jwt = require('jsonwebtoken');

/** Path to private.pem in backend folder (project-specific, not env) */
const PRIVATE_PEM_PATH = path.join(__dirname, '..', '..', 'private.pem');

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 55 * 60;
let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

class MortechAPI {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'https://thirdparty.mortech-inc.com/mpg/servlet/mpgThirdPartyServlet';
    this.customerId = config.customerId;
    this.thirdPartyName = config.thirdPartyName;
    this.licenseKey = config.licenseKey;
    this.emailAddress = config.emailAddress;
    this.authorizationToken = config.authorizationToken;
    this.xApiKey = config.xApiKey;
    this.partnerId = config.partnerId;
    this.privateKey = config.privateKey;
    this.authUrl = config.authUrl || 'https://api.mortech-inc.com/auth';
    this.accessTokenTtlSeconds =
      typeof config.accessTokenTtlSeconds === 'number' && config.accessTokenTtlSeconds > 0
        ? config.accessTokenTtlSeconds
        : DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
  }

  isJwtAuthConfigured() {
    return Boolean(this.partnerId && this.privateKey && this.xApiKey);
  }

  async getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cachedAccessToken && cachedAccessTokenExpiresAt > now + 30) {
      return cachedAccessToken;
    }

    if (!this.isJwtAuthConfigured()) {
      return this.authorizationToken || null;
    }

    const jwtPayload = {
      partnerId: this.partnerId,
      customerId: this.customerId,
      iat: now,
    };

    const signedJwt = jwt.sign(jwtPayload, this.privateKey, {
      algorithm: 'RS256',
    });

    const authHeaders = {
      authorizationtoken: `Bearer ${signedJwt}`,
      'x-api-key': this.xApiKey,
    };

    const authResponse = await fetch(this.authUrl, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(
        `Mortech Auth API error: ${authResponse.status} ${authResponse.statusText} - ${errorText}`
      );
    }

    const authData = await authResponse.json();
    if (!authData?.accesstoken) {
      throw new Error('Mortech Auth API error: missing accesstoken in response');
    }

    cachedAccessToken = authData.accesstoken;
    cachedAccessTokenExpiresAt = now + this.accessTokenTtlSeconds;
    return cachedAccessToken;
  }

  async getRates(request, options = {}) {
    try {
      const params = new URLSearchParams({
        request_id: '1',
        customerId: this.customerId,
        thirdPartyName: this.thirdPartyName,
        licenseKey: this.licenseKey,
        emailAddress: this.emailAddress,
        targetPrice: (request.targetPrice !== undefined && request.targetPrice !== null ? request.targetPrice : -999).toString(),
        propertyZip: request.propertyZip,
        appraisedvalue: request.appraisedvalue.toString(),
        loan_amount: request.loan_amount.toString(),
        fico: request.fico.toString(),
        loanpurpose: request.loanpurpose,
        proptype: request.proptype,
        occupancy: request.occupancy,
        loanProduct1: request.loanProduct1,
        ...(request.view !== undefined && { view: request.view.toString() }),
        ...(request.filterId && { filterId: request.filterId }),
        ...(request.pmiCompany && { pmiCompany: request.pmiCompany.toString() }),
        ...(request.noMI !== undefined && { noMI: request.noMI.toString() }),
        ...(request.financeMI !== undefined && { financeMI: request.financeMI.toString() }),
        ...(request.vaType && { vaType: request.vaType }),
        ...(request.subsequentUse !== undefined && { subsequentUse: request.subsequentUse.toString() }),
        ...(request.waiveescrow !== undefined && { waiveescrow: request.waiveescrow.toString() }),
        ...(request.militaryVeteran === true && { militaryVeteran: 'true' }),
        ...(request.lockindays && request.lockindays !== '30' && { lockindays: request.lockindays.toString() }),
        ...(typeof request.secondMortgageAmount === 'number' && request.secondMortgageAmount > 0
          ? { secondMortgageAmount: request.secondMortgageAmount.toString() }
          : {}),
      });

      const accessToken = await this.getAccessToken();
      const headers = {
        Accept: 'application/xml, text/xml',
        'User-Agent': 'LoanApp/1.0',
        ...(accessToken && { authorizationtoken: accessToken }),
        ...(this.xApiKey && { 'x-api-key': this.xApiKey }),
      };

      let response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        if (this.isJwtAuthConfigured()) {
          cachedAccessToken = null;
          cachedAccessTokenExpiresAt = 0;
          const refreshedToken = await this.getAccessToken();
          const retryHeaders = {
            ...headers,
            authorizationtoken: refreshedToken,
          };
          response = await fetch(`${this.baseUrl}?${params.toString()}`, {
            method: 'GET',
            headers: retryHeaders,
          });
        }
      }

      if (!response.ok) {
        throw new Error(`Mortech API error: ${response.status} ${response.statusText}`);
      }

      const xmlData = await response.text();
      const parsedResponse = await this.parseXMLResponse(xmlData);

      if (options.includeRawXml) {
        parsedResponse.rawXml = xmlData;
      }

      return parsedResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  parseXMLResponse(xmlData) {
    return new Promise((resolve) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          resolve({
            success: false,
            error: 'Failed to parse XML response',
          });
          return;
        }

        try {
          const mortech = result.mortech;
          const errorNum = parseInt(mortech.header[0].errorNum[0], 10);
          const errorDesc = mortech.header[0].errorDesc[0];

          if (errorNum !== 0) {
            resolve({
              success: false,
              error: errorDesc,
            });
            return;
          }

          const quotes = [];
          if (mortech.results) {
            for (const resultItem of mortech.results) {
              const quoteList = Array.isArray(resultItem.quote) ? resultItem.quote : [resultItem.quote];
              const eligibilityList = resultItem.eligibility
                ? (Array.isArray(resultItem.eligibility) ? resultItem.eligibility : [resultItem.eligibility])
                : [];

              for (let qIdx = 0; qIdx < quoteList.length; qIdx++) {
                const quote = quoteList[qIdx];
                const quoteDetail = quote.quote_detail[0];
                const eligibility = eligibilityList[qIdx] || eligibilityList[0] || { eligibilityCheck: [''], comments: [''], productSummaryLink: [''], productGuidelineLink: [''] };

                const fees = [];
              let borrowerRebate = null;
              if (quoteDetail.fees && quoteDetail.fees[0]) {
                const feesBlock = quoteDetail.fees[0];
                if (feesBlock.borrowerRebate && feesBlock.borrowerRebate[0] !== undefined) {
                  const raw = feesBlock.borrowerRebate[0];
                  const num = parseFloat(typeof raw === 'string' ? raw : raw.toString?.() ?? '');
                  if (!Number.isNaN(num)) borrowerRebate = num;
                }
                if (feesBlock.fee_list) {
                  const feeList = feesBlock.fee_list;
                  if (Array.isArray(feeList)) {
                    for (const feeItem of feeList) {
                      const feeData = feeItem.$ || feeItem;
                      if (feeData && (feeData.description || feeData.feeamount !== undefined)) {
                        fees.push({
                          hudline: feeData.hudline || '',
                          description: feeData.description || '',
                          feeamount: parseFloat(feeData.feeamount || '0'),
                          section: feeData.section || '',
                          paymenttype: feeData.paymenttype || '',
                          prepaid: feeData.prepaid === 'true',
                        });
                      }
                    }
                  } else if (feeList.$) {
                    fees.push({
                      hudline: feeList.$.hudline || '',
                      description: feeList.$.description || '',
                      feeamount: parseFloat(feeList.$.feeamount || '0'),
                      section: feeList.$.section || '',
                      paymenttype: feeList.$.paymenttype || '',
                      prepaid: feeList.$.prepaid === 'true',
                    });
                  }
                }
              }

              const adjustments = [];
              if (quoteDetail.adjustments && quoteDetail.adjustments[0] && quoteDetail.adjustments[0].adjustment_detail) {
                const adjList = quoteDetail.adjustments[0].adjustment_detail;
                const list = Array.isArray(adjList) ? adjList : [adjList];
                for (const a of list) {
                  const att = a.$ || a;
                  if (att) {
                    adjustments.push({
                      desc: att.desc || '',
                      price_adj: parseFloat(att.price_adj || '0'),
                      rate_adj: parseFloat(att.rate_adj || '0'),
                      margin_adj: parseFloat(att.margin_adj || '0'),
                      applied: att.applied === 'true',
                    });
                  }
                }
              }

              let specialBonusAdj = null;
              if (quoteDetail.special_bonuses && quoteDetail.special_bonuses[0]) {
                const sb = quoteDetail.special_bonuses[0];
                const val = sb.$?.total_special_bonus_adj ?? sb.total_special_bonus_adj?.[0];
                if (val !== undefined && val !== null) {
                  const n = parseFloat(val);
                  if (!Number.isNaN(n)) specialBonusAdj = n;
                }
              }

              let costsAndProfit = null;
              if (quoteDetail.costs_and_profit && quoteDetail.costs_and_profit[0]) {
                const cap = quoteDetail.costs_and_profit[0];
                const att = cap.$ || {};
                const profitDetail = cap.profit_detail?.[0];
                let amtFromBorrowerPercent = null;
                let amtFromBorrowerDollar = null;
                if (profitDetail && profitDetail.amt_from_borrower && profitDetail.amt_from_borrower[0]) {
                  const ab = profitDetail.amt_from_borrower[0].$ || profitDetail.amt_from_borrower[0];
                  if (ab.profit_percent != null) amtFromBorrowerPercent = parseFloat(ab.profit_percent);
                  if (ab.profit_dollar != null) amtFromBorrowerDollar = parseFloat(ab.profit_dollar);
                }
                costsAndProfit = {
                  profitTable: att.profit_table || '',
                  totalCostProfitDollar: parseFloat(att.total_cost_profit_dollar || '0'),
                  totalCostProfitPercent: parseFloat(att.total_cost_profit_percent || '0'),
                  amtFromBorrowerPercent: Number.isFinite(amtFromBorrowerPercent) ? amtFromBorrowerPercent : null,
                  amtFromBorrowerDollar: Number.isFinite(amtFromBorrowerDollar) ? amtFromBorrowerDollar : null,
                };
              }

              const productNameResult = resultItem.$.product_name || quote.$.productDesc;

                quotes.push({
                  productId: quote.$.product_id,
                  productName: productNameResult?.trim?.() || quote.$.productDesc,
                  vendorName: quote.$.vendor_name,
                  vendorProductName: quote.$.vendor_product_name,
                  vendorProductCode: quote.$.vendor_product_code,
                  productDesc: quote.$.productDesc,
                  productTerm: quote.$.productTerm,
                  rate: parseFloat(quoteDetail.$.rate),
                  apr: parseFloat(quoteDetail.$.apr),
                  monthlyPayment: parseFloat(quoteDetail.$.piti),
                  points: parseFloat(quoteDetail.$.price),
                  originationFee: parseFloat(quoteDetail.$.originationFee),
                  upfrontFee: parseFloat(quoteDetail.$.upfrontFee),
                  monthlyPremium: parseFloat(quoteDetail.$.monthlyPremium),
                  downPayment: parseFloat(quoteDetail.$.downPayment),
                  loanAmount: parseFloat(quoteDetail.$.loanAmount),
                  lockTerm: parseInt(resultItem.$.lockTerm, 10),
                  termType: resultItem.$.termType,
                  prepayType: quoteDetail.$.prepayType || '',
                  pricingStatus: quote.$.pricingStatus || '',
                  lastUpdate: quote.$.lastUpdate || '',
                  ratesheetPrice: quoteDetail.ratesheet_price?.[0] != null ? parseFloat(quoteDetail.ratesheet_price[0]) : null,
                  srp: quoteDetail.srp?.[0] != null ? parseFloat(quoteDetail.srp[0]) : null,
                  adjustments,
                  specialBonusAdj,
                  costsAndProfit,
                  borrowerRebate,
                  fees,
                  eligibility: {
                    eligibilityCheck: eligibility.eligibilityCheck?.[0] ?? '',
                    comments: eligibility.comments?.[0] ?? '',
                    productSummaryLink: eligibility.productSummaryLink?.[0] ?? '',
                    productGuidelineLink: eligibility.productGuidelineLink?.[0] ?? '',
                  },
                });
              }
            }
          }

          resolve({
            success: true,
            quotes,
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: 'Failed to parse response data',
          });
        }
      });
    });
  }
}

const createMortechAPI = () => {
  const customerId = process.env.MORTECH_CUSTOMER_ID;
  const thirdPartyName = process.env.MORTECH_THIRD_PARTY_NAME;
  const licenseKey = process.env.MORTECH_LICENSE_KEY;
  const emailAddress = process.env.MORTECH_EMAIL_ADDRESS;
  const baseUrl = process.env.MORTECH_BASE_URL;
  const authorizationToken = process.env.MORTECH_AUTHORIZATION_TOKEN;
  const xApiKey = process.env.MORTECH_X_API_KEY;
  const partnerId = process.env.MORTECH_PARTNER_ID;
  const rawPrivateKey = process.env.MORTECH_PRIVATE_KEY;
  const privateKeyBase64 = process.env.MORTECH_PRIVATE_KEY_BASE64;
  const privateKey = (() => {
    try {
      if (fs.existsSync(PRIVATE_PEM_PATH)) {
        return fs.readFileSync(PRIVATE_PEM_PATH, 'utf8');
      }
    } catch (e) {
      // fall through to env
    }
    if (privateKeyBase64) {
      try {
        return Buffer.from(privateKeyBase64, 'base64').toString('utf8');
      } catch (error) {
        throw new Error('Failed to decode MORTECH_PRIVATE_KEY_BASE64');
      }
    }
    if (rawPrivateKey) {
      return rawPrivateKey.replace(/\\n/g, '\n');
    }
    return undefined;
  })();
  const authUrl = process.env.MORTECH_AUTH_URL;
  const accessTokenTtlSeconds = process.env.MORTECH_ACCESS_TOKEN_TTL_SECONDS
    ? parseInt(process.env.MORTECH_ACCESS_TOKEN_TTL_SECONDS, 10)
    : undefined;

  if (!customerId || !thirdPartyName || !licenseKey || !emailAddress) {
    throw new Error(
      'Missing required Mortech configuration. Please set MORTECH_CUSTOMER_ID, MORTECH_THIRD_PARTY_NAME, MORTECH_LICENSE_KEY, and MORTECH_EMAIL_ADDRESS.'
    );
  }

  return new MortechAPI({
    customerId,
    thirdPartyName,
    licenseKey,
    emailAddress,
    baseUrl,
    authorizationToken,
    xApiKey,
    partnerId,
    privateKey,
    authUrl,
    accessTokenTtlSeconds,
  });
};

module.exports = {
  createMortechAPI,
};
