
module.exports = (() => {
    const externalApiMethods = require('../apiMethods/PrExternalApiMethods');


    return {
        
        PurchaseCreate: (req, res) => externalApiMethods.PurchaseCreate(req.body, res),
        Automatic:(req, res) => externalApiMethods.Automatic(req.body, res),
        changePrMethod:(req, res) => externalApiMethods.changePrMethod(req.body, res),
        prchangeget:(req, res) => externalApiMethods.prchangeget(req.body, res),
        pr_f4:(req, res) => externalApiMethods.dropdrownPr(req.body, res),
        purchaseList:(req, res) => externalApiMethods.purchaseList(req.body, res),
        stockOverview:(req, res) => externalApiMethods.stockOverview(req.body, res),
        prApprovalListMethod:(req, res) => externalApiMethods.prApprovalListMethod(req.body, res),
        // prreleasecodes:(req, res) => externalApiMethods.prReleaseCodes(req.body, res),
        prApprovalMethod:(req, res) => externalApiMethods.prApprovalMethod(req.body, res),
        prRejectMethod:(req, res) => externalApiMethods.prRejectMethod(req.body, res),

        // Login api//
        UserCreation:(req, res) => externalApiMethods.UserCreation(req.body, res),
        UpdateUser:(req, res) => externalApiMethods.UpdateUser(req.body, res),
        GetAllUsers:(req, res) => externalApiMethods.GetAllUsers(req.body, res),
        DeleteMethod:(req, res) => externalApiMethods.DeleteUser(req.body, res),
        ForgotPassword:(req, res) => externalApiMethods.ForgotPassword(req.body, res),
        LoginUser:(req, res) => externalApiMethods.loginUser(req.body, res),

        //Mb21//
        MatReservation:(req, res) => externalApiMethods.MatReservation(req.body, res),
        OrderConfirmation:(req, res) => externalApiMethods.OrderConfirmation(req.body, res),
        OrderConfirmationZcolln:(req, res) => externalApiMethods.OrderConfirmationZcolln(req.body, res),
        OrderInfoOutward:(req, res) => externalApiMethods.OrderInfoOutward(req.body, res),
        OrderInfoOutwardSave:(req, res) => externalApiMethods.OrderInfoOutwardSave(req.body, res),

       
    };
})();
