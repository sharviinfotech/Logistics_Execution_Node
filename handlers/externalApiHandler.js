const reportsMethods = require("../apiMethods/reportsMethods");

module.exports = (() => {
  const externalApiMethods = require("../apiMethods/externalApiMethods");
  const zprApiMethods = require("../apiMethods/zprMethods");
  const qrCodeMethods = require("../apiMethods/qrCodeMethods");



  return {
    Login: (req, res) => externalApiMethods.Login(req.body, res),

    getLotReports: (req, res) =>
      externalApiMethods.getLotReports(req.body, res),
    updateResultRecording: (req, res) =>
      externalApiMethods.updateResultRecording(req.body, res),
    UDsubmitResult: (req, res) =>
      externalApiMethods.UDsubmitResult(req.body, res),
    reportZQAR: (req, res) => externalApiMethods.reportZQAR(req.body, res),
    reportZQA32: (req, res) => externalApiMethods.reportZQA32(req.body, res),
    ZPRDID: (req, res) => externalApiMethods.ZPRDID(req.body, res),
    typeTest: (req, res) => externalApiMethods.typeTest(req.body, res),
    Coois: (req, res) => externalApiMethods.Coois(req.body, res),
    Co11: (req, res) => externalApiMethods.Co11(req.body, res),
    OrderInfoInwardOutward: (req, res) => externalApiMethods.OrderInfoInwardOutward(req.body, res),
    OrderInfoOutwardSave: (req, res) => externalApiMethods.OrderInfoOutwardSave(req.body, res),
    OrderInfoNonSap: (req, res) => externalApiMethods.OrderInfoNonSap(req.body, res),
    getpdb: (req, res) => externalApiMethods.getpdb(req.body, res),
    fetchzone: (req, res) => externalApiMethods.fetchzone(req.body, res),
    custgroup: (req, res) => externalApiMethods.custgroup(req.body, res),
    shipmentdetailsfetch: (req, res) => externalApiMethods.shipmentdetailsfetch(req.body, res),
    ShipmentOutwardSave: (req, res) => externalApiMethods.ShipmentOutwardSave(req.body, res),
    getTypeofmaterial: (req, res) => externalApiMethods.getTypeofmaterial(req.body, res),
    Incoterms: (req, res) => externalApiMethods.Incoterms(req.body, res),
    shipmentdetailsNonSapSave: (req, res) => externalApiMethods.shipmentdetailsNonSapSave(req.body, res),
    shipmentdetailsNonSapReports: (req, res) => externalApiMethods.shipmentdetailsNonSapReports(req.body, res),
    SegmentInfoInwardOutward: (req, res) => externalApiMethods.SegmentInfoInwardOutward(req.body, res),
    SegmentInfoOutwardSave: (req, res) => externalApiMethods.SegmentInfoOutwardSave(req.body, res),
    SegmentInfoNonSap: (req, res) => externalApiMethods.SegmentInfoNonSap(req.body, res),
    getssc: (req, res) => externalApiMethods.getssc(req.body, res),
    fetchzoneTat: (req, res) => externalApiMethods.fetchzoneTat(req.body, res),
    TransitInfoSave: (req, res) => externalApiMethods.TransitInfoSave(req.body, res),
    TransitInfoNonSap: (req, res) => externalApiMethods.TransitInfoNonSap(req.body, res),
    FreightBillingSave: (req, res) => externalApiMethods.FreightBillingSave(req.body, res),
    FreightBillingNonSap: (req, res) => externalApiMethods.FreightBillingNonSap(req.body, res),
    VehicleInfofetch: (req, res) => externalApiMethods.VehicleInfofetch(req.body, res),
    VehicleInfosave: (req, res) => externalApiMethods.VehicleInfosave(req.body, res),
    VehicleInfoNonSap: (req, res) => externalApiMethods.VehicleInfoNonSap(req.body, res),
    Invoiceloaddetailsfetch: (req, res) => externalApiMethods.Invoiceloaddetailsfetch(req.body, res),
    sapget: (req, res) => externalApiMethods.sapget(req.body, res),
    InvoiceloaddetailsSave: (req, res) => externalApiMethods.InvoiceloaddetailsSave(req.body, res),
    InvoiceloaddetailsNonSap: (req, res) => externalApiMethods.InvoiceloaddetailsNonSap(req.body, res),
    InsuranceClaimTrackingfetch: (req, res) => externalApiMethods.InsuranceClaimTrackingfetch(req.body, res),

  };
})();
