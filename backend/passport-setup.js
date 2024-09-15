const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/models-chat/User'); // Import your User model

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.BACKEND_URL + "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const userEmail = profile.emails[0].value;

      let user = await User.findOne({ 
        $or: [{ 'google.id': profile.id }, { 'local.email': userEmail }]
      });

      if (user) {
        if (!user.google || !user.google.id) {
          user.google = {
            id: profile.id,
            // Add any additional Google specific info here
          };

          user.displayName = profile.displayName;
          user.firstName = profile.name.givenName;
          user.lastName = profile.name.familyName;
          user.image = profile.photos[0].value;

          await user.save();
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
      }

      user.accessToken = accessToken;
      await user.save();
      return done(null, user);
    } catch (error) {
      console.error('Error in Google Strategy:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error("Error in deserializeUser:", err);
    done(err, null);
  }
});

module.exports = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());

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
  }), () => {

  });
  
  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/chat' }),
    (req, res) => {
      res.redirect(`${process.env.FRONTEND_URL}/chat`); 
    }
  );
};