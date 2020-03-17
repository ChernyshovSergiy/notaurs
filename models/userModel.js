const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
        unique: false,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal then 40 characters'],
        minlength: [1, 'A tour name must have more or equal then 1 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: { type: String },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        trim: true,
        select: false,
        maxlength: [40, 'A password must have less or equal then 40 characters'],
        minlength: [8, 'A password must have more or equal then 8 characters'],
    },
    passwordConfirmation: {
        type: String,
        required: [true, 'Password must be confirmed'],
        trim: true,
        validate: {
            validator: function(val) {
                return val === this.password;
            },
            message: 'Current password not equal ({VALUE})',
        },
    },
    passwordChangedAt: {
        type: Date,
        // select: false,
        default: Date.now(),
    },
    passwordResetToken: {
        type: String,
    },
    passwordResetExpires: {
        type: Date,
    },
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next;
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirmation = undefined;
    next();
});

userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function(next) {
    // This points to the current query
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changeTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        // console.log(changeTimestamp, JWTTimestamp);
        return JWTTimestamp < changeTimestamp;
    }
    // false means not changed (ложное означает, что не изменилось)
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 sec to milli sec
    console.log({ resetToken }, this.passwordResetToken, this.passwordResetExpires);
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
