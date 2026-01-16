"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
// import { UserControllers } from "./user.controller";
const user_interface_1 = require("./user.interface");
const CheckAuth_1 = require("../../middleware/CheckAuth");
const ValidateRequest_1 = require("../../middleware/ValidateRequest");
const user_validation_1 = require("./user.validation");
const user_controller_1 = require("./user.controller");
const router = (0, express_1.Router)();
router.post("/register", (0, ValidateRequest_1.validateRequest)(user_validation_1.createZodSchema), user_controller_1.UserControllers.createUser);
router.get("/all-users", (0, CheckAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), user_controller_1.UserControllers.getAllUsers);
router.get("/me", (0, CheckAuth_1.checkAuth)(...Object.values(user_interface_1.Role)), user_controller_1.UserControllers.getMe);
router.get("/:id", (0, CheckAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), user_controller_1.UserControllers.getSingleUser);
router.patch("/:id", (0, ValidateRequest_1.validateRequest)(user_validation_1.updateUserZodSchema), (0, CheckAuth_1.checkAuth)(...Object.values(user_interface_1.Role)), user_controller_1.UserControllers.updateUser);
// /api/v1/user/:id
exports.UserRoutes = router;
