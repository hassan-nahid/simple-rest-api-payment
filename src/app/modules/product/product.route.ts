import { Router } from "express";
import { checkAuth } from "../../middleware/CheckAuth";
import { validateRequest } from "../../middleware/ValidateRequest";
import { Role } from "../user/user.interface";
import { ProductControllers } from "./product.controller";
import { createProductZodSchema, updateProductZodSchema } from "./product.validation";

const router = Router()

router.post(
    "/create",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(createProductZodSchema),
    ProductControllers.createProduct
);

router.get("/", ProductControllers.getAllProducts);

router.get("/:id", ProductControllers.getSingleProduct);

router.patch(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateProductZodSchema),
    ProductControllers.updateProduct
);

router.delete(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    ProductControllers.deleteProduct
);


export const ProductRoutes = router;