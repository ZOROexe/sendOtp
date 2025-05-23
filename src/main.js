const sdk = require("node-appwrite");
const SibApiV3Sdk = require("sib-api-v3-sdk");

module.exports = async function ({ req, res }) {
  try {
    const client = new sdk.Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const database = new sdk.Databases(client);
    console.log("Raw req", req.bodyJson?.email);
    const email = req.bodyJson?.email;

    if (!email) {
      return res.send({
        status: 400,
        body: { success: false, message: "Email is required" },
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await database.createDocument(
      process.env.DATABASE_ID,
      process.env.COLLECTION_ID,
      "unique()",
      { email, otp, expireAt: expiry }
    );

    const brevoClient = SibApiV3Sdk.ApiClient.instance;
    brevoClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = {
      to: [{ email }],
      sender: { name: "Your App", email: "theonepieceisreal0777@gmail.com" },
      subject: "Your OTP Code",
      htmlContent: `<p>Hello, your OTP is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
    };

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Brevo response:", response);

    return res.send({
      status: 200,
      body: { success: true, message: "OTP sent" },
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    return res.send({
      status: 500,
      body: {
        success: false,
        message: "Something went wrong",
        error: error.message,
      },
    });
  }
};
