const OFF = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
  parser: 'babel-eslint',

  extends: 'standard',

  rules: {
    'comma-dangle': [ERROR, 'always-multiline'],
    'space-before-function-paren': [
      ERROR,
      {anonymous: 'never', named: 'never'},
    ],
  }
};
