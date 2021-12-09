const aws = require('aws-sdk');
const Sharp = require('sharp');
const s3 = new aws.S3();
aws.config.region = 'eu-west-2';

const srcBucketInput = process.env.SOURCE_BUCKET;
const quality = parseInt(process.env.QUALITY);
process.env['VIPS_DISC_THRESHOLD'] = "600m"; // Do not change when using with aws lambda

var modifiedResponse = null;
const sharp = require('sharp');
let buffer;


exports.handler = async (event, context, callback) => {

  const request = event.Records[0].cf.request;
  let response = event.Records[0].cf.response;
  const srcUri = request.uri;
  var srcKey = srcUri.substring(srcUri.indexOf('/') + 1);
  const srcBucket = srcBucketInput.replace(/\s/g, '');

  // Fail on mising data
  if (!quality || !srcBucketInput) {
    context.fail('Error: Environment variable SOURCE_BUCKET or QUALITY missing');
    return;
  }

  const compressPromises = [];

  var conversion = 'compressing (quality ' + quality + '): ' + srcBucket + ':' + srcKey;
  compressPromises.push(compressPromise(srcBucket, srcKey, conversion, response));

  try {
    await Promise.all(compressPromises);
    context.succeed(modifiedResponse);
  } catch (err) {
    console.error(err);
    throw (err);
  }
};

function compressPromise(srcBucket, srcKey, conversion, response) {
  console.log('Attempting: ' + conversion);
  return new Promise((resolve, reject) => {
    get(srcBucket, srcKey)
      .then(original => compress(original))
      .then(modified => modifyResponse(modified, response))
      .then(data => {
        modifiedResponse = data;
        console.log('Success: ' + conversion);
        resolve('Success: ' + conversion);
      })
      .catch(error => {
        console.error(error);
        console.log('Failed: ' + conversion);
        return reject(error);
      });
  });
}

function get(srcBucket, srcKey) {
  console.log("Trying to get object from " + srcBucket + " " + srcKey);
  var getParams = {
    Bucket: srcBucket,
    Key: srcKey,
  };
  return new Promise(function (resolve, reject) {
    s3.getObject(getParams, (err, data) => {
      if (err) {
        console.error(err);
        return reject(err);
      } else {
        console.log("Data retrieving from s3");
        resolve(data.Body);
      }
    });
  });
}

function modifyResponse(buffer, response) {
  var size = Buffer.byteLength(buffer);
  console.log("Compressed file size ", size);
  //Only compressed output images below 0.99MB is eligible (lambda edge restrictions)
  if (size < 1040000) {
    response.status = 200;
    response.body = buffer.toString('base64');
    response.bodyEncoding = 'base64';
    response.headers['content-type'] = [{ key: 'Content-Type', value: 'image/' + 'jpg' }];
    console.log("Response modified");
  } else {
    console.log("Output file size larger than expected returning back original image");
  }
  return response;
}

async function compress(inBuffer) {
  console.log("Compressing");
  buffer = await Sharp(inBuffer)
    .toFormat("jpeg")
    .jpeg({ quality: quality })
    .toBuffer();
  return buffer;
}

