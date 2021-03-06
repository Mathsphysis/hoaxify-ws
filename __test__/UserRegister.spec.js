const request = require('supertest');
const bcrypt = require('bcrypt');
const { SMTPServer } = require('smtp-server');
const app = require('../src/app');
const User = require('../src/user/user');
const sequelize = require('../src/config/database');
const emailService = require('../src/email/emailService');

let lastMail;
let server;

beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on('data', (data) => {
        mailBody += data.toString();
      });
      stream.on('end', () => {
        lastMail = mailBody;
        callback();
      });
    },
  });
  await server.listen(8587, 'localhost');
  await sequelize.sync();
});

afterAll(async () => {
  await server.close();
});

beforeEach(() => User.destroy({ truncate: true }));

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};

const postUser = (user = { ...validUser }, options = {}) => {
  const agent = request(app).post('/api/1.0/users');

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  return agent.send(user);
};

describe(`User Registration`, () => {
  it(`returns 200 Ok when signup request is valid`, async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it(`returns success message when signup request is valid`, async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });

  it(`saves the user to database`, async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it(`saves the username and email to database`, async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it(`confirms that the password is correctly hashed`, async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    bcrypt.compare(validUser.password, savedUser.password, (err, result) => {
      expect(err).toBeUndefined();
      expect(result).toBeTruthy();
    });
  });
  /* eslint-disable */
  const username_null = 'Username must have at least 4 characters';
  const username_size = 'Username must have between 4 and 32 characters';
  const email_null = 'Email cannot be empty';
  const email_invalid = 'Must be a valid email';
  const password_null = 'Password must have at least 6 characters';
  const password_size = 'Password must have between 6 and 18 characters';
  const password_invalid =
    'Password must have at least 1 lowercase, 1 uppercase and 1 number';
  const email_inuse = 'Email already in use';

  it.each`
    field         | value             | expectedMessage
    ${'username'} | ${null}           | ${username_null}
    ${'username'} | ${'usr'}          | ${username_size}
    ${'username'} | ${'u'.repeat(33)} | ${username_size}
    ${'email'}    | ${null}           | ${email_null}
    ${'email'}    | ${'usr.mail.com'} | ${email_invalid}
    ${'password'} | ${null}           | ${password_null}
    ${'password'} | ${'pass'}         | ${password_size}
    ${'password'} | ${'p'.repeat(19)} | ${password_size}
    ${'password'} | ${'aaaa5555'}     | ${password_invalid}
    ${'password'} | ${'AAAA5555'}     | ${password_invalid}
    ${'password'} | ${'aaaaAAAA'}     | ${password_invalid}
  `(
    /* eslint-enable */
    `returns $expectedMessage when $field is $value`,
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

  // eslint-disable-next-line
  it(`returns ${email_inuse} when email is in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.status).toBe(400);
    expect(response.body.validationErrors).toHaveProperty('email', email_inuse);
  });

  it(`returns validationErrors for all invalid fields`, async () => {
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

  it(`creates user in inactive mode`, async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it(`creates user in inactive mode even if the request body contains inactive as false`, async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(false);
  });

  it(`creates an activationToken for user`, async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
  });

  it('sends an Account Activation email with activationToken', async () => {
    await postUser();
    expect(lastMail).toContain(validUser.email);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail).toContain(savedUser.activationToken);
  });

  it('returns 502 Bad Gateway when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(emailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });
    const response = await postUser();
    mockSendAccountActivation.mockRestore();
    expect(response.status).toBe(502);
  });

  it('returns Failed to deliver email when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(emailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });
    const response = await postUser();
    mockSendAccountActivation.mockRestore();
    expect(response.status).toBe(502);
  });

  it('does not save user to database if sending activation email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(emailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });
    await postUser();
    mockSendAccountActivation.mockRestore();
    const users = await User.findAll();
    expect(users.length).toBe(0);
  });
});

describe(`Internationalization for pt-br`, () => {
  /* eslint-disable */
  const username_null = 'O Username tem que possuir pelo menos 4 caracteres';
  const username_size = 'O Username tem que ter entre 4 e 32 caracteres';
  const email_null = 'Email n??o deve ser vazio';
  const email_invalid = 'Deve ser um email v??lido';
  const password_null = 'A senha tem que possuir pelo menos 4 caracteres';
  const password_size = 'A senha tem que ter entre 4 e 32 caracteres';
  const password_invalid =
    'A senha deve possuir pelo menos 1 letra min??scula, 1 mai??scula e 1 n??mero';
  const email_inuse = 'Email j?? est?? registrado';

  it.each`
    field         | value             | expectedMessage
    ${'username'} | ${null}           | ${username_null}
    ${'username'} | ${'usr'}          | ${username_size}
    ${'username'} | ${'u'.repeat(33)} | ${username_size}
    ${'email'}    | ${null}           | ${email_null}
    ${'email'}    | ${'usr.mail.com'} | ${email_invalid}
    ${'password'} | ${null}           | ${password_null}
    ${'password'} | ${'pass'}         | ${password_size}
    ${'password'} | ${'p'.repeat(19)} | ${password_size}
    ${'password'} | ${'aaaa5555'}     | ${password_invalid}
    ${'password'} | ${'AAAA5555'}     | ${password_invalid}
    ${'password'} | ${'aaaaAAAA'}     | ${password_invalid}
  `(
    /* eslint-enable */
    `returns $expectedMessage when $field is $value`,
    async ({ field, value, expectedMessage }) => {
      const invalidUser = { ...validUser };
      invalidUser[field] = value;
      const response = await postUser(invalidUser, { language: 'pt-br' });
      expect(response.status).toBe(400);
      const { validationErrors } = response.body;
      expect(validationErrors).not.toBeUndefined();
      expect(validationErrors).toHaveProperty(field, expectedMessage);
    }
  );

  // eslint-disable-next-line
  it(`returns ${email_inuse} when email is in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser({ ...validUser }, { language: 'pt-br' });
    expect(response.status).toBe(400);
    expect(response.body.validationErrors).toHaveProperty('email', email_inuse);
  });

  it(`returns success message when signup request is valid`, async () => {
    const response = await postUser({ ...validUser }, { language: 'pt-br' });
    expect(response.body.message).toBe('Usu??rio criado com sucesso');
  });

  it('returns email failure message when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(emailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });
    const response = await postUser({ ...validUser }, { language: 'pt-br' });
    mockSendAccountActivation.mockRestore();
    expect(response.body.message).toBe(
      'Houve uma falha no envio do email de ativa????o'
    );
  });

  it(`returns token failure message when invalid token is sent from user`, async () => {
    await postUser();
    const token = 'inexistentToken';

    const response = await request(app)
      .post(`/api/1.0/users/token/${token}`)
      .set('Accept-Language', 'pt-br')
      .send();
    expect(response.body.message).toBe('O token enviado n??o ?? v??lido');
  });
});

describe('Account Activation', () => {
  it('activates the account when correct token is sent', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app).post(`/api/1.0/users/token/${token}`).send();
    users = await User.findAll();
    expect(users[0].inactive).toBe(false);
  });

  it('removes token from the user table after sucessful activation', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app).post(`/api/1.0/users/token/${token}`).send();
    users = await User.findAll();
    expect(users[0].activationToken).toBeFalsy();
  });

  it(`does not activate the account when token doesn't match`, async () => {
    await postUser();
    let users = await User.findAll();
    const token = 'inexistentToken';

    await request(app).post(`/api/1.0/users/token/${token}`).send();
    users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });

  it(`returns bad request 400 when invalid token is sent from user`, async () => {
    await postUser();
    const token = 'inexistentToken';

    const response = await request(app)
      .post(`/api/1.0/users/token/${token}`)
      .send();
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid token');
  });
});
