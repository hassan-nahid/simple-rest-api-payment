import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/CatchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ProductServices } from "./product.service";

const createProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductServices.createProduct(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Product created successfully",
        data: result,
    });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductServices.getAllProducts(req.query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Products retrieved successfully",
        data: result.result,
        meta: result.meta,
    });
});

const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductServices.getSingleProduct(req.params.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Product retrieved successfully",
        data: result,
    });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductServices.updateProduct(req.params.id as string, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Product updated successfully",
        data: result,
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductServices.deleteProduct(req.params.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Product deleted successfully",
        data: result,
    });
});

export const ProductControllers = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
};
