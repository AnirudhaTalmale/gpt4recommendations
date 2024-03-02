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
      const userEmail = profile.emails[0].value; // Get user's email from profile

      // Try to find a user either by Google ID or by local email
      let user = await User.findOne({ 
        $or: [{ 'google.id': profile.id }, { 'local.email': userEmail }]
      });

      if (user) {
        // If user exists but doesn't have a Google ID, link it
        if (!user.google || !user.google.id) {
          user.google = {
            id: profile.id,
            // Add any additional Google specific info here
          };

          // Optionally update other fields if needed
          user.displayName = profile.displayName;
          user.firstName = profile.name.givenName;
          user.lastName = profile.name.familyName;
          user.image = profile.photos[0].value;

          await user.save();
        }
      } else {
        // If user doesn't exist, create a new one
        const userRole = userEmail === "anirudhatalmale4@gmail.com" ? 'assistant' : 'user';

        user = new User({
          google: {
            id: profile.id,
          },
          local: {
            email: userEmail, // Use local sub-document to store email
          },
          displayName: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          image: profile.photos[0].value,
          role: userRole,
          // Add any other fields you need
        });

        await user.save();
      }

      // Save the accessToken in the user object
      user.accessToken = accessToken;
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
    console.error("Error in deserializeUser:", err);
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
      res.redirect(`${process.env.FRONTEND_URL}/chat`);
    }
  );
};