const AWS = require('aws-sdk');
const uuidv1 = require('uuid').v1;
var path = require('path');

let awsConfig = {
	region: "eu-west-1",
	bucket: "",
	accessKeyId: "",
	secretAccessKey: "",
};
const cartifig = {
	accessKeyId: awsConfig.accessKeyId,
	secretAccessKey: awsConfig.secretAccessKey, 
	region: awsConfig.region
};
const uploadParams = {
	Bucket: awsConfig.bucket,
	Key: '', // pass key
	Body: null, // pass file body
	ACL: "public-read"
};

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const s3ClientNew = new S3Client({
	region: "eu-west-1", 
	credentials: {
		accessKeyId: "", 
		secretAccessKey: "" 
	}
});

const params = {
	Bucket: "", // The path to the directory you want to upload the object to, starting with your Space name.
	Key: "", // Object key, referenced whenever you want to access this file later.
	Body: null, // The object's contents. This variable is an object, not a string.
	ACL: "public-read", // Defines ACL permissions, such as private or public.
	Metadata: { // Defines metadata tags.
		"HTTP": "text/html"
	}
};



// const doUploadBase64 = async (req, folder = null) => {
// 	let uni = uuidv1();

// 	if (folder !== null) {
// 		params.Key = folder + "/" + uni + path.extname(req.file.originalname);
// 	} else {
// 		params.Key = uni + path.extname(req.file.originalname);
// 	}
// 	params.Body = req.file.buffer;
// 	try {
// 		const s3Get = await s3ClientNew.send(new PutObjectCommand(params));
// 		console.log(
// 			"Successfully uploaded object: " +
// 			params.Bucket +
// 			"/" +
// 			params.Key
// 		);
// 		let data = {
// 			status: true,
// 			url: "https://salon.sgp1.digitaloceanspaces.com/" + params.Key,
// 			// data: {
// 			// 	url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
// 			// 	s3Get
// 			// }
// 		};
// 		return data;
// 	} catch (err) {
// 		console.log("Error", err);
// 	}
// };

async function doUpload(req, filder = null) {
	let uni = uuidv1();
	const params = uploadParams;
	if (filder !== null) {
		params.Key = filder + "/" + uni + path.extname(req?.file?.originalname);
	} else {
		params.Key = uni + path.extname(req?.file?.originalname);
	}
	let originalName = req?.file?.originalname;
	params.Body = req.file.buffer;
	try {
		let s3Get = await new AWS.S3(cartifig).putObject(params).promise();
		let data = {
			status: true,
			"originalname": originalName,
			url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
			// data: {
			// 	url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
			// 	s3Get
			// }
		};
		// console.log("Successfully uploaded data to bucket", data);
		return data;
	} catch (e) {
		// console.log("Error uploading data: ", e);
		return {
			status: false,
			e
		};
	}
}


// async function doPDFUpload(req, filder = null) {
// 	// console.log('mimetype', req.body);
// 	let uni = uuidv1();
// 	const params = uploadParams;
// 	if (filder !== null) {
// 		params.Key = filder + "/" + uni + path.extname(req.file.originalname);
// 	} else {
// 		params.Key = uni + path.extname(req.file.originalname);
// 	}
// 	let originalName = req.file.originalname;
// 	params.Body = req.file.buffer;
// 	try {
// 		// let s3Get = await new AWS.S3(cartifig).putObject(params).promise();
// 		const s3Get = await s3ClientNew.send(new PutObjectCommand(params));
// 		let data = {
// 			status: true,
// 			"originalname": originalName,
// 			// url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
// 			url: "https://salon.sgp1.digitaloceanspaces.com/" + params.Key,


// 			// data: {
// 			// 	url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
// 			// 	s3Get
// 			// }
// 		};
// 		// console.log("Successfully uploaded data to bucket", data);
// 		return data;
// 	} catch (e) {
// 		// console.log("Error uploading data: ", e);
// 		return {
// 			status: false,
// 			e
// 		};
// 	}
// }

async function doUploadBase64digi(req, filder = null) {

	// console.log('req.file', req.file);

	// console.log( filder);
	let uni = uuidv1();

	// console.log(uni)
	// const params = uploadParams;
	// const params = params
	//console.log( params);
	// console.log("req.file.originalname", req.headers.originalname)
	if (filder !== null) {
		params.Key = filder + "/" + uni + path.extname(req.headers.originalname);
	} else {
		params.Key = uni + path.extname(req.headers.originalname);
	}
	// let originalName = req.file.originalname;

	// var base64Data = req.rawBody.replace(/^data:image\/png;base64,/, "");
	// var buf = new buffer(base64Data, 'base64');
	// console.log("req.body", req.body)

	var base64Image = Buffer.from(req.body).toString('base64');
	var mineType = req.headers.minetype;
	var replaceType = req.headers.replacetype;
	var regm = new RegExp(replaceType);
	var orginalKey = base64Image.replace(regm, "")
	//console.log("key", orginalKey, regm, mineType, replaceType)

	params.Body = Buffer.from(orginalKey, 'base64');
	params.ContentEncoding = 'base64';
	params.ContentType = mineType;
	// params.Body = buf;

	try {
		// let s3Get = await new AWS.S3(cartifig).putObject(params).promise();
		const s3Get = await s3ClientNew.send(new PutObjectCommand(params));

		//  console.log(s3Get)
		let data = {
			status: true,
			// "originalname":originalName,
			//url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
			url: "https://salon.sgp1.digitaloceanspaces.com/" + params.Key,

			// data: {
			// 	url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
			// 	s3Get
			// }
		};
		// console.log("Successfully uploaded data to bucket", data);
		return data;
	} catch (e) {
		// console.log("Error uploading data: ", e);
		return {
			status: false,
			e
		};
	}
}

async function doUploadBase64(req, filder = null) {

	// console.log('req.file', req);

	// console.log( filder);
	let uni = uuidv1();

	// console.log(uni)
	const params = uploadParams;
	// const params = params
	//console.log( params);
	// console.log("req.file.originalname", req)
	if (filder !== null) {
		params.Key = filder + "/" + uni + path.extname(req.headers.originalname);
	} else {
		params.Key = uni + path.extname(req.headers.originalname);
	}
	let originalName = req.headers.originalname;

	// var base64Data = req.rawBody.replace(/^data:image\/png;base64,/, "");
	// var buf = new buffer(base64Data, 'base64');
	// console.log("req.body", req.body)

	var base64Image = Buffer.from(req.body).toString('base64');
	var mineType = req.headers.minetype;
	var replaceType = req.headers.replacetype;
	var regm = new RegExp(replaceType);
	var orginalKey = base64Image.replace(regm, "")
	// console.log("key", orginalKey, regm, mineType, replaceType)

	params.Body = Buffer.from(orginalKey, 'base64');
	params.ContentEncoding = 'base64';
	params.ContentType = mineType;
	// params.Body = buf;

	try {
		let s3Get = await new AWS.S3(cartifig).putObject(params).promise();
		// const s3Get = await s3ClientNew.send(new PutObjectCommand(params));

		//  console.log("s3get",s3Get)
		let data = {
			status: true,
			"originalname":originalName,
			url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
			// url: "https://dialoguein.sgp1..amazonaws.com/" + params.Key,
			data: {
				url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
				s3Get
			}
		};
		// console.log("Successfully uploaded data to bucket", data);
		return data;
	} catch (e) {
		// console.log("Error uploading data: ", e);
		return {
			status: false,
			e
		};
	}
}

const doPDFUpload = async (pdfBuffer, req, folder = null) => {

	let uni = uuidv1();
	params.Key = "pdf/" + uni + ".pdf";
	params.Body = pdfBuffer; 
	console.log("pdf krishna ===>> ")
	try {
		//const s3Get = await s3ClientNew.send(new PutObjectCommand(params));
		console.log(
			"Successfully uploaded object: " +
			params.Bucket +
			"/" +
			params.Key
		); 	
		// let data = {
		// 	status: true,
		// 	url: "https://thingstodo.sgp1.digitaloceanspaces.com/" + params.Key,
		// };
		let s3Get = await new AWS.S3(cartifig).putObject(params).promise(); 
		
		let data = {
			status: true,

			url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
			
		};
		return data;
	} catch (err) {
		console.log("Error", err);
	}
};

async function multipleUpload(req, filder = null, callback) {
	const file = req.files;
	let dataRetun = [];
	let senddata = { status: true, data: [] };
	let b = 0;
	file.map(async (item, i) => {
		let uni = uuidv1();
		let params = uploadParams;
		if (filder !== null) {
			params.Key = filder + "/" + uni + path.extname(item.originalname);
		} else {
			params.Key = uni + path.extname(item.originalname);
		}
		params.Body = item.buffer;
		let s3Get = await new AWS.S3(cartifig).putObject(params).promise();
		let data = {
			url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,
			data: s3Get
		};
		senddata.data.push(data);
		// console.log("Successfully uploaded data to bucket", data);
		b = i;

		if (Number(file.length) == Number(b + 1)) {
			await callback(null, senddata);
		}
	});



}

// async function doPDFUploadNew(pdfBuffer, timestamp) {
// 	let uni = uuidv1();
// 	params.Key = "pdf/" + uni + ".pdf";

// 	params.Body = pdfBuffer;

// 	try {
// 		const s3Get = await s3ClientNew.send(new PutObjectCommand(params));
// 		// let s3Get = await new AWS.S3(cartifig).putObject(params).promise();
// 		return {
// 			status: true,
// 			url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,

// 		};
// 	} catch (err) {
// 		console.log("Error", err);
// 		return {
// 			status: false,
// 			error: err,
// 		};
// 	}
// };

async function doPDFUploadNew(pdfBuffer, timestamp) {
    const uni = uuidv1();
    
    const params = {
        Bucket: "your-s3-bucket-name",
        Key: "pdf/" + uni + ".pdf",
        Body: pdfBuffer,
    };

    try {
        const s3Get = await s3ClientNew.send(new PutObjectCommand(params));
        return {
            status: true,
            // url: `https://${params.Bucket}.s3.${awsConfig.region}.amazonaws.com/${params.Key}`,
			url: "https://" + params.Bucket + ".s3." + awsConfig.region + ".amazonaws.com/" + params.Key,


        };
    } catch (err) {
        console.log("Error", err);
        return {
            status: false,
            error: err,
        };
    }
}



module.exports = {
	doUpload,
	multipleUpload,
	doUploadBase64,
	doPDFUpload,
	doUploadBase64digi,
	// doPDFUploadNew,
	// doPDFUpload
};