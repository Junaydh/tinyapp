const getUserByEmail = function(email, database) {
  let res;
  for (const user in database) {
    if (database[user].email === email) {
      return database[user]
    }
  }
  return true;
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

module.exports = {
  getUserByEmail,
  urlsForUser
}