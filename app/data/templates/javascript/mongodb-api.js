export const code = `// app/api/users/route.js
import { MongoClient } from 'mongodb';

// MongoDB connection string - store this in .env.local in production
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/yourdatabase";

// MongoDB connection cache to avoid creating new connections for each request
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Create a new connection
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

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

    const { db } = await connectToDatabase();
    
    // Find the user with the specified email
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email });
    
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
      paymentStatus: user.paymentStatus // Should be "paid" or "unpaid"
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