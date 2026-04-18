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
  router.post('/LE/orderInfo/Outward/DeleteWithSap', externalApiHandler.OrderInfoDeleteWithSap);
  router.put('/LE/orderInfo/Outward/DeleteWithoutSap', externalApiHandler.OrderInfoDeleteWithoutSap);

  // shipment  outward
  router.post('/LE/ShipmentDetails/Outward/fetchInvoiceList', externalApiHandler.shipmentdetailsfetch);
  router.post('/LE/ShipmentDetails/Outward/Save', externalApiHandler.ShipmentOutwardSave);
  router.get('/LE/ShipmentDetails/Nonsap/f4_Typeofmaterial', externalApiHandler.getTypeofmaterial);
  router.put('/LE/ShipmentDetails/Nonsap/f4_Incoterms', externalApiHandler.Incoterms);
  router.post('/LE/ShipmentDetails/Nonsap/Save', externalApiHandler.shipmentdetailsNonSapSave);
  router.post('/LE/ShipmentDetails/Nonsap/Reports', externalApiHandler.shipmentdetailsNonSapReports);
  router.post('/LE/ShipmentDetails/Outward/ChangeWithSap', externalApiHandler.Shipmentchangewithsap);
  router.post('/LE/ShipmentDetails/Outward/ChangeWithoutSap', externalApiHandler.Shipmentchangewithoutsap);
  router.post('/LE/ShipmentDetails/Outward/ShipmentDeleteWithSap', externalApiHandler.ShipmentDeleteWithSap);
  router.post('/LE/ShipmentDetails/Outward/ShipmentDeleteWithoutSap', externalApiHandler.ShipmentDeleteWithoutSap);


  // segment outward
  router.post('/LE/segmentInfo/Outward/fetchInvoiceList', externalApiHandler.SegmentInfoOutwardFetch);
    router.post('/LE/segmentInfo/Outward/WithoutSap/fetchInvoiceList', externalApiHandler.SegmentInfoOutwardwithoutSapFetch);
  router.post('/LE/segmentInfo/Outward/withsap/Save', externalApiHandler.SegmentInfoOutwardSave);
  router.put('/LE/segmentInfo/Outward/withoutsap/Save', externalApiHandler.SegmentInfoNonSap);
  router.get('/LE/segmentInfo/f4_getAllDetails', externalApiHandler.getssc);
  router.put('/LE/segmentInfo/Outward/withoutsap/fetchzone', externalApiHandler.fetchzoneTat);
  router.put('/LE/segmentInfo/Outward/withSap/TAT_Type', externalApiHandler.fetchTAT);
  router.put('/LE/segmentInfo/Outward/NonSap/TAT_Type', externalApiHandler.fetchNonSapTAT);
  router.post('/LE/segmentInfo/Outward/ChangeWithSap', externalApiHandler.SegmentInfoChangeWithSap);
  router.put('/LE/segmentInfo/Outward/ChangeWithoutSap', externalApiHandler.SegmentInfoChangeWithoutSap);
  router.post('/LE/segmentInfo/Outward/DeleteWithSap', externalApiHandler.SegmentInfoDeleteWithSap);
  router.put('/LE/segmentInfo/Outward/DeleteWithoutSap', externalApiHandler.SegmentInfoDeleteWithoutSap);

  //Transit Info OutWard
  router.post('/LE/TransitInfo/Outward/WithSap/Save', externalApiHandler.TransitInfoSave);
  router.put('/LE/TransitInfo/NonSap/Save', externalApiHandler.TransitInfoNonSap);
  router.post('/LE/TransitInfo/Outward/WithSap/Delete', externalApiHandler.TransitInfoDeleteWithSap);
  router.put('/LE/TransitInfo/Outward/WithoutSap/Delete', externalApiHandler.TransitInfoDeleteWithoutSap);
  router.post('/LE/TransitInfo/Outward/WithSap/Change', externalApiHandler.TransitInfoChangeWithSap);
  router.put('/LE/TransitInfo/Outward/WithoutSap/Change', externalApiHandler.TransitInfoChangeWithoutSap);

  // Freight Billing With Sap
  router.post('/LE/FreightBilling/Outward/WithSap/Save', externalApiHandler.FreightBillingSave);
  router.put('/LE/FreightBilling/Outward/NonSap/Create', externalApiHandler.FreightBillingNonSap);
  router.post('/LE/FreightBilling/Outward/ChangeWithSap', externalApiHandler.FreightBillingChangeWithSap);
  router.put('/LE/FreightBilling/Outward/ChangeWithoutSap', externalApiHandler.FreightBillingChangeWithoutSap);
  router.post('/LE/FreightBilling/Outward/WithSap/Delete', externalApiHandler.FreightBillingDeleteWithSap);
  router.put('/LE/FreightBilling/Outward/NonSap/Delete', externalApiHandler.FreightBillingDeleteWithOutSap);

  // vechile info outward
  router.post('/LE/Vehicleinfo/Outward/fetchInvoiceList', externalApiHandler.VehicleInfofetch);
  router.post('/LE/Vehicleinfo/Outward/Save', externalApiHandler.VehicleInfosave);
  router.put('/LE/Vehicleinfo/NonSap/Save', externalApiHandler.VehicleInfoNonSap);
  router.post('/LE/Vehicleinfo/Outward/WithSapMapid', externalApiHandler.VehicleInfoMapid);
  router.put('/LE/Vehicleinfo/Outward/WithoutSapMapid', externalApiHandler.VehicleInfoMapidForNonsap);
  router.put('/LE/Vehicleinfo/NonSap/DCNO', externalApiHandler.DCReferenceNo);
  router.post('/LE/Vehicleinfo/Outward/ChangeWithSap', externalApiHandler.VehicleInfoChangeWithSap);
  router.put('/LE/Vehicleinfo/Outward/ChangeWithoutSap', externalApiHandler.VehicleInfoChangeWithoutSap);
  router.post('/LE/Vehicleinfo/Outward/DeleteWithSap', externalApiHandler.VehicleInfoDeleteWithSap);
  router.put('/LE/Vehicleinfo/Outward/DeleteWithoutSap', externalApiHandler.VehicleInfoDeleteWithoutSap);

  //InvoiceLoad details
  router.post('/LE/InvoiceloadDetails/Outward/fetchInvoiceList', externalApiHandler.Invoiceloaddetailsfetch);
  router.post('/LE/InvoiceloadDetails/Outward/sapget', externalApiHandler.sapget);
  router.post('/LE/InvoiceloadDetails/Outward/save', externalApiHandler.InvoiceloaddetailsSave);
  router.post('/LE/InvoiceloadDetails/NonSap/Save', externalApiHandler.InvoiceloaddetailsNonSap);
  router.get('/LE/InvoiceloadDetails/f4_getAllDetails', externalApiHandler.gettypeofvehicle);
  router.post('/LE/InvoiceloadDetails/Outward/DeleteWithsap', externalApiHandler.InvoiceloaddetailsDeleteWithsap);
  router.put('/LE/InvoiceloadDetails/Outward/DeleteWithoutsap', externalApiHandler.InvoiceloaddetailsDeleteWithoutsap);

  // Insurance Claim Tracking
  router.post('/LE/InsuranceClaimTracking/Outward/fetchinvoicelist', externalApiHandler.InsuranceClaimTrackingfetch);
  router.post('/LE/InsuranceClaimTracking/Outward/save', externalApiHandler.InsuranceClaimTrackingSave);
  router.put('/LE/InsuranceClaimTracking/NonSap/fetchinvoicelistnonsap', externalApiHandler.fetchinvoicelistnonsap);
  router.put('/LE/InsuranceClaimTracking/NonSap/Nonsapsave', externalApiHandler.Nonsapsave);
  router.post('/LE/InsuranceClaimTracking/Outward/DeleteWithSap', externalApiHandler.InsuranceClaimTrackingDeleteWithSap);
  router.put('/LE/InsuranceClaimTracking/NonSap/DeleteWithoutSap', externalApiHandler.InsuranceClaimTrackingDeleteWithoutSap);
  router.post('/LE/InsuranceClaimTracking/Outward/ChangeWithSap', externalApiHandler.InsuranceClaimTrackingChangeWithSap);
  router.put('/LE/InsuranceClaimTracking/Outward/ChangeWithoutSap', externalApiHandler.InsuranceClaimTrackingChangeWithoutSap);

  //Transit Damage Info
  router.post('/LE/TransitDamageInfo/Outward/fetchinvoicelist', externalApiHandler.TransitDamageInfofetch);
  router.post('/LE/TransitDamageInfo/Outward/Save', externalApiHandler.TransitDamageInfoSave);
  router.put('/LE/TransitDamageInfo/NonSap/fetchinvoicelistnonsap', externalApiHandler.fetchinvoicelistnonsapwosp);
  router.put('/LE/TransitDamageInfo/NonSap/withoutsapSave', externalApiHandler.withoutsapSave);
  router.post('/LE/TransitDamageInfo/Outward/DeleteWithSap', externalApiHandler.TransitDamageInfoDeleteWithSap);
  router.put('/LE/TransitDamageInfo/NonSap/DeleteWithoutSap', externalApiHandler.TransitDamageInfoDeleteWithoutSap);
  router.post('/LE/TransitDamageInfo/Outward/ChangeWithSap', externalApiHandler.TransitDamageInfoChangeWithSap);
  router.put('/LE/TransitDamageInfo/Outward/Change/WithoutSap', externalApiHandler.TransitDamageInfoChangeWithoutSap);

  //Dispatch
  router.post('/LE/Dispatch/Outward/withsap/Save', externalApiHandler.DispatchWithSapSave);
  router.put('/LE/Dispatch/Outward/withoutsap/Save', externalApiHandler.DispatchWithoutSapSave);
  router.get('/LE/Dispatch/Outward/F4Vendorcode/fetch', externalApiHandler.Dispatchf4_vendorCode);
  router.post('/LE/Dispatch/Outward/ReferenceNumber/fetch', externalApiHandler.DispatchReferenceNumber);
  router.put('/LE/Dispatch/Outward/ReferenceNumber/WithoutSap/fetch', externalApiHandler.DispatchReferenceNumberWithoutsap);
  router.post('/LE/Dispatch/Outward/ReferenceNumber/edit', externalApiHandler.DispatchReferenceNumberEdit);
  router.post('/LE/orderinfo/GlobalReferenceNoFetch', externalApiHandler.ReferenceNoFetch);
  router.put('/LE/orderinfo/GlobalReferenceNoFetchwithoutsap', externalApiHandler.ReferenceNoFetch_Withoutsap);
  router.post('/LE/orderinfo/global_Fields_SearchOption', externalApiHandler.global_Fields_SearchOption);
  router.put('/LE/orderinfo/global_Fields_SearchOption_WithoutSap', externalApiHandler.global_Fields_SearchOption_WithoutSap);

  // Filter Creation For Dispatch
  router.post('/LE/orderinfo/Filter_Creation', externalApiHandler.Filter_Creation);
  router.put('/LE/Dispatch/Outward/Filter_Creation_NonSap', externalApiHandler.Filter_Creation_NonSap);

  // Filter Creation For Order Info
  router.post('/LE/orderinfo/Outward/Filter_Creation', externalApiHandler.OrderInfoFilterCreation);
  router.put('/LE/Global/Outward/Filter_Creation_NonSap', externalApiHandler.GlobalFilterCreationNonSap);

  // Count APIs for Global  Outward 

  router.post('/LE/Outward/GlobalScreen/CountWithSap', externalApiHandler.GlobalOutwardCountWithSap);

  //API for getting user details
  router.post('/LE/GlobalUserAuth', externalApiHandler.GlobalUserAuth);

  router.get('/LE/UserCreation/DisplayTable', externalApiHandler.UserCreationDisplayTable);

  router.post('/LE/UserCreationDelete', externalApiHandler.UserCreationDelete);
router.put('/LE/send-credentials', externalApiHandler.sendCredentials);

 router.post('/LE/ServiceLevel/Outword/withsap/FeedbackCreation', externalApiHandler.FeedbackCreationwithsap);
 router.put('/LE/ServiceLevel/Outword/WithoutSap/FeedbackCreation', externalApiHandler.FeedbackCreationwithoutsap);
 router.post('/LE/ServiceLevel/Outward/WithSap/InvoiceDetailsfetch', externalApiHandler.FeedBackInvoiceDetailsfetchwithsap);
 router.put('/LE/ServiceLevel/Outward/WithoutSap/InvoiceDetailsfetch', externalApiHandler.FeedBackInvoiceDetailsfetchwithoutsap);

//Reports
router.post('/LE/Reports/FetchTransitReport', externalApiHandler.FetchTransitReport);
router.post('/LE/Reports/FetchPendingPods', externalApiHandler.FetchPendingPods);
router.post('/LE/Reports/FetchLoadingFactorandCost', externalApiHandler.FetchLoadingFactorandCost);
router.post('/LE/Reports/FetchFreightBills', externalApiHandler.FetchFreightBills);



  return router;
})();
