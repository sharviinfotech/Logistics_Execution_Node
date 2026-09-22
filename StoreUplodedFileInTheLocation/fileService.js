require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Root of the upload tree configured dynamically via BASE_UPLOAD_PATH environment variable:
 * - Local/Dev default (Windows): 'D:\\Pravah'
 * - Linux/Dev/QA/Prod default: '/home/pravah_uploaded_files'
 */
// const defaultFallbackPath = process.platform === 'win32' ? 'D:\\Pravah' : '/home/pravah_uploaded_files';

const rawUploadPath = String(process.env.BASE_UPLOAD_PATH )
    .trim()
    .replace(/^["']|["']$/g, '');

const BASE_UPLOAD_PATH = path.normalize(rawUploadPath).replace(/[\\/]+$/, '');

// "mode" value coming from the caller -> top-level folder name
const MODE_FOLDERS = {
    sap: 'SAP',
    with: 'SAP',
    withsap: 'SAP',
    'with sap': 'SAP',
    nonsap: 'Without Sap',
    without: 'Without Sap',
    withoutsap: 'Without Sap',
    'without sap': 'Without Sap',
};

// data-URI mime type -> file extension
const MIME_EXTENSION = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
};

// Make a value safe to use inside a file / folder name.
const clean = (value, fallback) => {
    const text = String(value == null ? '' : value).trim();
    const safe = text
        .replace(/[\\/:*?"<>|\r\n]+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '');
    return safe || fallback;
};

/**
 * Save a base64 document into the Pravah tree.
 */
const saveImageFile = async (base64Data, refNo, invNo, docName, mode, screen, field) => {
    if (!base64Data) {
        throw new Error('No file content received');
    }

    if (refNo && typeof refNo === 'object') {
        ({ refNo, invNo, docName, mode, screen, field } = { screen: 'Transit_Info', field: 'POD', ...refNo });
    }

    const refNoStr = clean(refNo, 'NA');
    const invNoStr = clean(invNo, 'NA');

    const matches = String(base64Data).match(/^data:(.+);base64,(.+)$/);
    const mimeType = matches ? matches[1].split(';')[0].toLowerCase() : '';
    const content = matches ? matches[2] : base64Data;

    const parsed = path.parse(String(docName || 'POD'));
    const docBase = clean(parsed.name, 'POD');
    let ext = parsed.ext.replace('.', '').toLowerCase();
    if (!ext) ext = MIME_EXTENSION[mimeType] || 'pdf';

    const modeFolder = MODE_FOLDERS[String(mode == null ? '' : mode).trim().toLowerCase()] || 'SAP';
    const screenFolder = clean(screen, 'Transit_Info');
    const fieldFolder = clean(field, 'POD');
    const targetDir = path.join(BASE_UPLOAD_PATH, modeFolder, screenFolder, fieldFolder);

    fs.mkdirSync(targetDir, { recursive: true });

    const fileName = `${refNoStr}_${invNoStr}_${docBase}.${ext}`;
    const filePath = path.join(targetDir, fileName);

    console.log('REFNO:', refNoStr);
    console.log('INVNO:', invNoStr);
    console.log('File Name:', fileName);
    console.log('Folder Path:', targetDir);

    fs.writeFileSync(filePath, Buffer.from(content, 'base64'));

    console.log('File Saved Successfully:', filePath);
    return filePath;
};

/**
 * Remove existing files matching the <refNo>_<invNo> prefix.
 */
const deleteExistingFiles = ({ refNo, invNo, mode, screen, field } = {}) => {
    try {
        const modeFolder =
            MODE_FOLDERS[String(mode == null ? '' : mode).trim().toLowerCase()] || 'SAP';
        const screenFolder =
            GLOBAL_SCREEN_FOLDERS[String(screen == null ? '' : screen).trim().toUpperCase()] ||
            clean(screen, 'Transit_Info');

        const cleanRef = clean(refNo, '');
        const cleanInv = clean(invNo, '');
        if (!cleanRef && !cleanInv) return;

        const prefix = cleanRef && cleanInv ? `${cleanRef}_${cleanInv}_` : '';

        const modes = [modeFolder];
        if (!field) {
            if (!modes.includes('SAP')) modes.push('SAP');
            if (!modes.includes('Without Sap')) modes.push('Without Sap');
        }

        for (const m of modes) {
            const screenDir = path.join(BASE_UPLOAD_PATH, m, screenFolder);
            if (!fs.existsSync(screenDir)) continue;

            let targetDirs = [];
            if (field) {
                const fieldFolder = clean(field, '');
                if (fieldFolder) {
                    targetDirs.push(path.join(screenDir, fieldFolder));
                }
            } else {
                try {
                    const subEntries = fs.readdirSync(screenDir);
                    for (const sub of subEntries) {
                        const fullSub = path.join(screenDir, sub);
                        try {
                            if (fs.statSync(fullSub).isDirectory()) {
                                targetDirs.push(fullSub);
                            }
                        } catch (_e) {}
                    }
                } catch (_e) {}
                targetDirs.push(screenDir);
            }

            for (const targetDir of targetDirs) {
                if (!fs.existsSync(targetDir)) continue;
                try {
                    const files = fs.readdirSync(targetDir);
                    for (const file of files) {
                        let matches = false;
                        if (prefix && file.startsWith(prefix)) matches = true;
                        else if (cleanInv && file.includes(`_${cleanInv}_`)) matches = true;
                        else if (prefix && file.includes(prefix)) matches = true;

                        if (matches) {
                            const fullPath = path.join(targetDir, file);
                            try {
                                if (fs.statSync(fullPath).isFile()) {
                                    fs.unlinkSync(fullPath);
                                    console.log('Deleted existing file:', fullPath);
                                }
                            } catch (delErr) {
                                console.error('Failed to delete existing file:', fullPath, delErr);
                            }
                        }
                    }
                } catch (dirErr) {
                    console.error('Failed to read directory in deleteExistingFiles:', targetDir, dirErr);
                }
            }
        }
    } catch (err) {
        console.error('Error in deleteExistingFiles:', err);
    }
};

const saveDocuments = async (container, map, opts) => {
    if (!container || typeof container !== 'object' || !map) return;

    const { refNo, invNo, mode, screen } = opts || {};
    const processedFields = new Set();

    for (const docKey of Object.keys(map)) {
        const cfg = map[docKey] || {};
        const value = container[docKey];

        if (typeof value !== 'string' || !value.startsWith('data:')) continue;

        if (cfg.field && processedFields.has(cfg.field)) {
            container[docKey] = '';
            continue;
        }

        const altDocKey = docKey.startsWith('Z') ? docKey.slice(1) : `Z${docKey}`;
        const docName =
            container[`${docKey}_NAME`] ||
            container[`${altDocKey}_NAME`] ||
            container[`${cfg.field}_NAME`] ||
            cfg.field ||
            docKey;

        const savedPath = await saveImageFile(
            value, refNo, invNo, docName, mode, screen, cfg.field
        );

        if (cfg.field) processedFields.add(cfg.field);

        if (cfg.pathKey) container[cfg.pathKey] = savedPath;
        container[docKey] = '';
        if (`${docKey}_NAME` in container) container[`${docKey}_NAME`] = '';
        if (`${altDocKey}_NAME` in container) container[`${altDocKey}_NAME`] = '';
    }
};

const updateDocuments = async (container, map, opts) => {
    if (!container || typeof container !== 'object' || !map) return;

    const { refNo, invNo, mode, screen } = opts || {};
    const processedFields = new Set();

    for (const docKey of Object.keys(map)) {
        const cfg = map[docKey] || {};
        const value = container[docKey];

        if (typeof value !== 'string' || !value.startsWith('data:')) continue;

        if (cfg.field && processedFields.has(cfg.field)) {
            container[docKey] = '';
            continue;
        }

        deleteExistingFiles({
            refNo,
            invNo,
            mode,
            screen,
            field: cfg.field,
        });

        const altDocKey = docKey.startsWith('Z') ? docKey.slice(1) : `Z${docKey}`;
        const docName =
            container[`${docKey}_NAME`] ||
            container[`${altDocKey}_NAME`] ||
            container[`${cfg.field}_NAME`] ||
            cfg.field ||
            docKey;

        const savedPath = await saveImageFile(
            value, refNo, invNo, docName, mode, screen, cfg.field
        );

        if (cfg.field) processedFields.add(cfg.field);

        if (cfg.pathKey) container[cfg.pathKey] = savedPath;
        container[docKey] = '';
        if (`${docKey}_NAME` in container) container[`${docKey}_NAME`] = '';
        if (`${altDocKey}_NAME` in container) container[`${altDocKey}_NAME`] = '';
    }
};

const GLOBAL_SCREEN_FOLDERS = {
    'TRANSIT INFO': 'Transit_Info',
    'INSURANCE CLAIM STATUS': 'Insurance_Claim',
    'TRANSIT DAMAGE INFO': 'Transit_Damage_Info',
    'FREIGHT BILLING': 'Freight_Billing',
};

/**
 * List the documents already stored on disk for ONE record.
 */
const listDocuments = ({ refNo, invNo, mode, screen } = {}) => {
    try {
        const modeFolder =
            MODE_FOLDERS[String(mode == null ? '' : mode).trim().toLowerCase()] || 'SAP';
        const screenFolder =
            GLOBAL_SCREEN_FOLDERS[String(screen == null ? '' : screen).trim().toUpperCase()] ||
            clean(screen, 'Transit_Info');

        const screenDir = path.join(BASE_UPLOAD_PATH, modeFolder, screenFolder);
        if (!fs.existsSync(screenDir)) return {};

        const cleanRef = clean(refNo, '');
        const cleanInv = clean(invNo, '');
        const prefix = cleanRef && cleanInv ? `${cleanRef}_${cleanInv}_` : '';
        const found = {};

        for (const fieldFolder of fs.readdirSync(screenDir)) {
            const fieldDir = path.join(screenDir, fieldFolder);
            let isDir = false;
            try { isDir = fs.statSync(fieldDir).isDirectory(); } catch (_e) {}
            if (!isDir) continue;

            const dirFiles = fs.readdirSync(fieldDir);
            let matches = [];

            if (prefix) {
                matches = dirFiles.filter((name) => name.startsWith(prefix));
            }
            if (!matches.length && cleanInv) {
                matches = dirFiles.filter((name) => name.includes(`_${cleanInv}_`));
            }
            if (!matches.length && cleanRef) {
                matches = dirFiles.filter((name) => name.startsWith(`${cleanRef}_`));
            }

            if (matches.length) found[fieldFolder] = matches[0];
        }
        return found;
    } catch (_e) {
        return {};
    }
};

/**
 * Walk the HEADER / ITEMS rows of a search response and attach on each row:
 *     row.ZLOCALFILES = { "<FieldFolder>": "<fileName>", ... }
 *     row.ZLOCALFILE_URLS = { "<FieldFolder>": "pravah-files/...", ... }
 */
const attachLocalFileNames = (data, { mode, screen } = {}) => {
    try {
        if (!data || typeof data !== 'object') return data;

        const headerRows = Array.isArray(data.HEADER) ? data.HEADER : [];
        const itemRows = Array.isArray(data.ITEMS) ? data.ITEMS : [];
        const rows = [].concat(headerRows).concat(itemRows);

        const defaultRef = headerRows[0]?.ZREFNO || headerRows[0]?.REFNO || headerRows[0]?.REF_NO ||
                           itemRows[0]?.ZREFNO || itemRows[0]?.REFNO || itemRows[0]?.REF_NO;
        const defaultInv = headerRows[0]?.ZINV_NO || headerRows[0]?.INV_NO || headerRows[0]?.INVNO ||
                           itemRows[0]?.ZINV_NO || itemRows[0]?.INV_NO || itemRows[0]?.INVNO;

        const modeFolder =
            MODE_FOLDERS[String(mode == null ? '' : mode).trim().toLowerCase()] || 'SAP';
        const screenFolder =
            GLOBAL_SCREEN_FOLDERS[String(screen == null ? '' : screen).trim().toUpperCase()] ||
            clean(screen, 'Transit_Info');

        for (const row of rows) {
            if (!row || typeof row !== 'object') continue;
            const refNo = row.ZREFNO || row.REFNO || row.REF_NO || defaultRef;
            const invNo = row.ZINV_NO || row.INV_NO || row.INVNO || defaultInv;

            const docs = listDocuments({
                refNo,
                invNo,
                mode,
                screen,
            });
            row.ZLOCALFILES = docs;

            const urls = {};
            for (const [fieldKey, fName] of Object.entries(docs)) {
                if (fName) {
                    const singleFile = fName.split(',')[0].trim();
                    urls[fieldKey] = `pravah-files/${modeFolder}/${screenFolder}/${fieldKey}/${encodeURIComponent(singleFile)}`;
                }
            }
            row.ZLOCALFILE_URLS = urls;
        }
    } catch (_e) {}
    return data;
};

module.exports = {
    BASE_UPLOAD_PATH,
    saveImageFile,
    saveBase64File: saveImageFile,
    saveDocuments,
    updateDocuments,
    listDocuments,
    attachLocalFileNames,
    deleteExistingFiles,
};





























































// Backup On 17-09-2026
// const fs = require('fs');
// const path = require('path');

// /**
//  * Root of the upload tree.
//  * Files are stored under:
//  *   D:\Pravah\<MODE>\<SCREEN>\<FIELD>\<ReferenceNumber>_<InvoiceNumber>_<DocumentName>.<ext>
//  *   e.g.  D:\Pravah\SAP\Transit_Info\POD\1000000001_5000123_POD.pdf
//  *         D:\Pravah\Without Sap\Transit_Info\POD\1000000001_5000123_POD.pdf
//  */
// /**
//  * Root of the upload tree.
//  * Environment-based configuration via BASE_UPLOAD_PATH:
//  *   - Development: defaults to 'D:\\Pravah'
//  *   - Quality: set via BASE_UPLOAD_PATH on the Quality server
//  *   - Production: set via BASE_UPLOAD_PATH on the Production server
//  */
// const rawUploadPath = String(process.env.BASE_UPLOAD_PATH || 'D:\\Pravah').trim().replace(/^[\"']|[\"']$/g, '');
// const BASE_UPLOAD_PATH = path.normalize(rawUploadPath).replace(/[\\/]+$/, '');

// // "mode" value coming from the caller  ->  top-level folder name
// const MODE_FOLDERS = {
//     sap: 'SAP',
//     with: 'SAP',
//     withsap: 'SAP',
//     'with sap': 'SAP',
//     nonsap: 'Without Sap',
//     without: 'Without Sap',
//     withoutsap: 'Without Sap',
//     'without sap': 'Without Sap',
// };

// // data-URI mime type  ->  file extension
// const MIME_EXTENSION = {
//     'application/pdf': 'pdf',
//     'image/jpeg': 'jpg',
//     'image/jpg': 'jpg',
//     'image/png': 'png',
// };

// // Make a value safe to use inside a Windows file / folder name.
// const clean = (value, fallback) => {
//     const text = String(value == null ? '' : value).trim();
//     const safe = text
//         .replace(/[\\/:*?"<>|\r\n]+/g, '_')
//         .replace(/_{2,}/g, '_')
//         .replace(/^_+|_+$/g, '');
//     return safe || fallback;
// };

// /**
//  * Save a base64 document into the Pravah tree.
//  */
// const saveImageFile = async (base64Data, refNo, invNo, docName, mode, screen, field) => {
//     if (!base64Data) {
//         throw new Error('No file content received');
//     }

//     if (refNo && typeof refNo === 'object') {
//         ({ refNo, invNo, docName, mode, screen, field } = { screen: 'Transit_Info', field: 'POD', ...refNo });
//     }

//     const refNoStr = clean(refNo, 'NA');
//     const invNoStr = clean(invNo, 'NA');

//     const matches = String(base64Data).match(/^data:(.+);base64,(.+)$/);
//     const mimeType = matches ? matches[1].split(';')[0].toLowerCase() : '';
//     const content = matches ? matches[2] : base64Data;

//     const parsed = path.parse(String(docName || 'POD'));
//     const docBase = clean(parsed.name, 'POD');
//     let ext = parsed.ext.replace('.', '').toLowerCase();
//     if (!ext) ext = MIME_EXTENSION[mimeType] || 'pdf';

//     const modeFolder = MODE_FOLDERS[String(mode == null ? '' : mode).trim().toLowerCase()] || 'SAP';
//     const screenFolder = clean(screen, 'Transit_Info');
//     const fieldFolder = clean(field, 'POD');
//     const targetDir = path.join(BASE_UPLOAD_PATH, modeFolder, screenFolder, fieldFolder);

//     fs.mkdirSync(targetDir, { recursive: true });

//     const fileName = `${refNoStr}_${invNoStr}_${docBase}.${ext}`;
//     const filePath = path.join(targetDir, fileName);

//     console.log('REFNO:', refNoStr);
//     console.log('INVNO:', invNoStr);
//     console.log('File Name:', fileName);
//     console.log('Folder Path:', targetDir);

//     fs.writeFileSync(filePath, Buffer.from(content, 'base64'));

//     console.log('File Saved Successfully:', filePath);
//     return filePath;
// };

// /**
//  * Remove existing files matching the <refNo>_<invNo> prefix in a specific field directory.
//  */
// /**
//  * Remove existing files matching the <refNo>_<invNo> prefix.
//  * If field is provided, deletes from that specific field directory.
//  * If field is NOT provided (e.g. record delete), deletes matching files across ALL field directories under the screen.
//  */
// const deleteExistingFiles = ({ refNo, invNo, mode, screen, field } = {}) => {
//     try {
//         const modeFolder =
//             MODE_FOLDERS[String(mode == null ? '' : mode).trim().toLowerCase()] || 'SAP';
//         const screenFolder =
//             GLOBAL_SCREEN_FOLDERS[String(screen == null ? '' : screen).trim().toUpperCase()] ||
//             clean(screen, 'Transit_Info');

//         const cleanRef = clean(refNo, '');
//         const cleanInv = clean(invNo, '');
//         if (!cleanRef && !cleanInv) return;

//         const prefix = cleanRef && cleanInv ? `${cleanRef}_${cleanInv}_` : '';

//         const modes = [modeFolder];
//         if (!field) {
//             if (!modes.includes('SAP')) modes.push('SAP');
//             if (!modes.includes('Without Sap')) modes.push('Without Sap');
//         }

//         for (const m of modes) {
//             const screenDir = path.join(BASE_UPLOAD_PATH, m, screenFolder);
//             if (!fs.existsSync(screenDir)) continue;

//             let targetDirs = [];
//             if (field) {
//                 const fieldFolder = clean(field, '');
//                 if (fieldFolder) {
//                     targetDirs.push(path.join(screenDir, fieldFolder));
//                 }
//             } else {
//                 try {
//                     const subEntries = fs.readdirSync(screenDir);
//                     for (const sub of subEntries) {
//                         const fullSub = path.join(screenDir, sub);
//                         try {
//                             if (fs.statSync(fullSub).isDirectory()) {
//                                 targetDirs.push(fullSub);
//                             }
//                         } catch (_e) {}
//                     }
//                 } catch (_e) {}
//                 targetDirs.push(screenDir);
//             }

//             for (const targetDir of targetDirs) {
//                 if (!fs.existsSync(targetDir)) continue;
//                 try {
//                     const files = fs.readdirSync(targetDir);
//                     for (const file of files) {
//                         let matches = false;
//                         if (prefix && file.startsWith(prefix)) matches = true;
//                         else if (cleanInv && file.includes(`_${cleanInv}_`)) matches = true;
//                         else if (prefix && file.includes(prefix)) matches = true;

//                         if (matches) {
//                             const fullPath = path.join(targetDir, file);
//                             try {
//                                 if (fs.statSync(fullPath).isFile()) {
//                                     fs.unlinkSync(fullPath);
//                                     console.log('Deleted existing file:', fullPath);
//                                 }
//                             } catch (delErr) {
//                                 console.error('Failed to delete existing file:', fullPath, delErr);
//                             }
//                         }
//                     }
//                 } catch (dirErr) {
//                     console.error('Failed to read directory in deleteExistingFiles:', targetDir, dirErr);
//                 }
//             }
//         }
//     } catch (err) {
//         console.error('Error in deleteExistingFiles:', err);
//     }
// };

// const saveDocuments = async (container, map, opts) => {
//     if (!container || typeof container !== 'object' || !map) return;

//     const { refNo, invNo, mode, screen } = opts || {};
//     const processedFields = new Set();

//     for (const docKey of Object.keys(map)) {
//         const cfg = map[docKey] || {};
//         const value = container[docKey];

//         if (typeof value !== 'string' || !value.startsWith('data:')) continue;

//         if (cfg.field && processedFields.has(cfg.field)) {
//             container[docKey] = '';
//             continue;
//         }

//         const altDocKey = docKey.startsWith('Z') ? docKey.slice(1) : `Z${docKey}`;
//         const docName =
//             container[`${docKey}_NAME`] ||
//             container[`${altDocKey}_NAME`] ||
//             container[`${cfg.field}_NAME`] ||
//             cfg.field ||
//             docKey;

//         const savedPath = await saveImageFile(
//             value, refNo, invNo, docName, mode, screen, cfg.field
//         );

//         if (cfg.field) processedFields.add(cfg.field);

//         if (cfg.pathKey) container[cfg.pathKey] = savedPath;
//         container[docKey] = '';
//         if (`${docKey}_NAME` in container) container[`${docKey}_NAME`] = '';
//         if (`${altDocKey}_NAME` in container) container[`${altDocKey}_NAME`] = '';
//     }
// };

// const updateDocuments = async (container, map, opts) => {
//     if (!container || typeof container !== 'object' || !map) return;

//     const { refNo, invNo, mode, screen } = opts || {};
//     const processedFields = new Set();

//     for (const docKey of Object.keys(map)) {
//         const cfg = map[docKey] || {};
//         const value = container[docKey];

//         if (typeof value !== 'string' || !value.startsWith('data:')) continue;

//         if (cfg.field && processedFields.has(cfg.field)) {
//             container[docKey] = '';
//             continue;
//         }

//         deleteExistingFiles({
//             refNo,
//             invNo,
//             mode,
//             screen,
//             field: cfg.field,
//         });

//         const altDocKey = docKey.startsWith('Z') ? docKey.slice(1) : `Z${docKey}`;
//         const docName =
//             container[`${docKey}_NAME`] ||
//             container[`${altDocKey}_NAME`] ||
//             container[`${cfg.field}_NAME`] ||
//             cfg.field ||
//             docKey;

//         const savedPath = await saveImageFile(
//             value, refNo, invNo, docName, mode, screen, cfg.field
//         );

//         if (cfg.field) processedFields.add(cfg.field);

//         if (cfg.pathKey) container[cfg.pathKey] = savedPath;
//         container[docKey] = '';
//         if (`${docKey}_NAME` in container) container[`${docKey}_NAME`] = '';
//         if (`${altDocKey}_NAME` in container) container[`${altDocKey}_NAME`] = '';
//     }
// };

// const GLOBAL_SCREEN_FOLDERS = {
//     'TRANSIT INFO': 'Transit_Info',
//     'INSURANCE CLAIM STATUS': 'Insurance_Claim',
//     'TRANSIT DAMAGE INFO': 'Transit_Damage_Info',
//     'FREIGHT BILLING': 'Freight_Billing',
// };

// /**
//  * List the documents already stored on disk for ONE record.
//  */
// const listDocuments = ({ refNo, invNo, mode, screen } = {}) => {
//     try {
//         const modeFolder =
//             MODE_FOLDERS[String(mode == null ? '' : mode).trim().toLowerCase()] || 'SAP';
//         const screenFolder =
//             GLOBAL_SCREEN_FOLDERS[String(screen == null ? '' : screen).trim().toUpperCase()] ||
//             clean(screen, 'Transit_Info');

//         const screenDir = path.join(BASE_UPLOAD_PATH, modeFolder, screenFolder);
//         if (!fs.existsSync(screenDir)) return {};

//         const cleanRef = clean(refNo, '');
//         const cleanInv = clean(invNo, '');
//         const prefix = cleanRef && cleanInv ? `${cleanRef}_${cleanInv}_` : '';
//         const found = {};

//         for (const fieldFolder of fs.readdirSync(screenDir)) {
//             const fieldDir = path.join(screenDir, fieldFolder);
//             let isDir = false;
//             try { isDir = fs.statSync(fieldDir).isDirectory(); } catch (_e) { /* ignore */ }
//             if (!isDir) continue;

//             const dirFiles = fs.readdirSync(fieldDir);
//             let matches = [];

//             if (prefix) {
//                 matches = dirFiles.filter((name) => name.startsWith(prefix));
//             }
//             if (!matches.length && cleanInv) {
//                 matches = dirFiles.filter((name) => name.includes(`_${cleanInv}_`));
//             }
//             if (!matches.length && cleanRef) {
//                 matches = dirFiles.filter((name) => name.startsWith(`${cleanRef}_`));
//             }

//             if (matches.length) found[fieldFolder] = matches[0];
//         }
//         return found;
//     } catch (_e) {
//         return {};
//     }
// };

// /**
//  * Walk the HEADER / ITEMS rows of a search response and attach on each row:
//  *     row.ZLOCALFILES = { "<FieldFolder>": "<fileName>", ... }
//  *     row.ZLOCALFILE_URLS = { "<FieldFolder>": "pravah-files/...", ... }
//  */
// const attachLocalFileNames = (data, { mode, screen } = {}) => {
//     try {
//         if (!data || typeof data !== 'object') return data;

//         const headerRows = Array.isArray(data.HEADER) ? data.HEADER : [];
//         const itemRows = Array.isArray(data.ITEMS) ? data.ITEMS : [];
//         const rows = [].concat(headerRows).concat(itemRows);

//         const defaultRef = headerRows[0]?.ZREFNO || headerRows[0]?.REFNO || headerRows[0]?.REF_NO ||
//                            itemRows[0]?.ZREFNO || itemRows[0]?.REFNO || itemRows[0]?.REF_NO;
//         const defaultInv = headerRows[0]?.ZINV_NO || headerRows[0]?.INV_NO || headerRows[0]?.INVNO ||
//                            itemRows[0]?.ZINV_NO || itemRows[0]?.INV_NO || itemRows[0]?.INVNO;

//         const modeFolder =
//             MODE_FOLDERS[String(mode == null ? '' : mode).trim().toLowerCase()] || 'SAP';
//         const screenFolder =
//             GLOBAL_SCREEN_FOLDERS[String(screen == null ? '' : screen).trim().toUpperCase()] ||
//             clean(screen, 'Transit_Info');

//         for (const row of rows) {
//             if (!row || typeof row !== 'object') continue;
//             const refNo = row.ZREFNO || row.REFNO || row.REF_NO || defaultRef;
//             const invNo = row.ZINV_NO || row.INV_NO || row.INVNO || defaultInv;

//             const docs = listDocuments({
//                 refNo,
//                 invNo,
//                 mode,
//                 screen,
//             });
//             row.ZLOCALFILES = docs;

//             const urls = {};
//             for (const [fieldKey, fName] of Object.entries(docs)) {
//                 if (fName) {
//                     const singleFile = fName.split(',')[0].trim();
//                     urls[fieldKey] = `pravah-files/${modeFolder}/${screenFolder}/${fieldKey}/${encodeURIComponent(singleFile)}`;
//                 }
//             }
//             row.ZLOCALFILE_URLS = urls;
//         }
//     } catch (_e) {
//         /* never break the response over a file-name lookup */
//     }
//     return data;
// };

// module.exports = {
//     BASE_UPLOAD_PATH,
//     saveImageFile,
//     saveBase64File: saveImageFile,
//     saveDocuments,
//     updateDocuments,
//     listDocuments,
//     attachLocalFileNames,
//     deleteExistingFiles,
// };
