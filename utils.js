import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import * as fs from "fs";
import * as path from "path";
import * as aws from "./config/aws.js";
/*
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathToKey = path.join(__dirname, '.', 'id_rsa_priv.pem');
const PRIV_KEY2 = fs.readFileSync(pathToKey, 'utf8');
console.log(JSON.stringify({PRIV_KEY2}));
*/
const PRIV_KEY = aws.getPrivKey();

function generateHash(password) {
    var salt = crypto.randomBytes(32).toString('hex');
    var hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    return {
        salt: salt,
        hash: hash
    };
}

function isPasswordValid(user, password) {
    var generatedHash = crypto.pbkdf2Sync(password, user.salt, 10000, 64, 'sha512').toString('hex');
    return user.hash === generatedHash;
}

function issueJWT(user) {
    const _id = user._id;

    const expiresIn = '90d';
  
    const payload = {
      sub: _id,
      iat: Date.now()
    };
  
    const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { expiresIn: expiresIn, algorithm: 'RS256' });
  
    return {
      jwt: "Bearer " + signedToken,
      expires: expiresIn
    }
}

export {
  generateHash,
  isPasswordValid,
  issueJWT,
}