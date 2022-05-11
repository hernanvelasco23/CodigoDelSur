const chai = require("chai");
const request = require("supertest");
const expect = chai.expect;

const app = require("../index");

it("user post with invalid field", function(done) {
  request(app)
    .post("/user")
    .send({
      firstname:"hernan",
      lastname: "velasco"
     })
    .end(function(err, res) {
      //should return http 400 (body without fields)
      expect(res.statusCode).to.be.equal(400);
      done();
    });
});

it("user post with invalid field", function(done) {
  request(app)
    .post("/user")
    .send({
      firstname:"hernan",
      lastname: "velasco",
      password:"pass01",
      email:"hernanvelasco@mail."
     })
    .end(function(err, res) {
      //should return http 400 (body with invalid email field)
      expect(res.statusCode).to.be.equal(400);
      done();
    });
});