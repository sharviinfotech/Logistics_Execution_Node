module.exports = (() => {
    const express = require("express");
    const router = express.Router();
    const externalApiHandler = require("../handlers/PRExternalAPIHanlder");
  
    // Define routes
    router.post("/purchase/create", externalApiHandler.PurchaseCreate);
    router.put("/purchase/AutomaticMaterialDescriptionandUOM", externalApiHandler.Automatic);
    router.post('/purchase/changeprmethod',externalApiHandler.changePrMethod);
    router.post('/purchase/prchangeget',externalApiHandler.prchangeget);
    router.get('/pr/pr_f4',externalApiHandler.pr_f4);
    router.post('/purchase/list',externalApiHandler.purchaseList);
    router.post('/purchase/stock',externalApiHandler.stockOverview);
    router.post('/pr/prapprovallist',externalApiHandler.prApprovalListMethod);
    // router.put("/pr/prreleasecodes", externalApiHandler.prreleasecodes);
    router.post('/pr/ApproveRequest',externalApiHandler.prApprovalMethod);
    router.post('/pr/Rejected',externalApiHandler.prRejectMethod);


    //login apis//
    router.post('/pr/UserCreation',externalApiHandler.UserCreation);
    router.post('/pr/UpdateUser',externalApiHandler.UpdateUser)
    router.get('/pr/GetAllUsers',externalApiHandler.GetAllUsers)
    router.post('/pr/delete',externalApiHandler.DeleteMethod);
    router.post('/pr/ForgotPassword',externalApiHandler.ForgotPassword);
    router.post('/pr/LoginUser',externalApiHandler.LoginUser)


    //MB21//

    router.post('/pr/MB21',externalApiHandler.MatReservation);
    router.post('/coois/orderconfirmation',externalApiHandler.OrderConfirmation);
    router.post('/co11/orderconfirmation/zco11n',externalApiHandler.OrderConfirmationZcolln);
     router.post('/LE/orderInfo/Outward/fetchInvoiceList',externalApiHandler.OrderInfoOutward);
     router.post('/LE/orderInfo/Outward/fetchInvoiceList/Save',externalApiHandler.OrderInfoOutwardSave);

      // router.post('/LE/orderInfo/Inward/fetchPoList',externalApiHandler.OrderInfoInward);












    return router;
  })();
  