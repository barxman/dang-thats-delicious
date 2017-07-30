const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose'); 
const User = mongoose.model('User'); 
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout(); 
  req.flash('Successfully logged out');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash('error', 'Oops you must be logged in to do that');
  res.redirect('/login'); 
};

exports.forgot = async (req, res) => {
  // check user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No user with that accunt exists');
    return res.redirect('/login'); 
  }
  //  set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save(); 
  // send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset'
  });

  req.flash('success', `You have been emailed a link to reset you password.`);
  res.redirect('/login');
  // redirect to login page 
};

exports.reset = async (req, res) => {
  const user = await User.findOne({ 
    resetPasswordToken: req.params.token, 
    resetPasswordExpires: { $gt : Date.now() }
  }); 
  
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  console.log(user); 
  // show the reset password form
  res.render('reset', { title: 'Reset your password' });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password = req.body['password-confirm']) {
    next(); 
    return;
  }

  req.flash('error', 'Passwords do not Match'); 
  res.redirect('back'); 
};

exports.update = async (req, res) => {

  // verify
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  // update the users password 
  const setPassword = promisify(user.setPassword, user); 
  await setPassword(req.body.password); 
  user.resetPasswordToken = undefined; 
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save(); 
  await req.login(updatedUser); 
  req.flash('success', 'Your password has been reset'); 
  res.redirect('/'); 
};