import multer, { memoryStorage, type FileFilterCallback } from 'multer';
import type { NextFunction, Response, Request } from 'express';
import sharp from 'sharp';
import { FilterQuery } from 'mongoose';
import { type UserDocument } from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import UserService from '../services/userService.js';




class UserController {
  private userService: UserService;


  uploadImage!: ReturnType<multer.Multer['single']>;


  constructor() {

    this.userService = new UserService();


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


    this.uploadImage = upload.single("photo");


  }


  resizeUserPhoto = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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




  updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const updateData: Partial<UserDocument> = { ...req.body };

    // add images if exist 
    if (req.file) updateData.photo = req.file.filename;

    // updateUser datas
    const user = await this.userService.updateMe(req.user!.id, updateData);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  });


  deleteMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await this.userService.deActivateUser(req.user!.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  getMe = (req: Request, res: Response, next: NextFunction) => {
    req.params.id = req.user!.id;
    next();
  };



  // Admin CRUD operations
  getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // to allow get review in nested user route
    let actualFilter = {};
    if (req.params.userId) {
      actualFilter = { ...actualFilter, user: req.params.userId } as FilterQuery<UserDocument>;
    }

    const users = await this.userService.getAllUsers(actualFilter, req.query as Record<string, string>);

    res.status(200).json({
      status: 'success',
      length: users.length,
      data: {
        data: users,
      },
    });

  });

  getUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await this.userService.getUserById(req.params.id!);

    res.status(200).json({
      status: 'success',
      data: {
        data: user,
      },
    });
  });


  createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await this.userService.createUser(req.body);

    res.status(201).json({
      isSuccess: true,
      data: {
        data: user,
      },
    });
  });


  updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await this.userService.updateUser(req.params.id!, req.body);

    res.status(200).json({
      isSuccess: true,
      data: user,
    });
  });

  deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await this.userService.deleteUser(req.params.id!);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

}

const userController = new UserController();


export const {
  uploadImage,
  resizeUserPhoto,
  updateMe,
  deleteMe,
  getMe,
  getUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} = userController;


export default userController;