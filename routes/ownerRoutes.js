import express from 'express'
import {addCar, deleteCar, getDashboardData, getOwnerCars, toggleCarAvailability, updateUserImage } from '../controllers/ownercontroller.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/multer.js';
import { submitOwnerApplication, getAllApplications, reviewApplication,getMyApplicationStatus } from '../controllers/ownercontroller.js';
import { isAdmin } from '../middleware/auth.js'

const ownerRouter = express.Router();

ownerRouter.post('/add-car', protect, upload.single("image"), addCar)
ownerRouter.get('/cars', protect, getOwnerCars)
ownerRouter.post('/toggle-car', protect, toggleCarAvailability)
ownerRouter.post('/delete-car', protect, deleteCar)


ownerRouter.get('/dashboard', protect, getDashboardData)
ownerRouter.post('/update-image', protect, upload.single("image"), updateUserImage)

ownerRouter.post('/apply', protect, submitOwnerApplication)
ownerRouter.get('/application-status', protect, getMyApplicationStatus)
ownerRouter.get('/applications', protect, isAdmin, getAllApplications)      // sirf admin
ownerRouter.post('/review-application', protect, isAdmin, reviewApplication) // sirf admin







export default ownerRouter;
