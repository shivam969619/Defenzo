"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersANalytics = exports.getCoursesANalytics = exports.getUsersANalytics = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const analytics_genrator_1 = require("../utils/analytics.genrator");
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const orderModel_1 = __importDefault(require("../models/orderModel"));
//get user analytics
exports.getUsersANalytics = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const users = await (0, analytics_genrator_1.generateLast12MonthsData)(user_model_1.default);
        res.status(200).json({
            success: true,
            users,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
    res.status(200).json({
        success: true,
        message: "Users Analytics",
    });
});
//get courses analytics
exports.getCoursesANalytics = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const courses = await (0, analytics_genrator_1.generateLast12MonthsData)(course_model_1.default);
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
    res.status(200).json({
        success: true,
        message: "Courses Analytics",
    });
});
//get Orders analytics
exports.getOrdersANalytics = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const orders = await (0, analytics_genrator_1.generateLast12MonthsData)(orderModel_1.default);
        res.status(200).json({
            success: true,
            orders,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
    res.status(200).json({
        success: true,
        message: "Orders Analytics",
    });
});
