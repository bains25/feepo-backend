import http from 'http';
import https from "https";
import fs from "fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";

import { startDatabase } from "./config/mongo.js";
import { configurePassport } from "./config/passport.js";
import * as utils from "./utils.js";
import * as db from "./config/database.js";
import * as aws from "./config/aws.js";
const TEST_PIC_URL = "http://static.demilked.com/wp-content/uploads/2019/08/5d526c73b1566-russian-artist-photoshops-giant-cats-odnoboko-coverimage.jpg";

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const app = express();
app.use(express.json());
//app.use(express.urlencoded({extended: true}));
app.use(cors(corsOptions))
app.use(helmet()); // "Helps you secure your Express apps by setting various HTTP headers"

configurePassport(passport);
app.use(passport.initialize());

if(process.env.NODE_ENV === 'test') {
  var PORT = process.env.PORT || 4001;
}
else {
  var PORT = process.env.PORT || 8080;
  app.use(morgan('dev')); // Logs HTTP requests
}


/*
// Routes HTTP requests to HTTPS server
app.enable('trust proxy')
app.use(function(request, response, next) {
  console.log("rerouting");
  if (!request.secure) {
    console.log( request.headers.host);
     return response.redirect("https://" + request.headers.host + request.url);
  }

  next();
})
*/
/*
app.get('/test', async (req, res) => {
  res.send(await getUsers());
});

app.post('/test', async (req, res) => {
  const user = req.body;
  await addUser(user);
  res.send({ message: 'New user inserted.' });
});
*/

function validateEmail(email) {
  let emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  let matchedEmail = String(email).toLowerCase().match(emailRegex);

  // If the email was invalid, then matchedEmail equals null
  return matchedEmail != null;
}

function validateUsername(username) {
  return username.length > 0;
}

function validatePassword(password) {
  return password.length > 0;
}

async function signupUser(username, email, password, profilePicDataURL) {
  let isValidEmail = validateEmail(email);
  let isValidUsername = validateUsername(username);
  let isValidPassword = validatePassword(password);

  let existingUser = await db.findUserByUsername(username);
  let existingEmail = await db.findUserByEmail(email);
  
  let responseBody;
  if(isValidEmail && isValidUsername && isValidPassword && !existingUser && !existingEmail) {
    const saltHash = utils.generateHash(password);
    const salt = saltHash.salt;
    const hash = saltHash.hash;
    /*
    // Get signed url and upload profile pic
    let presignedURLData = await aws.getSignedURL(req.query.fileName, req.query.fileType);
    let signedURL = presignedURLData.uploadURL;
    let imageData = image.data_url.replace(/^data:image\/\w+;base64,/, "");       
    let buffer = Buffer.from(imageData,'base64');
    let blobData = new Blob([new Uint8Array(buffer)], {type: image.file.type});
    await fetch(signedURL, {
        method: 'PUT',
        mode: 'cors',
        body: blobData
    });
    let profilePicURL = signedURL.split('?')[0];
*/
    let user = await db.addUser(username, email, null, hash, salt);
    const tokenObject = utils.issueJWT(user);
    
    // The actual user object has data like salt and hash info which we don't need to return
    responseBody = { 
      err: null,
      user: {
        username: user.username,
        email: user.email,
        profilePicURL: user.profilePicURL,
      }, 
      token: tokenObject.jwt, 
      expiresIn: tokenObject.expires 
    };
  
  }
  else {
    let err = {};
    err.isValidEmail = isValidEmail;
    err.isValidUsername = isValidUsername;
    err.isValidPassword= isValidPassword;
    err.isUsernameTaken = (existingUser != null);
    err.isEmailTaken = (existingEmail != null);
    
    responseBody = { 
      err: err, 
      user: null,
      token: null,
      expiresIn: null,
    };
  }
  
  return responseBody;
}

app.post("/api/signup", (req, res, next) => {
  signupUser(req.body.username, req.body.email, req.body.password, req.body.profilePicURL)
    .then((responseBody) => {
      if(responseBody.err === null) {
        res.status(200).json(responseBody);
      }
      else {
        res.status(404).json(responseBody);
      }
        
    })
    .catch((err) => {
      console.log(err);
  
      res.status(500).json({ 
        err: { 
          msg: "Internal Server Error"
        }
      });
    });
});

async function loginUser(email, password) {
  let responseBody;
  let user = await db.findUserByEmail(email);

  if(user != null && utils.isPasswordValid(user, password)) {
    var tokenObject = utils.issueJWT(user);

    var err = null;
    var userData = {
      username: user.username,
      email: user.email,
      profilePicURL: user.profilePicURL,
    };
    var token = tokenObject.jwt;
    var expiresIn = tokenObject.expires;
  }
  else {
    err = {
      msg: "Invalid email or password"
    }
    var userData = null;
    var token = null;
    var expiresIn = null;
    
  }

  responseBody = {
    err: err,
    user: userData,
    token: token, 
    expiresIn: expiresIn,
  };
  
  return responseBody;
}

app.post("/api/login", (req, res, next) => {
  loginUser(req.body.email, req.body.password).then((responseBody) => {
    if(!responseBody.err) {
      res.status(200).json(responseBody);
    }
    else {
      res.status(401).json(responseBody);
    }
  })
  .catch((err) => {
    console.log(err);

    res.status(500).json({ 
      err: { 
        msg: "Internal Server Error"
      }
    });
  });
});

app.post("/api/protected", passport.authenticate('jwt', { session: false }), (req, res) => {
  console.log(req.get("authorization").split('.')[1]);
  let payload = req.get("authorization").split('.')[1];
  let decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  console.log("Decoded payload", decodedPayload);
  let _id = decodedPayload["sub"];
  console.log("User id:", _id);
  res.status(200).json({ success: true, msg: "You are successfully authenticated to this route!"});
});

/*
app.get("/api/presignedPostData", passport.authenticate('jwt', { session: false }), (req, res) => {
  console.log(req.body);
  var presignedPost = aws.getPresignedPost();
  res.status(200).json( presignedPost );
});
*/

app.get("/api/presignedPostData", passport.authenticate('jwt', { session: false }), (req, res) => {
  console.log(req.body);
  var presignedPost = aws.getPresignedPost();
  res.status(200).json( presignedPost );
});

app.get("/api/signedURL", passport.authenticate('jwt', { session: false }), (req, res) => {
  console.log(req.body);
  aws.getSignedURL(req.query.fileName, req.query.fileType).then((signedURLData) => {
    res.status(200).json( signedURLData );
  })
});

app.get("/api/artists", (req, res) => {
  console.log(req.body);
  db.getArtists().then(result => {
    res.status(200).json({ success: true, artists: result});
  })
});

app.get("/api/artists/:artist", (req, res) => {
  console.log(req.body);
  db.getArtist(req.params.artist).then(result => {
    res.status(200).json({ success: true, artist: result});
  })
});

// Returns all artists
app.get("/api/artists/:artist/images", (req, res) => {
  console.log(req.body);
  db.getArtistImages(req.params.artist).then(result => {
    res.status(200).json({ success: true, result: result});
  })
});

app.post("/api/images", passport.authenticate('jwt', { session: false }), (req, res) => {
  let payload = req.get("authorization").split('.')[1];
  let decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  let userID = decodedPayload["sub"];

  db.setArtistImages(userID, req.body.images).then(result => {
    if(!result.err) {
      res.status(200).json({ 
        err: null, 
        images: result.user.images 
      });
    }
    else {
      res.status(500).json({ 
        err: { 
          msg: "Internal server error"
        }, 
        images: null
      });
    }
  })
});

app.post("/api/artists/:artist/profilePicURL", passport.authenticate('jwt', { session: false }), (req, res) => {
  let payload = req.get("authorization").split('.')[1];
  let decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  let userID = decodedPayload["sub"];

  db.setArtistProfilePic(userID, req.body.profilePicURL).then(result => {
    if(!result.err) {
      res.status(200).json({ 
        err: null, 
        user: result.user
      });
    }
    else {
      res.status(500).json({ 
        err: { 
          msg: "Internal server error"
        }, 
        user: null
      });
    }
  })
});

import mkcert from 'mkcert';

// create a certificate authority
const ca = await mkcert.createCA({
  organization: 'Hello CA',
  countryCode: 'NP',
  state: 'Bagmati',
  locality: 'Kathmandu',
  validityDays: 365
});

// then create a tls certificate
const cert = await mkcert.createCert({
  domains: ['127.0.0.1', 'localhost'],
  validityDays: 365,
  caKey: ca.key,
  caCert: ca.cert
});

//console.log(cert.key, cert.cert); // certificate info
//console.log(`${cert.cert}\n${ca.cert}`); // create a full chain certificate by merging CA and domain certificates
/*
import * as path from "path";
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
var key = fs.readFileSync(__dirname + '/certs/selfsigned.key', 'utf8');
var cert = fs.readFileSync(__dirname + '/certs/selfsigned.crt', 'utf8');
*/
var credentials = {
  key: cert.key,
  cert: cert.cert
};

startDatabase().then(async () => {
  //await addUser({title: 'Hello, now from the in-memory database!'});

  /*
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
*/
  var httpServer = http.createServer(app);

  httpServer.listen(PORT);
  
  /*
  var server = https.createServer(options, app);
  server.listen(PORT, () => {
    console.log("server starting on port : " + PORT)
  });
  */
});


export default app;