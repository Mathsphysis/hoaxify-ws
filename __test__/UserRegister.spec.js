const request = require('supertest');
const bcrypt = require('bcrypt');
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

  it('confirms that the password is correctly hashed', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    bcrypt.compare(validUser.password, savedUser.password, (err, result) => {
      expect(err).toBeUndefined();
      expect(result).toBeTruthy();
    });
  });

  it.each`
    field         | value             | expectedMessage
    ${'username'} | ${null}           | ${'Username must have at least 4 characters'}
    ${'username'} | ${'usr'}          | ${'Username must have between 4 and 32 characters'}
    ${'username'} | ${'u'.repeat(33)} | ${'Username must have between 4 and 32 characters'}
    ${'email'}    | ${null}           | ${'Email cannot be empty'}
    ${'email'}    | ${'usr'}          | ${'Must be a valid email'}
    ${'email'}    | ${'usr'}          | ${'Must be a unique email'}
    ${'password'} | ${null}           | ${'Password must have at least 6 characters'}
    ${'password'} | ${'pass'}         | ${'Password must have between 6 and 18 characters'}
    ${'password'} | ${'p'.repeat(19)} | ${'Password must have between 6 and 18 characters'}
    ${'password'} | ${'aaaa5555'}     | ${'Password must have at least 1 lowercase, 1 uppercase and 1 number'}
    ${'password'} | ${'AAAA5555'}     | ${'Password must have at least 1 lowercase, 1 uppercase and 1 number'}
    ${'password'} | ${'aaaaAAAA'}     | ${'Password must have at least 1 lowercase, 1 uppercase and 1 number'}
  `(
    'returns $expectedMessage when $field is $value',
    async ({ field, value, expectedMessage }) => {
      const invalidUser = { ...validUser };
      invalidUser[field] = value;
      const response = await postUser(invalidUser);
      expect(response.status).toBe(400);
      const { validationErrors } = response.body;
      expect(validationErrors).not.toBeUndefined();
      expect(validationErrors).toHaveProperty(field, expectedMessage);
    }
  );

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
      expect(validationErrors).toHaveProperty(property)
    );
  });
});
