
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const connectDB = require('./config/db');

// Initialize App
const app = express();

// Middleware
app.use(cors());
//for deve server
// app.use(cors({
//     origin: 'http://10.10.4.178', // Adjust the origin to your frontend's URL
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
// }));
// app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Load Routes
app.use('/api', routes);

// Database Connection
// connectDB();

// local code
const BASE_SERVER_URL = 'http://localhost'
const BASE_PORT = 3001
app.listen(BASE_PORT, () => 
    // console.log(`Server running on port ${PORT}`)
 console.log(`🚀 Server running on ${BASE_SERVER_URL}:${BASE_PORT}`)
);



// Server code 
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));





// const express = require('express');
// const cors = require('cors');
// const routes = require('./routes');
// const connectDB = require('./config/db');

// // Initialize App
// const app = express();

// // Middleware
// // app.use(cors());
// // for deve server
// app.use(cors({
//     origin: '*', // Adjust the origin to your frontend's URL
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
// }));
// app.use(express.json());

// // Load Routes
// app.use('/api', routes);

// // Database Connection
// // connectDB();

// // Server Initialization
// // const PORT = process.env.PORT || 3000;
// const BASE_SERVER_URL = 'http://localhost'
// const BASE_PORT = 3001
// app.listen(BASE_PORT, () => 
//     // console.log(`Server running on port ${PORT}`)
//  console.log(`🚀 Server running on ${BASE_SERVER_URL}:${BASE_PORT}`)
// );



