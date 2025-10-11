const { OrderConfirmationZcolln } = require("../handlers/PRExternalAPIHanlder");

module.exports = (() => {
    const axios = require("axios");
    const config = require("../config/prApiConfig");
    
  
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
 
  
    return {
     

      PurchaseCreate: async (body, res) => {
        try {
          console.log(
            "Sending post payload to PurchaseCreate API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_PRCREATE,
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
      Automatic: async (body, res) => {
        try {
          console.log(
            "Sending Put payload to Automatic API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.put(
            config.THIRD_PARTY_API_URL_PUT_PRCREATE,
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
      changePrMethod: async (body, res) => {
        try {
          console.log(
            "Sending post payload to Purchase API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_PRCHANGE,
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
      prchangeget: async (body, res) => {
        try {
          console.log(
            "Sending post payload to Purchase API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_PRCHANGEGET,
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
      dropdrownPr: async (body, res) => {
        try {
          console.log(
            "Sending get payload to Pr_f4 API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.get(
            config.THIRD_PARTY_API_URL_GET_PR,
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
          res.status(500).json({ error: "Failed to process GET request" });
        }
      },
      purchaseList: async (body, res) => {
        try {
          console.log(
            "Sending post payload to Purchase List API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_PRLIST,
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
      stockOverview: async (body, res) => {
        try {
          console.log(
            "Sending post payload to Stock Overview API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_STOCKOVERVIEW,body,{
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
      prApprovalListMethod: async (body, res) => {
        try {
          console.log(
            "Sending  Post payload to Pr Approval List API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_PRAPPROVALLIST,body,
            
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
      // prReleaseCodes: async (body, res) => {
      //   try {
      //     console.log(
      //       "Sending  Put payload to Pr Release Code API:",
      //       JSON.stringify(body, null, 2)
      //     );
      //     const response = await axios.put(
      //       config.THIRD_PARTY_API_URL_PUT_PRAPPROVALLIST,body,
            
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
      //     handleAxiosError(error, "PurchaseCreate");
      //     res.status(500).json({ error: "Failed to process PUT request" });
      //   }
      // },
      prApprovalMethod:async (body, res) => {
        try {
          console.log(
            "Sending  Post payload to Pr Approval  API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_PRAPPROVALSAVE,
            body,
            {
              headers: {
                Authorization: getAuthHeader(),
              },
            }
          );
          console.log("POST Response from PrApprovalList API:", JSON.stringify(response.data, null, 2));

          res.json(response.data);
        } catch (error) {
          handleAxiosError(error, "PurchaseCreate");
          res.status(500).json({ error: "Failed to process POST request" });
        }
      },
      prRejectMethod:async (body, res) => {
        try {
          console.log(
            "Sending  Post payload to Pr Reject  API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_PRREJECTSAVE,
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
      UserCreation: async (body, res) => {
        try {
          console.log(
            "Sending post payload to UserCreate API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_USERCREATE,
            body,
            {
              headers: {
                Authorization: getAuthHeader(),
              },
            }
          );
          console.log(
            "POST Response from UserCreate API:",
            JSON.stringify(response.data, null, 2)
          );
          res.json(response.data);
        } catch (error) {
          handleAxiosError(error, "createUser");
          res.status(500).json({ error: "Failed to create user" });
        }
      },
      UpdateUser: async (body, res) => {
        try {
          console.log(
            "Sending post payload to UpdateUser API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_USERUPDATE,
            body,
            {
              headers: {
                Authorization: getAuthHeader(),
              },
            }
          );
          console.log(
            "POST Response from UpdateUser API:",
            JSON.stringify(response.data, null, 2)
          );
          res.json(response.data);
        } catch (error) {
          handleAxiosError(error, "updateUser");
          res.status(500).json({ error: "Failed to update user" });
        }
      },
      GetAllUsers: async (req, res) => {
        try {
          console.log("Sending GET request to GetAllUsers API");
      
          const response = await axios.get(config.THIRD_PARTY_API_URL_GET_ALL_USERS, {
            headers: {
              Authorization: getAuthHeader(),
            },
          });
      
          console.log(
            "GET Response from getAllUser API:",
            JSON.stringify(response.data, null, 2)
          );
      
          res.json(response.data);
        } catch (error) {
          handleAxiosError(error, "getAllUser");
          res.status(500).json({ error: "Failed to fetch users" });
        }
      },
      
      
      DeleteUser: async (body, res) => {
        try {
          console.log(
            "Sending post payload to UserDelete API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_USERDELETE,
            body,
            {
              headers: {
                Authorization: getAuthHeader(),
              },
            }
          );
          console.log(
            "POST Response from UserDelete API:",
            JSON.stringify(response.data, null, 2)
          );
          res.json(response.data);
        } catch (error) {
          handleAxiosError(error, "deleteUser");
          res.status(500).json({ error: "Failed to delete user" });
        }
      },
      ForgotPassword: async (body, res) => {
        try {
          console.log(
            "Sending put payload to ForgotPassword API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.put(
            config.THIRD_PARTY_API_URL_PUT_FORGOTPASSWORD,
            body,
            {
              headers: {
                Authorization: getAuthHeader(),
              },
            }
          );
          console.log(
            "POST Response from ForgotPassword API:",
            JSON.stringify(response.data, null, 2)
          );
          res.json(response.data);
        } catch (error) {
          handleAxiosError(error, "forgotPassword");
          res.status(500).json({ error: "Failed to process forgot password request" });
        }
      },
      loginUser: async (body, res) => {
        try {
          console.log(
            "Sending post payload to Login API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_LOGIN,
            body,
            {
              headers: {
                Authorization: getAuthHeader(),
              },
            }
          );
          console.log(
            "POST Response from Login API:",
            JSON.stringify(response.data, null, 2)
          );
          res.json(response.data);
        } catch (error) {
          handleAxiosError(error, "loginUser");
          res.status(500).json({ error: "Login failed" });
        }
      },
      MatReservation:async (body, res) => {
        try {
          console.log(
            "Sending  Post payload to Pr Reject  API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_MB21,
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
       Coois:async (body, res) => {
        try {
          console.log(
            "Sending  Post payload to Pr Reject  API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_COOIS_Order_Confirmation,
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
       OrderConfirmationZcolln:async (body, res) => {
        try {
          console.log(
            "Sending  Post payload to Pr Reject  API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_CO11_Order_Confirmation_ZCO11N,
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
       OrderInfoOutward:async (body, res) => {
        try {
          console.log(
            "Sending  Post payload to Pr Reject  API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_CO11_Order_Confirmation_ZCO11N,
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
       OrderInfoOutwardSave:async (body, res) => {
        try {
          console.log(
            "Sending  Post payload to Pr Reject  API:",
            JSON.stringify(body, null, 2)
          );
          const response = await axios.post(
            config.THIRD_PARTY_API_URL_POST_LE_OrderInfo_Outward_Save,
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
  