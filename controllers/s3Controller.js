const aws = require("aws-sdk");
const crypto = require("crypto");
const util = require("util");
const randomBytes = util.promisify(crypto.randomBytes);

const asyncHandler = require("express-async-handler");

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

const s3 = new aws.S3({
    bucketRegion,
    accessKey,
    secretAccessKey,
    signatureVersion: "v4",
});

async function generateUploadURL() {
    const rawBytes = await randomBytes(16);
    const fileName = rawBytes.toString("hex");

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Expires: 90,
    };

    const uploadURL = await s3.getSignedUrlPromise("putObject", params);
    return uploadURL;
}

// Get Upload URL
exports.getUrl = asyncHandler(async (req, res, next) => {
    const url = await generateUploadURL();
    res.send({ url });
});

// Delete file from S3
exports.deleteFileS3 = async (fileName) => {
    const deleteParams = {
        Bucket: bucketName,
        Key: fileName,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
};
