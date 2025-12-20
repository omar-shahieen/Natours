import multer, { memoryStorage, type FileFilterCallback } from 'multer';
import type { NextFunction, Response, Request } from 'express';
import sharp from 'sharp';
import User, { type UserDocument } from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { getAll, getOne, createOne, updateOne, deleteOne } from "./handlerFactory.js";


// keep in memory for image processing 
const multerStorage = memoryStorage();
const multerFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith("image"))
    cb(null, true);
  else
    cb(new AppError("Please upload only images!", 400));

};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

const filterObj = <T extends Record<string, unknown>>(obj: T, ...allowedFields: (keyof T)[]): Partial<T> => {
  const newObj: Partial<T> = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key as keyof T))
      newObj[key as keyof T] = obj[key as keyof T];
  });
  return newObj;
};

export const uploadImage = upload.single("photo");

export const resizeUserPhoto = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const imageFile = req.file as Express.Multer.File;
  if (!imageFile) return next();

  imageFile.filename = `user-${req.user!.id}-${Date.now()}.jpeg`;
  await sharp(imageFile.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${imageFile.filename}`);



  next();
});
export const updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // create error if user posts password data 
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError("You can not update password here ,user route /updateMyPassword", 400)); // bad req
  // filter out unWanted Data
  const filteredObj = filterObj(req.body, "name", "email");
  // add images if exist 
  if (req.file) filteredObj.photo = req.file.filename;

  // updateUser datas
  const user = await User.findByIdAndUpdate(req.user!.id, filteredObj, {
    runValidators: true,
    new: true,
  }) as UserDocument;

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
export const deleteMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  await User.findByIdAndUpdate(req.user!.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
export function getMe(req: Request, res: Response, next: NextFunction) {
  req.params.id = req.user!.id;
  next();
}

export const getAllUsers = getAll(User);

export const getUser = getOne(User);

export const createUser = createOne(User);

export const updateUser = updateOne(User);

export const deleteUser = deleteOne(User);

