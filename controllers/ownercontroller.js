import cloudinary from "../configs/cloudinaryConfig.js";
import User from "../models/User.js";
import Car from "../models/Car.js"
import fs from "fs";
import Booking from "../models/Booking.js";
import OwnerApplication from "../models/OwnerApplication.js"


//Role of User  

export const submitOwnerApplication = async (req, res) => {
  try {
    const { _id } = req.user;
    const { phone, cnicNumber, address, reason } = req.body;

    // Pehle se application hai?
    const existing = await OwnerApplication.findOne({ user: _id })
    if (existing) {
      return res.json({ 
        success: false, 
        message: `Application already ${existing.status}` 
      })
    }

    // Pehle se owner hai?
    if (req.user.role === "owner") {
      return res.json({ success: false, message: "Already an owner" })
    }

    await OwnerApplication.create({ user: _id, phone, cnicNumber, address, reason })
    res.json({ success: true, message: "Application submitted! Admin will review it." })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin — saari applications dekhe
export const getAllApplications = async (req, res) => {
  try {
    const applications = await OwnerApplication.find()
      .populate("user", "name email image")
      .sort({ createdAt: -1 })
    res.json({ success: true, applications })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin — approve ya reject kare
export const reviewApplication = async (req, res) => {
  try {
    const { applicationId, status, adminNote } = req.body;

    const application = await OwnerApplication.findById(applicationId)
    if (!application) {
      return res.json({ success: false, message: "Application not found" })
    }

    application.status = status
    application.adminNote = adminNote || ""
    await application.save()

    // Approve hone par role update karo
    if (status === "approved") {
      await User.findByIdAndUpdate(application.user, { role: "owner" })
    }

    res.json({ success: true, message: `Application ${status}` })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// User apni application ka status dekhe
export const getMyApplicationStatus = async (req, res) => {
  try {
    const { _id } = req.user;
    const application = await OwnerApplication.findOne({ user: _id })
    res.json({ success: true, application })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}



//API to add Car image
export const addCar = async (req, res) => {
  try {
    const { _id } = req.user;
    let car = JSON.parse(req.body.carData);
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    // Upload to Cloudinary with optimization
    const uploadResult = await cloudinary.uploader.upload(
      imageFile.path,
      {
        folder: "car_rental", // custom folder
        public_id: `${car.brand}_${Date.now()}`, // custom name
        transformation: [
          { width: 1280, crop: "scale" }, // resize
          { quality: "auto" },            // auto compression
          { fetch_format: "webp" }        // convert to webp
        ],
      }
    );

    const image = uploadResult.secure_url;

    await Car.create({
      ...car,
      owner: _id,
      image,
    });

    res.json({ success: true, message: "Car Added" });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//API to list Owner Cars
export const getOwnerCars = async(req, res) => {
  try {
    const { _id, role } = req.user

    // ✅ Admin ho to saari cars, owner ho to sirf apni
    const filter = role === "admin" ? {} : { owner: _id }

    const cars = await Car.find(filter)
    res.json({success: true, cars})

  } catch(error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}

//API to Car Availability
export const toggleCarAvailability = async(req, res) => {
  try {
    const { _id, role } = req.user
    const { carId } = req.body
    const car = await Car.findById(carId)

    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" })
    }

    // ✅ null check add kiya - admin ko allow karo
    if(role !== 'admin' && (!car.owner || car.owner.toString() !== _id.toString())){
      return res.json({success: false, message: "Unauthorized"})
    }

    car.isAvaliable = !car.isAvaliable
    await car.save()
    res.json({success: true, message: "Availability Toggled"})

  } catch(error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}

//API to remove Car
export const deleteCar = async(req, res) => {
  try {
    const { _id, role } = req.user
    const { carId } = req.body
    const car = await Car.findById(carId)

    if(!car) {
      return res.json({success: false, message: "Car not found"})
    }

    // ✅ null check add kiya - admin ko allow karo
    if(role !== 'admin' && (!car.owner || car.owner.toString() !== _id.toString())){
      return res.json({success: false, message: "Unauthorized"})
    }

    car.owner = null
    car.isAvaliable = false
    await car.save()
    res.json({success: true, message: "Car Removed"})

  } catch(error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}

//API to get Dashboard Data
export const getDashboardData = async (req, res) => {
  try {
    const { _id, role } = req.user

    if (role !== "owner" && role !== "admin") {
      
      return res.json({ success: false, message: "Unauthorized" })
    }

    const filter = role === "admin" ? {} : { owner: _id }
    

    const cars = await Car.find(filter).lean()
    const bookings = await Booking.find(filter).populate("car").lean()
    
    
    const pendingBookings = bookings.filter((b) => b.status === "pending")
    const completedBookings = bookings.filter((b) => b.status === "confirmed")

    const sortedBookings = bookings.slice().sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )

    const monthlyRevenue = completedBookings.reduce(
      (acc, booking) => acc + booking.price, 0
    )

    const dashboardData = {
      totalCars: cars.length,
      totalBookings: bookings.length,
      pendingBookings: pendingBookings.length,
      completedBookings: completedBookings.length,
      recentBookings: sortedBookings.slice(0, 3),
      monthlyRevenue,
    }

    res.json({ success: true, dashboardData })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message })
  }
}



//API to update user image
export const updateUserImage = async (req, res) => {
  try {
    const { _id } = req.user;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    // Upload image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      imageFile.path,
      {
        folder: "car_rental/users",
        public_id: `user_${_id}_${Date.now()}`,
        transformation: [
          { width: 400 },
          { quality: "auto" },
          { fetch_format: "webp" }
        ],
      }
    );

    const imageUrl = uploadResult.secure_url;

    // Update user image in database
    await User.findByIdAndUpdate(_id, {
      image: imageUrl,
    });

    res.json({
      success: true,
      message: "Profile image updated successfully",
      image: imageUrl,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};