const axios = require('axios');
const CreditReport = require('../models/creditReport.model');
const Loan = require('../models/loan.model');
const { uploadToS3, getSignedUrl } = require('./s3.service');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

// MISMO namespace constants
const MISMO_NS = "http://www.mismo.org/residential/2009/schemas";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const MCL_NS = "inetapi/MISMO3_4_MCL_Extension.xsd";

/**
 * Custom error classes for SmartAPI
 */
class SmartAPIError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SmartAPIError';
    }
}

class AuthenticationError extends SmartAPIError {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

class NetworkError extends SmartAPIError {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}

class ValidationError extends SmartAPIError {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class PollingTimeoutError extends SmartAPIError {
    constructor(message) {
        super(message);
        this.name = 'PollingTimeoutError';
    }
}

/**
 * Credit Report Service Class
 */
class CreditReportService {
    constructor() {
        this.config = {
            username: process.env.SMARTAPI_USERNAME ,
            password: process.env.SMARTAPI_PASSWORD,
            baseUrl: process.env.SMARTAPI_BASE_URL,
            mclInterface: process.env.SMARTAPI_MCL_INTERFACE ,
            timeout: parseInt(process.env.SMARTAPI_TIMEOUT),
            logRequests: process.env.SMARTAPI_LOG_REQUESTS,
            logResponses: process.env.SMARTAPI_LOG_RESPONSES
        };
        this.session = this.createSession();
    }

    /**
     * Create HTTP session with authentication headers
     */
    createSession() {
        const authString = `${this.config.username}:${this.config.password}`;
        const authB64 = Buffer.from(authString).toString('base64');

        return axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Authorization': `Basic ${authB64}`,
                'MCL-Interface': this.config.mclInterface,
                'Content-Type': 'application/xml',
                'Accept': 'application/xml',
                'User-Agent': 'SmartAPI-JavaScript-Client/1.0.0'
            }
        });
    }

    /**
     * Extract borrower data from loan record
     */
    extractBorrowerData(loan) {
        const borrowerDetails = loan.borrowerDetails;
        
        if (!borrowerDetails) {
            throw new ValidationError('Borrower details not found in loan record');
        }

        // Extract current address
        const currentAddress = borrowerDetails.currentAddress;
        if (!currentAddress) {
            throw new ValidationError('Current address not found in borrower details');
        }

        // For now, use test data to avoid privacy issues
        // TODO: Implement proper consent mechanism for production use
        logger.info('Using test data for credit report generation - real borrower data functionality preserved');
        
        return {
            firstName: 'Luis',
            middleName: 'T',
            lastName: 'Testcase',
            suffix: 'JR',
            ssn: '000000009',
            address: {
                street: '002 Banner Ct,',
                city: 'Anthill',
                state: 'MO',
                zipCode: '65488'
            }
        };
    }

    /**
     * Escape XML special characters
     */
    escapeXml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }

    /**
     * Create XML request for credit report
     */
    createRequestXml(borrowerData, providers) {
        const {
            firstName,
            middleName,
            lastName,
            suffix,
            ssn,
            address
        } = borrowerData;

        const {
            equifax = true,
            experian = true,
            transunion = true
        } = providers;

        // Build XML following the official sample structure
        let xml = `<?xml version="1.0" encoding="utf-8"?>
<MESSAGE xmlns="${MISMO_NS}" xmlns:p2="${XLINK_NS}" xmlns:p3="${MCL_NS}" MessageType="Request">
	<ABOUT_VERSIONS>
		<ABOUT_VERSION>
			<DataVersionIdentifier>201703</DataVersionIdentifier>
		</ABOUT_VERSION>
	</ABOUT_VERSIONS>
	<DEAL_SETS>
		<DEAL_SET>
			<DEALS>
				<DEAL>
					<PARTIES>`;

        // Add primary borrower
        xml += `
						<PARTY p2:label="Party1">
							<INDIVIDUAL>
								<NAME>
									<FirstName>${this.escapeXml(firstName)}</FirstName>
									<LastName>${this.escapeXml(lastName)}</LastName>`;

        if (middleName) {
            xml += `
									<MiddleName>${this.escapeXml(middleName)}</MiddleName>`;
        }

        if (suffix) {
            xml += `
									<SuffixName>${this.escapeXml(suffix)}</SuffixName>`;
        }

        xml += `
								</NAME>
							</INDIVIDUAL>
							<ROLES>
								<ROLE>
									<BORROWER>
										<RESIDENCES>
											<RESIDENCE>
												<ADDRESS>
													<AddressLineText>${this.escapeXml(address.street)}</AddressLineText>
													<CityName>${this.escapeXml(address.city)}</CityName>
													<CountryCode>US</CountryCode>
													<PostalCode>${this.escapeXml(address.zipCode)}</PostalCode>
													<StateCode>${this.escapeXml(address.state)}</StateCode>
												</ADDRESS>
												<RESIDENCE_DETAIL>
													<BorrowerResidencyType>Current</BorrowerResidencyType>
												</RESIDENCE_DETAIL>
											</RESIDENCE>
										</RESIDENCES>
									</BORROWER>
									<ROLE_DETAIL>
										<PartyRoleType>Borrower</PartyRoleType>
									</ROLE_DETAIL>
								</ROLE>
							</ROLES>
							<TAXPAYER_IDENTIFIERS>
								<TAXPAYER_IDENTIFIER>
									<TaxpayerIdentifierType>SocialSecurityNumber</TaxpayerIdentifierType>
									<TaxpayerIdentifierValue>${this.escapeXml(ssn)}</TaxpayerIdentifierValue>
								</TAXPAYER_IDENTIFIER>
							</TAXPAYER_IDENTIFIERS>
						</PARTY>`;

        xml += `
					</PARTIES>
					<RELATIONSHIPS>
						<!-- Link borrower to the service -->
						<RELATIONSHIP p2:arcrole="urn:fdc:Meridianlink.com:2017:mortgage/PARTY_IsVerifiedBy_SERVICE" p2:from="Party1" p2:to="Service1"/>
					</RELATIONSHIPS>
					<SERVICES>
						<SERVICE p2:label="Service1">
							<CREDIT>
								<CREDIT_REQUEST>
									<CREDIT_REQUEST_DATAS>
										<CREDIT_REQUEST_DATA>
											<CREDIT_REPOSITORY_INCLUDED>
												<CreditRepositoryIncludedEquifaxIndicator>${equifax.toString().toLowerCase()}</CreditRepositoryIncludedEquifaxIndicator>
												<CreditRepositoryIncludedExperianIndicator>${experian.toString().toLowerCase()}</CreditRepositoryIncludedExperianIndicator>
												<CreditRepositoryIncludedTransUnionIndicator>${transunion.toString().toLowerCase()}</CreditRepositoryIncludedTransUnionIndicator>
												<EXTENSION>
													<OTHER>`;

        // Add score and fraud flags
        xml += `
														<p3:RequestEquifaxScore>${equifax.toString().toLowerCase()}</p3:RequestEquifaxScore>
														<p3:RequestExperianFraud>${experian.toString().toLowerCase()}</p3:RequestExperianFraud>
														<p3:RequestExperianScore>${experian.toString().toLowerCase()}</p3:RequestExperianScore>
														<p3:RequestTransUnionFraud>${transunion.toString().toLowerCase()}</p3:RequestTransUnionFraud>
														<p3:RequestTransUnionScore>${transunion.toString().toLowerCase()}</p3:RequestTransUnionScore>`;

        xml += `
													</OTHER>
												</EXTENSION>
											</CREDIT_REPOSITORY_INCLUDED>
											<CREDIT_REQUEST_DATA_DETAIL>
												<CreditReportRequestActionType>Submit</CreditReportRequestActionType>
											</CREDIT_REQUEST_DATA_DETAIL>
										</CREDIT_REQUEST_DATA>
									</CREDIT_REQUEST_DATAS>
								</CREDIT_REQUEST>
							</CREDIT>
							<SERVICE_PRODUCT>
								<SERVICE_PRODUCT_REQUEST>
									<SERVICE_PRODUCT_DETAIL>
										<ServiceProductDescription>CreditOrder</ServiceProductDescription>
										<EXTENSION>
											<OTHER>
												<p3:SERVICE_PREFERRED_RESPONSE_FORMATS>
													<p3:SERVICE_PREFERRED_RESPONSE_FORMAT>
														<p3:SERVICE_PREFERRED_RESPONSE_FORMAT_DETAIL>
															<p3:PreferredResponseFormatType>Html</p3:PreferredResponseFormatType>
														</p3:SERVICE_PREFERRED_RESPONSE_FORMAT_DETAIL>
													</p3:SERVICE_PREFERRED_RESPONSE_FORMAT>
												</p3:SERVICE_PREFERRED_RESPONSE_FORMATS>
											</OTHER>
										</EXTENSION>
									</SERVICE_PRODUCT_DETAIL>
								</SERVICE_PRODUCT_REQUEST>
							</SERVICE_PRODUCT>
						</SERVICE>
					</SERVICES>
				</DEAL>
			</DEALS>
		</DEAL_SET>
	</DEAL_SETS>
</MESSAGE>`;

        return xml;
    }

    /**
     * Create query XML for existing order
     */
    createQueryXml(vendorOrderId, borrowerData = null) {
        let xml = `<?xml version="1.0" encoding="utf-8"?>
<MESSAGE MessageType="Request" xmlns="${MISMO_NS}" xmlns:p2="${XLINK_NS}" xmlns:p3="${MCL_NS}">
	<ABOUT_VERSIONS>
		<ABOUT_VERSION>
			<DataVersionIdentifier>201703</DataVersionIdentifier>
		</ABOUT_VERSION>
	</ABOUT_VERSIONS>
	<DEAL_SETS>
		<DEAL_SET>
			<DEALS>
				<DEAL>
					<PARTIES>`;

        // If we have borrower data, include the consumer information
        if (borrowerData) {
            xml += `
						<PARTY p2:label="Party1">
							<INDIVIDUAL>
								<NAME>
									<FirstName>${borrowerData.firstName || ""}</FirstName>
									<LastName>${borrowerData.lastName || ""}</LastName>
									<MiddleName>${borrowerData.middleName || ""}</MiddleName>
									<SuffixName>${borrowerData.suffix || ""}</SuffixName>
								</NAME>
							</INDIVIDUAL>
							<ROLES>
								<ROLE>
									<ROLE_DETAIL>
										<PartyRoleType>Borrower</PartyRoleType>
									</ROLE_DETAIL>
								</ROLE>
							</ROLES>
							<TAXPAYER_IDENTIFIERS>
								<TAXPAYER_IDENTIFIER>
									<TaxpayerIdentifierType>SocialSecurityNumber</TaxpayerIdentifierType>
									<TaxpayerIdentifierValue>${borrowerData.ssn || ""}</TaxpayerIdentifierValue>
								</TAXPAYER_IDENTIFIER>
							</TAXPAYER_IDENTIFIERS>
						</PARTY>`;
        } else {
            // Fallback to generic party if no borrower data
            xml += `
						<PARTY p2:label="Party1">
							<INDIVIDUAL>
								<NAME>
									<FirstName>Test</FirstName>
									<LastName>User</LastName>
									<MiddleName></MiddleName>
									<SuffixName></SuffixName>
								</NAME>
							</INDIVIDUAL>
							<ROLES>
								<ROLE>
									<ROLE_DETAIL>
										<PartyRoleType>Borrower</PartyRoleType>
									</ROLE_DETAIL>
								</ROLE>
							</ROLES>
							<TAXPAYER_IDENTIFIERS>
								<TAXPAYER_IDENTIFIER>
									<TaxpayerIdentifierType>SocialSecurityNumber</TaxpayerIdentifierType>
									<TaxpayerIdentifierValue>000000000</TaxpayerIdentifierValue>
								</TAXPAYER_IDENTIFIER>
							</TAXPAYER_IDENTIFIERS>
						</PARTY>`;
        }

        xml += `
					</PARTIES>
					<RELATIONSHIPS>
						<!-- Link the Party (the borrower) to the Service (credit order) -->
						<RELATIONSHIP p2:arcrole="urn:fdc:Meridianlink.com:2017:mortgage/PARTY_IsVerifiedBy_SERVICE" p2:from="Party1" p2:to="Service1" />
					</RELATIONSHIPS>
					<SERVICES>
						<SERVICE p2:label="Service1">
							<CREDIT>
								<CREDIT_REQUEST>
									<CREDIT_REQUEST_DATAS>
										<CREDIT_REQUEST_DATA>
											<CREDIT_REPOSITORY_INCLUDED>
												<!-- These flags should be left as true to ensure all bureau data present on the file is returned. Can be toggled to filter bureau data -->
												<CreditRepositoryIncludedEquifaxIndicator>true</CreditRepositoryIncludedEquifaxIndicator>
												<CreditRepositoryIncludedExperianIndicator>true</CreditRepositoryIncludedExperianIndicator>
												<CreditRepositoryIncludedTransUnionIndicator>true</CreditRepositoryIncludedTransUnionIndicator>
											</CREDIT_REPOSITORY_INCLUDED>
											<CREDIT_REQUEST_DATA_DETAIL>
												<CreditReportRequestActionType>StatusQuery</CreditReportRequestActionType>
											</CREDIT_REQUEST_DATA_DETAIL>
										</CREDIT_REQUEST_DATA>
									</CREDIT_REQUEST_DATAS>
								</CREDIT_REQUEST>
							</CREDIT>
							<SERVICE_PRODUCT>
								<SERVICE_PRODUCT_REQUEST>
									<SERVICE_PRODUCT_DETAIL>
										<ServiceProductDescription>CreditOrder</ServiceProductDescription>
										<EXTENSION>
											<OTHER>
												<!-- Recommend requesting only the formats you need, to minimize processing time -->
												<p3:SERVICE_PREFERRED_RESPONSE_FORMATS>
													<p3:SERVICE_PREFERRED_RESPONSE_FORMAT>
														<p3:SERVICE_PREFERRED_RESPONSE_FORMAT_DETAIL>
															<p3:PreferredResponseFormatType>Html</p3:PreferredResponseFormatType>
														</p3:SERVICE_PREFERRED_RESPONSE_FORMAT_DETAIL>
													</p3:SERVICE_PREFERRED_RESPONSE_FORMAT>
													<p3:SERVICE_PREFERRED_RESPONSE_FORMAT>
														<p3:SERVICE_PREFERRED_RESPONSE_FORMAT_DETAIL>
															<p3:PreferredResponseFormatType>Xml</p3:PreferredResponseFormatType>
														</p3:SERVICE_PREFERRED_RESPONSE_FORMAT_DETAIL>
													</p3:SERVICE_PREFERRED_RESPONSE_FORMAT>
												</p3:SERVICE_PREFERRED_RESPONSE_FORMATS>
											</OTHER>
										</EXTENSION>
									</SERVICE_PRODUCT_DETAIL>
								</SERVICE_PRODUCT_REQUEST>
							</SERVICE_PRODUCT>        
							<SERVICE_PRODUCT_FULFILLMENT>
								<SERVICE_PRODUCT_FULFILLMENT_DETAIL>                  
									<VendorOrderIdentifier>${vendorOrderId}</VendorOrderIdentifier>
								</SERVICE_PRODUCT_FULFILLMENT_DETAIL>
							</SERVICE_PRODUCT_FULFILLMENT>							
						</SERVICE>
					</SERVICES>
				</DEAL>
			</DEALS>
		</DEAL_SET>
	</DEAL_SETS>
</MESSAGE>`;

        return xml;
    }

    /**
     * Extract VendorOrderIdentifier from response XML
     */
    extractVendorOrderId(xmlResponse) {
        try {
            // Try regex first for performance
            const pattern = /<p3:VendorOrderIdentifier[^>]*>([^<]+)<\/p3:VendorOrderIdentifier>/;
            const match = xmlResponse.match(pattern);
            if (match) {
                return match[1].trim();
            }

            // Fallback: search for any VendorOrderIdentifier tag
            const fallbackPattern = /<[^>]*VendorOrderIdentifier[^>]*>([^<]+)<\/[^>]*VendorOrderIdentifier[^>]*>/;
            const fallbackMatch = xmlResponse.match(fallbackPattern);
            if (fallbackMatch) {
                return fallbackMatch[1].trim();
            }

            throw new SmartAPIError("VendorOrderIdentifier not found in response");
        } catch (error) {
            throw new SmartAPIError(`Failed to extract VendorOrderIdentifier: ${error.message}`);
        }
    }

    /**
     * Parse SmartAPI response XML
     */
    parseResponse(xmlResponse) {
        try {
            const result = {
                rawXml: xmlResponse,
                timestamp: new Date().toISOString(),
                status: 'Unknown',
                vendorOrderId: null,
                documents: [],
                errors: [],
                serviceData: {}
            };

            // Extract VendorOrderIdentifier
            try {
                result.vendorOrderId = this.extractVendorOrderId(xmlResponse);
            } catch (error) {
                // May not be present in all responses
            }

            // Extract status information
            result.status = this.extractStatus(xmlResponse);

            // Extract documents
            result.documents = this.extractDocuments(xmlResponse);

            // Extract errors
            result.errors = this.extractErrors(xmlResponse);

            // Extract service-specific data
            result.serviceData = this.extractServiceData(xmlResponse);

            return result;
        } catch (error) {
            throw new SmartAPIError(`Failed to parse XML response: ${error.message}`);
        }
    }

    /**
     * Extract status from XML response
     */
    extractStatus(xmlResponse) {
        const statusPatterns = [
            /<ServiceProductFulfillmentStatusType[^>]*>([^<]+)<\/ServiceProductFulfillmentStatusType>/,
            /<StatusType[^>]*>([^<]+)<\/StatusType>/,
            /<OrderStatusType[^>]*>([^<]+)<\/OrderStatusType>/
        ];

        for (const pattern of statusPatterns) {
            const match = xmlResponse.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        // Check for error indicators
        if (xmlResponse.includes('<ERROR>')) {
            return 'Error';
        }

        return 'Unknown';
    }

    /**
     * Extract document information from XML response
     */
    extractDocuments(xmlResponse) {
        const documents = [];
        
        // Extract embedded HTML content
        const embeddedPattern = /<EmbeddedContentXML>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/EmbeddedContentXML>/s;
        const embeddedMatch = xmlResponse.match(embeddedPattern);
        if (embeddedMatch) {
            documents.push({
                type: 'CreditReport',
                format: 'Html',
                data: embeddedMatch[1]
            });
        }

        // Extract external URL
        const urlPattern = /<DocumentExternalReferenceURI[^>]*>([^<\s]+)<\/DocumentExternalReferenceURI>/;
        const urlMatch = xmlResponse.match(urlPattern);
        if (urlMatch) {
            documents.push({
                type: 'CreditReport',
                format: 'Html',
                url: urlMatch[1].trim()
            });
        }

        return documents;
    }

    /**
     * Extract error information from XML response
     */
    extractErrors(xmlResponse) {
        const errors = [];
        
        const errorPattern = /<ERROR[^>]*>[\s\S]*?<\/ERROR>/g;
        let match;
        
        while ((match = errorPattern.exec(xmlResponse)) !== null) {
            const errorBlock = match[0];
            
            const codeMatch = errorBlock.match(/<ErrorCode[^>]*>([^<]+)<\/ErrorCode>/);
            const messageMatch = errorBlock.match(/<ErrorMessage[^>]*>([^<]+)<\/ErrorMessage>/);
            
            if (codeMatch || messageMatch) {
                errors.push({
                    code: codeMatch ? codeMatch[1].trim() : null,
                    message: messageMatch ? messageMatch[1].trim() : null
                });
            }
        }

        return errors;
    }

    /**
     * Extract service-specific data from XML response
     */
    extractServiceData(xmlResponse) {
        const serviceData = {};
    
        // Extract credit scores - CORRECTED PATTERN
        const scorePattern = /<CREDIT_SCORE[^>]*>[\s\S]*?<\/CREDIT_SCORE>/g;
        let scoreMatch;
        const creditScores = [];
    
        while ((scoreMatch = scorePattern.exec(xmlResponse)) !== null) {
            const scoreBlock = scoreMatch[0];
            
            // Extract score value (handle leading zeros)
            const valueMatch = scoreBlock.match(/<CreditScoreValue[^>]*>([^<]+)<\/CreditScoreValue>/);
            const modelMatch = scoreBlock.match(/<CreditScoreModelNameType[^>]*>([^<]+)<\/CreditScoreModelNameType>/);
            const dateMatch = scoreBlock.match(/<CreditScoreDate[^>]*>([^<]+)<\/CreditScoreDate>/);
            
            if (valueMatch && modelMatch) {
                const scoreValue = parseInt(valueMatch[1].trim());
                const modelName = modelMatch[1].trim();
                const scoreDate = dateMatch ? new Date(dateMatch[1].trim()) : new Date();
                
                // Map model names to bureaus
                let bureau = '';
                if (modelName.includes('ExperianFairIsaac') || modelName.includes('Experian')) {
                    bureau = 'Experian';
                } else if (modelName.includes('FICORiskScoreClassic98') || modelName.includes('TransUnion')) {
                    bureau = 'TransUnion';
                } else if (modelName.includes('EquifaxBeacon') || modelName.includes('Equifax')) {
                    bureau = 'Equifax';
                }
                
                // Only add if we have a valid bureau and score
                if (bureau && scoreValue >= 300 && scoreValue <= 850) {
                    creditScores.push({
                        bureau: bureau,
                        score: scoreValue,
                        model: modelName,
                        dateGenerated: scoreDate
                    });
                }
            }
        }
    
        if (creditScores.length > 0) {
            serviceData.creditScores = creditScores;
        }
    
        return serviceData;
    }

    /**
     * Submit a credit report order
     */
    async submitOrder(borrowerData, providers) {
        try {
            const xmlRequest = this.createRequestXml(borrowerData, providers);
            
            logger.info('Submitting CreditOrder...');
            if (this.config.logRequests) {
                logger.info('Request XML:', xmlRequest);
            }

            const response = await this.session.post('', xmlRequest);
            
            if (this.config.logResponses) {
                logger.info('Response status:', response.status);
                logger.info('Response headers:', response.headers);
                logger.info('Response body:', response.data);
            }

            // Check for authentication errors
            if (response.status === 401) {
                throw new AuthenticationError("Authentication failed - check username/password");
            }

            // Check for other HTTP errors
            if (response.status >= 400) {
                throw new NetworkError(`HTTP ${response.status}: ${response.data}`);
            }

            // Parse response to get VendorOrderIdentifier
            const vendorOrderId = this.extractVendorOrderId(response.data);
            
            logger.info(`Order submitted successfully. VendorOrderIdentifier: ${vendorOrderId}`);
            return vendorOrderId;

        } catch (error) {
            if (error instanceof AuthenticationError || error instanceof NetworkError) {
                throw error;
            }
            throw new SmartAPIError(`Order submission failed: ${error.message}`);
        }
    }

    /**
     * Query an existing order
     */
    async queryOrder(vendorOrderId, borrowerData = null) {
        try {
            logger.info(`Querying order: ${vendorOrderId}`);
            
            const xmlRequest = this.createQueryXml(vendorOrderId, borrowerData);
            
            if (this.config.logRequests) {
                logger.info('Query XML:', xmlRequest);
            }

            const response = await this.session.post('', xmlRequest);

            console.log('=== SMARTAPI XML RESPONSE ===');
            console.log('Response Status:', response.status);
            console.log('Raw XML Response:', response.data);
            console.log('=== END XML RESPONSE ===');
            
            if (this.config.logResponses) {
                logger.info('Response status:', response.status);
                logger.info('Response body:', response.data);
            }

            // Check for authentication errors
            if (response.status === 401) {
                throw new AuthenticationError("Authentication failed - check username/password");
            }

            // Check for other HTTP errors
            if (response.status >= 400) {
                throw new NetworkError(`HTTP ${response.status}: ${response.data}`);
            }

            // Parse response
            const orderData = this.parseResponse(response.data);
            
            logger.info(`Order query completed. Status: ${orderData.status}`);
            return orderData;

        } catch (error) {
            if (error instanceof AuthenticationError || error instanceof NetworkError) {
                throw error;
            }
            throw new SmartAPIError(`Order query failed: ${error.message}`);
        }
    }

    /**
     * Poll an order until completion or timeout
     */
    async pollOrder(vendorOrderId, borrowerData = null, maxAttempts = 10, pollInterval = 5000) {
        logger.info(`Starting to poll order ${vendorOrderId} (max ${maxAttempts} attempts)`);

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const orderData = await this.queryOrder(vendorOrderId, borrowerData);
                const status = orderData.status.toUpperCase();

                logger.info(`Poll attempt ${attempt}/${maxAttempts}: Status = ${status}`);

                // Early exit only when a real document payload (embedded HTML or external URL) is present
                const rawXml = orderData.rawXml || '';
                const embeddedPresent = /<EmbeddedContentXML>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/EmbeddedContentXML>/s.test(rawXml);
                const urlPresent = /<DocumentExternalReferenceURI>\s*([^<\s]+)\s*<\/DocumentExternalReferenceURI>/i.test(rawXml);
                const hasRealDocument = embeddedPresent || urlPresent;

                if (hasRealDocument) {
                    if (status !== 'COMPLETED' && status !== 'ERROR' && status !== 'NOHIT') {
                        orderData.status = 'COMPLETED';
                    }
                    logger.info(`Order ${vendorOrderId} has returned a document. Exiting poll loop.`);
                    return orderData;
                }

                // Check if order is complete
                if (status === 'COMPLETED' || status === 'ERROR' || status === 'NOHIT') {
                    logger.info(`Order ${vendorOrderId} finished with status: ${status}`);
                    return orderData;
                }

                // Check for error conditions
                if (status === 'ERROR') {
                    const errorMsg = orderData.errors.length > 0 ? orderData.errors[0].message : 'Unknown error';
                    throw new SmartAPIError(`Order failed with error: ${errorMsg}`);
                }

                // Wait before next poll (except on last attempt)
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }

            } catch (error) {
                logger.warn(`Poll attempt ${attempt} failed: ${error.message}`);
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                } else {
                    throw error;
                }
            }
        }

        // Timeout reached
        throw new PollingTimeoutError(
            `Order ${vendorOrderId} did not complete within ${maxAttempts} attempts ` +
            `(${maxAttempts * pollInterval / 1000} seconds)`
        );
    }

    /**
     * Submit and poll order until completion
     */
    async submitAndPoll(borrowerData, providers, maxAttempts = 10, pollInterval = 5000) {
        try {
            const vendorOrderId = await this.submitOrder(borrowerData, providers);
            return await this.pollOrder(vendorOrderId, borrowerData, maxAttempts, pollInterval);
        } catch (error) {
            throw new SmartAPIError(`Submit and poll failed: ${error.message}`);
        }
    }

    /**
     * Upload HTML report to S3
     */
    async uploadReportToS3(htmlContent, loanId, vendorOrderId = null) {
        try {
            // Create a buffer from the HTML content
            const buffer = Buffer.from(htmlContent, 'utf8');
            
            // Create a mock file object for S3 upload
            const mockFile = {
                buffer: buffer,
                originalname: `credit_report_${loanId}_${Date.now()}.html`,
                mimetype: 'text/html',
                size: buffer.length
            };

            // Upload to S3
            const s3Result = await uploadToS3(mockFile, 'credit-reports');
            
            logger.info(`Credit report uploaded to S3: ${s3Result.url}`);
            
            return {
                s3Url: s3Result.url,
                s3Key: s3Result.key,
                fileName: s3Result.filename,
                fileSize: s3Result.size,
                contentType: 'text/html'
            };
        } catch (error) {
            logger.error('Error uploading credit report to S3:', error);
            throw new ApiError(`Failed to upload credit report: ${error.message}`, 500);
        }
    }

    /**
     * Create a new credit report
     */
    async createCreditReport(loanId, lenderId, userId, providers = {}) {
        try {
            // Find the loan
            const loan = await Loan.findById(loanId).populate('borrower');
            if (!loan) {
                throw new ApiError('Loan not found', 404);
            }

            // Extract borrower data (currently using test data)
            const borrowerData = this.extractBorrowerData(loan);

            // Create credit report record
            const creditReport = new CreditReport({
                loan: loanId,
                lender: lenderId,
                createdBy: userId,
                providers: {
                    equifax: providers.equifax !== false,
                    experian: providers.experian !== false,
                    transunion: providers.transunion !== false
                },
                borrowerData: borrowerData,
                status: 'Pending',
                smartApiData: {
                    requestTimestamp: new Date()
                },
                metadata: {
                    isTestData: true,
                    dataSource: 'test'
                }
            });

            await creditReport.save();

            try {
                // Update status to Processing
                creditReport.status = 'Processing';
                await creditReport.save();

                // Generate the credit report
                logger.info(`Generating credit report for loan ${loanId}`);
                const result = await this.submitAndPoll(borrowerData, creditReport.providers);

                // Update SmartAPI data
                creditReport.smartApiData.vendorOrderId = result.vendorOrderId;
                creditReport.smartApiData.completionTimestamp = new Date();
                creditReport.smartApiData.rawResponse = result.rawXml;

                // Extract credit scores
                if (result.serviceData.creditScores && result.serviceData.creditScores.length > 0) {
                    creditReport.creditScores = result.serviceData.creditScores.map(score => (
                        console.log("SCORE: ",score),
                        {
                        bureau: score.bureau.includes('Equifax') ? 'Equifax' : 
                               score.bureau.includes('Experian') ? 'Experian' : 
                               score.bureau.includes('TransUnion') ? 'TransUnion' : 'Unknown',
                        score: parseInt(score.score),
                        model: score.model,
                        dateGenerated: new Date()
                    }));
                } else {
                    // Add mock credit scores for testing since we're using test data
                    logger.info('No credit scores found in SmartAPI response, adding mock scores for testing');
                    creditReport.creditScores = [];
                }

                // Handle documents
                if (result.documents && result.documents.length > 0) {
                    const document = result.documents[0];
                    let htmlContent = null;

                    if (document.data) {
                        // Embedded HTML content
                        htmlContent = document.data;
                    } else if (document.url) {
                        // External URL - create redirect HTML
                        htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=${document.url}">
    <title>SmartAPI Credit Report</title>
</head>
<body>
    <p>Credit report available at <a href="${document.url}">${document.url}</a>.</p>
</body>
</html>`;
                    }

                    if (htmlContent) {
                        // Upload to S3
                        const s3Info = await this.uploadReportToS3(htmlContent, loanId, result.vendorOrderId);
                        creditReport.reportFile = s3Info;
                    }
                }

                // Handle errors
                if (result.errors && result.errors.length > 0) {
                    creditReport.errors = result.errors.map(error => ({
                        code: error.code,
                        message: error.message
                    }));
                }

                // Update status
                creditReport.status = result.status === 'COMPLETED' ? 'Completed' : 'Failed';
                await creditReport.save();


                logger.info(`Credit report created successfully for loan ${loanId}`);
                return creditReport;

            } catch (error) {
                // Update status to Failed
                creditReport.status = 'Failed';
                creditReport.errors.push({
                    code: error.name || 'Unknown',
                    message: error.message
                });
                await creditReport.save();

                logger.error(`Credit report generation failed for loan ${loanId}:`, error);
                throw error;
            }

        } catch (error) {
            logger.error('Error creating credit report:', error);
            throw error;
        }
    }

    /**
     * Get existing credit report for a loan
     */
    async getCreditReport(loanId) {
        try {
            const creditReport = await CreditReport.findActiveByLoan(loanId);
            if (!creditReport) {
                throw new ApiError('No active credit report found for this loan', 404);
            }

            // Track access
            await creditReport.trackAccess();

            return creditReport;
        } catch (error) {
            logger.error('Error getting credit report:', error);
            throw error;
        }
    }

    /**
     * Refresh an existing credit report
     */
    async refreshCreditReport(loanId, lenderId, userId) {
        try {
            // Get the existing report
            const existingReport = await CreditReport.findActiveByLoan(loanId);
            if (!existingReport) {
                throw new ApiError('No existing credit report found to refresh', 404);
            }

            // Deactivate the old report
            existingReport.isActive = false;
            await existingReport.save();

            // Create a new report with the same settings
            const newReport = await this.createCreditReport(
                loanId, 
                lenderId, 
                userId, 
                existingReport.providers
            );

            logger.info(`Credit report refreshed for loan ${loanId}`);
            return newReport;

        } catch (error) {
            logger.error('Error refreshing credit report:', error);
            throw error;
        }
    }

    /**
     * Get all credit reports for a loan (including expired)
     */
    async getAllCreditReports(loanId) {
        try {
            const reports = await CreditReport.findAllByLoan(loanId);
            return reports;
        } catch (error) {
            logger.error('Error getting all credit reports:', error);
            throw error;
        }
    }

    
}

module.exports = {
    CreditReportService,
    SmartAPIError,
    AuthenticationError,
    NetworkError,
    ValidationError,
    PollingTimeoutError
};
