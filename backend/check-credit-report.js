require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const CreditReport = require("./src/models/creditReport.model");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const doc = await CreditReport.findOne({
    "smartApiData.rawResponse": { $exists: true, $ne: "" },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!doc) {
    console.log("No credit report with rawResponse found");
    process.exit(0);
  }

  const raw = doc.smartApiData?.rawResponse || "";
  const tempDir = path.join(__dirname, "tmp");
  fs.mkdirSync(tempDir, { recursive: true });

  const outPath = path.join(
    tempDir,
    `credit-report-raw-${String(doc._id)}-${Date.now()}.xml`
  );
  fs.writeFileSync(outPath, raw, "utf8");

  console.log(JSON.stringify({
    id: String(doc._id),
    status: doc.status,
    rawLen: raw.length,
    hasPublicRecordDetail: raw.includes("CREDIT_PUBLIC_RECORD_DETAIL"),
    hasCreditPublicRecordDetail: raw.includes("CreditPublicRecord"),
    hasPublicRecordType: raw.includes("CreditPublicRecordType"),
    savedXmlPath: outPath,
    reportFile: doc.reportFile,
  }, null, 2));

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
