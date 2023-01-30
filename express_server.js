const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}

const getUserByEmail = function(email) {
  let res;
  for (const user in users) {
    if (users[user].email === email) {
      return users[user]
    }
  }
  return true;
};

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  }
};

app.get('/urls', (req, res) => {
  let user = users[req.cookies['user_id']];
  const templateVars = { urls: urlDatabase, user};
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`urls/${id}`);
})

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls')
})

app.get('/urls/new', (req, res) => {
  let user = users[req.cookies['user_id']];
  const templateVars = {user};
  res.render('urls_new', templateVars);
});

app.get('/register', (req, res) => {
  let user = users[req.cookies['user_id']];
  const templateVars = { user };
  res.render('urls_register', templateVars);
})

app.get('/login', (req, res) => {
  let user = users[req.cookies['user_id']];
  const templateVars = { user };
  res.render('urls_login', templateVars);
})

app.get('/urls/:id', (req, res) => {
  let user = users[req.cookies['user_id']];
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user};
  res.render("urls_show", templateVars);
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
})

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
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
  let user = getUserByEmail(req.body.email);
  if (req.body.email && req.body.password) { 
    if (user) {
      users[id] = { id, email: req.body.email, password: req.body.password };
      res.cookie('user_id', users[id].id);
      res.redirect('/urls');
    }
  } else {
    res.status(400);
    res.send("You shall not pass");
  }
});

app.post('/login' ,(req, res) => {
  let user = getUserByEmail(req.body.email);
  if (user) {
    if (user.password === req.body.password) {
      res.cookie('user_id', user.id);
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
  res.clearCookie('user_id');
  res.redirect('/login');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});