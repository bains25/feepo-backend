import validator from "validator";
import mongoose from "mongoose";
import { getDatabase } from "./mongo.js";
const TEST_PIC_URL = "http://static.demilked.com/wp-content/uploads/2019/08/5d526c73b1566-russian-artist-photoshops-giant-cats-odnoboko-coverimage.jpg";
import * as utils from "../utils.js";
import { config } from "dotenv";
config();

async function setupMongoose() {
    let connectionAddress = null;
    await getDatabase().then((db) => connectionAddress = db.mongoDBURL);

    mongoose.connect(connectionAddress, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    mongoose.connection.on('connected', () => {
        console.log('Database connected');
    });

    if(process.env.NODE_ENV === 'development') {
        // Add test data
        var TEST_IMAGES = [
            {"imageURL": TEST_PIC_URL},
            {"imageURL": TEST_PIC_URL},
            {"imageURL": TEST_PIC_URL},
            {"imageURL": TEST_PIC_URL},
        ]
        
        var names = ["Joe", "Momma", "Nutz", "Deez"]

        for(var i = 0; i < 4; i++) {
            for(var j = 0; j < 4; j++) {
                var generateHashResult = utils.generateHash("password");
                var username = names[i] + names[j];
                var addUserResult = await addUser(username, username + "@mail.com", TEST_PIC_URL, generateHashResult.hash, generateHashResult.salt);
                setArtistImages(addUserResult._id, TEST_IMAGES);
            }
        }
    }
}

setupMongoose();

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        lowercase: true,
        unique: true,
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        validate: (value) => {
            return validator.isEmail(value)
        }
    },
    profilePicURL: String,
    images: [{
        imageURL: String,
        _id : false,
    }],
    hash: String,
    salt: String
});
const User = mongoose.model('User', UserSchema);













// Used for passport strategy
async function lookupUser(userID) {
    var result;
    await User.findOne({_id: userID})
        .then((user) => {
            if(user) result = { "errStatus": null, "result": user }
            else result = { "errStatus": null, "result": false };
        })
        .catch((err) => {
            result = { "errStatus": err, "result": false };
        });

    return result;
}

async function findUserByID(userID) {
    return User.findOne({ _id: userID}).exec();
}

async function findUserByEmail(email) {
    return User.findOne({ email: email}).exec();
}

async function findUserByUsername(username) {
    return User.findOne({ username: username}).exec();
}

// Returns users who are artists
// TODO: Filter users based on whether they are artists
async function getArtists() {
    var artists;
    await User.find({}, "-hash -salt -images").then((result) => {
        artists = result;
    });

    return artists;
}

async function getArtist(username) {
    var user;
    await User.findOne({username: username}, "-_id -hash -salt").then((result) => {
        user = result;
    });

    return user;
}

// Returns list of urls for images uploaded by the artist
async function getArtistImages(username) {
    var images;
    await User.findOne({username: username}, "username images").then((result) => {
        images = result;
    });

    return images;
}

async function addUser(username, email, profilePicURL, hash, salt) {
    const newUser = new User({
        username: username,
        email: email,
        profilePicURL: profilePicURL,
        hash: hash,
        salt: salt
    });
    
    try {
        var user = await newUser.save();
    }
    catch (err) {
        var user = null;
        console.log(err);
    }
    
    return user;
}

async function setArtistImages(userID, images) {
    var result;
    //console.log("imageUrls\n", images);
    // map each image url to a json object with a key "imageURL" and a value equal to the respective url string
    try {
      await User.findOneAndUpdate({"_id": userID}, {$push: { "images": { "$each": images } }}, {upsert: false, new: true})
        .then((user) => {
            result = { 
                err: null, 
                user: user 
            };
        })
    }
    catch (err) {
        result = { 
            err: err,
            user: null
        };

        console.log(err);
    }

    return result;
}

async function setArtistProfilePic(userID, profilePicURL) {
    var result;
    
    try {
      await User.findOneAndUpdate({"_id": userID}, {$set: { "profilePicURL":  profilePicURL }}, {upsert: false, new: true})
        .then((user) => {
            result = { 
                err: null, 
                user: user 
            };
        })
    }
    catch (err) {
        result = { 
            err: err,
            user: null
        };

        console.log(err);
    }

    return result;
}

export {
    lookupUser,
    findUserByID,
    findUserByEmail,
    findUserByUsername,
    addUser,
    getArtist,
    getArtists,
    getArtistImages,
    setArtistImages,
    setArtistProfilePic,
};
