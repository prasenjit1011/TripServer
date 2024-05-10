require('dotenv').config()
const aws = require("aws-sdk");
const AWS = require("aws-sdk");
const multer = require("multer");
//const multerS3 = require("multer-s3");
var express = require("express");
var router = express.Router();
var fs = require("fs");
const storage = multer.memoryStorage();
const limitsMulter = {
    files: 1, // allow only 1 file per request
    fileSize: 9000 * 1024 * 1024, // (replace MBs allowed with your desires)
};
const upload = multer({
    storage: storage,
    limits: limitsMulter,
});
// const uuidv1 = require("uuid").v1;
var path = require('path');

const uploadNew = multer({
    // storage: storage,
    dest: path.resolve('./malter'),
    limits: limitsMulter,
});
const uuidv1 = require("uuid").v1;

const awsConfig = {
    region: "us-east-1",
    bucket: "oneanddone-input", //jd3tvoutput
    bucketOutput: "oneanddone-output",
    accessKeyId: "",
    secretAccessKey: "",
    PipelineId: ""
};

const uploadParams = {
    Bucket: awsConfig.bucket,
    Key: '', // pass key
    Body: null, // pass file body
    ACL: "public-read"
};

const credentials = {
    accessKeyId: "",
    secretAccessKey: "",
    region: awsConfig.region
};
const uploadParamsOutput = {
    Bucket: awsConfig.bucketOutput,
    Key: '', // pass key
    Body: null, // pass file body
    ACL: "public-read"
};

var Etrans = new aws.ElasticTranscoder({
    region: awsConfig.region, //Bucket Region
    credentials: {
        accessKeyId: "",
        secretAccessKey: "",
        region: awsConfig.region
    },
});

async function uploadToS3(fileName, filePath) {
    if (!fileName) {
        throw new Error('the fileName is empty');
    }
    if (!filePath) {
        throw new Error('the file absolute path is empty');
    }

    const fileNameInS3 = `${fileName}`; // the relative path inside the bucket
    console.info(`file name: ${fileNameInS3} file path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        throw new Error(`file does not exist: ${filePath}`);
    }

    const bucket = awsConfig.bucket;


    const s3 = new AWS.S3(credentials);

    const statsFile = fs.statSync(filePath);
    console.info(`file size: ${Math.round(statsFile.size / 1024 / 1024)}MB`);

    //  Each part must be at least 5 MB in size, except the last part.
    let uploadId;
    try {
        const params = {
            Bucket: bucket,
            Key: fileNameInS3,
            ACL: "public-read"
        };
        const result = await s3.createMultipartUpload(params).promise();
        uploadId = result.UploadId;
        console.info(`${fileNameInS3} multipart created with upload id: ${uploadId}`);
    } catch (e) {
        throw new Error(`Error creating S3 multipart. ${e.message}`);
    }

    const chunkSize = 50 * 1024 * 1024; // 10MB
    const readStream = fs.createReadStream(filePath); // you can use a second parameter here with this option to read with a bigger chunk size than 64 KB: { highWaterMark: chunkSize }

    // read the file to upload using streams and upload part by part to S3
    const uploadPartsPromise = new Promise((resolve, reject) => {
        const multipartMap = { Parts: [] };

        let partNumber = 1;
        let chunkAccumulator = null;

        readStream.on('error', (err) => {
            reject(err);
        });

        readStream.on('data', (chunk) => {
            // it reads in chunks of 64KB. We accumulate them up to 10MB and then we send to S3
            if (chunkAccumulator === null) {
                chunkAccumulator = chunk;
            } else {
                chunkAccumulator = Buffer.concat([chunkAccumulator, chunk]);
            }
            if (chunkAccumulator.length > chunkSize) {
                // pause the stream to upload this chunk to S3
                readStream.pause();

                const chunkMB = chunkAccumulator.length / 1024 / 1024;

                const params = {
                    Bucket: bucket,
                    Key: fileNameInS3,
                    PartNumber: partNumber,
                    UploadId: uploadId,
                    Body: chunkAccumulator,
                    ContentLength: chunkAccumulator.length,
                    // ACL: "public-read"
                };
                s3.uploadPart(params).promise()
                    .then((result) => {
                        console.info(`Data uploaded. Entity tag: ${result.ETag} Part: ${params.PartNumber} Size: ${chunkMB}`);
                        multipartMap.Parts.push({ ETag: result.ETag, PartNumber: params.PartNumber });
                        partNumber++;
                        chunkAccumulator = null;
                        // resume to read the next chunk
                        readStream.resume();
                    }).catch((err) => {
                        console.error(`error uploading the chunk to S3 ${err.message}`);
                        reject(err);
                    });
            }
        });

        readStream.on('end', () => {
            console.info('End of the stream');
        });

        readStream.on('close', () => {
            console.info('Close stream');
            if (chunkAccumulator) {
                const chunkMB = chunkAccumulator.length / 1024 / 1024;

                // upload the last chunk
                const params = {
                    Bucket: bucket,
                    Key: fileNameInS3,
                    PartNumber: partNumber,
                    UploadId: uploadId,
                    Body: chunkAccumulator,
                    ContentLength: chunkAccumulator.length,
                    // ACL: "public-read"
                };

                s3.uploadPart(params).promise()
                    .then((result) => {
                        console.info(`Last Data uploaded. Entity tag: ${result.ETag} Part: ${params.PartNumber} Size: ${chunkMB}`);
                        multipartMap.Parts.push({ ETag: result.ETag, PartNumber: params.PartNumber });
                        chunkAccumulator = null;
                        resolve(multipartMap);
                    }).catch((err) => {
                        console.error(`error uploading the last csv chunk to S3 ${err.message}`);
                        reject(err);
                    });
            }
        });
    });

    const multipartMap = await uploadPartsPromise;

    console.info(`All parts have been upload. Let's complete the multipart upload. Parts: ${multipartMap.Parts.length} `);

    // gather all parts' tags and complete the upload
    try {
        const params = {
            Bucket: bucket,
            Key: fileNameInS3,
            MultipartUpload: multipartMap,
            UploadId: uploadId,
            // ACL: "public-read"
        };
        const result = await s3.completeMultipartUpload(params).promise();
        console.info(`Upload multipart completed. Location: ${result.Location} Entity tag: ${result.ETag}`);
        return { fileNameInS3, result };

    } catch (e) {
        return { e }
        // throw new Error(`Error completing S3 multipart. ${e.message}`);
    }

}

async function doUpload(req, filder = null) {
    console.log('mimetype', req);
    let uni = "test--" + uuidv1() + "--educare";
    const params = uploadParams;

    if (filder !== null) {
        params.Key = filder + "/" + uni + path.extname(req.file.originalname);
    } else {
        params.Key = uni + path.extname(req.file.originalname);
    }
    const mainFile = uni + path.extname(req.file.originalname);
    // console.log('mimetype', req.file);
    const or = req.file.originalname

    let getUpload = await uploadToS3(params.Key, req.file.path);

    if (typeof (getUpload.e) == "undefined") {
        fs.unlinkSync(req.file.path);
        return {
            status: true,
            url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
            fileName: or,
            fileData: getUpload.fileNameInS3,
            data: {
                url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
                s3Get: getUpload.result
            }
        };
    } else {
        fs.unlinkSync(req.file.path);
        return getUpload.e
    }


    return;

}

async function doFolder(req, filder = null) {
    const params = uploadParamsOutput;
    if (filder !== null) {
        params.Key = filder + "/";
        try {
            let s3Get = await new aws.S3(credentials).putObject(params).promise();
            let data = {
                status: true,
                url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
                fileName: filder,
                data: {
                    url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
                    s3Get
                }
            };
            // console.log("Successfully uploaded data to bucket", data);
            return data;
        } catch (e) {
            // console.log("Error uploading data: ", e);
            return e;
        }
    } else {
        return { status: false }
    }
}



module.exports = {
    uploadToS3,
    doUpload,
    doFolder,
    awsConfig,
    credentials,
    uploadParams,
    Etrans
};