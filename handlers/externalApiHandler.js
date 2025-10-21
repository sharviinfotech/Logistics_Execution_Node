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
    SegmentInfoInwardOutward: (req, res) => externalApiMethods.SegmentInfoInwardOutward(req.body, res),
    SegmentInfoOutwardSave: (req, res) => externalApiMethods.SegmentInfoOutwardSave(req.body, res),
    SegmentInfoNonSap: (req, res) => externalApiMethods.SegmentInfoNonSap(req.body, res),
    getssc: (req, res) => externalApiMethods.getssc(req.body, res),
    fetchzoneTat: (req, res) => externalApiMethods.fetchzoneTat(req.body, res),
  };
})();
