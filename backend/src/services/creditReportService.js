const axios = require('axios');
const CreditReport = require('../models/creditReport.model');
const Loan = require('../models/loan.model');
const Lender = require('../models/lender.model');
const { uploadToS3, getSignedUrl } = require('./s3.service');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const CreditDataExtractor = require('./creditDataExtractor');

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
            timeout: 60000,
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
     * Create XML request for reissuing existing credit report (StatusQuery)
     */
    createReissueXml(vendorOrderId, borrowerData) {
        const {
            firstName,
            middleName,
            lastName,
            suffix,
            ssn
        } = borrowerData;

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
					<PARTIES>
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
						</PARTY>
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
     * Create XML request for upgrading credit report order
     */
    createUpgradeXml(vendorOrderId, borrowerData, providers) {
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
					<PARTIES>
						<!-- SequenceNumber not required for individual credit order, but needed on joint credit orders. 1 = the borrower, 2 = the spouse -->
						<PARTY SequenceNumber="1" p2:label="Party1">
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
						</PARTY>
					</PARTIES>
					<RELATIONSHIPS>
						<!-- Link borrower Party to the Service -->
						<RELATIONSHIP p2:arcrole="urn:fdc:Meridianlink.com:2017:mortgage/PARTY_IsVerifiedBy_SERVICE" p2:from="Party1" p2:to="Service1" />
					</RELATIONSHIPS>
					<SERVICES>
						<SERVICE p2:label="Service1">
							<CREDIT>
								<CREDIT_REQUEST>
									<CREDIT_REQUEST_DATAS>
										<CREDIT_REQUEST_DATA>
											<CREDIT_REPOSITORY_INCLUDED>
                                                <!-- Indicate credit, score, and fraud flags for the upgrade request -->
												<CreditRepositoryIncludedEquifaxIndicator>${equifax.toString().toLowerCase()}</CreditRepositoryIncludedEquifaxIndicator>
												<CreditRepositoryIncludedExperianIndicator>${experian.toString().toLowerCase()}</CreditRepositoryIncludedExperianIndicator>
												<CreditRepositoryIncludedTransUnionIndicator>${transunion.toString().toLowerCase()}</CreditRepositoryIncludedTransUnionIndicator>
												<EXTENSION>
													<OTHER>
														<p3:RequestEquifaxScore>${equifax.toString().toLowerCase()}</p3:RequestEquifaxScore>
														<p3:RequestExperianFraud>${experian.toString().toLowerCase()}</p3:RequestExperianFraud>
														<p3:RequestExperianScore>${experian.toString().toLowerCase()}</p3:RequestExperianScore>
														<p3:RequestTransUnionFraud>${transunion.toString().toLowerCase()}</p3:RequestTransUnionFraud>
														<p3:RequestTransUnionScore>${transunion.toString().toLowerCase()}</p3:RequestTransUnionScore>
													</OTHER>
												</EXTENSION>
											</CREDIT_REPOSITORY_INCLUDED>
											<CREDIT_REQUEST_DATA_DETAIL>
												<CreditReportRequestActionType>Upgrade</CreditReportRequestActionType>
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
     * Create XML request for credit report refresh
     */
    createRefreshXml(vendorOrderId, borrowerData, providers) {
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
                    <PARTIES>
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
                        </PARTY>
                    </PARTIES>
                    <RELATIONSHIPS>
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
                                                    <OTHER>
                                                        <p3:RequestEquifaxScore>${equifax.toString().toLowerCase()}</p3:RequestEquifaxScore>
                                                        <p3:RequestExperianFraud>${experian.toString().toLowerCase()}</p3:RequestExperianFraud>
                                                        <p3:RequestExperianScore>${experian.toString().toLowerCase()}</p3:RequestExperianScore>
                                                        <p3:RequestTransUnionFraud>${transunion.toString().toLowerCase()}</p3:RequestTransUnionFraud>
                                                        <p3:RequestTransUnionScore>${transunion.toString().toLowerCase()}</p3:RequestTransUnionScore>
                                                    </OTHER>
                                                </EXTENSION>
                                            </CREDIT_REPOSITORY_INCLUDED>
                                            <CREDIT_REQUEST_DATA_DETAIL>
                                                <CreditReportRequestActionType>Other</CreditReportRequestActionType>
                                                <CreditReportRequestActionTypeOtherDescription>Refresh</CreditReportRequestActionTypeOtherDescription>
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
     * Create XML request for query XML for existing order
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
     * Submit a credit report refresh order
     */
    async submitRefreshOrder(vendorOrderId, borrowerData, providers) {
        try {
            const xmlRequest = this.createRefreshXml(vendorOrderId, borrowerData, providers);
            
            logger.info(`Submitting CreditOrder refresh for ${vendorOrderId}...`);
            if (this.config.logRequests) {
                logger.info('Refresh Request XML:', xmlRequest);
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

            // Parse response to get new VendorOrderIdentifier (if any)
            const newVendorOrderId = this.extractVendorOrderId(response.data);
            
            logger.info(`Refresh order submitted successfully. New VendorOrderIdentifier: ${newVendorOrderId}`);
            return newVendorOrderId;

        } catch (error) {
            if (error instanceof AuthenticationError || error instanceof NetworkError) {
                throw error;
            }
            throw new SmartAPIError(`Refresh order submission failed: ${error.message}`);
        }
    }

    /**
     * Submit a credit report reissue order (StatusQuery)
     */
    async submitReissueOrder(vendorOrderId, borrowerData) {
        try {
            const xmlRequest = this.createReissueXml(vendorOrderId, borrowerData);
            
            logger.info(`Submitting CreditOrder reissue for ${vendorOrderId}...`);
            if (this.config.logRequests) {
                logger.info('Reissue Request XML:', xmlRequest);
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

            // Parse response - reissue returns the same vendorOrderId
            const responseData = this.parseResponse(response.data);
            
            logger.info(`Reissue order submitted successfully for VendorOrderIdentifier: ${vendorOrderId}`);
            return responseData;

        } catch (error) {
            if (error instanceof AuthenticationError || error instanceof NetworkError) {
                throw error;
            }
            throw new SmartAPIError(`Reissue order submission failed: ${error.message}`);
        }
    }

    /**
     * Submit a credit report upgrade order
     */
    async submitUpgradeOrder(vendorOrderId, borrowerData, providers) {
        try {
            const xmlRequest = this.createUpgradeXml(vendorOrderId, borrowerData, providers);
            
            logger.info(`Submitting CreditOrder upgrade for ${vendorOrderId}...`);
            if (this.config.logRequests) {
                logger.info('Upgrade Request XML:', xmlRequest);
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

            // Parse response to get new VendorOrderIdentifier (if any)
            const newVendorOrderId = this.extractVendorOrderId(response.data);
            
            logger.info(`Upgrade order submitted successfully. New VendorOrderIdentifier: ${newVendorOrderId}`);
            return newVendorOrderId;

        } catch (error) {
            if (error instanceof AuthenticationError || error instanceof NetworkError) {
                throw error;
            }
            throw new SmartAPIError(`Upgrade order submission failed: ${error.message}`);
        }
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
     * Extract and update loan with credit data
     */
    async updateLoanWithCreditData(loanId, xmlContent, importMethod = 'merge') {
      try {
        const extractor = new CreditDataExtractor();
        
        // Extract debts and assets from XML
        const extractedDebts = extractor.extractDebtsFromXML(xmlContent);
        const extractedAssets = extractor.extractAssetsFromXML(xmlContent);
        const extractedEmployment = extractor.extractEmploymentFromXML(xmlContent);
        
        // Update the loan
        const loan = await Loan.findById(loanId);
        if (!loan) {
          throw new ApiError('Loan not found', 404);
        }
        
        let debtsAdded = 0;
        let assetsAdded = 0;
        
        // Handle debts based on import method
        switch (importMethod) {
          case 'merge':
            // Merge extracted debts with existing debts (avoid duplicates)
            const existingDebtCreditors = loan.debts.map(debt => debt.creditor?.toLowerCase());
            const newDebts = extractedDebts.filter(debt => 
              !existingDebtCreditors.includes(debt.creditor?.toLowerCase())
            );
            
            if (newDebts.length > 0) {
              loan.debts = [...loan.debts, ...newDebts];
              debtsAdded = newDebts.length;
              logger.info(`[MERGE] Added ${newDebts.length} new debts to loan ${loanId}`);
            }
            break;
            
          case 'override':
            // Replace all existing debts with extracted debts
            const oldDebtCount = loan.debts.length;
            loan.debts = extractedDebts;
            debtsAdded = extractedDebts.length;
            logger.info(`[OVERRIDE] Replaced ${oldDebtCount} debts with ${extractedDebts.length} extracted debts for loan ${loanId}`);
            break;
            
          case 'dont_merge':
            // Don't modify debts at all
            debtsAdded = 0;
            logger.info(`[DONT_MERGE] Skipped debt import for loan ${loanId}. Extracted ${extractedDebts.length} debts but did not save.`);
            break;
            
          default:
            // Default to merge if invalid method provided
            logger.warn(`Invalid import method '${importMethod}', defaulting to 'merge'`);
            const defaultExistingCreditors = loan.debts.map(debt => debt.creditor?.toLowerCase());
            const defaultNewDebts = extractedDebts.filter(debt => 
              !defaultExistingCreditors.includes(debt.creditor?.toLowerCase())
            );
            
            if (defaultNewDebts.length > 0) {
              loan.debts = [...loan.debts, ...defaultNewDebts];
              debtsAdded = defaultNewDebts.length;
            }
            break;
        }
        
        // Merge extracted assets with existing assets (always merge for now)
        if (extractedAssets.checkingAndSavings.length > 0) {
          loan.assets.checkingAndSavings = [
            ...loan.assets.checkingAndSavings,
            ...extractedAssets.checkingAndSavings
          ];
          assetsAdded = extractedAssets.checkingAndSavings.length;
          logger.info(`Added ${extractedAssets.checkingAndSavings.length} new assets to loan ${loanId}`);
        }
        
        // Update employment if found
        if (extractedEmployment.length > 0) {
          // You might want to update borrower employment history here
          logger.info(`Found ${extractedEmployment.length} employment records for loan ${loanId}`);
        }
        
        await loan.save();
        
        return {
          debtsAdded,
          assetsAdded,
          employmentFound: extractedEmployment.length,
          importMethod
        };
        
      } catch (error) {
        logger.error('Error updating loan with credit data:', error);
        throw error;
      }
    }

    /**
     * Extract and update loan with credit data (refresh/reissue/upgrade mode)
     */
    async updateLoanWithCreditDataRefresh(loanId, xmlContent, importMethod = 'merge') {
      try {
        const extractor = new CreditDataExtractor();
        
        // Extract debts and assets from XML
        const extractedDebts = extractor.extractDebtsFromXML(xmlContent);
        const extractedAssets = extractor.extractAssetsFromXML(xmlContent);
        const extractedEmployment = extractor.extractEmploymentFromXML(xmlContent);
        
        // Update the loan
        const loan = await Loan.findById(loanId);
        if (!loan) {
          throw new ApiError('Loan not found', 404);
        }
        
        let debtsUpdated = 0;
        let assetsUpdated = 0;
        
        // Handle debts based on import method
        switch (importMethod) {
          case 'merge':
            // Update debts - match by creditor name and update existing or add new
            const existingDebtCreditors = loan.debts.map(debt => debt.creditor?.toLowerCase());
            
            extractedDebts.forEach(extractedDebt => {
              const creditorLower = extractedDebt.creditor?.toLowerCase();
              const existingDebtIndex = existingDebtCreditors.indexOf(creditorLower);
              
              if (existingDebtIndex !== -1) {
                // Update existing debt with all fields
                const existingDebt = loan.debts[existingDebtIndex];
                existingDebt.monthlyPayment = extractedDebt.monthlyPayment;
                existingDebt.balance = extractedDebt.balance;
                existingDebt.accountOpenDate = extractedDebt.accountOpenDate;
                existingDebt.accountClosedDate = extractedDebt.accountClosedDate;
                existingDebt.liabilityType = extractedDebt.liabilityType;
                existingDebt.status = extractedDebt.status;
                existingDebt.highBalance = extractedDebt.highBalance;
                existingDebt.pastDueAmount = extractedDebt.pastDueAmount;
                existingDebt.creditLimit = extractedDebt.creditLimit;
                existingDebt.currentRating = extractedDebt.currentRating;
                existingDebt.highestAdverseRating = extractedDebt.highestAdverseRating;
                existingDebt.comments = extractedDebt.comments;
                debtsUpdated++;
              } else {
                // Add new debt
                loan.debts.push(extractedDebt);
                debtsUpdated++;
              }
            });
            logger.info(`[MERGE] Updated/added ${debtsUpdated} debts for loan ${loanId}`);
            break;
            
          case 'override':
            // Replace all existing debts with extracted debts
            const oldDebtCount = loan.debts.length;
            loan.debts = extractedDebts;
            debtsUpdated = extractedDebts.length;
            logger.info(`[OVERRIDE] Replaced ${oldDebtCount} debts with ${extractedDebts.length} extracted debts for loan ${loanId}`);
            break;
            
          case 'dont_merge':
            // Don't modify debts at all
            debtsUpdated = 0;
            logger.info(`[DONT_MERGE] Skipped debt import for loan ${loanId}. Extracted ${extractedDebts.length} debts but did not save.`);
            break;
            
          default:
            // Default to merge if invalid method provided
            logger.warn(`Invalid import method '${importMethod}', defaulting to 'merge'`);
            const defaultExistingCreditors = loan.debts.map(debt => debt.creditor?.toLowerCase());
            
            extractedDebts.forEach(extractedDebt => {
              const creditorLower = extractedDebt.creditor?.toLowerCase();
              const existingDebtIndex = defaultExistingCreditors.indexOf(creditorLower);
              
              if (existingDebtIndex !== -1) {
                const existingDebt = loan.debts[existingDebtIndex];
                existingDebt.monthlyPayment = extractedDebt.monthlyPayment;
                existingDebt.balance = extractedDebt.balance;
                debtsUpdated++;
              } else {
                loan.debts.push(extractedDebt);
                debtsUpdated++;
              }
            });
            break;
        }
        
        // Update assets - for refresh, we'll replace the credit report assets
        // Remove existing credit report assets and add fresh ones
        loan.assets.checkingAndSavings = loan.assets.checkingAndSavings.filter(
          asset => asset.accountNumber !== 'Credit Report Assets'
        );
        
        if (extractedAssets.checkingAndSavings.length > 0) {
          loan.assets.checkingAndSavings = [
            ...loan.assets.checkingAndSavings,
            ...extractedAssets.checkingAndSavings
          ];
          assetsUpdated = extractedAssets.checkingAndSavings.length;
        }
        
        // Update employment if found
        if (extractedEmployment.length > 0) {
          logger.info(`Found ${extractedEmployment.length} employment records for loan ${loanId} refresh`);
        }
        
        await loan.save();
        
        return {
          debtsUpdated,
          assetsUpdated,
          employmentFound: extractedEmployment.length,
          importMethod
        };
        
      } catch (error) {
        logger.error('Error updating loan with credit data during refresh:', error);
        throw error;
      }
    }

    /**
     * Create a new credit report
     */
    async createCreditReport(loanId, lenderId, userId, providers = {}, importMethod = 'merge') {
        try {
            // Find the loan and populate borrower and lender
            const loan = await Loan.findById(loanId).populate('borrower lender');
            if (!loan) {
                throw new ApiError('Loan not found', 404);
            }

            // Get the lender to find the company
            const lender = await Lender.findById(lenderId).populate('company');
            if (!lender) {
                throw new ApiError('Lender not found', 404);
            }

            // Check if there's already an active credit report for this borrower in this company
            // const existingReport = await CreditReport.findActiveByBorrower(loan.borrower._id, lender.company._id);
            // if (existingReport) {
            //     throw new ApiError('An active credit report already exists for this borrower', 409);
            // }

            // Extract borrower data (currently using test data)
            const borrowerData = this.extractBorrowerData(loan);

            // Create credit report record
            const creditReport = new CreditReport({
                borrower: loan.borrower._id,
                loan: loanId,
                lender: lenderId,
                company: lender.company._id,
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
                logger.info(`Generating credit report for loan ${loanId} with import method: ${importMethod}`);
                const result = await this.submitAndPoll(borrowerData, creditReport.providers);

                // Update SmartAPI data
                creditReport.smartApiData.vendorOrderId = result.vendorOrderId;
                creditReport.smartApiData.completionTimestamp = new Date();
                creditReport.smartApiData.rawResponse = result.rawXml;

                // Extract credit scores
                if (result.serviceData.creditScores && result.serviceData.creditScores.length > 0) {
                    creditReport.creditScores = result.serviceData.creditScores.map(score => (
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
                        
                        // Extract and update loan with credit data using specified import method
                        try {
                            const extractionResult = await this.updateLoanWithCreditData(loanId, result.rawXml, importMethod);
                            logger.info(`Credit data extraction completed for loan ${loanId}:`, extractionResult);
                        } catch (extractionError) {
                            logger.warn('Failed to extract credit data, but report was created:', extractionError);
                        }
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
            // Find the loan to get borrower and lender info
            const loan = await Loan.findById(loanId).populate('borrower lender');
            if (!loan) {
                throw new ApiError('Loan not found', 404);
            }

            // Get the lender to find the company
            const lender = await Lender.findById(loan.lender._id).populate('company');
            if (!lender) {
                throw new ApiError('Lender not found', 404);
            }

            // Find active credit report for this borrower in this company
            const creditReport = await CreditReport.findActiveByBorrower(loan.borrower._id, lender.company._id);
            if (!creditReport) {
                throw new ApiError('No active credit report found for this borrower', 404);
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
    async refreshCreditReport(loanId, lenderId, userId, providers = null, importMethod = 'merge') {
        try {
            // Find the loan to get borrower and lender info
            const loan = await Loan.findById(loanId).populate('borrower lender');
            if (!loan) {
                throw new ApiError('Loan not found', 404);
            }

            // Get the lender to find the company
            const lender = await Lender.findById(lenderId).populate('company');
            if (!lender) {
                throw new ApiError('Lender not found', 404);
            }

            // Get the existing report for this borrower in this company
            const existingReport = await CreditReport.findActiveByBorrower(loan.borrower._id, lender.company._id);
            if (!existingReport) {
                throw new ApiError('No existing credit report found to refresh', 404);
            }

            // Check if we have a vendorOrderId
            if (!existingReport.smartApiData?.vendorOrderId) {
                throw new ApiError('Cannot refresh report without vendor order ID', 400);
            }

            // Update providers if provided, otherwise use existing ones
            const providersToUse = providers || existingReport.providers;
            if (providers) {
                existingReport.providers = {
                    equifax: providers.equifax !== false,
                    experian: providers.experian !== false,
                    transunion: providers.transunion !== false
                };
            }

            // Update status to Processing
            existingReport.status = 'Processing';
            await existingReport.save();

            try {
                // Submit refresh order using existing vendorOrderId
                logger.info(`Refreshing credit report for loan ${loanId} using vendorOrderId: ${existingReport.smartApiData.vendorOrderId} with import method: ${importMethod}`);
                
                const newVendorOrderId = await this.submitRefreshOrder(
                    existingReport.smartApiData.vendorOrderId,
                    existingReport.borrowerData,
                    providersToUse
                );

                // Poll for completion
                const result = await this.pollOrder(newVendorOrderId, existingReport.borrowerData);

                // Update SmartAPI data with new order ID and completion info
                existingReport.smartApiData.vendorOrderId = newVendorOrderId;
                existingReport.smartApiData.completionTimestamp = new Date();
                existingReport.smartApiData.rawResponse = result.rawXml;

                // Update credit scores with fresh data
                if (result.serviceData.creditScores && result.serviceData.creditScores.length > 0) {
                    existingReport.creditScores = result.serviceData.creditScores.map(score => ({
                        bureau: score.bureau.includes('Equifax') ? 'Equifax' : 
                               score.bureau.includes('Experian') ? 'Experian' : 
                               score.bureau.includes('TransUnion') ? 'TransUnion' : 'Unknown',
                        score: parseInt(score.score),
                        model: score.model,
                        dateGenerated: new Date()
                    }));
                }

                // Handle documents - update with new HTML report
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
                        // Upload new report to S3, replacing the old one
                        const s3Info = await this.uploadReportToS3(htmlContent, loanId, newVendorOrderId);
                        existingReport.reportFile = s3Info;
                        
                        // Extract and update loan with fresh credit data using specified import method
                        try {
                            const extractionResult = await this.updateLoanWithCreditDataRefresh(loanId, result.rawXml, importMethod);
                            logger.info(`Credit data extraction completed for loan ${loanId} refresh:`, extractionResult);
                        } catch (extractionError) {
                            logger.warn('Failed to extract credit data during refresh, but report was updated:', extractionError);
                        }
                    }
                }

                // Clear previous errors and add new ones if any
                existingReport.errors = [];
                if (result.errors && result.errors.length > 0) {
                    existingReport.errors = result.errors.map(error => ({
                        code: error.code,
                        message: error.message
                    }));
                }

                // Update status based on result
                existingReport.status = result.status === 'COMPLETED' ? 'Completed' : 'Failed';
                
                // Update timestamps
                existingReport.updatedAt = new Date();
                
                await existingReport.save();

                logger.info(`Credit report refreshed successfully for loan ${loanId}`);
                return existingReport;

            } catch (error) {
                logger.error(`Credit report refresh failed for loan ${loanId}:`, error);
                throw error;
            }

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
            // Find the loan to get borrower and lender info
            const loan = await Loan.findById(loanId).populate('borrower lender');
            if (!loan) {
                throw new ApiError('Loan not found', 404);
            }

            // Get the lender to find the company
            const lender = await Lender.findById(loan.lender._id).populate('company');
            if (!lender) {
                throw new ApiError('Lender not found', 404);
            }

            // Find all credit reports for this borrower in this company
            const reports = await CreditReport.findAllByBorrower(loan.borrower._id, lender.company._id);
            return reports;
        } catch (error) {
            logger.error('Error getting all credit reports:', error);
            throw error;
        }
    }

    /**
     * Reissue an existing credit report (retrieve using StatusQuery)
     */
    async reissueCreditReport(loanId, lenderId, userId, providers = null, importMethod = 'merge') {
        try {
            // Find the loan to get borrower and lender info
            const loan = await Loan.findById(loanId).populate('borrower lender');
            if (!loan) {
                throw new ApiError('Loan not found', 404);
            }

            // Get the lender to find the company
            const lender = await Lender.findById(lenderId).populate('company');
            if (!lender) {
                throw new ApiError('Lender not found', 404);
            }

            // Get the existing report for this borrower in this company
            const existingReport = await CreditReport.findActiveByBorrower(loan.borrower._id, lender.company._id);
            if (!existingReport) {
                throw new ApiError('No existing credit report found to reissue', 404);
            }

            // Check if we have a vendorOrderId
            if (!existingReport.smartApiData?.vendorOrderId) {
                throw new ApiError('Cannot reissue report without vendor order ID', 400);
            }

            // Update providers if provided, otherwise use existing ones
            if (providers) {
                existingReport.providers = {
                    equifax: providers.equifax !== false,
                    experian: providers.experian !== false,
                    transunion: providers.transunion !== false
                };
            }

            // Update status to Processing
            existingReport.status = 'Processing';
            await existingReport.save();

            try {
                // Submit reissue order using existing vendorOrderId
                logger.info(`Reissuing credit report for loan ${loanId} using vendorOrderId: ${existingReport.smartApiData.vendorOrderId} with import method: ${importMethod}`);
                
                const result = await this.submitReissueOrder(
                    existingReport.smartApiData.vendorOrderId,
                    existingReport.borrowerData
                );

                // Update SmartAPI data with reissue timestamp
                existingReport.smartApiData.completionTimestamp = new Date();
                existingReport.smartApiData.rawResponse = result.rawXml;

                // Update credit scores with data from reissued report
                if (result.serviceData.creditScores && result.serviceData.creditScores.length > 0) {
                    existingReport.creditScores = result.serviceData.creditScores.map(score => ({
                        bureau: score.bureau.includes('Equifax') ? 'Equifax' : 
                               score.bureau.includes('Experian') ? 'Experian' : 
                               score.bureau.includes('TransUnion') ? 'TransUnion' : 'Unknown',
                        score: parseInt(score.score),
                        model: score.model,
                        dateGenerated: new Date()
                    }));
                }

                // Handle documents - update with reissued HTML report
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
                        // Upload reissued report to S3
                        const s3Info = await this.uploadReportToS3(htmlContent, loanId, existingReport.smartApiData.vendorOrderId);
                        existingReport.reportFile = s3Info;
                        
                        // Extract and update loan with credit data using specified import method
                        try {
                            const extractionResult = await this.updateLoanWithCreditDataRefresh(loanId, result.rawXml, importMethod);
                            logger.info(`Credit data extraction completed for loan ${loanId} reissue:`, extractionResult);
                        } catch (extractionError) {
                            logger.warn('Failed to extract credit data during reissue, but report was updated:', extractionError);
                        }
                    }
                }

                // Clear previous errors and add new ones if any
                existingReport.errors = [];
                if (result.errors && result.errors.length > 0) {
                    existingReport.errors = result.errors.map(error => ({
                        code: error.code,
                        message: error.message
                    }));
                }

                // Update status based on result
                existingReport.status = result.status === 'COMPLETED' || result.status === 'Completed' ? 'Completed' : 'Failed';
                
                // Update timestamps
                existingReport.updatedAt = new Date();
                
                await existingReport.save();

                logger.info(`Credit report reissued successfully for loan ${loanId}`);
                return existingReport;

            } catch (error) {
                // Update status to Failed
                existingReport.status = 'Failed';
                existingReport.errors.push({
                    code: error.name || 'Unknown',
                    message: error.message
                });
                await existingReport.save();

                logger.error(`Credit report reissue failed for loan ${loanId}:`, error);
                throw error;
            }

        } catch (error) {
            logger.error('Error reissuing credit report:', error);
            throw error;
        }
    }

    /**
     * Upgrade an existing credit report order
     */
    async upgradeCreditReport(loanId, lenderId, userId, providers = null, importMethod = 'merge') {
        try {
            // Find the loan to get borrower and lender info
            const loan = await Loan.findById(loanId).populate('borrower lender');
            if (!loan) {
                throw new ApiError('Loan not found', 404);
            }

            // Get the lender to find the company
            const lender = await Lender.findById(lenderId).populate('company');
            if (!lender) {
                throw new ApiError('Lender not found', 404);
            }

            // Get the existing report for this borrower in this company
            const existingReport = await CreditReport.findActiveByBorrower(loan.borrower._id, lender.company._id);
            if (!existingReport) {
                throw new ApiError('No existing credit report found to upgrade', 404);
            }

            // Check if we have a vendorOrderId
            if (!existingReport.smartApiData?.vendorOrderId) {
                throw new ApiError('Cannot upgrade report without vendor order ID', 400);
            }

            // Update providers if provided, otherwise use existing ones
            const providersToUse = providers || existingReport.providers;
            if (providers) {
                existingReport.providers = {
                    equifax: providers.equifax !== false,
                    experian: providers.experian !== false,
                    transunion: providers.transunion !== false
                };
            }

            // Update status to Processing
            existingReport.status = 'Processing';
            await existingReport.save();

            try {
                // Submit upgrade order using existing vendorOrderId
                logger.info(`Upgrading credit report for loan ${loanId} using vendorOrderId: ${existingReport.smartApiData.vendorOrderId} with import method: ${importMethod}`);
                
                const newVendorOrderId = await this.submitUpgradeOrder(
                    existingReport.smartApiData.vendorOrderId,
                    existingReport.borrowerData,
                    providersToUse
                );

                // Poll for completion
                const result = await this.pollOrder(newVendorOrderId, existingReport.borrowerData);

                // Update SmartAPI data with new order ID and completion info
                existingReport.smartApiData.vendorOrderId = newVendorOrderId;
                existingReport.smartApiData.completionTimestamp = new Date();
                existingReport.smartApiData.rawResponse = result.rawXml;

                // Update credit scores with upgraded data
                if (result.serviceData.creditScores && result.serviceData.creditScores.length > 0) {
                    existingReport.creditScores = result.serviceData.creditScores.map(score => ({
                        bureau: score.bureau.includes('Equifax') ? 'Equifax' : 
                               score.bureau.includes('Experian') ? 'Experian' : 
                               score.bureau.includes('TransUnion') ? 'TransUnion' : 'Unknown',
                        score: parseInt(score.score),
                        model: score.model,
                        dateGenerated: new Date()
                    }));
                }

                // Handle documents - update with upgraded HTML report
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
                        // Upload upgraded report to S3, replacing the old one
                        const s3Info = await this.uploadReportToS3(htmlContent, loanId, newVendorOrderId);
                        existingReport.reportFile = s3Info;
                        
                        // Extract and update loan with upgraded credit data using specified import method
                        try {
                            const extractionResult = await this.updateLoanWithCreditDataRefresh(loanId, result.rawXml, importMethod);
                            logger.info(`Credit data extraction completed for loan ${loanId} upgrade:`, extractionResult);
                        } catch (extractionError) {
                            logger.warn('Failed to extract credit data during upgrade, but report was updated:', extractionError);
                        }
                    }
                }

                // Clear previous errors and add new ones if any
                existingReport.errors = [];
                if (result.errors && result.errors.length > 0) {
                    existingReport.errors = result.errors.map(error => ({
                        code: error.code,
                        message: error.message
                    }));
                }

                // Update status based on result
                existingReport.status = result.status === 'COMPLETED' ? 'Completed' : 'Failed';
                
                // Update timestamps
                existingReport.updatedAt = new Date();
                
                await existingReport.save();

                logger.info(`Credit report upgraded successfully for loan ${loanId}`);
                return existingReport;

            } catch (error) {
                // Update status to Failed
                existingReport.status = 'Failed';
                existingReport.errors.push({
                    code: error.name || 'Unknown',
                    message: error.message
                });
                await existingReport.save();

                logger.error(`Credit report upgrade failed for loan ${loanId}:`, error);
                throw error;
            }

        } catch (error) {
            logger.error('Error upgrading credit report:', error);
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
