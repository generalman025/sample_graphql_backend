const {validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    try
    {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            password: hashedPassword,
            name: name
        });
        const result = user.save();
        res.status(201).json({message: 'User created!', userId: result._id})
    }
    catch(err)
    {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    try
    {
        const user = await User.findOne({email: email});
        if(!user){
            console.log(email);
            const error = new Error('A user with this email could not be found.');
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;
        const isEqual = await bcrypt.compare(password, user.password);
        if(!isEqual){
            const error = new Error('Wrong password!');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign({email: loadedUser.email, userId: loadedUser._id.toString()}, 'generalman025secret', {expiresIn: '1h'});
        res.status(200).json({token: token, userId: loadedUser._id.toString()});
    }
    catch(err)
    {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getStatus = async (req, res, next) => {
    try
    {
        const user = await User.findOne({_id: req.userId});
        res.status(200).json({status: user.status});
    }
    catch(err)
    {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updateStatus = async (req, res, next) => {
    const status = req.body.status;
    try
    {
        const user = await User.findById(req.userId);
        user.status = status;
        const result = await user.save();
        res.status(200).json({message: 'Status updated!', result: result});
    }
    catch(err)
    {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
};