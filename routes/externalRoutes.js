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



  router.get('/LE/orderInfo/f4_getAllDetails', externalApiHandler.getpdb);
  router.put('/LE/orderInfo/Outward/withoutsap/fetchzone', externalApiHandler.fetchzone);
  router.put('/LE/orderInfo/Outward/withoutsap/custgroup', externalApiHandler.custgroup);

  // order info  outward
  router.post('/LE/orderInfo/Outward/fetchInvoiceList', externalApiHandler.OrderInfoInwardOutward);
  router.post('/LE/orderInfo/Outward/withsap/Save', externalApiHandler.OrderInfoOutwardSave);
  router.put('/LE/orderInfo/Outward/withoutsap/Save', externalApiHandler.OrderInfoNonSap);
  router.put('/LE/orderInfo/Outward/Physicaldispatch', externalApiHandler.OrderInfoPhysicaldispatch);
  router.put('/LE/orderInfo/Outward/withoutsap/PlantBasedDivison', externalApiHandler.OrderInfoPlantBasedDivison);

  // shipment  outward
  router.post('/LE/ShipmentDetails/Outward/fetchInvoiceList', externalApiHandler.shipmentdetailsfetch);
  router.post('/LE/ShipmentDetails/Outward/Save', externalApiHandler.ShipmentOutwardSave);
  router.get('/LE/ShipmentDetails/Nonsap/f4_Typeofmaterial', externalApiHandler.getTypeofmaterial);
  router.put('/LE/ShipmentDetails/Nonsap/f4_Incoterms', externalApiHandler.Incoterms);
  router.post('/LE/ShipmentDetails/Nonsap/Save', externalApiHandler.shipmentdetailsNonSapSave);
  router.post('/LE/ShipmentDetails/Nonsap/Reports', externalApiHandler.shipmentdetailsNonSapReports);


  // segment outward
  router.post('/LE/segmentInfo/Outward/fetchInvoiceList', externalApiHandler.SegmentInfoOutwardFetch);
  router.post('/LE/segmentInfo/Outward/withsap/Save', externalApiHandler.SegmentInfoOutwardSave);
  router.put('/LE/segmentInfo/Outward/withoutsap/Save', externalApiHandler.SegmentInfoNonSap);
  router.get('/LE/segmentInfo/f4_getAllDetails', externalApiHandler.getssc);
  router.put('/LE/segmentInfo/Outward/withoutsap/fetchzone', externalApiHandler.fetchzoneTat);
  router.put('/LE/segmentInfo/Outward/withSap/TAT_Type', externalApiHandler.fetchTAT);
  router.put('/LE/segmentInfo/Outward/NonSap/TAT_Type', externalApiHandler.fetchNonSapTAT);

  //Transit Info OutWard
  router.post('/LE/TransitInfo/Outward/WithSap/Save', externalApiHandler.TransitInfoSave);
  router.put('/LE/TransitInfo/NonSap/Save', externalApiHandler.TransitInfoNonSap);

  // Freight Billing With Sap
  router.post('/LE/FreightBilling/Outward/WithSap/Save', externalApiHandler.FreightBillingSave);
  router.put('/LE/FreightBilling/Outward/NonSap/Create', externalApiHandler.FreightBillingNonSap);

  // vechile info outward
  router.post('/LE/Vehicleinfo/Outward/fetchInvoiceList', externalApiHandler.VehicleInfofetch);
  router.post('/LE/Vehicleinfo/Outward/Save', externalApiHandler.VehicleInfosave);
  router.put('/LE/Vehicleinfo/NonSap/Save', externalApiHandler.VehicleInfoNonSap);

  //InvoiceLoad details
  router.post('/LE/InvoiceloadDetails/Outward/fetchInvoiceList', externalApiHandler.Invoiceloaddetailsfetch);
  router.post('/LE/InvoiceloadDetails/Outward/sapget', externalApiHandler.sapget);
  router.post('/LE/InvoiceloadDetails/Outward/save', externalApiHandler.InvoiceloaddetailsSave);
  router.post('/LE/InvoiceloadDetails/NonSap/Save', externalApiHandler.InvoiceloaddetailsNonSap);
  router.get('/LE/InvoiceloadDetails/f4_getAllDetails', externalApiHandler.gettypeofvehicle);

  // Insurance Claim Tracking
  router.post('/LE/InsuranceClaimTracking/Outward/fetchinvoicelist', externalApiHandler.InsuranceClaimTrackingfetch);
  router.post('/LE/InsuranceClaimTracking/Outward/save', externalApiHandler.InsuranceClaimTrackingSave);
  router.put('/LE/InsuranceClaimTracking/NonSap/fetchinvoicelistnonsap', externalApiHandler.fetchinvoicelistnonsap);
  router.put('/LE/InsuranceClaimTracking/NonSap/Nonsapsave', externalApiHandler.Nonsapsave);

  //Transit Damage Info
  router.post('/LE/TransitDamageInfo/Outward/fetchinvoicelist', externalApiHandler.TransitDamageInfofetch);
  router.post('/LE/TransitDamageInfo/Outward/Save', externalApiHandler.TransitDamageInfoSave);
  router.put('/LE/TransitDamageInfo/NonSap/fetchinvoicelistnonsap', externalApiHandler.fetchinvoicelistnonsapwosp);
  router.put('/LE/TransitDamageInfo/NonSap/withoutsapSave', externalApiHandler.withoutsapSave);

  //Dispatch
  router.post('/LE/Dispatch/Outward/withsap/Save', externalApiHandler.DispatchWithSapSave);
  router.put('/LE/Dispatch/Outward/withoutsap/Save', externalApiHandler.DispatchWithoutSapSave);
  router.get('/LE/Dispatch/Outward/F4Vendorcode/fetch', externalApiHandler.Dispatchf4_vendorCode);
  router.post('/LE/Dispatch/Outward/ReferenceNumber/fetch', externalApiHandler.DispatchReferenceNumber);
  router.post('/LE/Dispatch/Outward/ReferenceNumber/edit', externalApiHandler.DispatchReferenceNumberEdit);
  router.post('/LE/orderinfo/GlobalReferenceNoFetch', externalApiHandler.ReferenceNoFetch);
  router.post('/LE/orderinfo/global_Fields_SearchOption', externalApiHandler.global_Fields_SearchOption);



  

  return router;
})();
