const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { getUserByEmail, urlsForUser } = require('./helper')

const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id'],
  maxAge: 24 * 60 * 60 * 1000 
}))

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'userRandomID'
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 'user2RandomID'
  }
};

const users = {
};

app.get('/urls', (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    let urlList = urlsForUser(user.id, urlDatabase);
    if (Object.keys(urlList).length !== 0) {
      const templateVars = { urls: urlList, user};
      res.render('urls_index', templateVars);
    } else {
      res.send("<html><body><b>No URLs to display. <a href='/urls/new'>click here to make one!</a></b></body></html>\n")
    }
  } else {
    res.send("<html><body><b>You must be logged in to see urls</b></body></html>\n");
  }

});

app.post('/urls', (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    let id = generateRandomString();
    urlDatabase[id] = {longURL: req.body.longURL, userID: user.id}
    res.redirect(`urls/${id}`);
  } else {
    res.send("<html><body><b>You must be logged in to create TinyURLS</b></body></html>\n");
  }
})

app.post('/urls/:id/delete', (req, res) => {
  let user = users[req.session.user_id];
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    if (user) {
      let urlList = urlsForUser(user.id, urlDatabase)
      if (urlList.hasOwnProperty(req.params.id)) {
        delete urlDatabase[req.params.id];
        res.redirect('/urls')
      } else {
        res.status(403);
        res.send('URL does not belong to user')
      }
    } else {
      res.status(403);
      res.send('You must be logged in to complete this action')
    }
  } else {
    res.status(403);
    res.send("URL ID doesn't exist");
  }

})

app.get('/urls/new', (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    const templateVars = {user};
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login')
  }
});

app.get('/register', (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    const templateVars = { user };
    res.render('urls_register', templateVars);
  } else {
    res.redirect('/urls');
  }
})

app.get('/login', (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    const templateVars = { user };
    res.render('urls_login', templateVars);
  } else {
    res.redirect('/urls');
  }
})

app.get('/urls/:id', (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    let urlList = urlsForUser(user.id, urlDatabase)
    if (urlList.hasOwnProperty(req.params.id)) {
      const templateVars = { id: req.params.id, longURL: urlList[req.params.id].longURL, user};
      res.render("urls_show", templateVars);
    } else {
      res.send("<html><body><b>TinyURL doesn't match your UserID</b></body></html>\n")
    }
  } else {
    res.send("<html><body><b>You must be logged in to see urls</b></body></html>\n");
  }
  
});

app.post('/urls/:id', (req, res) => {
  let user = users[req.session.user_id];
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    if (user) {
      let urlList = urlsForUser(user.id, urlDatabase)
      if (urlList.hasOwnProperty(req.params.id)) {
        urlDatabase[req.params.id] = {longURL: req.body.longURL, userID: user.id}
        res.redirect(`/urls`);
      } else {
        res.status(403);
        res.send('URL does not belong to user')
      }
    } else {
      res.status(403);
      res.send('You must be logged in to complete this action')
    }
  } else {
    res.status(403);
    res.send("URL ID doesn't exist");
  }
})

app.get("/u/:id", (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  } else {
    res.status(403);
    res.send('TinyURL does not exist');
  }
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post('/register', (req, res) => {
  let id = generateRandomString();
  let user = getUserByEmail(req.body.email, users);
  if (req.body.email && req.body.password) { 
    if (user) {
      users[id] = { id, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) };
      req.session.user_id = users[id].id;
      res.redirect('/urls/new');
    }
  } else {
    res.status(400);
    res.send("You shall not pass");
  }
});

app.post('/login' ,(req, res) => {
  let user = getUserByEmail(req.body.email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.id;
      res.redirect('/urls')
    } else {
      res.status(403);
      res.send('Password does not match user records')
    }
  } else {
    res.status(403);
    res.send('Email does not exist in user database')
  }
})

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});