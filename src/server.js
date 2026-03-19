const express = require('express');
const session = require('express-session');
const passport = require('passport');
const googleStrategy = require('passport-google-oauth20');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');
require('dotenv').config();
const configViewEngine = require('./config/ViewEngine');
const webRouters = require('./routes/web');
const apiRoutes = require('./routes/api');

const path = require('path');
const Account = require('./models/AccountModel');

const app = express();
const port = process.env.PORT || 9000;
const hostname = process.env.HOST_NAME || 'localhost';

// Config view engine
configViewEngine(app);

// Middlewares
app.use(cookieParser()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session & Passport
app.use(session({
  secret: process.env.SERVER_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: true, 
    sameSite: 'lax' 
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Google Strategy
passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    proxy: true 
  }, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;

    Account.findByEmail(email, (err, existingUser) => {
      if (err) return done(err);

      if (!existingUser) {
        const newUser = {
          email: email,
          password: null, 
          role: 'customer'
        };

        Account.create(newUser, (err, createdUser) => {
          if (err) return done(err);
          done(null, createdUser); 
        });
      } else {
        done(null, existingUser);
      }
    });
}));

passport.serializeUser((user, done) => {
  done(null, user.id); 
});

passport.deserializeUser((id, done) => {
  Account.findById(id, (err, user) => {
    if (err) return done(err);
    done(null, user); 
  });
});


app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate('google', { failureRedirect: "/login" }), (req, res) => {
  res.redirect('/HomePage');
});
app.get("/logout", (req, res, next) => {
  req.logOut(function(err) {
    if (err) { return next(err); }
    res.redirect("/homepage");
  });
});


app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/', webRouters);
app.use('/api', apiRoutes);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


module.exports = app;