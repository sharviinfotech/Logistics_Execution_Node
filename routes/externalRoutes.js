module.exports = (() => {
  const express = require("express");
  const router = express.Router();
  const externalApiHandler = require("../handlers/externalApiHandler");

  // Define routes
  router.post("/Login", externalApiHandler.Login);

  //UCL
  router.put("/getLotReports", externalApiHandler.getLotReports);

  router.post("/resultrecord", externalApiHandler.updateResultRecording);
  router.post("/UDsubmitResult", externalApiHandler.UDsubmitResult);
  router.post("/reportZQAR", externalApiHandler.reportZQAR); //quality reports
  router.post("/reportZQA32", externalApiHandler.reportZQA32); //pending lot reports
  router.post("/ZPRDID", externalApiHandler.ZPRDID);
  router.post("/typeTest", externalApiHandler.typeTest);
  router.post('/orderconfirmation/coois', externalApiHandler.Coois);
  router.post('/orderconfirmationzco11n/co11', externalApiHandler.Co11);
  router.post('/LE/orderInfo/Outward/fetchInvoiceList', externalApiHandler.OrderInfoInwardOutward);
  router.post('/LE/orderInfo/Outward/withsap/Save', externalApiHandler.OrderInfoOutwardSave);
  router.put('/LE/orderInfo/Outward/withoutsap/Save', externalApiHandler.OrderInfoNonSap);
  router.get('/LE/orderInfo/plant_division_Biltype', externalApiHandler.getpdb);
  router.put('/LE/orderInfo/Outward/withoutsap/fetchzone', externalApiHandler.fetchzone);
  router.put('/LE/orderInfo/Outward/withoutsap/custgroup', externalApiHandler.custgroup);
  router.post('/LE/ShipmentDetails/Outword/sapfetch', externalApiHandler.shipmentdetailsfetch);
  router.post('/LE/ShipmentDetails/Outward/Save', externalApiHandler.ShipmentOutwardSave);
  router.post('/LE/segmentInfo/Outward/fetchInvoiceList', externalApiHandler.SegmentInfoInwardOutward);
  router.post('/LE/segmentInfo/Outward/withsap/Save', externalApiHandler.SegmentInfoOutwardSave);


  // router.post('/LE/orderInfo/Inward/fetchPoList',externalApiHandler.OrderInfoInward);

  return router;
})();
