/* eslint-disable no-unused-vars */
const OFF = 0
const WARNING = 1
const ERROR = 2
/* eslint-enable no-unused-vars */

module.exports = {
  parser: 'babel-eslint',

  extends: 'standard',

  rules: {
    'comma-dangle': [ERROR, 'always-multiline'],
    'space-before-function-paren': [
      ERROR,
      {anonymous: 'never', named: 'never'},
    ],
  },
}
