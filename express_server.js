const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helper');

// setting middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id'],
  maxAge: 24 * 60 * 60 * 1000
}));

// database constants
const urlDatabase = {
};

const users = {
};

// get request for urls_index
app.get('/urls', (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    let urlList = urlsForUser(user.id, urlDatabase);
    if (Object.keys(urlList).length !== 0) {
      const templateVars = { urls: urlList, user};
      res.render('urls_index', templateVars);
    } else {
      res.send("<html><body><b>No URLs to display. <a href='/urls/new'>click here to make one!</a></b></body></html>\n");
    }
  } else {
    res.send("<html><body><b>You must be logged in to see urls</b></body></html>\n");
  }

});

// post request for creating a new url from urls_new
app.post('/urls', (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    let id = generateRandomString();
    urlDatabase[id] = {longURL: req.body.longURL, userID: user.id};
    res.redirect(`urls/${id}`);
  } else {
    res.send("<html><body><b>You must be logged in to create TinyURLS</b></body></html>\n");
  }
});

// post request to delete a url
app.post('/urls/:id/delete', (req, res) => {
  let user = users[req.session.user_id];
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    if (user) {
      let urlList = urlsForUser(user.id, urlDatabase);
      if (urlList.hasOwnProperty(req.params.id)) {
        delete urlDatabase[req.params.id];
        res.redirect('/urls');
      } else {
        res.status(403);
        res.send('URL does not belong to user');
      }
    } else {
      res.status(403);
      res.send('You must be logged in to complete this action');
    }
  } else {
    res.status(403);
    res.send("URL ID doesn't exist");
  }

});

//get request for urls_new
app.get('/urls/new', (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    const templateVars = {user};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

// get request for urls_register
app.get('/register', (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    const templateVars = { user };
    res.render('urls_register', templateVars);
  } else {
    res.redirect('/urls');
  }
});

// get request for urls_login
app.get('/login', (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    const templateVars = { user };
    res.render('urls_login', templateVars);
  } else {
    res.redirect('/urls');
  }
});

// get request for a specific tinyURL's url_show page
app.get('/urls/:id', (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    let urlList = urlsForUser(user.id, urlDatabase);
    if (urlList.hasOwnProperty(req.params.id)) {
      const templateVars = { id: req.params.id, longURL: urlList[req.params.id].longURL, user};
      res.render("urls_show", templateVars);
    } else {
      res.send("<html><body><b>TinyURL doesn't match your UserID</b></body></html>\n");
    }
  } else {
    res.send("<html><body><b>You must be logged in to see urls</b></body></html>\n");
  }
  
});

// post request for editing a tinyURl's longURL
app.post('/urls/:id', (req, res) => {
  let user = users[req.session.user_id];
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    if (user) {
      let urlList = urlsForUser(user.id, urlDatabase);
      if (urlList.hasOwnProperty(req.params.id)) {
        urlDatabase[req.params.id] = {longURL: req.body.longURL, userID: user.id};
        res.redirect(`/urls`);
      } else {
        res.status(403);
        res.send('URL does not belong to user');
      }
    } else {
      res.status(403);
      res.send('You must be logged in to complete this action');
    }
  } else {
    res.status(403);
    res.send("URL ID doesn't exist");
  }
});

// get request for the actual tinyURL which redirects to the associated longURL
app.get("/u/:id", (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  } else {
    res.status(403);
    res.send('TinyURL does not exist');
  }
});

// post request for registering a new user account
app.post('/register', (req, res) => {
  let id = generateRandomString();
  let user = getUserByEmail(req.body.email, users);
  if (req.body.email && req.body.password) {
    if (!user) {
      users[id] = { id, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) };
      req.session.user_id = users[id].id;
      res.redirect('/urls/new');
    } else {
      res.status(400);
      res.send('Email already in use!');
    }
  } else {
    res.status(400);
    res.send("You shall not pass");
  }
});

// post request for logging into an existing user account
app.post('/login' ,(req, res) => {
  let user = getUserByEmail(req.body.email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.id;
      res.redirect('/urls');
    } else {
      res.status(403);
      res.send('Password does not match user records');
    }
  } else {
    res.status(403);
    res.send('Email does not exist in user database');
  }
});

//post request for logging out of user account
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});