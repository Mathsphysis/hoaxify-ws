const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/user');
const sequelize = require('../src/config/database');

beforeAll(() => sequelize.sync());

beforeEach(() => User.destroy({ truncate: true }));

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};

describe('User Registration', () => {
  const postUser = (user = validUser) =>
    request(app).post('/api/v1/users').send(user);

  it('returns 200 Ok when signup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });

  it('saves the user to database', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('saves the username and email to database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it('confirms that the password is not plainly saved', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).not.toBe('P4ssword');
  });

  it('returns 400 when entering invalid username', async () => {
    const invalidUser = { ...validUser };
    invalidUser.username = null;
    const response = await postUser(invalidUser);
    expect(response.status).toBe(400);
  });

  it('returns Username cannot be null when username is null', async () => {
    const invalidUser = { ...validUser };
    invalidUser.username = null;
    const response = await postUser(invalidUser);
    expect(response.status).toBe(400);
    const { validationErrors } = response.body;
    expect(validationErrors).not.toBeUndefined();
    expect(validationErrors.username).toBe('Username cannot be null');
  });

  it('returns Email cannot be null when email is null', async () => {
    const invalidUser = { ...validUser };
    invalidUser.email = null;
    const response = await postUser(invalidUser);
    expect(response.status).toBe(400);
    const { validationErrors } = response.body;
    expect(validationErrors).not.toBeUndefined();
    expect(validationErrors.email).toBe('Email cannot be null');
  });

  it('returns validationErrors for all invalid fields', async () => {
    const invalidUser = { ...validUser };
    invalidUser.username = null;
    invalidUser.email = null;
    const response = await postUser(invalidUser);
    expect(response.status).toBe(400);
    const { validationErrors } = response.body;
    expect(validationErrors).not.toBeUndefined();
    const requiredProperties = ['username', 'email'];
    requiredProperties.forEach((property) =>
      expect(validationErrors).toHaveProperty(property));
  });
});
