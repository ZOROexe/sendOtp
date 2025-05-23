const sdk = require("node-appwrite");
const SibApiV3Sdk = require("sib-api-v3-sdk");

module.exports = async function (req, res) {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const database = new sdk.Databases(client);
  console.log("Raw req", req.req.bodyJson.email);
  console.log("req bodyJson", req.bodyJson);
  const email = req.bodyJson.email;
  console.log("email:", email);
  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await database.createDocument(
    process.env.DATABASE_ID,
    process.env.COLLECTION_ID,
    "unique()",
    {
      email,
      otp,
      expireAt: expiry,
    }
  );

  SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey =
    process.env.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = {
    to: [{ email }],
    sender: { name: "Your App", email: "theonepieceisreal0777@gmail.com" },
    subject: "Your OTP Code",
    htmlContent: `<p>Hello, your OTP is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
  };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return res.json({ success: true, message: "OTP sent" });
  } catch (error) {
    return res.json({
      success: false,
      message: "Email failed",
      error: error.message,
    });
  }
};
