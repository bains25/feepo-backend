//var passport = require('passport');
import { Strategy as JwtStrategy } from "passport-jwt";
import { ExtractJwt as ExtractJwt } from "passport-jwt";
import path from "path";
import fs from "fs";
import * as db from "./database.js";
import * as aws from "./aws.js";


const PUB_KEY = aws.getPubKey();
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ['RS256']
};

function configurePassport(passport) {
  // The JWT payload is passed into the verify callback
  passport.use(new JwtStrategy(options, function(jwt_payload, done) {
    db.lookupUser(jwt_payload.sub)
      .then((result) => {
        done(result.errStatus, result.result);
      })
      .catch((err) => {
        console.log(err);
      });
  }));
}

export {
  configurePassport,
};