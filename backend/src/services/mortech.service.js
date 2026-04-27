const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/** Redact sensitive query params for logs */
function redactMortechQueryString(queryString) {
  if (!queryString || typeof queryString !== 'string') return '';
  return queryString
    .replace(/(licenseKey=)[^&]*/gi, '$1***REDACTED***')
    .replace(/(emailAddress=)[^&]*/gi, '$1***REDACTED***');
}

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
    const startedAt = Date.now();
    try {
      logger.info(
        `[Mortech] getRates incoming (sanitized): ${JSON.stringify({
          propertyZip: request.propertyZip,
          appraisedvalue: request.appraisedvalue,
          loan_amount: request.loan_amount,
          fico: request.fico,
          loanpurpose: request.loanpurpose,
          proptype: request.proptype,
          occupancy: request.occupancy,
          loanProduct1: request.loanProduct1,
          productList: request.productList,
          financeMI: request.financeMI,
          vaType: request.vaType,
          subsequentUse: request.subsequentUse,
          targetPrice: request.targetPrice,
        })}`
      );

      const targetPrice =
        request.targetPrice !== undefined && request.targetPrice !== null ? request.targetPrice : -999;

      const str = (v) => v != null ? String(v) : undefined;

      const baseEntries = {
        request_id: '1',
        customerId: this.customerId,
        thirdPartyName: this.thirdPartyName,
        licenseKey: this.licenseKey,
        emailAddress: this.emailAddress,
        targetPrice: String(targetPrice),
        ...(request.propertyState && { propertyState: request.propertyState }),
        propertyZip: request.propertyZip,
        ...(request.propertyCounty && { propertyCounty: request.propertyCounty }),
        appraisedvalue: request.appraisedvalue.toString(),
        loan_amount: request.loan_amount.toString(),
        ...(request.downPayment > 0 && { downPayment: str(request.downPayment) }),
        fico: request.fico.toString(),
        loanpurpose: String(request.loanpurpose),
        proptype: String(request.proptype),
        occupancy: String(request.occupancy),

        // Lien position
        ...(request.lienPosition && { lienPosition: str(request.lienPosition) }),
        // DTI
        ...(request.DTIPercent > 0 && { DTIPercent: str(request.DTIPercent) }),
        // CLTV
        ...(request.cltv > 0 && { cltv: str(request.cltv) }),
        // Closing & payment dates
        ...(request.closingDate && { closingDate: request.closingDate }),
        ...(request.firstPaymentDate && { firstPaymentDate: request.firstPaymentDate }),
        // Monthly taxes & insurance
        ...(request.taxes > 0 && { taxes: str(request.taxes) }),
        ...(request.insurance > 0 && { insurance: str(request.insurance) }),
        // Borrower flags
        ...(request.firstTimeHomeBuyer === 1 && { firstTimeHomeBuyer: '1' }),
        ...(request.selfEmployed === 1 && { selfEmployed: '1' }),
        ...(request.amiIlpaWaiver === 1 && { amiIlpaWaiver: '1' }),
        // Interest-only
        ...(request.interestOnly === 1 && { interestOnly: '1' }),
        // Lender-paid compensation
        ...(request.lenderPaidYSP === 1 && { lenderPaidYSP: '1' }),
        // Restrict to specific investors
        ...(request.parent_id && { parent_id: request.parent_id }),

        // Subordinate financing
        ...(request.program !== undefined && { program: str(request.program) }),
        // Borrower annual income
        ...(request.annualIncome > 0 && { annualIncome: str(request.annualIncome) }),
        // MI coverage type
        ...(request.coverageType > 0 && { coverageType: str(request.coverageType) }),
        // Include FHA MIP / VA funding fee in fee_list
        ...(request.includeUpfrontFee === true && { includeUpfrontFee: 'True' }),

        ...(request.view !== undefined && { view: request.view.toString() }),
        ...(request.filterId && { filterId: request.filterId }),
        ...(request.pmiCompany && { pmiCompany: request.pmiCompany.toString() }),
        ...(request.noMI !== undefined && { noMI: request.noMI.toString() }),
        ...(request.financeMI !== undefined && { financeMI: request.financeMI.toString() }),
        ...(request.vaType && { vaType: request.vaType }),
        ...(request.subsequentUse !== undefined && { subsequentUse: request.subsequentUse.toString() }),
        ...(request.waiveescrow !== undefined && { waiveescrow: request.waiveescrow.toString() }),
        ...(request.militaryVeteran === true && { militaryVeteran: 'true' }),
        ...(request.lockindays !== undefined &&
          request.lockindays !== null && { lockindays: String(request.lockindays) }),
        ...(typeof request.secondMortgageAmount === 'number' && request.secondMortgageAmount > 0
          ? { secondMortgageAmount: request.secondMortgageAmount.toString() }
          : {}),
      };

      // Mortech: send productList OR loanProduct1, not both (matches loan-officer-platform).
      if (request.productList) {
        baseEntries.productList = request.productList;
      } else if (request.loanProduct1) {
        baseEntries.loanProduct1 = request.loanProduct1;
      }

      const params = new URLSearchParams(baseEntries);
      const queryString = params.toString();
      const fullUrl = `${this.baseUrl}?${queryString}`;
      logger.info(
        `[Mortech] HTTP GET url=${this.baseUrl} queryRedacted=${redactMortechQueryString(queryString)}`
      );

      const accessToken = await this.getAccessToken();
      const headers = {
        Accept: 'application/xml, text/xml',
        'User-Agent': 'LoanApp/1.0',
        ...(accessToken && { authorizationtoken: accessToken }),
        ...(this.xApiKey && { 'x-api-key': this.xApiKey }),
      };

      let response = await fetch(fullUrl, {
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
          response = await fetch(fullUrl, {
            method: 'GET',
            headers: retryHeaders,
          });
        }
      }

      const httpMs = Date.now() - startedAt;
      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        logger.error(
          `[Mortech] HTTP error status=${response.status} ${response.statusText} ms=${httpMs} queryRedacted=${redactMortechQueryString(queryString)} bodyPreview=${(errBody || '').slice(0, 1500)}`
        );
        throw new Error(
          `Mortech HTTP ${response.status} ${response.statusText}${errBody ? `: ${errBody.slice(0, 300)}` : ''}`
        );
      }

      const xmlData = await response.text();
      logger.info(
        `[Mortech] XML received httpStatus=${response.status} ms=${Date.now() - startedAt} xmlLength=${xmlData.length} preview=${xmlData.slice(0, 400).replace(/\s+/g, ' ')}`
      );

      const parsedResponse = await this.parseXMLResponse(xmlData);

      if (options.includeRawXml) {
        parsedResponse.rawXml = xmlData;
      }

      if (!parsedResponse.success) {
        logger.error(
          `[Mortech] parse failed: ${parsedResponse.error} ms=${Date.now() - startedAt} xmlHead=${xmlData.slice(0, 800)}`
        );
      } else {
        logger.info(
          `[Mortech] OK quotes=${(parsedResponse.quotes && parsedResponse.quotes.length) || 0} totalMs=${Date.now() - startedAt}`
        );
      }

      return parsedResponse;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(
        `[Mortech] getRates exception ms=${Date.now() - startedAt} error=${msg} stack=${error instanceof Error ? error.stack : ''}`
      );
      return {
        success: false,
        error: msg,
      };
    }
  }

  parseXMLResponse(xmlData) {
    return new Promise((resolve) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          logger.error(
            `[Mortech] xml2js parse error: ${err.message} xmlPreview=${xmlData && xmlData.slice ? xmlData.slice(0, 600) : ''}`
          );
          resolve({
            success: false,
            error: `Failed to parse XML response: ${err.message}`,
          });
          return;
        }

        try {
          const mortech = result.mortech;
          if (!mortech || !mortech.header || !mortech.header[0]) {
            logger.error(
              `[Mortech] missing mortech.header keys=${result ? Object.keys(result).join(',') : 'none'}`
            );
            resolve({
              success: false,
              error: 'Unexpected Mortech XML: missing header',
            });
            return;
          }

          const errorNum = parseInt(mortech.header[0].errorNum[0], 10);
          const errorDesc = mortech.header[0].errorDesc[0];

          if (errorNum !== 0) {
            const errMsg = `Mortech errorNum=${errorNum}: ${errorDesc}`;
            logger.error(`[Mortech] Business error errorNum=${errorNum} errorDesc=${errorDesc}`);
            resolve({
              success: false,
              error: errMsg,
              mortechErrorNum: errorNum,
              mortechErrorDesc: errorDesc,
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
          logger.error(
            `[Mortech] parseXMLResponse inner catch: ${parseError instanceof Error ? parseError.message : String(parseError)}`
          );
          resolve({
            success: false,
            error: `Failed to parse response data: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
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
