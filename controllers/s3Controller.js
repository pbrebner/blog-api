const { S3Client } = require("@aws-sdk/client-s3");

const crypto = require("crypto");
const util = require("util");
const randomBytes = util.promisify(crypto.randomBytes);

const asyncHandler = require("express-async-handler");

const region = "us-west-2";
const bucketName = "blog-bucket-banana";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
    region,
    accessKeyId,
    secretAccessKey,
    signatureVersion: "v4",
});

async function generateUploadURL() {
    const rawBytes = await randomBytes(16);
    const imageName = rawBytes.toString("hex");

    const params = {
        Bucket: bucketName,
        Key: imageName,
        Expires: 60,
    };

    const uploadURL = await s3.getSignedUrlPromise("putObject", params);
    return uploadURL;
}

exports.getUrl = asyncHandler(async (req, res, next) => {
    const url = await generateUploadURL();
    res.send({ url });
});
