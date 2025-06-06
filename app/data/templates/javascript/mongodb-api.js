export const code = `// app/api/users/route.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Define the User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  address: String,
  phoneNumber: String,
  paymentStatus: { type: String, enum: ['paid', 'unpaid'] }
});

// Create the User model
const User = mongoose.models.User || mongoose.model('User', userSchema);

export async function GET(request) {
  try {
    // Get the email from URL query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return Response.json(
        { success: false, message: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();
    
    // Find the user with the specified email
    const user = await User.findOne({ email });
    
    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Extract and return only the required fields
    const userData = {
      name: user.name,
      address: user.address,
      phoneNumber: user.phoneNumber,
      email: user.email,
      paymentStatus: user.paymentStatus
    };
    
    return Response.json({ success: true, user: userData });
  } catch (error) {
    console.error('Database query error:', error);
    return Response.json(
      { success: false, message: 'Failed to retrieve user information' },
      { status: 500 }
    );
  }
}`; 