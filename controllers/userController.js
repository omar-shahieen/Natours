const User = require('../models/User');
const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key))
      newObj[key] = obj[key]
  });
  return newObj;
};
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query).filter().limitFields().paginate().sort();
  const users = await features.query;
  res.status(200).json({
    status: 'success',
    length: users.length,
    data: {
      users
    }
  })
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // create error if user posts password data 
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError("You can not update password here ,user route /updateMyPassword", 400)); // bad req
  // filter out unWanted Data
  const filteredObj = filterObj(req.body, "name", "email");
  // updateUser datas
  const user = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    runValidators: true,
    new: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("User with this id is not found", 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });

});
exports.createUser = catchAsync(async (req, res) => {
  const newUser = await User.create(req.body);
  res.status(200).json({
    status: 'success',
    data: {
      newUser
    }
  })

});
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id);
  if (!user) {
    return next(new AppError("User with this id is not found", 404));
  }
  res.status(201).json({
    status: 'success',
    data: {
      user
    }
  });


});
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new AppError("User with this id is not found", 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});
