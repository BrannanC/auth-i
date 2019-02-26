const express = require('express');
const session = require('express-session'); 
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const KnexSessionStore = require('connect-session-knex')(session);

const db = require('./data/dbConfig.js');
const Users = require('./users/usersHelper.js');

const server = express();

const sessionConfig = {
    name: 'Goofyfoot',
    secret: 'Hold me closer, Danzig',
    cookie: {
      maxAge: 1000 * 60 * 60,
      secure: false
    },
    httpOnly: true,
    resave: false,
    saveUninitialized: false,
    store: new KnexSessionStore({
        knex: db,
        tablename: 'sessions',
        sidfieldname: 'sid',
        createtable: true,
        clearInterval: 1000 * 60 * 60, // in ms
      }),
  }
  

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));

server.get('/api/users', restricted, (req, res) => {
    Users.find()
    .then(users => {
        res.status(200).json({ users })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ error: 'Could not get users' })
    })
});

server.post('/api/register', (req, res) => {
    const user = req.body;
    if(user.password && user.username){
        const hash = bcrypt.hashSync(user.password, 16);
        user.password = hash;
        Users.add(user)
            .then(saved => {
                res.status(201).json(saved);
            })
            .catch(error => {
                res.status(500).json(error);
            });
    } else {
        res.status(400).json({ error: 'Need username and passowrd' })
    }
});

server.post('/api/login', (req, res) => {
    let { username, password } = req.body;
  
    Users.findBy({ username })
      .first()
      .then(user => {
        // check that passwords match
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.user = user;
          res.status(200).json({ message: `Welcome ${user.username}!` });
        } else {
          res.status(401).json({ message: 'Invalid Credentials' });
        }
      })
      .catch(error => {
        res.status(500).json(error);
      });
  });

  function restricted(req, res, next){
      req.session && req.session.user ? next() 
      :  res.status(401).json({ message: 'Please log in' }); 
  }


const port = process.env.PORT || 3300;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));