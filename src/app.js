const express = require('express');
const userRouter = require('./user/userRouter');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(userRouter);

module.exports = app;
