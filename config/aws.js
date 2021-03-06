
import AWS from 'aws-sdk';
AWS.config.update({region: 'ca-central-1'});

/**
 * Function to get signed URLs which users can use to upload pictures to the s3 bucket
 */

let s3 = new AWS.S3({apiVersion: '2006-03-01'});
const URL_EXPIRATION_SECONDS = 3000;
const Bucket = 'feepo-images-test';

async function getSignedURL(fileName) {
    let Key = Date.now() + "-" + fileName; // Ex: 1642038797612-filename1.jpg or 1642038797612-filename2.png

    let s3Params = {
        Bucket: Bucket,
        Key: Key,
        Expires: URL_EXPIRATION_SECONDS,
    }

    console.log("s3Params", s3Params);
    let uploadURL = await s3.getSignedUrlPromise('putObject', s3Params);

    let result = {
        uploadURL: uploadURL
    };
    
    return result;
}


/**
 * getPrivKey() and getPubKey() and used by the server to sign and validate JWTs.
 * The keys are stored on AWS so that they can be securely accessed regardless of where
 * the server is deployed as long as the supplied AWS credentials are valid.
 */

var region = "ca-central-1";
var secretName = "PubPrivKeys";

// Create a Secrets Manager client
var client = new AWS.SecretsManager({
    region: region
});

let data = await client.getSecretValue({SecretId: secretName}).promise();
let secret = data.SecretString;
let parsedSecret = JSON.parse(secret);
let privKey = parsedSecret.id_rsa_priv;
let pubKey = parsedSecret.id_rsa_pub;
let dbAddress = parsedSecret.db_address

// Returns the RSA priv key that is stored in AWS Secrets Manager
function getPrivKey() {
    return privKey;
}

// Returns the RSA pub key that is stored in AWS Secrets Manager
function getPubKey() {
    return pubKey;
}

// Returns the address for the mongodb production server
function getDBAddress() {
    return dbAddress;
}

export {
    getSignedURL,
    getPubKey,
    getPrivKey,
    getDBAddress,
}