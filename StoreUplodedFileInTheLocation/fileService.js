// const saveImageFile = async (base64Data, refNo, invNo) => {

//     const folderPath = path.join(
//         BASE_UPLOAD_PATH,
//         refNo
//     );

//     console.log("REFNO:", refNo);
//     console.log("INVNO:", invNo);
//     console.log("Folder Path:", folderPath);

//     if (!fs.existsSync(folderPath)) {
//         fs.mkdirSync(folderPath, { recursive: true });
//     }
//     const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
//     if (!matches) {
//         throw new Error('Invalid Base64 format');
//     }
//     const extension = matches[1].split('/')[1];
//     const fileName = `${invNo}.${extension}`;
//     const filePath = path.join(folderPath, fileName);
//     fs.writeFileSync(
//         filePath,
//         Buffer.from(matches[2], 'base64')
//     );
//     console.log("File Saved Successfully:", filePath);
//     return filePath;
// };

// module.exports = {
//     saveImageFile
// };

const fs = require('fs');
const path = require('path');

const BASE_UPLOAD_PATH = 'O:\\TransitInfoFiles'; // ✅ Your local drive path

const saveImageFile = async (base64Data, refNo, fileName) => {

    // ✅ Convert to string to avoid path.join error
    const refNoStr = String(refNo);
    // const invNoStr = String(invNo);

    const folderPath = path.join(BASE_UPLOAD_PATH, refNoStr);

    console.log("REFNO:", refNoStr);
    console.log("File Name:", fileName);
    console.log("Folder Path:", folderPath);

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
        throw new Error('Invalid Base64 format');
    }

    // const extension = matches[1].split('/')[1];
    // const fileName = `${invNoStr}.${extension}`;
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));

    console.log("File Saved Successfully:", filePath);
    return filePath;
};

module.exports = { saveImageFile };