const express = require('express');
const User = require('./user/user');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/v1/users', (req, res) => {
  User.create(req.body).then(() => {
    return res.send({
      message: 'User created',
    });
  });
});

module.exports = app;
