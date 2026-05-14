import mongoose from "mongoose";

const connectDB = async () => {
  try {

    await mongoose.connect(process.env.MASTER_MONGODB_URI);

    console.log("✅ Master Database Connected");

  } catch (error) {

    console.log(error);

    process.exit(1);
  }
};

export default connectDB;