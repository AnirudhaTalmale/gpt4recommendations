const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/models-chat/User'); // Import your User model

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.BACKEND_URL + "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    console.log('Google Strategy callback triggered');
    try {
      const userEmail = profile.emails[0].value;
      console.log('User email obtained from Google:', userEmail);

      let user = await User.findOne({ 
        $or: [{ 'google.id': profile.id }, { 'local.email': userEmail }]
      });

      if (user) {
        console.log('User found in database:', user);

        if (!user.google || !user.google.id) {
          console.log('Linking Google ID to existing user');
          user.google = {
            id: profile.id,
            // Add any additional Google specific info here
          };

          user.displayName = profile.displayName;
          user.firstName = profile.name.givenName;
          user.lastName = profile.name.familyName;
          user.image = profile.photos[0].value;

          await user.save();
          console.log('User updated with Google info');
        }
      } else {
        console.log('User not found, creating new user');
        const userRole = userEmail === "anirudhatalmale4@gmail.com" ? 'assistant' : 'user';

        user = new User({
          google: {
            id: profile.id,
          },
          local: {
            email: userEmail,
          },
          displayName: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          image: profile.photos[0].value,
          role: userRole,
        });

        await user.save();
        console.log('New user created:', user);
      }

      user.accessToken = accessToken;
      return done(null, user);
    } catch (error) {
      console.error('Error in Google Strategy:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('Deserializing user:', user);
    done(null, user);
  } catch (err) {
    console.error("Error in deserializeUser:", err);
    done(err, null);
  }
});

module.exports = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('Passport initialized and session middleware set up');

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

  app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }), (req, res) => {
    // The request will be redirected to Google, so this function will not be called.
  });
  
  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth/login' }),
    (req, res) => {
      console.log('Google authentication successful, redirecting to chat');
      res.redirect(`${process.env.FRONTEND_URL}/chat`); 
    }
  );
};