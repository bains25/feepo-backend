//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.PORT = 4001;

import chai from "chai";
import chaiHttp from "chai-http";
import server from "./index.js";
let expect = chai.expect;
let should = chai.should();
chai.use(chaiHttp);

const TEST_PIC_URL = "http://static.demilked.com/wp-content/uploads/2019/08/5d526c73b1566-russian-artist-photoshops-giant-cats-odnoboko-coverimage.jpg";

describe('Authentication', () => {
    beforeEach((done) => {   
      done();
    });

  // This test must be executed first since the subsequent tests use the data that's been inserted
  // Also, if this test fails, it will likely cause the other tests to fail as well
  describe('/POST /api/signup', () => {
      it('should register the user', (done) => {
        let testBody = {
          username: "test0",
          email: "test0@test.com",
          password: "password",
          profilePicURL: TEST_PIC_URL,
        }

        chai.request(server)
            .post('/api/signup')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);
              
              expect(err).to.equal(null);
              expect(res.status).to.equal(200);
              
              expect(res.body).to.have.property("err").equal(null);
              expect(res.body).to.have.property("user");
              expect(res.body).to.have.property("token").be.a('string');
              expect(res.body).to.have.property("expiresIn").be.a('string');

              let userInfo = res.body.user;
              expect(userInfo).to.have.property("username").equal(testBody.username);
              expect(userInfo).to.have.property("email").equal(testBody.email);
              expect(userInfo).to.have.property("profilePicURL");
              // No extra user information should be present in userInfo
              expect(Object.keys(userInfo).length).to.equal(3);

              done();
            });
      });

      it('should register the user even if they have no profile pic', (done) => {
        let testBody = {
          username: "test1",
          email: "test1@test.com",
          password: "password",
          profilePicURL: null,
        }

        chai.request(server)
            .post('/api/signup')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);
              
              expect(err).to.equal(null);
              expect(res.status).to.equal(200);
              
              expect(res.body).to.have.property("err").equal(null);
              expect(res.body).to.have.property("user");
              expect(res.body).to.have.property("token").be.a('string');
              expect(res.body).to.have.property("expiresIn").be.a('string');

              let userInfo = res.body.user;
              expect(userInfo).to.have.property("username").equal(testBody.username);
              expect(userInfo).to.have.property("email").equal(testBody.email);
              expect(userInfo).to.have.property("profilePicURL").equal(null);
              // No extra user information should be present in userInfo
              expect(Object.keys(userInfo).length).to.equal(3);

              done();
            });
      });

      it('should NOT register user if username is taken', (done) => {
        let testBody = {
          username: "test1",
          email: "test2@test.com",
          password: "password",
          profilePicURL: null,
        }

        chai.request(server)
            .post('/api/signup')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);

              expect(err).to.equal(null);
              expect(res.status).to.equal(404);
              
              expect(res.body).to.have.property("err").not.equal(null);
              expect(res.body).to.have.property("user").equal(null);

              let responseErr = res.body.err;
              expect(responseErr).to.have.property("isValidEmail").equal(true);
              expect(responseErr).to.have.property("isValidUsername").equal(true);
              expect(responseErr).to.have.property("isValidPassword").equal(true);
              expect(responseErr).to.have.property("isUsernameTaken").equal(true);
              expect(responseErr).to.have.property("isEmailTaken").equal(false);

              done();
            });
      });

      it('should NOT register user if the email is taken', (done) => {
        let testBody = {
          username: "test3",
          email: "test1@test.com",
          password: "password",
          profilePicURL: null,
        }

        chai.request(server)
            .post('/api/signup')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);

              expect(err).to.equal(null);
              expect(res.status).to.equal(404);
              
              expect(res.body).to.have.property("err").not.equal(null);
              expect(res.body).to.have.property("user").equal(null);

              let responseErr = res.body.err;
              expect(responseErr).to.have.property("isValidEmail").equal(true);
              expect(responseErr).to.have.property("isValidUsername").equal(true);
              expect(responseErr).to.have.property("isValidPassword").equal(true);
              expect(responseErr).to.have.property("isUsernameTaken").equal(false);
              expect(responseErr).to.have.property("isEmailTaken").equal(true);

              done();
            });
      });

      it('should NOT register user if both the username and email are taken', (done) => {
        let testBody = {
          username: "test1",
          email: "test1@test.com",
          password: "password",
          profilePicURL: null,
        }

        chai.request(server)
            .post('/api/signup')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);

              expect(err).to.equal(null);
              expect(res.status).to.equal(404);
              
              expect(res.body).to.have.property("err").not.equal(null);
              expect(res.body).to.have.property("user").equal(null);

              let responseErr = res.body.err;
              expect(responseErr).to.have.property("isValidEmail").equal(true);
              expect(responseErr).to.have.property("isValidUsername").equal(true);
              expect(responseErr).to.have.property("isValidPassword").equal(true);
              expect(responseErr).to.have.property("isUsernameTaken").equal(true);
              expect(responseErr).to.have.property("isEmailTaken").equal(true);

              done();
            });
      });


      it('should NOT register a user with an invalid email', (done) => {
        let testBody = {
          username: "test4",
          email: "test2@t",
          password: "password",
          profilePicURL: null,
        }

        chai.request(server)
            .post('/api/signup')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);

              expect(err).to.equal(null);
              expect(res.status).to.equal(404);
              
              expect(res.body).to.have.property("err").not.equal(null);
              expect(res.body).to.have.property("user").equal(null);

              let responseErr = res.body.err;
              expect(responseErr).to.have.property("isValidEmail").equal(false);
              expect(responseErr).to.have.property("isValidUsername").equal(true);
              expect(responseErr).to.have.property("isValidPassword").equal(true);
              expect(responseErr).to.have.property("isUsernameTaken").equal(false);
              expect(responseErr).to.have.property("isEmailTaken").equal(false);

              done();
            });
      });

      it('should NOT register a user with an empty username', (done) => {
        let testBody = {
          username: "",
          email: "test5@live.com",
          password: "password",
          profilePicURL: null,
        }

        chai.request(server)
            .post('/api/signup')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);

              expect(err).to.equal(null);
              expect(res.status).to.equal(404);
              
              expect(res.body).to.have.property("err").not.equal(null);
              expect(res.body).to.have.property("user").equal(null);

              let responseErr = res.body.err;
              expect(responseErr).to.have.property("isValidEmail").equal(true);
              expect(responseErr).to.have.property("isValidUsername").equal(false);
              expect(responseErr).to.have.property("isValidPassword").equal(true);
              expect(responseErr).to.have.property("isUsernameTaken").equal(false);
              expect(responseErr).to.have.property("isEmailTaken").equal(false);

              done();
            });
      });

      it('should NOT register a user with an empty password', (done) => {
        let testBody = {
          username: "test6",
          email: "test6@live.com",
          password: "",
          profilePicURL: null,
        }

        chai.request(server)
            .post('/api/signup')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);

              expect(err).to.equal(null);
              expect(res.status).to.equal(404);
              
              expect(res.body).to.have.property("err").not.equal(null);
              expect(res.body).to.have.property("user").equal(null);

              let responseErr = res.body.err;
              expect(responseErr).to.have.property("isValidEmail").equal(true);
              expect(responseErr).to.have.property("isValidUsername").equal(true);
              expect(responseErr).to.have.property("isValidPassword").equal(false);
              expect(responseErr).to.have.property("isUsernameTaken").equal(false);
              expect(responseErr).to.have.property("isEmailTaken").equal(false);

              done();
            });
      });
  });

  describe('/POST /api/login', () => {
    before((done) => {
       // Register a user to test log in functionality
      chai.request(server)
        .post('/api/signup')
        .send({
          username: "username",
          email: "user@test.com",
          password: "password",
          profilePicURL: null,
        })
        .end((err, res) => {
          expect(res.body).to.have.property("err").equal(null);
          expect(res.body).to.have.property("user");
          expect(res.body).to.have.property("token");

          done();
        });
    });

    it('logs in a user if the email and password are correct', (done) => {

      let testBody = {
        email: "user@test.com",
        password: "password"
      };

      chai.request(server)
            .post('/api/login')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);
              
              expect(err).to.equal(null);
              expect(res.status).to.equal(200);
              
              expect(res.body).to.have.property("err").equal(null);
              expect(res.body).to.have.property("user");
              expect(res.body).to.have.property("token").be.a('string');
              expect(res.body).to.have.property("expiresIn").be.a('string');;

              let userInfo = res.body.user;
              expect(userInfo).to.have.property("username").be.a('string');
              expect(userInfo).to.have.property("email").equal(testBody.email);
              expect(userInfo).to.have.property("profilePicURL");
              // No extra user information should be present in userInfo
              expect(Object.keys(userInfo).length).to.equal(3);

              done();
            });
    });

    it("doesn't log in a user if the email is incorrect", (done) => {

      let testBody = {
        email: "wrongEmail@test.com",
        password: "password"
      };

      chai.request(server)
            .post('/api/login')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);
              
              expect(err).to.equal(null);
              expect(res.status).to.equal(401);
              
              expect(res.body).to.have.property("err").to.not.equal(null);
              expect(res.body).to.have.property("user").equal(null);
              expect(res.body).to.have.property("token").equal(null);

              expect(res.body.err).to.have.property("msg").equal("Invalid email or password");

              done();
            });
    });

    it("doesn't log in a user if the password is incorrect", (done) => {

      let testBody = {
        email: "user@test.com",
        password: "wrongPassword"
      };

      chai.request(server)
            .post('/api/login')
            .send(testBody)
            .end((err, res) => {
              //console.log(res.body);
              
              expect(err).to.equal(null);
              expect(res.status).to.equal(401);
              
              expect(res.body).to.have.property("err").to.not.equal(null);
              expect(res.body).to.have.property("user").equal(null);
              expect(res.body).to.have.property("token").equal(null);

              expect(res.body.err).to.have.property("msg").equal("Invalid email or password");

              done();
            });
    });

  });
});

describe('Uploading images', () => {
  let TEST_JWT, TEST_USER, TEST_IMAGES, TEST_IMAGES_2, TEST_IMAGES_3;

  before((done) => {
    TEST_USER = {
      username: "username2",
      email: "user2@test.com",
      password: "password",
      profilePicURL: null,
    };
    TEST_IMAGES = [
      { imageURL: "http://static.demilked.com/wp-content/uploads/2019/08/5d526c73b1566-russian-artist-photoshops-giant-cats-odnoboko-coverimage.jpg" },
      { imageURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Rottweiler_standing_facing_left.jpg/800px-Rottweiler_standing_facing_left.jpg" },
    ]
    TEST_IMAGES_2 = [
      { imageURL: "https://upload.wikimedia.org/wikipedia/commons/d/d0/German_Shepherd_-_DSC_0346_%2810096362833%29.jpg" },
      { imageURL: "https://www.akc.org/wp-content/uploads/2017/11/German-Shepherd-on-White-00.jpg" },
    ]
    TEST_IMAGES_3 = [
      { imageURL: "https://i0.wp.com/readysetpuppy.com/wp-content/uploads/2019/09/The-Dos-and-Donts-of-Exercising-a-Young-German-Shepherd.jpg?fit=994%2C538&ssl=1" },
      { imageURL: "https://spiritdogtraining.com/wp-content/uploads/2021/02/shepherd-dog.jpg" },
    ]

    // Register a user to test log in functionality
   chai.request(server)
     .post('/api/signup')
     .send(TEST_USER)
     .end((err, res) => {
       expect(res.body).to.have.property("err").equal(null);
       expect(res.body).to.have.property("user");
       expect(res.body).to.have.property("token");

       TEST_JWT = res.body.token;

       done();
     });
  });

  describe('/GET /api/signedURL', () => {
      it('should get a signedURL if the user has a valid JWT', (done) => {

        chai.request(server)
            .get('/api/signedURL')
            .set('Authorization', TEST_JWT)
            .end((err, res) => {
              //console.log(res.body);
              
              expect(err).to.equal(null);
              expect(res.status).to.equal(200);
              
              expect(res.body).to.have.property("uploadURL").be.a('string');

              done();
            });
      });

      it('should NOT get a signedURL if the JWT is invalid', (done) => {
        chai.request(server)
            .get('/api/signedURL')
            .set('Authorization', TEST_JWT + 'x')
            .end((err, res) => {
              //console.log(res.body);
              
              expect(err).to.equal(null);
              expect(res.status).to.equal(401);

              done();
            });
      });

      it('should NOT get a signedURL if there is no JWT', (done) => {
        chai.request(server)
            .get('/api/signedURL')
            .end((err, res) => {
              //console.log(res.body);
              
              expect(err).to.equal(null);
              expect(res.status).to.equal(401);

              done();
            });
      });

      it('should NOT get a signedURL if there is no JWT', (done) => {
        chai.request(server)
            .get('/api/signedURL')
            .end((err, res) => {
              //console.log(res.body);
              
              expect(err).to.equal(null);
              expect(res.status).to.equal(401);

              done();
            });
      });
  });

  describe('/POST /api/images', () => {
    it("adds new images to artist's profile", (done) => {
      let testBody = {
        images: TEST_IMAGES,
      }

      chai.request(server)
          .post('/api/images')
          .set('Authorization', TEST_JWT)
          .send(testBody)
          .end((err, res) => {
            //console.log(res.body);
            
            expect(err).to.equal(null);
            expect(res.status).to.equal(200);

            expect(res.body).to.have.property("err").equal(null);
            expect(res.body).to.have.property("images").be.a('array');

            let images = res.body.images;
            expect(images).to.deep.equal(TEST_IMAGES);

            done();
          });
    });

    it("adds new images to artist's profile if images already exist", (done) => {
      let testBody = {
        images: TEST_IMAGES_2,
      }

      chai.request(server)
          .post('/api/images')
          .set('Authorization', TEST_JWT)
          .send(testBody)
          .end((err, res) => {
            //console.log(res.body);
            
            expect(err).to.equal(null);
            expect(res.status).to.equal(200);

            expect(res.body).to.have.property("err").equal(null);
            expect(res.body).to.have.property("images").be.a('array');

            let images = res.body.images;
            expect(images).to.deep.equal(TEST_IMAGES.concat(TEST_IMAGES_2));

            done();
          });
    });

    it("doesn't add new images if there is no JWT", (done) => {
      let testBody = {
        images: TEST_IMAGES_2,
      }

      chai.request(server)
          .post('/api/images')
          .send(testBody)
          .end((err, res) => {
            //console.log(res.body);
            
            expect(err).to.equal(null);
            expect(res.status).to.equal(401);

            done();
          });
    });

    it("doesn't add new images if the JWT is invalid", (done) => {
      let testBody = {
        images: TEST_IMAGES_2,
      }

      chai.request(server)
          .post('/api/images')
          .set('Authorization', TEST_JWT + 'x')
          .send(testBody)
          .end((err, res) => {
            //console.log(res.body);
            
            expect(err).to.equal(null);
            expect(res.status).to.equal(401);

            done();
          });
    });
  });

  describe('/GET /api/artists/:artist/profilePicURL', () => {
    it("should set a user's profile pic", (done) => {

      chai.request(server)
          .post('/api/artists/' + TEST_USER.username + '/profilePicURL')
          .set('Authorization', TEST_JWT)
          .send({ profilePicURL: TEST_IMAGES[0].imageURL })
          .end((err, res) => {
            //console.log(res.body);
            
            expect(err).to.equal(null);
            expect(res.status).to.equal(200);
            
            expect(res.body).to.have.property("user").not.equal(null);

            let user = res.body.user;
            expect(user.profilePicURL).to.equal(TEST_IMAGES[0].imageURL);

            done();
          });
    });
  });
});