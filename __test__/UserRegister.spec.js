const request = require('supertest');
const app = require('../src/app');

describe('User Registration', () => {
  it('returns 200 Ok when signup request is valid', (done) => {
    request(app)
      .post('/api/v1/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then((response) => {
        expect(response.status).toBe(200);
        done();
      });
  });

  it('returns success message when signup request is valid', (done) => {
    request(app)
      .post('/api/v1/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then((response) => {
        expect(response.body.message).toBe('User created');
        done();
      });
  });
});
