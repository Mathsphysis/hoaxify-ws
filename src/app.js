const express = require('express');
const i18next = require('i18next');
const i18Backend = require('i18next-fs-backend');
const i18Middleware = require('i18next-http-middleware');
const userRouter = require('./user/userRouter');

i18next
  .use(i18Backend)
  .use(i18Middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    lng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      lookupHeader: 'accept-language',
    },
  });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(i18Middleware.handle(i18next));

app.use(userRouter);

module.exports = app;
