const { getpdb, OrderInfoNonSap, custgroup } = require("../handlers/externalApiHandler");
const { OrderConfirmationZcolln } = require("./PrExternalApiMethods");

module.exports = (() => {
  const axios = require("axios");
  const https = require("https");
  const config = require("../config/apiConfig");

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
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
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
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
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
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
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

    shipmentdetailsfetch: async (body, res) => {
      try {
        console.log(
          "Sending  Post payload to Pr Reject  API:",
          JSON.stringify(body, null, 2)
        );
        const response = await axios.post(
          config.THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outword_sapfetch,
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
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },
    SegmentInfoInwardOutward: async (body, res) => {
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
          "PUT Response from PurchaseCreate API:",
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
          "PUT Response from PurchaseCreate API:",
          JSON.stringify(response.data, null, 2)
        );
        res.json(response.data);
      } catch (error) {
        handleAxiosError(error, "PurchaseCreate");
        res.status(500).json({ error: "Failed to process PUT request" });
      }
    },

  };
})();
