const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

// connect passport to the helpers in passport-local-mongoose
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser());