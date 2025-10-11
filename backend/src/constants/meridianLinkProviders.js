// MeridianLink Credit Providers Configuration
// Based on the provided table with Name, SmartAPI URLs, CreditAPI URLs, and MLCID

const MERIDIAN_LINK_PROVIDERS = [
  {
    name: "Advantage Credit",
    key: "advantage_credit",
    smartApiUrl: "https://credit.advcredit.com/inetapi/request_products.aspx",
    creditApiUrl: "https://credit.advcredit.com/inetapi/au/get_credit_report.aspx",
    mlcId: "BE"
  },
  {
    name: "Advantage Credit Bureau",
    key: "advantage_credit_bureau",
    smartApiUrl: "https://advantagecreditbureau.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://advantagecreditbureau.meridianlink.com/inetapi/get_credit_report.aspx",
    mlcId: "F9"
  },
  {
    name: "Advantage Plus Credit",
    key: "advantage_plus_credit",
    smartApiUrl: "https://advantagepluscredit.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://advantagepluscredit.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "BA"
  },
  {
    name: "American Reporting Company",
    key: "american_reporting_company",
    smartApiUrl: "https://arc.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://arc.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "CE"
  },
  {
    name: "Birchwood Credit Services",
    key: "birchwood_credit_services",
    smartApiUrl: "https://birchwoodcredit.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://birchwoodcredit.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "BO"
  },
  {
    name: "CBFS Business Solutions",
    key: "cbfs_business_solutions",
    smartApiUrl: "https://cbfs.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://cbfs.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "CP"
  },
  {
    name: "Certified Credit Reporting",
    key: "certified_credit_reporting",
    smartApiUrl: "https://certifiedcredit.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://certifiedcredit.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "B2"
  },
  {
    name: "CIC Credit",
    key: "cic_credit",
    smartApiUrl: "https://ciccredit.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://ciccredit.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "CL"
  },
  {
    name: "CISCO Credit",
    key: "cisco_credit",
    smartApiUrl: "https://ciscocredit.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://ciscocredit.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "B1"
  },
  {
    name: "Credit Bureau Services",
    key: "credit_bureau_services",
    smartApiUrl: "https://creditbureauservices.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://creditbureauservices.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "A1"
  },
  {
    name: "Credit Information Systems",
    key: "credit_information_systems",
    smartApiUrl: "https://creditinfosys.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://creditinfosys.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "FD"
  },
  {
    name: "Credit Link",
    key: "credit_link",
    smartApiUrl: "https://creditlink.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://creditlink.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "AW"
  },
  {
    name: "Credit Technologies",
    key: "credit_technologies",
    smartApiUrl: "https://credittech.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://credittech.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "AR"
  },
  {
    name: "Credit Technology",
    key: "credit_technology",
    smartApiUrl: "https://credittechnology.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://credittechnology.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "AS"
  },
  {
    name: "Information Searching Company (ISC)",
    key: "information_searching_company",
    smartApiUrl: "https://isc.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://isc.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "BW"
  },
  {
    name: "KCB Credit",
    key: "kcb_credit",
    smartApiUrl: "https://kcbcredit.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://kcbcredit.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "AJ"
  },
  {
    name: "Lenders One",
    key: "lenders_one",
    smartApiUrl: "https://lendersone.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://lendersone.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "FB"
  },
  {
    name: "Merchants Credit Bureau (Augusta)",
    key: "merchants_credit_bureau_augusta",
    smartApiUrl: "https://mcb-augusta.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://mcb-augusta.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "BL"
  },
  {
    name: "Merchants Credit Bureau (Savannah)",
    key: "merchants_credit_bureau_savannah",
    smartApiUrl: "https://mcb-savannah.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://mcb-savannah.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "BV"
  },
  {
    name: "MeridianLink, Inc.",
    key: "meridianlink_inc",
    smartApiUrl: "https://meridianlink.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://meridianlink.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "A4"
  },
  {
    name: "Premium Credit Bureau",
    key: "premium_credit_bureau",
    smartApiUrl: "https://premiumcredit.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://premiumcredit.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "AE"
  },
  {
    name: "Premium Credit Bureau Data",
    key: "premium_credit_bureau_data",
    smartApiUrl: "https://premiumcreditdata.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://premiumcreditdata.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "F3"
  },
  {
    name: "SARMA",
    key: "sarma",
    smartApiUrl: "https://sarma.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://sarma.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "F6"
  },
  {
    name: "Service 1st",
    key: "service_1st",
    smartApiUrl: "https://service1st.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://service1st.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "A9"
  },
  {
    name: "SettlementOne",
    key: "settlement_one",
    smartApiUrl: "https://settlementone.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://settlementone.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "D2"
  },
  {
    name: "TheCreditBureau.com",
    key: "the_credit_bureau",
    smartApiUrl: "https://thecreditbureau.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://thecreditbureau.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "AH"
  },
  {
    name: "TRIVERIFY LLC",
    key: "triverify_llc",
    smartApiUrl: "https://triverify.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://triverify.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "FC"
  },
  {
    name: "Unisource Credit, LLC",
    key: "unisource_credit_llc",
    smartApiUrl: "https://unisource.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://unisource.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "FH"
  },
  {
    name: "United One Resources",
    key: "united_one_resources",
    smartApiUrl: "https://unitedone.meridianlink.com/inetapi/request_products.aspx",
    creditApiUrl: "https://unitedone.meridianlink.com/inetapi/au/get_credit_report.aspx",
    mlcId: "A7"
  }
];

module.exports = {
  MERIDIAN_LINK_PROVIDERS
};
