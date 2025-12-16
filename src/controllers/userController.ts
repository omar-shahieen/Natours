import multer, { memoryStorage } from 'multer';
import sharp from 'sharp';
import User from '../models/User.ts';
import AppError from '../utils/AppError.ts';
import catchAsync from '../utils/catchAsync.ts';
import { getAll, getOne, createOne, updateOne, deleteOne } from "./handlerFactory.ts";




// keep in memory for image processing 
const multerStorage = memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true)
  } else {
    cb(new AppError("Please upload only images!", 400), false)
  }
}
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key))
      newObj[key] = obj[key]
  });
  return newObj;
};

export const uploadImage = upload.single("photo");

export const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) next();


  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);



  next();
});
export const updateMe = catchAsync(async (req, res, next) => {
  // create error if user posts password data 
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError("You can not update password here ,user route /updateMyPassword", 400)); // bad req
  // filter out unWanted Data
  const filteredObj = filterObj(req.body, "name", "email");
  // add images if exist 
  if (req.file) filteredObj.photo = req.file.filename;

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
export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});
export function getMe(req, res, next) {
  req.params.id = req.user.id;
  next();
}

export const getAllUsers = getAll(User);

export const getUser = getOne(User);

export const createUser = createOne(User);

export const updateUser = updateOne(User);

export const deleteUser = deleteOne(User);

