const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken')

const User = require("../models/User");

const JWT_SECRET = 'REPLACE_WITH_YOUR_JWT_SECRET'; // To be fetched from env variables

const signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Please check the details.");
    error.statusCode = 422;
    error.errors = errors.array();
    throw error;
  }

  const { email, name, password } = req.body;

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({ name, email, password: hashedPassword });
      return user.save();
    })
    .then((result) => {
      res
        .status(201)
        .json({ message: "User created Successfully", userId: result._id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      console.log(err);
      next(err);
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error("email and password required.");
    error.statusCode = 422;
    error.errors = errors.array();
    throw error;
  }

  let fetchedUser;

  User.findOne({ email }).then(user => {
    if (!user) {
      const error = new Error("Invalid email, User doesn't exist. Please enter a correct email address.")
      error.statusCode = 404;
      error.errors = []
      throw error;
    }
    fetchedUser = user;
    return bcrypt.compare(password, user.password)
  }).then(isMatch => {
    if (!isMatch) {
      const error = new Error("Invalid password, Please enter a correct password.")
      error.statusCode = 401;
      error.errors = []
      throw error;
    }

    const token = jwt.sign({ email: fetchedUser.email, userId: fetchedUser._id.toString() }, JWT_SECRET, { expiresIn: '1h' })

    res.status(200).json({
      message: "Logged in successfully!!", token, userId: fetchedUser._id.toString()
    })
  })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      console.log(err);
      next(err);
    });
}


const getUserStatus = (req, res, next) => {
  User.findById(req.userId).then(user => {
    if (!user) {
      const error = new Error('User does not exist!!');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      status: user.status
    })
  }).catch((err) => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    console.log(err);
    next(err);
  });
}

const updateUserStatus = (req, res, next) => {
  const { status } = req.body;

  User.findById(req.userId).then(user => {
    if (!user) {
      const error = new Error('User does not exist!!');
      error.statusCode = 404;
      throw error;
    }

    user.status = status;
    return user.save();
  }).then(result => {
    res.status(200).json({
      message: 'Status updated successfully!!'
    })
  }).catch((err) => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    console.log(err);
    next(err);
  });
}

module.exports = { signup, login, getUserStatus, updateUserStatus };
