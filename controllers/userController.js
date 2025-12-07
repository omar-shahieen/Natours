const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const factory = require("./handlerFactory");


const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key))
      newObj[key] = obj[key]
  });
  return newObj;
};

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
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

// CRUD for user with admin previligaes
exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.createUser = factory.createOne(User);

// do not update password here
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);