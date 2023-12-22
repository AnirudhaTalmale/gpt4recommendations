const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./User'); // Import your User model

// Passport setup for Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          displayName: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          image: profile.photos[0].value,
          email: profile.emails[0].value
        });
      }
      // Save the accessToken in the user object
      user.accessToken = accessToken;
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the sessions
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Export a function to attach to the Express app
module.exports = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());

  // This is a helper function to check if the request is authenticated
  app.use((req, res, next) => {
    req.isAuthenticated = function() {
      var property = 'user';
      if (this._passport && this._passport.instance._userProperty) {
        property = this._passport.instance._userProperty;
      }
      return (this[property]) ? true : false;
    };
    next();
  });

  // Google Auth Routes
  app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));
  
  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth/login' }),
    (req, res) => {
      // Successful authentication, redirect home.
      res.redirect('http://localhost:3001/');
    }
  );
};