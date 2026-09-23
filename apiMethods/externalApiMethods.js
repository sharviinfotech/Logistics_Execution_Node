const { getpdb, OrderInfoNonSap, custgroup } = require("../handlers/externalApiHandler");
const { OrderConfirmationZcolln } = require("./PrExternalApiMethods");
const config = require("../config/apiConfig");
const nodemailer = require('nodemailer');
const fileService = require('../StoreUplodedFileInTheLocation/fileService');

module.exports = (() => {
  const transporter = nodemailer.createTransport({
    host: "smtp.logix.in",
    port: 587,
    secure: false, // Use TLS
    requireTLS: true,
    auth: {
      user: "noreply.itapps@hbl.in",
      pass: "Acc@ptMe#6547",
    },
    tls: {
      rejectUnauthorized: false, // Ignore self-signed certificate errors
    },
  });

  const axios = require("axios");
  const https = require('https');

  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  // Override axios default config
  axios.defaults.httpsAgent = agent;

  module.exports = axios;

  const handleAxiosError = (error, functionName) => {
    console.error(`Error in ${functionName}:`, error.message);

    // Log detailed error information if available
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Request made but no response received:", error.request);
    } else {
      console.error("Error details:", error.message);
    }

    // Return an error object to send a consistent response
    return { error: `Error processing your request in ${functionName}` };
  };

  const getAuthHeader = () => {
    if (!config.THIRD_PARTY_USERNAME || !config.THIRD_PARTY_PASSWORD) {
      throw new Error("Third-party API credentials are missing");
    }

    const credentials = `${config.THIRD_PARTY_USERNAME}:${config.THIRD_PARTY_PASSWORD}`;
    const token = Buffer.from(credentials).toString("base64");
    return `Basic ${token}`;
  };
  const getAuthHeader2 = () => {
    if (!config.THIRD_PARTY_USERNAME2 || !config.THIRD_PARTY_PASSWORD2) {
      throw new Error("Third-party API credentials are missing");
    }

    const credentials = `${config.THIRD_PARTY_USERNAME2}:${config.THIRD_PARTY_PASSWORD2}`;
    const token = Buffer.from(credentials).toString("base64");
    return `Basic ${token}`;
  };

  // Helper to perform POST with a simple retry on network errors/timeouts
  const postWithRetry = async (url, body, options = {}, retries = 1) => {
    try {
      return await axios.post(url, body, options);
    } catch (err) {
      const isNetworkError = err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || (err.request && !err.response);
      if (retries > 0 && isNetworkError) {
        console.warn(`Network error when posting to ${url} - retrying (${retries} left)`);
        return postWithRetry(url, body, options, retries - 1);
      }
      throw err;
    }
  };

  // Transit Info multi-invoice save: the request body is an array,
  //   [ { HEAD: {...}, ITEM: [...] }, { HEAD: {...}, ITEM: [...] }, ... ]
  // one entry per invoice. Before the body is forwarded to SAP unchanged, store each
  // invoice's POD file (named <refNo>_<invNo>_<doc>) and put the saved path in that
  // entry's ZPATH.
  const transitSaveArrayFiles = async (entries, mode) => {
    for (const entry of entries) {
      const head = entry && entry.HEAD;
      if (head && head.ZPOD_FNAME) {
        const savedFilePath = await fileService.saveImageFile(
          head.ZPOD_FNAME,
          head.REFNO,
          head.INV_NO,
          head.ZPOD_DOCNAME,
          mode,
          "Transit_Info",
          "POD"
        );
        head.ZPATH = savedFilePath;
        head.ZPOD_FNAME = '';
      }
    }
  };

  // Transit Info change (edit): the request body is an array of the usual change record,
  //   [ { REFNO, INV_NO, ZPOD_FNAME, ZPOD_DOCNAME, ZPATH, HEADER: {...}, ITEM: [...] }, ... ]
  // For each entry that carries a newly chosen POD file, replace the stored file the same
  // way the single-record change does, and put the saved path in ZPATH (entry + HEADER).
  // Freight Billing multi-invoice save: SAVE / CREATE can hold one record per invoice.
  // The existing handlers store the documents of the FIRST record only; this stores the
  // documents of every remaining record (same field map, named <refNo>_<invNo>_<doc>).
  const freightSaveExtraRecordFiles = async (records, mode) => {
    if (!Array.isArray(records)) return;
    for (const rec of records.slice(1)) {
      await fileService.saveDocuments(
        rec || {},
        {
          FRBILLUP: { field: "Freight_Bill", pathKey: "ZFRB_PATH" },
          UNLOADAPP: { field: "Unloading_Charges_Approval", pathKey: "ZUNAPP_PATH" },
          DETENTUP: { field: "Detention_Charges", pathKey: "ZDUP_PATH" },
          WORDUP: { field: "Work_Order", pathKey: "ZWORDUP_PATH" },
        },
        { refNo: rec && rec.REFNO, invNo: rec && rec.INV_NO, mode, screen: "Freight_Billing" }
      );
    }
  };

  const transitChangeArrayFiles = async (entries, mode) => {
    for (const entry of entries) {
      if (!entry) continue;
      const podData = entry.ZPOD_FNAME || (entry.HEADER && entry.HEADER.ZPOD_FNAME);
      const refNo = (entry.HEADER && entry.HEADER.ZREFNO) || entry.REFNO || entry.REF_NO;
      const invNo = (entry.HEADER && entry.HEADER.ZINV_NO) || entry.INV_NO || entry.INVNO;
      const docName = entry.ZPOD_DOCNAME || (entry.HEADER && entry.HEADER.ZPOD_DOCNAME) || "POD";

      if (podData && typeof podData === "string" && podData.startsWith("data:")) {
        fileService.deleteExistingFiles({
          refNo,
          invNo,
          mode,
          screen: "Transit_Info",
          field: "POD",
        });

        const savedFilePath = await fileService.saveImageFile(
          podData,
          refNo,
          invNo,
          docName,
          mode,
          "Transit_Info",
          "POD"
        );

        entry.ZPATH = savedFilePath;
        entry.ZPOD_FNAME = '';
        if (entry.HEADER) {
          entry.HEADER.ZPATH = savedFilePath;
          entry.HEADER.ZPOD_FNAME = '';
        }
      }
    }
  };

  // The Dispatch Filter Creation SAP endpoint sometimes sends its array double-encoded as a
  // JSON string (e.g. "[{\"ZREFNO\":...}]") instead of a real array, and some records in it
  // have a field with no value at all (e.g. "ZNO_TRUCKS":,"ZNO_LRS":1 — nothing between the
  // colon and the comma), which is invalid JSON on its own. Repair and parse that so the
  // response this API sends back to the browser is a clean, valid array instead of the raw
  // string SAP returned.
  const repairDispatchFilterResponse = (data) => {
    if (typeof data !== 'string') return data;
    const tryParse = (text) => {
      try {
        return { ok: true, value: JSON.parse(text) };
      } catch (e) {
        return { ok: false };
      }
    };
    const direct = tryParse(data);
    if (direct.ok) return direct.value;
    const repaired = data.replace(/"([A-Za-z0-9_]+)":(\s*)([,}])/g, '"$1":null$3');
    const afterRepair = tryParse(repaired);
    return afterRepair.ok ? afterRepair.value : data;
  };

  return {
    Login: async (body, res) => {
      try {
        console.log(
          "Sending POST payload to LOgin API:",
          JSON.stringify(body, null, 2)
        );
        console.log(config.THIRD_PARTY_API_URL_POST_LOGIN);
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LOGIN,
          body,
          {
            headers: {
              Authorization: getAuthHeader2(),
            },
          }
        );

        res.json(response.data);
      } catch (error) {
        if (error.response) {
          console.error("Error Response Status:", error.response.status);
          console.error("Error Response Data:", error.response.data);
          console.error("Error Response Headers:", error.response.headers);
        } else {
          console.error("Error Message:", error.message);
        }

        const errorResponse = handleAxiosError(error, "Login");
        res.status(500).json(errorResponse);
      }
    },
    getLotReports: async (body, res) => {
      try {
        console.log(
          "Sending PUT payload to getLotReports API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_GET_LOT_REPORTS,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );
        console.log(
          "PUT Response from getLotReports API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "getLotReports");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    updateResultRecording: async (body, res) => {
      try {
        console.log(
          "Sending POST payload to updateResultRecording API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_UPDATE_RESULT_RECORDING,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );
        console.log(
          "POST Response from updateResultRecording API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "updateResultRecording");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    UDsubmitResult: async (body, res) => {
      try {
        console.log(
          "Sending POST payload to UDsubmitResult API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_UDSUBMIT_RESULT,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );

        console.log(
          "POST Response from UDsubmitResult API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "UDsubmitResult");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    reportZQAR: async (body, res) => {
      try {
        console.log(
          "Sending POST payload to reportZQAR API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_REPORT_ZQAR,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );

        console.log(
          "POST Response from reportZQAR API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "reportZQAR");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    reportZQA32: async (body, res) => {
      try {
        console.log(
          "Sending POST payload to reportZQA32 API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_REPORT_ZQA32,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );

        console.log(
          "POST Response from reportZQA32 API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "reportZQA32");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    ZPRDID: async (body, res) => {
      try {
        console.log(
          "Sending POST payload to ZPRDID API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_ZPRDID,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );

        console.log(
          "POST Response from ZPRDID API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "ZPRDID");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    typeTest: async (body, res) => {
      try {
        console.log(
          "Sending POST payload to typeTest API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_TYPE_TEST,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );

        console.log(
          "POST Response from typeTest API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "typeTest");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    Coois: async (body, res) => {
      try {
        console.log(
          "Sending POST payload to Coois API:",
          JSON.stringify(body, null, 2)
        );
        const agent = new https.Agent({ rejectUnauthorized: false }); // <-- Add this line
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_COOIS_Order_Confirmation,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
            httpsAgent: agent,
          }
        );
        console.log(
          "POST Response from Coois API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Coois");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    Co11: async (body, res) => {
      try {
        console.log(
          "Sending POST payload to Co11 API:",
          JSON.stringify(body, null, 2)
        );
        const agent = new https.Agent({ rejectUnauthorized: false }); // Add this line
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_CO11_Order_Confirmation_ZCO11N,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
            httpsAgent: agent, // Add this line
          }
        );
        console.log(
          "POST Response from Co11 API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Co11");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    OrderInfoInwardOutward: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );

        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_OrderInfo_Outward_sapfetch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "order info");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    OrderInfoOutwardSave: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_PUT_LE_OrderInfo_Outword_NonSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "order info save");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    OrderInfoNonSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_OrderInfo_Outword_NonSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "order info create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    getpdb: async (body, res) => {
      try {
        // console.log(
        //   "Sending GET payload to plant API:",
        //   JSON.stringify(body, null, 2)
        // );
        const response = await axios.get(config.THIRD_PARTY_API_URL_GET_LE_OrderInfo_plant_division_Biltype, {
          headers: {
            Authorization: getAuthHeader(),
          },

        });
        // console.log(
        //   "GET Response from plant API:",
        //   JSON.stringify(response.data, null, 2)
        // );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "plant");
        res.status(500).json({ error: "Failed to process GET request" });
      }
    },
    fetchzone: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_OrderInfo_getzone,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    custgroup: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_OrderInfo_custGroup,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    OrderInfoPhysicaldispatch: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_OrderInfo_Physicaldispatch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "order info create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    OrderInfoPlantBasedDivison: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_OrderInfo_PlantBasedDivison,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "order info create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    OrderInfoDeleteWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_OrderInfo_Outward_DeleteWithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "order info save");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    OrderInfoDeleteWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_OrderInfo_DeleteWithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "order info create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },


    shipmentdetailsfetch: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_sapfetch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    ShipmentOutwardSave: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    getTypeofmaterial: async (body, res) => {
      try {
        // console.log(
        //   "Sending GET payload to plant API:",
        //   JSON.stringify(body, null, 2)
        // );
        const response = await axios.get(config.THIRD_PARTY_API_URL_GET_LE_ShipmentDetails_NonSap_typeofmaterial, {
          headers: {
            Authorization: getAuthHeader(),
          },

        });
        // console.log(
        //   "GET Response from plant API:",
        //   JSON.stringify(response.data, null, 2)
        // );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Typeofmaterial");
        res.status(500).json({ error: "Failed to process GET request" });
      }
    },
    Incoterms: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_ShipmentDetails_NonSap_Incoterms,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "F4 Incoterms");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    shipmentdetailsNonSapSave: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_NonSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    shipmentdetailsNonSapReports: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_NonSap_Reports,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    Shipmentchangewithsap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_Change,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    Shipmentchangewithoutsap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_ChangeWithouSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },

    ShipmentDeleteWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_ShipmentDeleteWithsap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment create");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    ShipmentDeleteWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_PUT_LE_ShipmentDetails_Outward_ShipmentDeleteWithoutsap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "F4 Incoterms");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },


    SegmentInfoOutwardFetch: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_sapfetch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from segment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    SegmentInfoOutwardwithoutSapFetch: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_WithoutSapfetch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from segment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    SegmentInfoOutwardSave: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from segment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "segment save");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    SegmentInfoNonSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outword_NonSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    getssc: async (body, res) => {
      try {
        // console.log(
        //   "Sending GET payload to plant API:",
        //   JSON.stringify(body, null, 2)
        // );
        const response = await axios.get(config.THIRD_PARTY_API_URL_GET_LE_SegmentInfo_supplier_segment_custgrp, {
          headers: {
            Authorization: getAuthHeader(),
          },

        });
        // console.log(
        //   "GET Response from plant API:",
        //   JSON.stringify(response.data, null, 2)
        // );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "plant");
        res.status(500).json({ error: "Failed to process GET request" });
      }
    },
    fetchTAT: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outward_WithSap_TAT_Type,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from TAT_Type create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "TAT_Type create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    fetchNonSapTAT: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outward_NonSap_TAT_Type,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from TAT_Type create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "TAT_Type create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    fetchzoneTat: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_getzone,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    SegmentInfoChangeWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_ChangeWithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from segment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "segment save");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    SegmentInfoChangeWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outword_ChangeWithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from segment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "segment save");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    SegmentInfoDeleteWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_DeleteWithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from segment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "segment save");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    SegmentInfoDeleteWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outword_DeleteWithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from segment save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "segment save");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    // TransitInfoSave: async (body, res) => {

    //   try {
    //     console.log(
    //       "Sending  Post payload to Pr Reject  API:",
    //       JSON.stringify(body, null, 2)
    //     );
    //     const response = await axios.post(
    //       config.THIRD_PARTY_API_URL_POST_LE_TransitInfo_WithSap_Save,
    //       body,
    //       {
    //         headers: {
    //           Authorization: getAuthHeader(),
    //         },

    //       }
    //     );
    //     console.log(
    //       "POST Response from TransitInfoSave fetch API:",
    //       JSON.stringify(response.data, null, 2)
    //     );
    //     res.json(response.data);
    //   } catch (error) {
    //     handleAxiosError(error, "PurchaseCreate");
    //     res.status(500).json({ error: "Failed to process POST request" });
    //   }
    // },

    TransitInfoSave: async (body, res) => {
      try {

        if (Array.isArray(body)) {
          await transitSaveArrayFiles(body, "SAP");
        }

        if (body.HEAD && body.HEAD.ZPOD_FNAME) {

          const savedFilePath = await fileService.saveImageFile(
            body.HEAD.ZPOD_FNAME,   // base64 file from the frontend
            body.HEAD.REFNO,        // reference number
            body.HEAD.INV_NO,       // invoice number
            body.HEAD.ZPOD_DOCNAME, // original document name
            "SAP",                  // mode  -> D:\Pravah\SAP\Transit_Info\POD
            "Transit_Info",
            "POD"
          );

          body.HEAD.ZPATH = savedFilePath;
          body.HEAD.ZPOD_FNAME = '';
        }

        console.log("Payload:", body);

        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_TransitInfo_WithSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );

        res.json(response.data);

      } catch (error) {
        console.log(error);
        res.status(500).json({
          error: "Failed to process POST request"
        });
      }
    },
    // TransitInfoNonSap: async (body, res) => {
    //   try {
    //     console.log(
    //       "Sending  Put payload to Pr Reject  API:",
    //       JSON.stringify(body, null, 2)
    //     );
    //     const response = await axios.put(
    //       config.THIRD_PARTY_API_URL_PUT_LE_TransitInfo_NonSap,
    //       body,
    //       {
    //         headers: {
    //           Authorization: getAuthHeader(),
    //         },

    //       }
    //     );
    //     console.log(
    //       "PUT Response from PurchaseCreate API:",
    //       JSON.stringify(response.data, null, 2)
    //     );
    //     res.json(response.data);
    //   } catch (error) {
    //     handleAxiosError(error, "Data Saved");
    //     res.status(500).json({ error: "Failed to process PUT request" });
    //   }
    // },

    TransitInfoNonSap: async (body, res) => {
      try {
        if (Array.isArray(body)) {
          await transitSaveArrayFiles(body, "Without Sap");
        }
        console.log("=== TRANSIT INFO NON SAP ===");

        const podBase64 = body.HEAD?.ZPOD_FNAME;
        const refNo = body.HEAD?.REFNO;
        const invNo = body.HEAD?.INV_NO;
        const docName = body.HEAD?.ZPOD_DOCNAME;

        console.log("ZPOD_FNAME present:", !!podBase64);
        console.log("REFNO:", refNo);
        console.log("INV_NO:", invNo);
        console.log("Document Name:", docName);

        if (podBase64) {
          const savedFilePath = await fileService.saveImageFile(
            podBase64, refNo, invNo, docName,
            "Without Sap",          // mode  -> D:\Pravah\Without Sap\Transit_Info\POD
            "Transit_Info",
            "POD"
          );
          console.log("File saved at:", savedFilePath);

          body.HEAD.ZPOD_FNAME = '';
          body.HEAD.ZPATH = savedFilePath;
        }

        // ✅ Add Authorization header — same as TransitInfoSave
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_TransitInfo_NonSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),  // ✅ same as SAP save
            },
          }
        );

        console.log("SAP Response:", response.data);
        res.json(response.data);

      } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    TransitInfoDeleteWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_TransitInfo_WithSap_Delete,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from TransitInfoSave fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        const delItem = (body.DELETE && body.DELETE[0]) || (body.HEADER && body.HEADER[0]) || body.HEADER || body;
        const refNo = delItem?.ZREFNO || delItem?.REFNO || delItem?.REF_NO || body?.REFNO;
        const invNo = delItem?.ZINV_NO || delItem?.INV_NO || delItem?.INVNO || body?.INV_NO;
        if (refNo && invNo) {
          const isSuccess = response.data?.STATUS === true || String(response.data?.STATUS ?? '').toUpperCase() === 'TRUE' || String(response.data?.NUMBER ?? '') === '200' || String(response.data?.STATUS ?? '').toUpperCase() === 'S';
          if (isSuccess) {
            fileService.deleteExistingFiles({ refNo, invNo, mode: 'SAP', screen: 'Transit_Info' });
          }
        }
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    TransitInfoDeleteWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_TransitInfo_WithoutSap_Delete,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from TransitInfoSave fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        const delItem = (body.DELETE && body.DELETE[0]) || (body.HEADER && body.HEADER[0]) || body.HEADER || body;
        const refNo = delItem?.ZREFNO || delItem?.REFNO || delItem?.REF_NO || body?.REFNO;
        const invNo = delItem?.ZINV_NO || delItem?.INV_NO || delItem?.INVNO || body?.INV_NO;
        if (refNo && invNo) {
          const isSuccess = response.data?.STATUS === true || String(response.data?.STATUS ?? '').toUpperCase() === 'TRUE' || String(response.data?.NUMBER ?? '') === '200' || String(response.data?.STATUS ?? '').toUpperCase() === 'S';
          if (isSuccess) {
            fileService.deleteExistingFiles({ refNo, invNo, mode: 'Without Sap', screen: 'Transit_Info' });
          }
        }
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "To Delete Without Sap");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    TransitInfoChangeWithSap: async (body, res) => {
      try {
        if (Array.isArray(body)) {
          await transitChangeArrayFiles(body, "SAP");
        }
        const podData = body.ZPOD_FNAME || (body.HEADER && body.HEADER.ZPOD_FNAME);
        const refNo = body.HEADER?.ZREFNO || body.REFNO || body.REF_NO;
        const invNo = body.HEADER?.ZINV_NO || body.INV_NO || body.INVNO;
        const docName = body.ZPOD_DOCNAME || (body.HEADER && body.HEADER.ZPOD_DOCNAME) || "POD";

        if (podData && typeof podData === "string" && podData.startsWith("data:")) {
          fileService.deleteExistingFiles({
            refNo,
            invNo,
            mode: "SAP",
            screen: "Transit_Info",
            field: "POD",
          });

          const savedFilePath = await fileService.saveImageFile(
            podData,
            refNo,
            invNo,
            docName,
            "SAP",
            "Transit_Info",
            "POD"
          );

          body.ZPATH = savedFilePath;
          body.ZPOD_FNAME = '';
          if (body.HEADER) {
            body.HEADER.ZPATH = savedFilePath;
            body.HEADER.ZPOD_FNAME = '';
          }
        }

        console.log(
          "Sending Post payload to TransitInfoChangeWithSap API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Outward_TransitInfo_WithSap_Change,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );
        console.log(
          "POST Response from TransitInfoChangeWithSap API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "TransitInfoChangeWithSap");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    TransitInfoChangeWithoutSap: async (body, res) => {
      try {
        if (Array.isArray(body)) {
          await transitChangeArrayFiles(body, "Without Sap");
        }
        const podData = body.ZPOD_FNAME || (body.HEADER && body.HEADER.ZPOD_FNAME);
        const refNo = body.HEADER?.ZREFNO || body.REFNO || body.REF_NO;
        const invNo = body.HEADER?.ZINV_NO || body.INV_NO || body.INVNO;
        const docName = body.ZPOD_DOCNAME || (body.HEADER && body.HEADER.ZPOD_DOCNAME) || "POD";

        if (podData && typeof podData === "string" && podData.startsWith("data:")) {
          fileService.deleteExistingFiles({
            refNo,
            invNo,
            mode: "Without Sap",
            screen: "Transit_Info",
            field: "POD",
          });

          const savedFilePath = await fileService.saveImageFile(
            podData,
            refNo,
            invNo,
            docName,
            "Without Sap",
            "Transit_Info",
            "POD"
          );

          body.ZPATH = savedFilePath;
          body.ZPOD_FNAME = '';
          if (body.HEADER) {
            body.HEADER.ZPATH = savedFilePath;
            body.HEADER.ZPOD_FNAME = '';
          }
        }

        console.log(
          "Sending Put payload to TransitInfoChangeWithoutSap API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Outward_TransitInfo_WithOutSap_Change,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );
        console.log(
          "PUT Response from TransitInfoChangeWithoutSap API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "TransitInfoChangeWithoutSap");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },

    FreightBillingSave: async (body, res) => {
      try {
        const _fbRec = (body.SAVE && body.SAVE[0]) || {};
        await fileService.saveDocuments(
          _fbRec,
          {
            FRBILLUP: { field: "Freight_Bill", pathKey: "ZFRB_PATH" },
            UNLOADAPP: { field: "Unloading_Charges_Approval", pathKey: "ZUNAPP_PATH" },
            DETENTUP: { field: "Detention_Charges", pathKey: "ZDUP_PATH" },
            WORDUP: { field: "Work_Order", pathKey: "ZWORDUP_PATH" },
          },
          { refNo: _fbRec.REFNO, invNo: _fbRec.INV_NO, mode: "SAP", screen: "Freight_Billing" }
        );
        await freightSaveExtraRecordFiles(body.SAVE, "SAP");
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_FreightBilling_WithSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from TransitInfoSave fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    FreightBillingNonSap: async (body, res) => {
      try {
        const _fbRec = (body.CREATE && body.CREATE[0]) || {};
        await fileService.saveDocuments(
          _fbRec,
          {
            FRBILLUP: { field: "Freight_Bill", pathKey: "ZFRB_PATH" },
            UNLOADAPP: { field: "Unloading_Charges_Approval", pathKey: "ZUNAPP_PATH" },
            DETENTUP: { field: "Detention_Charges", pathKey: "ZDUP_PATH" },
            WORDUP: { field: "Work_Order", pathKey: "ZWORDUP_PATH" },
          },
          { refNo: _fbRec.REFNO, invNo: _fbRec.INV_NO, mode: "Without Sap", screen: "Freight_Billing" }
        );
        await freightSaveExtraRecordFiles(body.CREATE, "Without Sap");
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_FreightBilling_NonSap_Create,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    FreightBillingChangeWithSap: async (body, res) => {
      try {
        const _fbRec = (body.CHANGE && body.CHANGE[0]) || (body.UPDATE && body.UPDATE[0]) || {};
        const _fbRefNo = _fbRec.ZREFNO || _fbRec.REFNO || body.REFNO;
        const _fbInvNo = _fbRec.ZINV_NO || _fbRec.INV_NO || body.INV_NO;
        await fileService.updateDocuments(
          _fbRec,
          {
            FRBILLUP: { field: "Freight_Bill", pathKey: "ZFRB_PATH" },
            ZFRBILLUP: { field: "Freight_Bill", pathKey: "ZFRB_PATH" },
            UNLOADAPP: { field: "Unloading_Charges_Approval", pathKey: "ZUNAPP_PATH" },
            ZUNLOADAPP: { field: "Unloading_Charges_Approval", pathKey: "ZUNAPP_PATH" },
            DETENTUP: { field: "Detention_Charges", pathKey: "ZDUP_PATH" },
            ZDETENTUP: { field: "Detention_Charges", pathKey: "ZDUP_PATH" },
            WORDUP: { field: "Work_Order", pathKey: "ZWORDUP_PATH" },
            ZWORDUP: { field: "Work_Order", pathKey: "ZWORDUP_PATH" },
          },
          { refNo: _fbRefNo, invNo: _fbInvNo, mode: "SAP", screen: "Freight_Billing" }
        );
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_FreightBilling_ChangeWithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from TransitInfoSave fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    FreightBillingChangeWithoutSap: async (body, res) => {
      try {
        const _fbRec = (body.CHANGE && body.CHANGE[0]) || (body.UPDATE && body.UPDATE[0]) || {};
        const _fbRefNo = _fbRec.ZREFNO || _fbRec.REFNO || body.REFNO;
        const _fbInvNo = _fbRec.ZINV_NO || _fbRec.INV_NO || body.INV_NO;
        await fileService.updateDocuments(
          _fbRec,
          {
            FRBILLUP: { field: "Freight_Bill", pathKey: "ZFRB_PATH" },
            ZFRBILLUP: { field: "Freight_Bill", pathKey: "ZFRB_PATH" },
            UNLOADAPP: { field: "Unloading_Charges_Approval", pathKey: "ZUNAPP_PATH" },
            ZUNLOADAPP: { field: "Unloading_Charges_Approval", pathKey: "ZUNAPP_PATH" },
            DETENTUP: { field: "Detention_Charges", pathKey: "ZDUP_PATH" },
            ZDETENTUP: { field: "Detention_Charges", pathKey: "ZDUP_PATH" },
            WORDUP: { field: "Work_Order", pathKey: "ZWORDUP_PATH" },
            ZWORDUP: { field: "Work_Order", pathKey: "ZWORDUP_PATH" },
          },
          { refNo: _fbRefNo, invNo: _fbInvNo, mode: "Without Sap", screen: "Freight_Billing" }
        );
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_FreightBilling_ChangeWithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    FreightBillingDeleteWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_FreightBilling_WithSap_Delete,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from TransitInfoSave fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        const deleteItems = Array.isArray(body.DELETE) ? body.DELETE : (body.DELETE ? [body.DELETE] : [body.HEADER || body]);
        const isSuccess = response.data?.STATUS === true || String(response.data?.STATUS ?? '').toUpperCase() === 'TRUE' || String(response.data?.NUMBER ?? '') === '200' || String(response.data?.STATUS ?? '').toUpperCase() === 'S' || String(response.data?.TYPE ?? '').toUpperCase() === 'S';
        if (isSuccess) {
          for (const item of deleteItems) {
            const refNo = item?.ZREFNO || item?.REFNO || item?.REF_NO || body?.REFNO || body?.ZREFNO;
            const invNo = item?.ZINV_NO || item?.INV_NO || item?.INVNO || item?.VBELN || body?.INV_NO || body?.ZINV_NO;
            if (refNo || invNo) {
              fileService.deleteExistingFiles({ refNo, invNo, mode: 'SAP', screen: 'Freight_Billing' });
            }
          }
        }
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    FreightBillingDeleteWithOutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_FreightBilling_NonSap_Delete,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        const deleteItems = Array.isArray(body.DELETE) ? body.DELETE : (body.DELETE ? [body.DELETE] : [body.HEADER || body]);
        const isSuccess = response.data?.STATUS === true || String(response.data?.STATUS ?? '').toUpperCase() === 'TRUE' || String(response.data?.NUMBER ?? '') === '200' || String(response.data?.STATUS ?? '').toUpperCase() === 'S' || String(response.data?.TYPE ?? '').toUpperCase() === 'S';
        if (isSuccess) {
          for (const item of deleteItems) {
            const refNo = item?.ZREFNO || item?.REFNO || item?.REF_NO || body?.REFNO || body?.ZREFNO;
            const invNo = item?.ZINV_NO || item?.INV_NO || item?.INVNO || item?.VBELN || body?.INV_NO || body?.ZINV_NO;
            if (refNo || invNo) {
              fileService.deleteExistingFiles({ refNo, invNo, mode: 'Without Sap', screen: 'Freight_Billing' });
            }
          }
        }
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    VehicleInfofetch: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Vehicleinfo_Outward_sapfetch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    VehicleInfosave: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Vehicleinfo_Outward_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    VehicleInfoNonSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Vehicleinfo_Outword_NonSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Data Saved");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    DCReferenceNo: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Vehicleinfo_Outword_NonSap_DCNO,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Data Saved");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    VehicleInfoMapid: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Vehicleinfo_Outward_Mapid,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    VehicleInfoMapidForNonsap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Vehicleinfo_Outward_Mapidfornonsap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Data Saved");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    VehicleInfoChangeWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Vehicleinfo_Outward_ChangeWithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    VehicleInfoChangeWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Vehicleinfo_Outword_ChangeWithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    VehicleInfoDeleteWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Vehicleinfo_Outward_DeleteWithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    VehicleInfoDeleteWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Vehicleinfo_Outword_DeleteWithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    Invoiceloaddetailsfetch: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_InvoiceloadDetails_Outward_sapfetch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    sapget: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_InvoiceloadDetails_Outward_sapget,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    InvoiceloaddetailsSave: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_InvoiceloadDetails_Outward_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    InvoiceloaddetailsNonSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_InvoiceloadDetails_Outword_NonSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },

    gettypeofvehicle: async (body, res) => {
      try {
        // console.log(
        //   "Sending GET payload to plant API:",
        //   JSON.stringify(body, null, 2)
        // );
        const response = await axios.get(config.THIRD_PARTY_API_URL_GET_LE_InvoiceloadDetails_typeofvehicle, {
          headers: {
            Authorization: getAuthHeader(),
          },

        });
        // console.log(
        //   "GET Response from plant API:",
        //   JSON.stringify(response.data, null, 2)
        // );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "plant");
        res.status(500).json({ error: "Failed to process GET request" });
      }
    },
    InvoiceloaddetailsDeleteWithsap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_InvoiceloadDetails_Outward_DeleteWithsap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "shipment fetch");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    InvoiceloaddetailsDeleteWithoutsap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_InvoiceloadDetails_Outward_DeleteWithoutsap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from shipment fetch API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Change Without Sap");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },


    InsuranceClaimTrackingfetch: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_InsuranceClaimTracking_Outward_fetchinvoicelist,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Insurance Claim");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    InsuranceClaimTrackingSave: async (body, res) => {
      try {
        await fileService.saveDocuments(
          body.HEADER,
          {
            ZSUPT_DOC: { field: "Supporting_Document", pathKey: "ZSUPT_PATH" },
            ZAPP_DOC: { field: "Approve_Document", pathKey: "ZAPP_PATH" },
          },
          { refNo: body.HEADER && body.HEADER.REFNO, invNo: body.HEADER && body.HEADER.INV_NO, mode: "SAP", screen: "Insurance_Claim" }
        );
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_InsuranceClaimTracking_Outward_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Insurance Claim");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    fetchinvoicelistnonsap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_InsuranceClaimTracking_Outword_fetchinvoicelistnonsap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Data Saved");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    Nonsapsave: async (body, res) => {
      try {
        await fileService.saveDocuments(
          body.HEADER,
          {
            ZSUPT_DOC: { field: "Supporting_Document", pathKey: "ZSUPT_PATH" },
            ZAPP_DOC: { field: "Approve_Document", pathKey: "ZAPP_PATH" },
          },
          { refNo: body.HEADER && body.HEADER.REFNO, invNo: body.HEADER && body.HEADER.INV_NO, mode: "Without Sap", screen: "Insurance_Claim" }
        );
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_InsuranceClaimTracking_Outword_Nonsapsave,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Data Saved");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },

    InsuranceClaimTrackingDeleteWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_InsuranceClaimTracking_Outward_DeleteWithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        const delItem = (body.DELETE && body.DELETE[0]) || (body.HEADER && body.HEADER[0]) || body.HEADER || body;
        const refNo = delItem?.ZREFNO || delItem?.REFNO || delItem?.REF_NO || body?.REFNO;
        const invNo = delItem?.ZINV_NO || delItem?.INV_NO || delItem?.INVNO || body?.INV_NO;
        if (refNo && invNo) {
          const isSuccess = response.data?.STATUS === true || String(response.data?.STATUS ?? '').toUpperCase() === 'TRUE' || String(response.data?.NUMBER ?? '') === '200' || String(response.data?.STATUS ?? '').toUpperCase() === 'S';
          if (isSuccess) {
            fileService.deleteExistingFiles({ refNo, invNo, mode: 'SAP', screen: 'Insurance_Claim' });
          }
        }
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Insurance Claim");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    InsuranceClaimTrackingDeleteWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_InsuranceClaimTracking_Outword_DeleteWithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        const delItem = (body.DELETE && body.DELETE[0]) || (body.HEADER && body.HEADER[0]) || body.HEADER || body;
        const refNo = delItem?.ZREFNO || delItem?.REFNO || delItem?.REF_NO || body?.REFNO;
        const invNo = delItem?.ZINV_NO || delItem?.INV_NO || delItem?.INVNO || body?.INV_NO;
        if (refNo && invNo) {
          const isSuccess = response.data?.STATUS === true || String(response.data?.STATUS ?? '').toUpperCase() === 'TRUE' || String(response.data?.NUMBER ?? '') === '200' || String(response.data?.STATUS ?? '').toUpperCase() === 'S';
          if (isSuccess) {
            fileService.deleteExistingFiles({ refNo, invNo, mode: 'Without Sap', screen: 'Insurance_Claim' });
          }
        }
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Data Saved");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    InsuranceClaimTrackingChangeWithSap: async (body, res) => {
      try {
        const _icHead = body.HEAD || body.HEADER || body;
        const _icRefNo = _icHead.ZREFNO || _icHead.REFNO || body.REFNO || _icHead.REF_NO || body.REF_NO;
        const _icInvNo = _icHead.ZINV_NO || _icHead.INV_NO || body.INV_NO || _icHead.INVNO || body.INVNO;
        const _icMap = {
          ZSUPT_DOC: { field: "Supporting_Document", pathKey: "ZSUPT_PATH" },
          ZAPP_DOC: { field: "Approve_Document", pathKey: "ZAPP_PATH" },
        };
        for (const k of Object.keys(_icMap)) {
          if (body[k] && typeof body[k] === "string" && body[k].startsWith("data:")) {
            _icHead[k] = body[k];
          }
          if (body[`${k}_NAME`]) {
            _icHead[`${k}_NAME`] = body[`${k}_NAME`];
          }
        }
        await fileService.updateDocuments(
          _icHead,
          _icMap,
          { refNo: _icRefNo, invNo: _icInvNo, mode: "SAP", screen: "Insurance_Claim" }
        );
        for (const [k, cfg] of Object.entries(_icMap)) {
          if (_icHead[cfg.pathKey]) {
            body[cfg.pathKey] = _icHead[cfg.pathKey];
            if (body.HEAD) body.HEAD[cfg.pathKey] = _icHead[cfg.pathKey];
            if (body.HEADER) body.HEADER[cfg.pathKey] = _icHead[cfg.pathKey];
          }
          if (body[k] && typeof body[k] === "string" && body[k].startsWith("data:")) {
            body[k] = "";
          }
          if (body[`${k}_NAME`]) {
            body[`${k}_NAME`] = "";
          }
        }
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_InsuranceClaimTracking_Outward_Change_WithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Insurance Claim");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    InsuranceClaimTrackingChangeWithoutSap: async (body, res) => {
      try {
        const _icHead = body.HEAD || body.HEADER || body;
        const _icRefNo = _icHead.ZREFNO || _icHead.REFNO || body.REFNO || _icHead.REF_NO || body.REF_NO;
        const _icInvNo = _icHead.ZINV_NO || _icHead.INV_NO || body.INV_NO || _icHead.INVNO || body.INVNO;
        const _icMap = {
          ZSUPT_DOC: { field: "Supporting_Document", pathKey: "ZSUPT_PATH" },
          ZAPP_DOC: { field: "Approve_Document", pathKey: "ZAPP_PATH" },
        };
        for (const k of Object.keys(_icMap)) {
          if (body[k] && typeof body[k] === "string" && body[k].startsWith("data:")) {
            _icHead[k] = body[k];
          }
          if (body[`${k}_NAME`]) {
            _icHead[`${k}_NAME`] = body[`${k}_NAME`];
          }
        }
        await fileService.updateDocuments(
          _icHead,
          _icMap,
          { refNo: _icRefNo, invNo: _icInvNo, mode: "Without Sap", screen: "Insurance_Claim" }
        );
        for (const [k, cfg] of Object.entries(_icMap)) {
          if (_icHead[cfg.pathKey]) {
            body[cfg.pathKey] = _icHead[cfg.pathKey];
            if (body.HEAD) body.HEAD[cfg.pathKey] = _icHead[cfg.pathKey];
            if (body.HEADER) body.HEADER[cfg.pathKey] = _icHead[cfg.pathKey];
          }
          if (body[k] && typeof body[k] === "string" && body[k].startsWith("data:")) {
            body[k] = "";
          }
          if (body[`${k}_NAME`]) {
            body[`${k}_NAME`] = "";
          }
        }
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_InsuranceClaimTracking_Outward_Change_WithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Insurance Claim");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    TransitDamageInfofetch: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_TransitDamageInfo_Outward_fetchinvoicelist,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Insurance Claim");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    TransitDamageInfoSave: async (body, res) => {
      try {
        await fileService.saveDocuments(
          body.HEADER,
          {
            ZDIMAGES: { field: "Images", pathKey: "ZDIMG_PATH" },
            ZFSRREP: { field: "FSR_Report", pathKey: "ZFSRREP_PATH" },
            ZFIRREP: { field: "FIR_Report", pathKey: "ZFIRREP_PATH" },
            ZCOF: { field: "COF", pathKey: "ZCOF_PATH" },
          },
          { refNo: body.HEADER && body.HEADER.REFNO, invNo: body.HEADER && body.HEADER.INV_NO, mode: "SAP", screen: "Transit_Damage_Info" }
        );
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_TransitDamageInfo_Outward_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Insurance Claim");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    fetchinvoicelistnonsapwosp: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_TransitDamageInfo_Outword_fetchinvoicelistnonsap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Data Saved");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    withoutsapSave: async (body, res) => {
      try {
        await fileService.saveDocuments(
          body.HEADER,
          {
            ZDIMAGES: { field: "Images", pathKey: "ZDIMG_PATH" },
            ZFSRREP: { field: "FSR_Report", pathKey: "ZFSRREP_PATH" },
            ZFIRREP: { field: "FIR_Report", pathKey: "ZFIRREP_PATH" },
            ZCOF: { field: "COF", pathKey: "ZCOF_PATH" },
          },
          { refNo: body.HEADER && body.HEADER.REFNO, invNo: body.HEADER && body.HEADER.INV_NO, mode: "Without Sap", screen: "Transit_Damage_Info" }
        );
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_TransitDamageInfo_Outword_WithoutsapSave,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Data Saved");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    TransitDamageInfoDeleteWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_TransitDamageInfo_Outward_DeleteWithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        const delItem = (body.DELETE && body.DELETE[0]) || (body.HEADER && body.HEADER[0]) || body.HEADER || body;
        const refNo = delItem?.ZREFNO || delItem?.REFNO || delItem?.REF_NO || body?.REFNO;
        const invNo = delItem?.ZINV_NO || delItem?.INV_NO || delItem?.INVNO || body?.INV_NO;
        if (refNo && invNo) {
          const isSuccess = response.data?.STATUS === true || String(response.data?.STATUS ?? '').toUpperCase() === 'TRUE' || String(response.data?.NUMBER ?? '') === '200' || String(response.data?.STATUS ?? '').toUpperCase() === 'S';
          if (isSuccess) {
            fileService.deleteExistingFiles({ refNo, invNo, mode: 'SAP', screen: 'Transit_Damage_Info' });
          }
        }
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Insurance Claim");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    TransitDamageInfoDeleteWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_TransitDamageInfo_Outword_DeleteWithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        const delItem = (body.DELETE && body.DELETE[0]) || (body.HEADER && body.HEADER[0]) || body.HEADER || body;
        const refNo = delItem?.ZREFNO || delItem?.REFNO || delItem?.REF_NO || body?.REFNO;
        const invNo = delItem?.ZINV_NO || delItem?.INV_NO || delItem?.INVNO || body?.INV_NO;
        if (refNo && invNo) {
          const isSuccess = response.data?.STATUS === true || String(response.data?.STATUS ?? '').toUpperCase() === 'TRUE' || String(response.data?.NUMBER ?? '') === '200' || String(response.data?.STATUS ?? '').toUpperCase() === 'S';
          if (isSuccess) {
            fileService.deleteExistingFiles({ refNo, invNo, mode: 'Without Sap', screen: 'Transit_Damage_Info' });
          }
        }
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Data Saved");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },

    TransitDamageInfoChangeWithSap: async (body, res) => {
      try {
        const _tdHead = body.HEAD || body.HEADER || body;
        const _tdRefNo = _tdHead.ZREFNO || _tdHead.REFNO || body.REFNO || _tdHead.REF_NO || body.REF_NO;
        const _tdInvNo = _tdHead.ZINV_NO || _tdHead.INV_NO || body.INV_NO || _tdHead.INVNO || body.INVNO;
        const _tdMap = {
          ZDIMAGES: { field: "Images", pathKey: "ZDIMG_PATH" },
          ZFSRREP: { field: "FSR_Report", pathKey: "ZFSRREP_PATH" },
          ZFIRREP: { field: "FIR_Report", pathKey: "ZFIRREP_PATH" },
          ZCOF: { field: "COF", pathKey: "ZCOF_PATH" },
        };
        for (const k of Object.keys(_tdMap)) {
          if (body[k] && typeof body[k] === "string" && body[k].startsWith("data:")) {
            _tdHead[k] = body[k];
          }
          if (body[`${k}_NAME`]) {
            _tdHead[`${k}_NAME`] = body[`${k}_NAME`];
          }
        }
        await fileService.updateDocuments(
          _tdHead,
          _tdMap,
          { refNo: _tdRefNo, invNo: _tdInvNo, mode: "SAP", screen: "Transit_Damage_Info" }
        );
        for (const [k, cfg] of Object.entries(_tdMap)) {
          if (_tdHead[cfg.pathKey]) {
            body[cfg.pathKey] = _tdHead[cfg.pathKey];
            if (body.HEAD) body.HEAD[cfg.pathKey] = _tdHead[cfg.pathKey];
            if (body.HEADER) body.HEADER[cfg.pathKey] = _tdHead[cfg.pathKey];
          }
          if (body[k] && typeof body[k] === "string" && body[k].startsWith("data:")) {
            body[k] = "";
          }
          if (body[`${k}_NAME`]) {
            body[`${k}_NAME`] = "";
          }
        }
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_TransitDamageInfo_Outward_Change_WithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Change With Sap");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    TransitDamageInfoChangeWithoutSap: async (body, res) => {
      try {
        const _tdHead = body.HEAD || body.HEADER || body;
        const _tdRefNo = _tdHead.ZREFNO || _tdHead.REFNO || body.REFNO || _tdHead.REF_NO || body.REF_NO;
        const _tdInvNo = _tdHead.ZINV_NO || _tdHead.INV_NO || body.INV_NO || _tdHead.INVNO || body.INVNO;
        const _tdMap = {
          ZDIMAGES: { field: "Images", pathKey: "ZDIMG_PATH" },
          ZFSRREP: { field: "FSR_Report", pathKey: "ZFSRREP_PATH" },
          ZFIRREP: { field: "FIR_Report", pathKey: "ZFIRREP_PATH" },
          ZCOF: { field: "COF", pathKey: "ZCOF_PATH" },
        };
        for (const k of Object.keys(_tdMap)) {
          if (body[k] && typeof body[k] === "string" && body[k].startsWith("data:")) {
            _tdHead[k] = body[k];
          }
          if (body[`${k}_NAME`]) {
            _tdHead[`${k}_NAME`] = body[`${k}_NAME`];
          }
        }
        await fileService.updateDocuments(
          _tdHead,
          _tdMap,
          { refNo: _tdRefNo, invNo: _tdInvNo, mode: "Without Sap", screen: "Transit_Damage_Info" }
        );
        for (const [k, cfg] of Object.entries(_tdMap)) {
          if (_tdHead[cfg.pathKey]) {
            body[cfg.pathKey] = _tdHead[cfg.pathKey];
            if (body.HEAD) body.HEAD[cfg.pathKey] = _tdHead[cfg.pathKey];
            if (body.HEADER) body.HEADER[cfg.pathKey] = _tdHead[cfg.pathKey];
          }
          if (body[k] && typeof body[k] === "string" && body[k].startsWith("data:")) {
            body[k] = "";
          }
          if (body[`${k}_NAME`]) {
            body[`${k}_NAME`] = "";
          }
        }
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_TransitDamageInfo_Outward_Change_WithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Change Without Sap");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    DispatchWithSapSave: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Dispatch_Outward_WithSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Insurance Claim API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Insurance Claim");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    DispatchWithoutSapSave: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Dispatch_Outward_WithoutSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Data Saved");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    Dispatchf4_vendorCode: async (body, res) => {
      try {
        // console.log(
        //   "Sending GET payload to plant API:",
        //   JSON.stringify(body, null, 2)
        // );
        const response = await axios.get(config.THIRD_PARTY_API_URL_GET_LE_Dispatch_Outward_Fetch_VendorCode, {
          headers: {
            Authorization: getAuthHeader(),
          },

        });
        // console.log(
        //   "GET Response from plant API:",
        //   JSON.stringify(response.data, null, 2)
        // );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "VendorCode");
        res.status(500).json({ error: "Failed to process GET request" });
      }
    },
    DispatchReferenceNumber: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Dispatch_Outward_Fetch_ReferenceNumber,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Dispatch  API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Dispatch Reference Number");
        res.status(500).json({ error: "Failed to process Post request" });
      }
    },
    DispatchReferenceNumberWithoutsap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Dispatch_Outward_WithoutSap_Fetch_ReferenceNumber,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Dispatch  API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Dispatch Reference Number Without Sap");
        res.status(500).json({ error: "Failed to process Put request" });
      }
    },
    DispatchReferenceNumberEdit: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Dispatch_Outward_Edit_ReferenceNumber,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Dispatch  API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Dispatch Reference Number Edit");
        res.status(500).json({ error: "Failed to process Post request" });
      }
    },
    DispatchReferenceNumberDelete: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Dispatch_Outward_Delete_ReferenceNumber,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Dispatch  API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Dispatch With Sap Reference Number Delete");
        res.status(500).json({ error: "Failed to process Post request" });
      }
    },
    DispatchWithoutSapDelete: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Dispatch_Outward_WithoutSap_Delete_ReferenceNumber,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );
        console.log(
          "PUT Response from Dispatch  API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      }
      catch (error) {
        handleAxiosError(error, "Dispatch Without Sap Reference Number Delete");
        res.status(500).json({ error: "Failed to process Put request" });
      }
    },
    ReferenceNoFetch: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.ReferenceNoFetch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "order info create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    ReferenceNoFetch_Withoutsap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.ReferenceNoFetch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "order info create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    global_Fields_SearchOption: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.global_Fields_SearchOption,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        // Additive: attach the on-disk document file names for each record.
        res.json(fileService.attachLocalFileNames(response.data, { mode: "SAP", screen: body.global }));
      } catch (error) {
        handleAxiosError(error, "order info create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    global_Fields_SearchOption_WithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.global_Fields_SearchOption_WithoutSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        // Additive: attach the on-disk document file names for each record.
        res.json(fileService.attachLocalFileNames(response.data, { mode: "Without Sap", screen: body.global }));
      } catch (error) {
        handleAxiosError(error, "order info create");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    Filter_Creation: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Dispatch_Outward_Filter_Creation,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        const repairedFilterData = repairDispatchFilterResponse(response.data);
        console.log(
          "POST Response from order info create API:",
          JSON.stringify(repairedFilterData, null, 2)
        );
        res.json(repairedFilterData);
      } catch (error) {
        handleAxiosError(error, "Dispatch Filter Creation");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    Filter_Creation_NonSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Dispatch_Outward_Filter_Creation_NonSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        const repairedFilterData = repairDispatchFilterResponse(response.data);
        console.log(
          "PUT Response from Dispatch Filter Creation NonSap API:",
          JSON.stringify(repairedFilterData, null, 2)
        );
        res.json(repairedFilterData);
      } catch (error) {
        handleAxiosError(error, "Dispatch Filter Creation");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    OrderInfoFilterCreation: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_OrderInfo_Outward_Filter_Creation,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        // Additive: attach the on-disk document file names for each record.
        res.json(fileService.attachLocalFileNames(response.data, { mode: "SAP", screen: body.GLOBAL }));
      } catch (error) {
        handleAxiosError(error, "Order Info Filter Creation");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    GlobalFilterCreationNonSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Global_Outward_Filter_Creation_NonSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Global Filter Creation NonSap API:",
          JSON.stringify(response.data, null, 2)
        );
        // Additive: attach the on-disk document file names for each record.
        res.json(fileService.attachLocalFileNames(response.data, { mode: "Without Sap", screen: body.GLOBAL }));
      } catch (error) {
        handleAxiosError(error, "Global  NonSap Filter Creation");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    GlobalFileView: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_Global_FileView,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Global File View API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Global  NonSap Filter Creation");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    GlobalOutwardCountWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Global_Outward_CountWithSap,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Global Outward Count With Sap API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Global  Count Creation");
        res.status(500).json({ error: "Failed to process Post request" });
      }
    },

    GlobalUserAuth: async (body, res) => {
      try {
        console.log(
          "Sending Post payload to GlobalUserAuth API:",
          JSON.stringify(body, null, 2)
        );



        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_GlobalUserCreationLogin,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
            // ADD THIS
          }
        );

        console.log(
          "POST Response from GlobalUserAuth API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "User Creation Login");
        res.status(500).json({ error: "Failed to process Post request" });
      }
    },
    UserCreationDisplayTable: async (body, res) => {
      try {
        // console.log(
        //   "Sending GET payload to plant API:",
        //   JSON.stringify(body, null, 2)
        // );
        const response = await axios.get(config.THIRD_PARTY_API_URL_GET_LE_UserCreation_DisplayTable, {
          headers: {
            Authorization: getAuthHeader(),
          },

        });
        // console.log(
        //   "GET Response from plant API:",
        //   JSON.stringify(response.data, null, 2)
        // );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "VendorCode");
        res.status(500).json({ error: "Failed to process GET request" });
      }
    },

    UserCreationDelete: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_GlobalUserCreationDelete,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Global Outward Count With Sap API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "User Creation Login");
        res.status(500).json({ error: "Failed to process Post request" });
      }
    },
    // Configure email transporter

    sendCredentials: async (req, res) => {
      // Use req.body to see the payload: { ZMAIL: "..." }
      console.log('Incoming Payload:', req);

      try {


        // 1. Pass req.body (the JSON payload), NOT req (the whole request object)
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_ForgotDetails,
          req.body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );

        // 2. Since the response is an ARRAY [ { ZUSER: ... } ], access index 0
        const userData = Array.isArray(response.data) ? response.data[0] : response.data;

        console.log("Extracted User Data:", userData);

        if (!userData?.ZUSER || !userData?.ZPASSWORD) {
          return res.status(404).json({
            status: false,
            message: 'User credentials not found in external system',
          });
        }

        const { ZUSER, ZPASSWORD } = userData;
        const email = req.body.ZMAIL;

        const mailOptions = {
          from: 'noreply.itapps@hbl.in',
          to: email,
          subject: 'Your Login Credentials',
          html: `
        <p>Dear User,</p>
        <p>We are pleased to provide you with your login credentials:</p>
        <p><strong>Username:</strong> ${ZUSER}</p>  
        <p><strong>Password:</strong> ${ZPASSWORD}</p>  
        <p>For security reasons, please keep this information strictly confidential.</p>  
        <p>Best regards,<br>HBL Team</p>
      `,
        };

        // 3. Send the email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
          status: true,
          message: 'Email sent successfully with credentials!',
        });

      } catch (error) {
        console.error('Error sending credentials:', error.message);
        res.status(500).json({
          status: false,
          message: 'Failed to process request.',
          error: error.message,
        });
      }
    },

    FeedbackCreationwithsap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_ServiceLevel_Outword_WithSap_FeedbackCreation,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Order Info Filter Creation");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FeedbackCreationwithoutsap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_ServiceLevel_Outword_WithoutSap_FeedbackCreation,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Global Filter Creation NonSap API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Global  NonSap Filter Creation");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    FeedBackInvoiceDetailsfetchwithsap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_ServiceLevel_Outward_WithSap_FeedBackInvoiceDetailsfetch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Order Info Filter Creation");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FeedBackInvoiceDetailsfetchwithoutsap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_ServiceLevel_Outward_WithoutSap_FeedBackInvoiceDetailsfetch,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Global Filter Creation NonSap API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Global  NonSap Filter Creation");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },

    //Reports
    FetchTransitReport: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Reports_FetchTransitandReport,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from order info create API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Order Info Filter Creation");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },
    FetchPendingPods: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Reports_FetchPendingPods,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Fetch Pending Pods API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Fetch Pending Pods");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FetchLoadingFactorandCost: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Reports_FetchLoadingFactorandCost,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Fetch Loading Factor and Cost API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Fetch Loading Factor and Cost");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FetchFreightBills: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Reports_FetchFreightBills,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Fetch Pending Pods API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Fetch Pending Pods");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FetchBusinessShareMatrix: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Reports_FetchBusinessShareMatrix,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Fetch Pending Pods API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Fetch Pending Pods");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FetchDamageList: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Reports_FetchDamageList,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Fetch Damage List API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Fetch Damage List");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FetchInsuranceReportsDetails: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Reports_FetchInsuranceReportsDetails,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Fetch Insurance Reports Details API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Fetch Insurance Reports Details");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FetchServiceLevelDetails: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_Reports_FetchServiceLevelDetails,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Fetch Service Level Details API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Fetch Service Level Details");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FetchDispatchOrderFlowData: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_DispatchOrderFlow_FetchData,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Fetch Dispatch Order Flow Data API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Fetch Dispatch Order Flow Data");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FetchDispatchOrderFlowPendingCounts: async (body, res) => {
      try {
        // console.log(
        //   "Sending GET payload to plant API:",
        //   JSON.stringify(body, null, 2)
        // );
        const response = await axios.get(config.THIRD_PARTY_API_URL_GET_LE_DispatchOrderFlow_PendingCounts, {
          headers: {
            Authorization: getAuthHeader(),
          },

        });
        // console.log(
        //   "GET Response from plant API:",
        //   JSON.stringify(response.data, null, 2)
        // );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "plant");
        res.status(500).json({ error: "Failed to process GET request" });
      }
    },

    FetchGateInOutInvoiceData: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Gate In Out Invoice Get API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_GateInOut_InvoiceGet,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Fetch Gate In Out Invoice Data API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Fetch Gate In Out Invoice Data");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    SaveGateInOutWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Gate In Out With Sap Save API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_GateInOut_WithSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Save Gate In Out With Sap API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Save Gate In Out With Sap");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    SearchGateInOutWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Gate In Out With Sap Search API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_GateInOut_WithSap_Search,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Gate In Out With Sap Search API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Gate In Out With Sap Search");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    DeleteGateInOutWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Gate In Out With Sap Delete API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_GateInOut_WithSap_Delete,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Gate In Out With Sap Delete API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Gate In Out With Sap Delete");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FilterRecordsGateInOutWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Gate In Out With Sap Filter Records API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_GateInOut_WithSap_FilterRecords,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Gate In Out With Sap Filter Records API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Gate In Out With Sap Filter Records");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    ChangeGateInOutWithSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Gate In Out With Sap Change API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_GateInOut_WithSap_Change,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "POST Response from Gate In Out With Sap Change API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Gate In Out With Sap Change");
        res.status(500).json({ error: "Failed to process POST request" });
      }
    },

    FetchGateInOutInvoiceDataWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Gate In Out With Sap Change API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_GateInOut_WithoutSap_InvoiceGet,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Gate In Out Without Sap Invoice Get API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Gate In Out Without Sap Invoice Get");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    SaveGateInOutWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Gate In Out Without Sap Save API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_GateInOut_WithoutSap_Save,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Gate In Out Without Sap Save API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Gate In Out Without Sap Save");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    SearchGateInOutWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Gate In Out Without Sap Search API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_GateInOut_WithoutSap_Search,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Gate In Out Without Sap Search API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Gate In Out Without Sap Search");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },

    DeleteGateInOutWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Gate In Out Without Sap Delete API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_GateInOut_WithoutSap_Delete,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },

          }
        );
        console.log(
          "PUT Response from Gate In Out Without Sap Delete API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Gate In Out Without Sap Delete");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    FilterRecordsGateInOutWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Gate In Out Without Sap Filter Records API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_GateInOut_WithoutSap_FilterRecords,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );
        console.log(
          "PUT Response from Gate In Out Without Sap Filter Records API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Gate In Out Without Sap Filter Records");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    ChangeGateInOutWithoutSap: async (body, res) => {
      try {
        console.log(
          "Sending  Put payload to Gate In Out Without Sap Change API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.put(
          config.THIRD_PARTY_API_URL_PUT_LE_GateInOut_WithoutSap_Change,
          body,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
          }
        );
        console.log(
          "PUT Response from Gate In Out Without Sap Change API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "Gate In Out Without Sap Change");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },










  };
})();
