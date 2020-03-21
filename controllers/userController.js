const User = require('./../models/userModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//     const features = new APIFeatures(User.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();
//     const users = await features.query;
//
//     // SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         results: users.length,
//         data: {
//             users,
//         },
//     });
// });

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirmation) {
        return next(
            new AppError(
                'This route is not for password updates. Pleas use /updateMyPassword.',
                400,
            ),
        );
    }

    // 2) Filtered out unwanted fields names that are not allowed to be update (Отфильтрованы имена нежелательных полей, которые не могут быть обновлены)
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: {
            user: null,
        },
    });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.createUser = factory.createOne(User);

// do NOT update password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
