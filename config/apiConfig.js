module.exports = (() => {
  const server = process.env.SERVER || "dev"; //dev  //Set the server environment variable (default to 'dev')
  const baseUrls = {
    prod: "http://10.10.6.115:8000",
    dev: "http://10.10.6.115:8000",
  };
  const login = "http://10.10.6.115:8000";
  const baseUrl = baseUrls[server];


  return {
    // Credentials for 115
    THIRD_PARTY_USERNAME: process.env.THIRD_PARTY_USERNAME || "Dev00", //"ims113"
    THIRD_PARTY_PASSWORD: process.env.THIRD_PARTY_PASSWORD || "R@p!d#3125",//"$anB@0625",//"Sh@rv1512", //"Sh@rv1511",

    // THIRD_PARTY_USERNAME: process.env.THIRD_PARTY_USERNAME || "110203",
    // THIRD_PARTY_PASSWORD: process.env.THIRD_PARTY_PASSWORD || "Venp0rt@Hps234",

    // THIRD_PARTY_USERNAME2: process.env.THIRD_PARTY_USERNAME2 || "ims113",
    // THIRD_PARTY_PASSWORD2: process.env.THIRD_PARTY_PASSWORD2 || "Ims$0425",

    // Credentials for 113
    THIRD_PARTY_USERNAME2: process.env.THIRD_PARTY_USERNAME2 || "Dev00", //"Dev00",
    THIRD_PARTY_PASSWORD2: process.env.THIRD_PARTY_PASSWORD2 || "Th!nk#0725", //"HBL@2025",//"$bx#@113",

    // API Calls
    THIRD_PARTY_API_URL_POST_LOGIN: `${login}/login/create?sap-client=234`,
    // THIRD_PARTY_API_URL_POST_LOGIN: `${baseUrl}/login/create?sap-client=234`,

    // THIRD_PARTY_API_URL_PUT_GET_LOT_REPORTS: `${baseUrl}/qm/result_rec/record?sap-client=400`,
    // THIRD_PARTY_API_URL_POST_UPDATE_RESULT_RECORDING: `${baseUrl}/qm/result_rec/record?sap-client=400`,
    // THIRD_PARTY_API_URL_POST_UDSUBMIT_RESULT: `${baseUrl}/qm/usage_ud/decision?sap-client=400`,
    // THIRD_PARTY_API_URL_POST_REPORT_ZQAR: `${baseUrl}/qm/quality/report?sap-client=400`,
    // THIRD_PARTY_API_URL_POST_REPORT_ZQA32: `${baseUrl}/qm/pending/lots?sap-client=400 `,
    // THIRD_PARTY_API_URL_POST_QR_CODE: `${baseUrl}/qm/qr_generation/transfer?sap-client=400`,
    // THIRD_PARTY_API_URL_POST_ZPRDID: `${baseUrl}/qm/prdid/product?sap-client=400`,
    // THIRD_PARTY_API_URL_POST_TYPE_TEST: `${baseUrl}/qm/type_test/typetest?sap-client=400`,
    // THIRD_PARTY_API_URL_POST_COOIS_Order_Confirmation: `${baseUrl}/sipl_pp/coois/porder?sap-client=100`,
    // THIRD_PARTY_API_URL_POST_CO11_Order_Confirmation_ZCO11N: `${baseUrl}/sipl_pp/prod_order/zco11n?sap-client=100`,
    THIRD_PARTY_API_URL_POST_LE_OrderInfo_Outward_sapfetch: `${baseUrl}/le/order_info/list?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_OrderInfo_Outward_Save: `${baseUrl}/le/order_info/list?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_OrderInfo_Outword_NonSap_Save: `${baseUrl}/le/order_info/list?sap-client=234`,
    THIRD_PARTY_API_URL_GET_LE_OrderInfo_plant_division_Biltype: `${baseUrl}/le/order_info/list?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_OrderInfo_getzone: `${baseUrl}/le/order_info/list?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_OrderInfo_custGroup: `${baseUrl}/le/order_info/list?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_OrderInfo_Physicaldispatch: `${baseUrl}/le/order_info/list?sap-client=234`,
    ReferenceNoFetch: `${baseUrl}/le/order_info/list?sap-client=234`,
    ReferenceNoFetch_Withoutsap: `${baseUrl}/le/order_info/list?sap-client=234`,
    // global_Fields_SearchOption: `${baseUrl}/le/order_info/list?sap-client=234`,
    global_Fields_SearchOption: `${baseUrl}/le/search/display?sap-client=234`,
    global_Fields_SearchOption_WithoutSap: `${baseUrl}/le/search/display?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_OrderInfo_PlantBasedDivison: `${baseUrl}/le/order_info/list?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_OrderInfo_Outward_DeleteWithSap: `${baseUrl}/le/order_info/list?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_OrderInfo_DeleteWithoutSap: `${baseUrl}/le/order_info/list?sap-client=234`,



    THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_sapfetch: `${baseUrl}/le/shipment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_Save: `${baseUrl}/le/shipment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_GET_LE_ShipmentDetails_NonSap_typeofmaterial: `${baseUrl}/le/shpmnt_nonsap/details?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_ShipmentDetails_NonSap_Incoterms: `${baseUrl}/le/shpmnt_nonsap/details?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_NonSap_Save: `${baseUrl}/le/shpmnt_nonsap/details?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_NonSap_Reports: `${baseUrl}/le/shpmnt_nonsap/details?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_Change: `${baseUrl}/le/shipment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_ChangeWithouSap: `${baseUrl}/le/shpmnt_nonsap/details?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_ShipmentDeleteWithsap: `${baseUrl}/le/shipment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_ShipmentDeleteWithoutsap: `${baseUrl}/le/shpmnt_nonsap/details?sap-client=234`,



    THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_sapfetch: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_Save: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outword_NonSap_Save: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_GET_LE_SegmentInfo_supplier_segment_custgrp: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_getzone: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outward_WithSap_TAT_Type: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outward_NonSap_TAT_Type: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_ChangeWithSap: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outword_ChangeWithoutSap: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_DeleteWithSap: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outword_DeleteWithoutSap: `${baseUrl}/le/segment_sap/det?sap-client=234`,

    THIRD_PARTY_API_URL_POST_LE_TransitInfo_WithSap_Save: `${baseUrl}/le/transit_info/info?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_TransitInfo_NonSap: `${baseUrl}/le/transit_info/info?sap-client=234`,

    // Transit info delete URLs
    THIRD_PARTY_API_URL_POST_LE_TransitInfo_WithSap_Delete: `${baseUrl}/le/transit_info/info?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_TransitInfo_WithoutSap_Delete: `${baseUrl}/le/transit_info/info?sap-client=234`,

    // Transit info change URLs
    THIRD_PARTY_API_URL_POST_LE_Outward_TransitInfo_WithSap_Change: `${baseUrl}/le/transit_info/info?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_Outward_TransitInfo_WithOutSap_Change: `${baseUrl}/le/transit_info/info?sap-client=234`,
   
    // FreightBilling URLs
    THIRD_PARTY_API_URL_POST_LE_FreightBilling_WithSap_Save: `${baseUrl}/le/freight_billing/billing?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_FreightBilling_NonSap_Create: `${baseUrl}/le/freight_billing/billing?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_FreightBilling_ChangeWithSap: `${baseUrl}/le/freight_billing/billing?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_FreightBilling_ChangeWithoutSap: `${baseUrl}/le/freight_billing/billing?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_FreightBilling_WithSap_Delete: `${baseUrl}/le/freight_billing/billing?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_FreightBilling_NonSap_Delete: `${baseUrl}/le/freight_billing/billing?sap-client=234`,
     
    //Vehicle Info Outward URLs
    THIRD_PARTY_API_URL_POST_LE_Vehicleinfo_Outward_sapfetch: `${baseUrl}/le/vehicle/info?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_Vehicleinfo_Outward_Save: `${baseUrl}/le/vehicle/info?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_Vehicleinfo_Outword_NonSap_Save: `${baseUrl}/le/vehicle/info?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_Vehicleinfo_Outward_Mapid: `${baseUrl}/le/vehicle/info?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_Vehicleinfo_Outward_Mapidfornonsap: `${baseUrl}/le/vehicle/info?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_Vehicleinfo_Outword_NonSap_DCNO: `${baseUrl}/le/vehicle/info?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_Vehicleinfo_Outward_ChangeWithSap: `${baseUrl}/le/vehicle/info?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_Vehicleinfo_Outword_ChangeWithoutSap: `${baseUrl}/le/vehicle/info?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_Vehicleinfo_Outward_DeleteWithSap: `${baseUrl}/le/vehicle/info?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_Vehicleinfo_Outword_DeleteWithoutSap: `${baseUrl}/le/vehicle/info?sap-client=234`,

    // Invoice Load Details Outward URLs
    THIRD_PARTY_API_URL_POST_LE_InvoiceloadDetails_Outward_sapfetch: `${baseUrl}/le/inv_load/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_InvoiceloadDetails_Outward_sapget: `${baseUrl}/le/inv_load/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_InvoiceloadDetails_Outward_Save: `${baseUrl}/le/inv_load/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_InvoiceloadDetails_Outword_NonSap_Save: `${baseUrl}/le/inv_load/det?sap-client=234`,
    THIRD_PARTY_API_URL_GET_LE_InvoiceloadDetails_typeofvehicle: `${baseUrl}/le/inv_load/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_InvoiceloadDetails_Outward_DeleteWithsap: `${baseUrl}/le/inv_load/det?sap-client=234`,
      THIRD_PARTY_API_URL_PUT_LE_InvoiceloadDetails_Outward_DeleteWithoutsap: `${baseUrl}/le/inv_load/det?sap-client=234`,

    // Insurance Claim Tracking Outward URLs
    THIRD_PARTY_API_URL_POST_LE_InsuranceClaimTracking_Outward_fetchinvoicelist: `${baseUrl}/le/insurance_cs/status?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_InsuranceClaimTracking_Outward_Save: `${baseUrl}/le/insurance_cs/status?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_InsuranceClaimTracking_Outword_fetchinvoicelistnonsap: `${baseUrl}/le/insurance_cs/status?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_InsuranceClaimTracking_Outword_Nonsapsave: `${baseUrl}/le/insurance_cs/status?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_InsuranceClaimTracking_Outward_DeleteWithSap: `${baseUrl}/le/transit_info/info?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_InsuranceClaimTracking_Outword_DeleteWithoutSap: `${baseUrl}/le/transit_info/info?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_InsuranceClaimTracking_Outward_Change_WithSap: `${baseUrl}/le/insurance_cs/status?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_InsuranceClaimTracking_Outward_Change_WithoutSap: `${baseUrl}/le/insurance_cs/status?sap-client=234`,

    // Transit Damage Info Outward URLs
    THIRD_PARTY_API_URL_POST_LE_TransitDamageInfo_Outward_fetchinvoicelist: `${baseUrl}/le/transit_dmg_inf/damage?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_TransitDamageInfo_Outward_Save: `${baseUrl}/le/transit_dmg_inf/damage?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_TransitDamageInfo_Outword_fetchinvoicelistnonsap: `${baseUrl}/le/transit_dmg_inf/damage?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_TransitDamageInfo_Outword_WithoutsapSave: `${baseUrl}/le/transit_dmg_inf/damage?sap-client=234`,
    //Transit Damage Info Delete URLs
    THIRD_PARTY_API_URL_POST_LE_TransitDamageInfo_Outward_DeleteWithSap: `${baseUrl}/le/transit_info/info?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_TransitDamageInfo_Outword_DeleteWithoutSap: `${baseUrl}/le/transit_info/info?sap-client=234`,
    // Transit Damage Info Change URLs
    THIRD_PARTY_API_URL_POST_LE_TransitDamageInfo_Outward_Change_WithSap: `${baseUrl}/le/transit_dmg_inf/damage?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_TransitDamageInfo_Outward_Change_WithoutSap: `${baseUrl}/le/transit_dmg_inf/damage?sap-client=234`,

    // Dispatch  Outward URLs
    THIRD_PARTY_API_URL_POST_LE_Dispatch_Outward_WithSap_Save: `${baseUrl}/le/dispatch/ref?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_Dispatch_Outward_WithoutSap_Save: `${baseUrl}/le/dispatch/ref?sap-client=234`,
    THIRD_PARTY_API_URL_GET_LE_Dispatch_Outward_Fetch_VendorCode: `${baseUrl}/le/dispatch/ref?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_Dispatch_Outward_Fetch_ReferenceNumber: `${baseUrl}/le/dispatch/ref?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_Dispatch_Outward_WithoutSap_Fetch_ReferenceNumber: `${baseUrl}/le/dispatch/ref?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_Dispatch_Outward_Edit_ReferenceNumber: `${baseUrl}/le/dispatch/ref?sap-client=234`,


    // Filter Creation For Dispatch
    THIRD_PARTY_API_URL_POST_LE_Dispatch_Outward_Filter_Creation: `${baseUrl}/le/dispatch/ref?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_Dispatch_Outward_Filter_Creation_NonSap: `${baseUrl}/le/dispatch/ref?sap-client=234`,


    // Filter Creation For Order Info
    THIRD_PARTY_API_URL_POST_LE_OrderInfo_Outward_Filter_Creation: `${baseUrl}/le/filter/api?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_Global_Outward_Filter_Creation_NonSap: `${baseUrl}/le/filter/api?sap-client=234`,



  };
})();
