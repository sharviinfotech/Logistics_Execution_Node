require('dotenv').config();
const path = require('path');
const fs = require('fs');

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const connectDB = require('./config/db');

// Initialize App
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve local files from fileService base upload path
const fileService = require('./StoreUplodedFileInTheLocation/fileService');
const BASE_UPLOAD_PATH = fileService.BASE_UPLOAD_PATH;

// Smart file serving for /pravah-files and /api/pravah-files
const servePravahFile = (req, res, next) => {
    try {
        const decodedPath = decodeURIComponent(req.path.replace(/^\/+/, ''));
        if (!decodedPath) return next();

        // 1. Direct path match under BASE_UPLOAD_PATH
        const fullPath = path.join(BASE_UPLOAD_PATH, decodedPath);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            return res.sendFile(fullPath);
        }

        // 2. Folder-based matching if direct file doesn't exist
        const segments = decodedPath.split(/[\\/]/).filter(Boolean);
        if (segments.length >= 2) {
            const requestedFileName = segments[segments.length - 1];
            const dirSegments = segments.slice(0, -1);
            const targetDir = path.join(BASE_UPLOAD_PATH, ...dirSegments);

            if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
                const files = fs.readdirSync(targetDir);
                const refNo = String(req.query.refNo || '').trim();
                const invNo = String(req.query.invNo || '').trim();

                let matchedFile = null;

                // Priority 1: refNo and invNo
                if (refNo && invNo) {
                    matchedFile = files.find(f => f.startsWith(`${refNo}_${invNo}_`));
                }

                // Priority 2: invNo
                if (!matchedFile && invNo) {
                    matchedFile = files.find(f => f.includes(`_${invNo}_`));
                }

                // Priority 3: ends with requested filename
                if (!matchedFile && requestedFileName) {
                    matchedFile = files.find(f => 
                        f.toLowerCase() === requestedFileName.toLowerCase() ||
                        f.toLowerCase().endsWith('_' + requestedFileName.toLowerCase()) ||
                        f.toLowerCase().endsWith(requestedFileName.toLowerCase())
                    );
                }

                // Priority 4: refNo
                if (!matchedFile && refNo) {
                    matchedFile = files.find(f => f.startsWith(`${refNo}_`));
                }

                if (matchedFile) {
                    const foundFullPath = path.join(targetDir, matchedFile);
                    if (fs.existsSync(foundFullPath) && fs.statSync(foundFullPath).isFile()) {
                        return res.sendFile(foundFullPath);
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error in servePravahFile:', err);
    }
    next();
};

app.use('/pravah-files', servePravahFile, express.static(BASE_UPLOAD_PATH));
app.use('/api/pravah-files', servePravahFile, express.static(BASE_UPLOAD_PATH));

// Load Routes
app.use('/api', routes);

// Database Connection
// connectDB();

const BASE_PORT = process.env.PORT || 3001;
app.listen(BASE_PORT, () => {
    console.log(`🚀 Server running on port: ${BASE_PORT}`);
    console.log(`📁 File Storage Base Path: ${BASE_UPLOAD_PATH}`);
});













































































//Backup 17-09-2026
// const path = require('path');
// const fs = require('fs');

// const express = require('express');
// const cors = require('cors');
// const routes = require('./routes');
// const connectDB = require('./config/db');

// // Initialize App
// const app = express();

// // Middleware
// app.use(cors());
// //for deve server
// // app.use(cors({
// //     origin: 'http://10.10.4.178', // Adjust the origin to your frontend's URL
// //     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
// //     credentials: true,
// // }));
// // app.use(express.json());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));

// // Serve local files from configurable base upload path
// const fileService = require('./StoreUplodedFileInTheLocation/fileService');
// const BASE_UPLOAD_PATH = fileService.BASE_UPLOAD_PATH || (() => {
//     const rawPath = String(process.env.BASE_UPLOAD_PATH || 'D:\\Pravah').trim().replace(/^[\"']|[\"']$/g, '');
//     return path.normalize(rawPath).replace(/[\\/]+$/, '');
// })();
// // Smart file serving for /pravah-files and /api/pravah-files
// const servePravahFile = (req, res, next) => {
//     try {
//         const decodedPath = decodeURIComponent(req.path.replace(/^\/+/, ''));
//         if (!decodedPath) return next();

//         // 1. Direct path match under BASE_UPLOAD_PATH
//         const fullPath = path.join(BASE_UPLOAD_PATH, decodedPath);
//         if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
//             return res.sendFile(fullPath);
//         }

//         // 2. Folder-based matching if direct file doesn't exist
//         const segments = decodedPath.split(/[\\/]/).filter(Boolean);
//         if (segments.length >= 2) {
//             const requestedFileName = segments[segments.length - 1];
//             const dirSegments = segments.slice(0, -1);
//             const targetDir = path.join(BASE_UPLOAD_PATH, ...dirSegments);

//             if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
//                 const files = fs.readdirSync(targetDir);
//                 const refNo = String(req.query.refNo || '').trim();
//                 const invNo = String(req.query.invNo || '').trim();

//                 let matchedFile = null;

//                 // Priority 1: refNo and invNo
//                 if (refNo && invNo) {
//                     matchedFile = files.find(f => f.startsWith(`${refNo}_${invNo}_`));
//                 }

//                 // Priority 2: invNo
//                 if (!matchedFile && invNo) {
//                     matchedFile = files.find(f => f.includes(`_${invNo}_`));
//                 }

//                 // Priority 3: ends with requested filename
//                 if (!matchedFile && requestedFileName) {
//                     matchedFile = files.find(f => 
//                         f.toLowerCase() === requestedFileName.toLowerCase() ||
//                         f.toLowerCase().endsWith('_' + requestedFileName.toLowerCase()) ||
//                         f.toLowerCase().endsWith(requestedFileName.toLowerCase())
//                     );
//                 }

//                 // Priority 4: refNo
//                 if (!matchedFile && refNo) {
//                     matchedFile = files.find(f => f.startsWith(`${refNo}_`));
//                 }

//                 if (matchedFile) {
//                     const foundFullPath = path.join(targetDir, matchedFile);
//                     if (fs.existsSync(foundFullPath) && fs.statSync(foundFullPath).isFile()) {
//                         return res.sendFile(foundFullPath);
//                     }
//                 }
//             }
//         }
//     } catch (err) {
//         console.error('Error in servePravahFile:', err);
//     }
//     next();
// };

// app.use('/pravah-files', servePravahFile, express.static(BASE_UPLOAD_PATH));
// app.use('/api/pravah-files', servePravahFile, express.static(BASE_UPLOAD_PATH));

// // Load Routes
// app.use('/api', routes);

// // Database Connection
// // connectDB();

// // local code
// const BASE_SERVER_URL = 'http://localhost';
// const BASE_PORT = process.env.PORT || 3001;
// app.listen(BASE_PORT, () => {
//     console.log(`🚀 Server running on ${BASE_SERVER_URL}:${BASE_PORT}`);
//     console.log(`📁 File Storage Base Path: ${BASE_UPLOAD_PATH}`);
// });



// // Server code 
// // const PORT = process.env.PORT || 3001;
// // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));





// // const express = require('express');
// // const cors = require('cors');
// // const routes = require('./routes');
// // const connectDB = require('./config/db');

// // // Initialize App
// // const app = express();

// // // Middleware
// // // app.use(cors());
// // // for deve server
// // app.use(cors({
// //     origin: '*', // Adjust the origin to your frontend's URL
// //     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
// //     credentials: true,
// // }));
// // app.use(express.json());

// // // Load Routes
// // app.use('/api', routes);

// // // Database Connection
// // // connectDB();

// // // Server Initialization
// // // const PORT = process.env.PORT || 3000;
// // const BASE_SERVER_URL = 'http://localhost'
// // const BASE_PORT = 3001
// // app.listen(BASE_PORT, () => 
// //     // console.log(`Server running on port ${PORT}`)
// //  console.log(`🚀 Server running on ${BASE_SERVER_URL}:${BASE_PORT}`)
// // );



