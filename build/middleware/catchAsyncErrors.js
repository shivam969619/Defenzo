"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsyncError = void 0;
const catchAsyncError = (theFunc) => (req, res, next) => {
    Promise.resolve(theFunc(req, res, next)).catch((error) => next(error));
};
exports.catchAsyncError = catchAsyncError;
