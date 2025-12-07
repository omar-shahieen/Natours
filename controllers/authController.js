const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');
// TODO Later : create max attempt login 
// TODO Later : prevent cross site request forgery (csurf package)
// TODO Later : create blackList of unTrasted JWT
// TODO Later : Confirm email after creating account 
// TODO Later : Refresh Token
// TODO Later : 2FA

const signInToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPERIES_IN
    })
}
const createSendToken = (user, statusCode, res) => {
    const token = signInToken(user._id);
    // set cookies
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPERIES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true // can not be edited or accessed by browser
    }
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true; // sent on https only
    res.cookie("jwt", token, cookieOptions)
    //delete password from user in res 
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}


exports.signup = catchAsync(async (req, res, next) => {
    const userData = {
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        name: req.body.name,
    };
    const newUser = await User.create(userData);
    createSendToken(newUser, 201, res);
});


exports.login = catchAsync(async (req, res, next) => {
    //  TODO Later : create max attempt login
    const { email, password } = req.body;

    //  check if email and password exist 
    if (!email || !password)//bad request
        return next(new AppError("Please provide email and password!", 400));
    // check if user is exist 
    const user = await User.findOne({ email }).select(['email', 'password']);
    if (!user || !(await user.correctPassword(password, user.password))) // unauthorized
        return next(new AppError("password or email is not correct", 401));
    // generate token
    createSendToken(user, 200, res);

});
exports.protect = catchAsync(async (req, res, next) => {
    // check if token exist 
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token)
        return next(new AppError("You are not logged in! Please log in to get access.", 401));
    // token verification
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    // check if users still exist 
    const currentUser = await User.findById(decoded.id);
    if (!currentUser)  // user delete account 
        return next(new AppError("The user belonging to this token is no longer exist", 401));
    // check if user change password
    if (!currentUser.hasChangePassword(decoded.iat))
        return next(new AppError("The user has changed passwords", 401));
    // pass
    req.user = currentUser;
    next()
})
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']. role='user'
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};
exports.forgetPassword = catchAsync(async (req, res, next) => {
    // find user with this email
    const user = await User.findOne({ email: req.body.email });
    if (!user)
        return next(new AppError("there is no user with email address.", 404));
    // generate random token to reset
    const token = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // send token as email
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/resetPassword/${token}`;
    const message = `Forget Password ? submit this url ${resetURL} with PATCH to reset your password`
    try {
        sendEmail({
            email: user.email,
            subject: "reset password token <valid for 10 min> !",
            message
        })
        res.status(200).json({
            isSuccess: true,
            message: "reset token sent to email",
            // we don't sent token as res because with this token any one can reset anyone pass 
        })
    } catch (error) {
        // invalidate token and send error message
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("error while sending an email , please try again later", 500));
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    //  get the user based on the token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest('hex'); //hash token
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    }); // search in db by the token

    // if the token is not expired update password
    if (!user)
        return next(new AppError("inValid or Expired Token!", 400)); // bad request
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // update changedpassword at property
    // log the user in , send jwt token
    createSendToken(user, 200, res);

})
exports.updatePassword = catchAsync(async (req, res, next) => {
    // get the user from the collection 
    const user = await User.findById(req.user.id).select("+password"); // req.user from protected route // - select because we exclude password from select
    // check if password entered is correct  
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
        return next(new AppError("Old password is not Correct", 401)); // un authorizer
    // update the user password and confirm 
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save(); // findById not work because validation
    // log user in 
    createSendToken(user, 200, res);
})