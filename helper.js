const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user]
    }
  }
  return undefined;
};

const urlsForUser = function(id, database) {
  let ret = {};
  for (const url in database) {
    if (database[url].userID === id) {
      ret[url] = database[url];
    }
  }
  return ret;
}

const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}

module.exports = {
  getUserByEmail,
  urlsForUser,
  generateRandomString
}