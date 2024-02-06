const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = 'mongodb+srv://ak2432:Aleenaali@gettingstarted.uumymka.mongodb.net';
const client = new MongoClient(mongoURI); // Remove the deprecated options

// Connect to MongoDB
client.connect((err) => {
  if (err) {
    console.error('Error connecting to MongoDB:', err);
    return;
  }

  console.log('Connected to MongoDB');

  const db = client.db(); // Use the default database or specify your database name

  // Middleware Functions
  app.use(loggerMiddleware);
  app.use(express.static(path.join(__dirname, 'public')));

  // REST API Routes
  app.get('/lessons', getLessons);
  app.post('/orders', saveOrder);
  app.put('/update-lesson-spaces/:lessonId', updateLessonSpaces);
  app.get('/search', searchLessons);

  // Logger Middleware
  function loggerMiddleware(req, res, next) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  }

  // Static File Middleware
  app.use('/images', express.static(path.join(__dirname, 'images')));

  // Get all lessons
  async function getLessons(req, res) {
    const lessons = await db.collection('lessons').find().toArray();
    res.json(lessons);
  }

  // Save a new order
  async function saveOrder(req, res) {
    const { name, phoneNumber, lessonIds, numberOfSpace } = req.body;

    const orderData = {
      OrderID: generateOrderId(),
      Name: name,
      "Phone Number": phoneNumber,
      "Lesson IDs": lessonIds,
      "Number of Space": numberOfSpace,
    };

    const result = await db.collection('orders').insertOne(orderData);
    res.status(201).json({ orderId: result.insertedId });
  }

  // Update lesson spaces
  async function updateLessonSpaces(req, res) {
    const lessonId = req.params.lessonId;

    // Update the lesson document based on the lessonId and the number of spaces in the request body
    await db.collection('lessons').updateOne(
      { _id: ObjectId(lessonId) },
      { $inc: { spaces: -req.body.numberOfSpace } }
    );

    res.status(200).send('Lesson spaces updated successfully');
  }

  // Search lessons
  async function searchLessons(req, res) {
    const searchTerm = req.query.term;
    const regex = new RegExp(searchTerm, 'i');

    const searchResults = await db.collection('lessons').find({
      $or: [
        { topic: regex },
        { location: regex },
      ],
    }).toArray();

    res.json(searchResults);
  }

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Close MongoDB connection on process termination
  process.on('SIGINT', () => {
    client.close();
    process.exit();
  });

  // Utility function to generate a unique order ID
  function generateOrderId() {
    return Math.random().toString(36).substr(2, 9);
  }
});
