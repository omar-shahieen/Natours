import { Router } from 'express';
import { uploadImage, resizeUserPhoto, updateMe, deleteMe, getMe, getUser, getAllUsers, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { signup, login, logout, forgetPassword, resetPassword, protect, updatePassword, restrictTo } from "../controllers/authController.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgetPassword", forgetPassword);
router.patch("/resetPassword/:token", resetPassword);

// protected routes 
router.use(protect);

router.patch("/updateMyPassword", updatePassword);
router.patch("/updateMe", uploadImage, resizeUserPhoto, updateMe);
router.delete("/deleteMe", deleteMe);
router.get("/me", getMe, getUser);

// admin restricted routes 
router.use(restrictTo("admin"));

router
  .route('/')
  .get(getAllUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

export default router;
