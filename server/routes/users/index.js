var path = require('path');
var users = require(path.join(__dirname, 'config'));

// Export Routes/Pre
module.exports = [
  { method: 'POST', path: '/users', config: users.create },
  { method: 'GET', path: '/users/{id}', config: users.find },
  { method: 'PUT', path: '/users', config: users.update },
  // POST IMPORT
  { method: 'POST', path: '/users/import', config: users.import }
];