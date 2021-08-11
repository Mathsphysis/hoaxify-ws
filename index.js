const app = require('./src/app');
const sequelize = require('./src/config/database');

sequelize.sync();

// eslint-disable-next-line no-console
app.listen(3000, () => console.log('app is running'));
