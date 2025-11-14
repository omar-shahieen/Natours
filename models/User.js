const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require("crypto")

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "email field is required"],
        trim: true,
        unique: true,
        validate: [validator.isEmail, 'Invalid Email address'],
        lowercase: true
    },
    role: {
        type: String,
        enum: ["user", "guide", "guide-lead", "admin"]
    },
    password: {
        type: String,
        required: [true, "password field is required"],
        trim: true,
        minlength: [8, "password should be more than or equal 8 characters"],
        select: false //not selecting in query
    },
    passwordConfirm: {
        type: String,
        required: [true, "passwordConfirm field is required"],
        trim: true,
        validate: {
            validator: function (val) {
                return this.password === val; // onsave only
            },
            message: "Passwords do not match."
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        select: false,
        default: true
    },
    name: {
        type: String,
        required: [true, "name field is required"],
        trim: true,
        minlength: [3, "name should be more than or equal 3 characters"],
        maxlength: [50, "name should be less than or equal 50 characters"],
    },
    photo: {
        type: String,
        trim: true,
    }
});

// pre save hooks
userSchema.pre("save", async function (next) {
    // if password not modified go the next middleware
    if (!this.isModified("password")) return next();
    // hash the password with salt 12 
    this.password = await bcrypt.hash(this.password, 12);
    // delete passwordConfirm field 
    this.passwordConfirm = undefined;
    next();
})
userSchema.pre("save", function (next) {
    // if password not modified go the next middleware
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; // because saving to db slower than issuing the token so it may not worked 
    next()
})

// query middleWares 
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next()
})



// instance methoes
userSchema.methods.correctPassword = async (candidatePassword, password) => {
    // this.password not available because select set to true 
    return await bcrypt.compare(candidatePassword, password);
}
userSchema.methods.hasChangePassword = async function (jwtToken) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return jwtToken < changedTimestamp;
    }
    // false mean not change and pass
    return false
};
userSchema.methods.generatePasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex"); // create random token
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest('hex'); // hash token to db
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min from now 
    return resetToken; // return the  unIncrepted token to send it by email 
}
const User = mongoose.model("User", userSchema);

module.exports = User;