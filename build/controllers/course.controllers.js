"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genrateVideoUrl = exports.deleteCourse = exports.getAdminAllCourses = exports.addReplyToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const axios_1 = __importDefault(require("axios"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
//upload course
exports.uploadCourse = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        // console.log("create course is called")
        const data = req.body;
        console.log(data);
        const videoThumbnail = data.videothumbanail;
        if (videoThumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(videoThumbnail, {
                folder: "courses"
            });
            //  data.videothumbanail={
            //         public_id:myCloud.public_id,
            //         url:myCloud.secure_url
            //     }
            data.videothumbanail = myCloud.secure_url;
            console.log(data);
        }
        (0, course_service_1.createCourse)(data, res, next);
    }
    catch (error) {
        console.log(error);
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//edit course 
exports.editCourse = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const courseId = req.params.id;
        const thumbnail = data.thumbnail;
        const courseData = await course_model_1.default.findById(courseId);
        if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary_1.default.v2.uploader.destroy(thumbnail.public_id);
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
            if (thumbnail.startsWith("https")) {
                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
        }
        const course = await course_model_1.default.findById(courseId, { $set: data, }, { new: true });
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//get single course --without purchasing
exports.getSingleCourse = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const isCacheExist = await redis_1.redis.get(courseId);
        if (isCacheExist) {
            const course = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                course,
            });
        }
        else {
            const course = await course_model_1.default.findById(req.params.id).select("-courseData.videoUrl --courseData.suggestion --courseData.questions --courseData.links ");
            await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
            res.status(200).json({
                success: true,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//get all courses -- without purchasing
exports.getAllCourses = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions-courseData.links ");
        await redis_1.redis.set("allCourses", JSON.stringify(courses));
        res.status(200).json({
            success: true,
            courses
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//get course content --only for purchased course and valid user
exports.getCourseByUser = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        const coursesExists = userCourseList?.find((course) => course._id.toString() === courseId.toString());
        if (!coursesExists) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course please purchase it", 404));
        }
        const course = await course_model_1.default.findById(courseId);
        const content = course?.courseData;
        res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addQuestion = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const courseContent = course?.courseData?.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        //create a new question object
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: []
        };
        //add this question to our curse content
        courseContent.questions.push(newQuestion);
        await notificationModel_1.default.create({
            user: req.user?._id,
            title: "New question Recieved",
            message: `You have a new question in ${courseContent.title}`,
        });
        await course?.save();
        res.status(200).json({
            success: true,
            course
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addAnswer = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default(" Invalid content id", 400));
        }
        const courseContent = course?.courseData?.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("", 400));
        }
        const question = courseContent?.questions?.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default(" Invalid content id", 400));
        }
        //create a new answer object
        const newAnswer = {
            user: req.user,
            answer,
        };
        //add this answer to our course content
        question.questionReplies.push(newAnswer);
        await course?.save();
        if (req.user?._id === question.user._id) {
            //create a notification 
            await notificationModel_1.default.create({
                user: req.user?._id,
                title: "New Question Reply Recieved",
                message: `You have a new question reply in${courseContent.title} `
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                await (0, sendMail_1.default)({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 500));
            }
            res.status(200).json({
                success: true,
                course,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReview = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        //if the course allredday exist
        const courseExists = userCourseList?.some((course) => course._id.toString() === courseId.toString());
        if (!courseExists) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course", 404));
        }
        const course = await course_model_1.default.findById(courseId);
        const { review, rating } = req.body;
        const reviewData = {
            user: req.user,
            comment: review,
            rating,
        };
        course?.reviews.push(reviewData);
        let avg = 0;
        course?.reviews.forEach((rev) => {
            avg += rev.rating;
        });
        if (course) {
            course.ratings = avg / course.reviews.length;
        }
        await course?.save();
        const notification = {
            title: "New Revies Recieved",
            message: `$(req.user?.name) has given a review in ${course?.name}`,
        };
        //create notification
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReplyToReview = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Review not found", 404));
        }
        const review = course?.reviews?.find((rev) => rev._id.toString() === reviewId);
        const replyData = {
            user: req.user,
            comment,
        };
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 404));
        }
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        review.commentReplies.push(replyData);
        await course?.save();
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
////get all courses--only for admins
exports.getAdminAllCourses = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        (0, course_service_1.getAllCoursesService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
//Delete Course --only for admin
exports.deleteCourse = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await course_model_1.default.findById(id);
        if (!course) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        await course.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "course deleted successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
//genrate video url
exports.genrateVideoUrl = (0, catchAsyncErrors_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`
            }
        });
        res.json(response.data);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
