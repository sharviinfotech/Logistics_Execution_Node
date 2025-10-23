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
    THIRD_PARTY_PASSWORD: process.env.THIRD_PARTY_PASSWORD || "Th!nk#1025",//"$anB@0625",//"Sh@rv1512", //"Sh@rv1511",

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


    THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_sapfetch: `${baseUrl}/le/shipment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_ShipmentDetails_Outward_Save: `${baseUrl}/le/shipment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_GET_LE_ShipmentDetails_NonSap_typeofmaterial: `${baseUrl}/le/shpmnt_nonsap/details?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_ShipmentDetails_NonSap_Incoterms: `${baseUrl}/le/shpmnt_nonsap/details?sap-client=234`,
    // THIRD_PARTY_API_URL_PUT_LE_ShipmentDetails_NonSap_Incoterms: `${baseUrl}/le/shpmnt_nonsap/details?sap-client=234`,


    THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_sapfetch: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_POST_LE_SegmentInfo_Outward_Save: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_Outword_NonSap_Save: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_GET_LE_SegmentInfo_supplier_segment_custgrp: `${baseUrl}/le/segment_sap/det?sap-client=234`,
    THIRD_PARTY_API_URL_PUT_LE_SegmentInfo_getzone: `${baseUrl}/le/segment_sap/det?sap-client=234`,

     THIRD_PARTY_API_URL_POST_LE_TransitInfo_WithSap_Save: `${baseUrl}/le/transit_info/info?sap-client=234`,
     THIRD_PARTY_API_URL_PUT_LE_TransitInfo_NonSap: `${baseUrl}/le/transit_info/info?sap-client=234`,

     THIRD_PARTY_API_URL_POST_LE_FreightBilling_WithSap_Save: `${baseUrl}/le/freight_billing/billing?sap-client=234`,
      THIRD_PARTY_API_URL_PUT_LE_FreightBilling_NonSap_Create: `${baseUrl}/le/freight_billing/billing?sap-client=234`,

  };
})();
