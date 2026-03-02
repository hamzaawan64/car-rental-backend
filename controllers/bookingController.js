import Booking from "../models/Booking.js"
import Car from "../models/Car.js"


const checkAvailability  = async(car, pickupDate, returnDate)=>{
    const bookings = await Booking.find({
        car,
        pickupDate: { $lte: returnDate },
        returnDate: { $gte: pickupDate }
    })
    return bookings.length === 0;
}

//API to check Availability of cars for the given Date and Location
export const checkAvailabilityofCar = async(req, res)=>{
    try{

        const{location, pickupDate, returnDate} = req.body

        //fetch all available cars for the given location
        const cars = await Car.find({location, isAvaliable: true})

        //check car availability for the given date range using promise
        const availableCarsPromises = cars.map(async(car)=>{
         const isAvailable =  await checkAvailability(car._id, pickupDate, returnDate)
        return{...car._doc, isAvailable}
        })
        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true)
        res.json({success:true, availableCars})
    }
    catch(error){
        console.log(error.message)
        res.json({success:false, message: error.message })

    }
}

//API to create Booking
export const createBooking = async(req,res)=>{
    try{
        const{_id} = req.user;
        const{car, pickupDate, returnDate} = req.body;

        const isAvailable = await checkAvailability(car, pickupDate, returnDate)
        if(!isAvailable){
            return res.json({success: false, message: "Car is not available"})
        }

        const carData = await Car.findById(car)
        if(!carData){
   return res.json({success:false, message:"Car not found"})
}

            //calculate price based on pickupDate and return Date
            const picked = new Date(pickupDate);
            const returned = new Date(returnDate);
            const noOfDays = Math.max(1, Math.ceil((returned - picked)/(1000 * 60 * 60 * 24)))
            const price = carData.pricePerDay * noOfDays;

            await Booking.create({car,owner:carData.owner, user: _id, pickupDate, returnDate, price})

            res.json({success:true, message: "Booking Created"})
    }
    catch(error){
        console.log(error.message)
        res.json({success:false, message: error.message })

    }
}
   
//ApI to List User Bookings
export const getUserBookings = async(req,res)=>{
    try{
        const{_id} = req.user;
        const bookings = await Booking.find({user: _id})
        .populate("car")
        // .lean()
        // .sort({createdAt: -1})
        res.json({success: true, bookings})
        
    }
    catch(error){
        console.log(error.message)
        res.json({success:false, message: error.message })

    }
}

//ApI to get Owner Bookings
export const getOwnerBookings = async(req, res) => {
  try {
    const { _id, role } = req.user

    // ✅ YE ADD KARO
    console.log("=== MANAGE BOOKINGS DEBUG ===")
    console.log("User ID:", _id)
    console.log("User Role:", role)
    console.log("=============================")

    if(role !== 'owner' && role !== 'admin'){
      console.log("❌ UNAUTHORIZED - role is:", role)
      return res.json({success: false, message: "unauthorized"})
    }
    // ... baaki code same

    // ✅ Admin ho to saari bookings, owner ho to sirf apni
    const filter = role === "admin" ? {} : { owner: _id }

    const bookings = await Booking.find(filter)
      .populate('car user')
      .sort({ createdAt: -1 })
    
    res.json({success: true, bookings})

  } catch(error) {
    console.log(error.message)
    res.json({success: false, message: error.message})
  }
}

//ApI to change booking status
export const changeBookingStatus = async(req, res) => {
  try {
    const { _id, role } = req.user
    const { bookingId, status } = req.body

    const booking = await Booking.findById(bookingId)
    if(!booking) {
      return res.json({success: false, message: "Booking not found"})
    }

    // ✅ null check - admin ko allow karo
    if(role !== 'admin' && (!booking.owner || booking.owner.toString() !== _id.toString())){
      return res.json({success: false, message: "Unauthorized"})
    }

    booking.status = status
    await booking.save()
    res.json({success: true, message: "Status Updated"})

  } catch(error) {
    console.log(error.message)
    res.json({success: false, message: error.message})
  }
}