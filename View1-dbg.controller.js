sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "dicv/zcomplaintsmangt/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History",
    "sap/ui/model/odata/v2/ODataModel"

],
    function (Controller, Fragment, JSONModel, MessageBox, formatter, Filter, FilterOperator, History, ODataModel) {
        "use strict";
        var oBusyDialog, oVINCMp, oVIN, oComplnt_Id, oSubmit, nStatus, dPath, Gen_Num = '', oCSC = '', Old_New = '';
        return Controller.extend("dicv.zcomplaintsmangt.controller.View1", {
            formatter: formatter,
            onInit: function () {
                var that = this;
                this.aCmplntId = "";
                oBusyDialog = new sap.m.BusyDialog({});
                var oJobJSONModel = new sap.ui.model.json.JSONModel([]);
                this.getOwnerComponent().setModel(oJobJSONModel, "ComplaintsModel");
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/DealerData", []);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/AreaData", []);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/SubAreaData", []);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/BillTypeData", []);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/SourecData", []);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/ModeData", []);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldData", []);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/LogsData", []);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleFileds", true);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleNotes", true);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/Attachments", []);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/MrdtVisible", false);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldVisible", false);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/OrgAttachments", []);
                oVINCMp = this.getOwnerComponent().getComponentData().startupParameters.VIN;
                if (!oVINCMp || oVINCMp === undefined) {
                    MessageBox.warning("To create complaint please access this application through Vehicle overview app");
                    const oHistory = History.getInstance();
                    const sPreviousHash = oHistory.getPreviousHash();
                    if (sPreviousHash !== undefined) {
                        window.history.go(-1);
                    }
                    return;
                }
                oVINCMp = oVINCMp[0]
                oVIN = oVINCMp.split("/");
                oComplnt_Id = oVIN[1];

                var lvProp = this.getView().getCustomData("properties"); //[0].mProperties.value;
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldVisible", false);
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VIN", oVIN[0]);
                this.byId("Status_Id").setEditable(false);
                this.byId("Area_Id").setEnabled(true);
                this.byId("SubAr_Id").setEnabled(true);
                this._getComplaintData(oVIN);
                this._ReadDealerData();
                this._ReadKAMFlag(oVIN[0]);
                this._initFn();
                this._serviceUrl = this.getURLForService();
                this.oModelData = new sap.ui.model.odata.v2.ODataModel(this._serviceUrl, {
                    defaultBindingMode: " "
                });
            },
            getURLForService: function () {
                var systemAlias = "LOCAL";
                return (sap.ui.model.odata.ODataUtils.setOrigin("/sap/opu/odata/sap/CV_ATTACHMENT_SRV", systemAlias));
            },
            _getComplaintData: function (oVIN) {
                if (oComplnt_Id) {
                    var that = this;
                    this.aCmplntId = oComplnt_Id;
                    var b = that.getOwnerComponent().getModel("ComplaintsModel");
                    var oSuccess, oError;
                    oBusyDialog.open();
                    oSuccess = function (oData) {
                        oBusyDialog.close();
                        var oResults = oData.results;

                        this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/MrdtVisible", true);

                        if (oResults.length > 0) {
                            oCSC = oResults[0].Csc_Flag;
                            Old_New = oResults[0].Old_New_Flag;
                            that.byId("Status_Id").setEditable(true);
                            this.byId('RsaStatus_Id').setVisible(false);
                            that.byId("Status_Id").setVisible(true);
                            that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/", oResults[0]);
                            //that.getOwnerComponent().setModel("ComplaintsModel", oResults[0]);
                            var stats = that.validateSatus(oResults[0].Status);
                            that.byId("Status_Id").setSelectedKey(stats);
                            that.byId("Area_Id").setValue(oResults[0].Area);
                            that.getAttachments(oComplnt_Id);
                            nStatus = oResults[0].Status;
                            if (oResults[0].Area) {
                                that.onFilterSubArea(oResults[0].Area);
                            }

                            if (oResults[0].Area.toUpperCase() === 'RSA/OFF ROAD') {
                                this.byId("OffRdLctnLbl_Id").setRequired(true);
                                this.byId("LadCrrdLbl_Id").setRequired(true);
                                this.byId("TypeRuteLbl_Id").setRequired(false);
                                this.byId("DistnLbl_Id").setRequired(false);
                                this.byId("DlrLabel_Id").setRequired(true);
                                this.byId("NotesLabel_Id").setRequired(true);
                                this.byId('BillTyp_Id').setEnabled(false);
                                this.byId("Area_Id").setEnabled(false);
                                this.byId("SubAr_Id").setEnabled(false);
                                this.byId("OffRdLctn_Id").setEditable(false);
                                this.byId("LoadCrrd_Id").setEditable(false);
                                if(oResults[0].RSAStatus !== ''){
                                this.byId('RsaStatus_Id').setVisible(true);
                                that.byId("Status_Id").setVisible(false);
                                }
                                if (oResults[0].Csc_Flag === '') {
                                    this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/MrdtVisible", false);

                                }
                                if (oResults[0].Status.toUpperCase() === "VEHICLE DELIVERED" || oResults[0].Status.toUpperCase() === "CLOSED") {
                                    this.byId("BillTypLabel_Id").setRequired(true);
                                    this.byId("MsvStrtDat_Id").setRequired(true);
                                    this.byId("MsvStrtT_Id").setRequired(true);
                                    this.byId("MsvRchD_Id").setRequired(true);
                                    this.byId("MsvRchT_Id").setRequired(true);
                                }
                                if (oResults[0].Status.toUpperCase() === 'WORK IN PROGRESS') {
                                    this.byId("MsvStrtDat_Id").setRequired(true);
                                    this.byId("MsvStrtT_Id").setRequired(true);
                                }
                            }
                            if (oResults[0].Area.toUpperCase() === 'SERVICE') {
                                this.byId("DlrLabel_Id").setRequired(true);
                            }

                            if (oResults[0].Area.toUpperCase() === 'SSI') {
                                this.byId("DlrLabel_Id").setRequired(true);
                                this.byId("Area_Id").setEnabled(false);
                                this.byId("SubAr_Id").setEnabled(false);
                            }
                            that.byId("SubAr_Id").setValue(oResults[0].SubArea);
                            that.byId("Csource_Id").setValue(oResults[0].ComplaintSource);
                            that.byId("CmplntM_Id").setValue(oResults[0].ComplaintMode);
                            that.byId("HoldRsn_Id").setValue(oResults[0].HoldReason);
                            that.byId("BillTyp_Id").setValue(oResults[0].BilltoType);
                            this.byId("rdn_Id").setSelectedKey(oResults[0].ReasonDelayMSVReach);
                            this.byId("dlrsn_Id").setSelectedKey(oResults[0].DelayReasonOnroad);

                            if (oResults[0].Status.toUpperCase() === "VEHICLE DELIVERED") {
                                this.byId("onRdDteLabl_Id").setRequired(true);
                                this.byId("onRDTmeLbl_Id").setRequired(true);
                                this.byId("ActknLabl_Id").setRequired(true);
                            }
                            if (oResults[0].Status.toUpperCase() === "HOLD") {
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldVisible", true);
                                that.byId("holdRsnLbl_Id").setRequired(true);
                            }
                            else {
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldVisible", false);
                                that.byId("holdRsnLbl_Id").setRequired(false);
                            }
                            if (oResults[0].Status.toUpperCase() === "CANCELED") {
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleNotes", false);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleFileds", false);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/MrdtVisible", false);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldVisible", false);
                                this.byId("Area_Id").setEnabled(false);
                                this.byId("SubAr_Id").setEnabled(false);
                                this.byId("ODate_Id").setEditable(false);
                                this.byId("OTime_Id").setEditable(false);
                                this.byId("ActknLabl_Id").setRequired(true);
                                this.byId("ActnTkn_Id").setEnabled(false);
                                this.byId("Attach_Id").setEnabled(false);
                                if (oResults[0].Role_Ind !== "X") {
                                    this.byId("Status_Id").setEditable(false);
                                }
                                else if (oResults[0].Role_Ind === "X") {
                                    this.byId("Status_Id").setEditable(true);

                                }
                            }
                            if (oResults[0].Status.toUpperCase() === "CLOSED") {
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/MrdtVisible", false);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleFileds", false);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleNotes", false);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldVisible", false);
                                this.byId("Area_Id").setEnabled(false);
                                this.byId("SubAr_Id").setEnabled(false);
                                this.byId("ODate_Id").setEditable(false);
                                this.byId("OTime_Id").setEditable(false);
                                this.byId("ActknLabl_Id").setRequired(true);
                                this.byId("ActnTkn_Id").setEnabled(false);
                                this.byId("Attach_Id").setEnabled(false);
                                if (oResults[0].Role_Ind !== "X") {
                                    this.byId("Status_Id").setEditable(false);
                                }
                                else if (oResults[0].Role_Ind === "X") {
                                    this.byId("Status_Id").setEditable(true);

                                }
                            }
                            if (oResults[0].Status.toUpperCase() === "REOPEN" && oResults[0].Role_Ind === "X") {
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleNotes", true);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleFileds", true);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/MrdtVisible", true);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldVisible", true);
                                this.byId("ODate_Id").setEditable(false);
                                this.byId("OTime_Id").setEditable(false);
                                this.byId("ActknLabl_Id").setRequired(false);
                                this.byId("ActnTkn_Id").setEnabled(true);
                                this.byId("Attach_Id").setEnabled(true);
                                this.byId("Status_Id").setEditable(true);
                            }
                            else if (oResults[0].Status.toUpperCase() === "REOPEN" && oResults[0].Role_Ind !== "X") {
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleNotes", false);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleFileds", false);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/MrdtVisible", false);
                                that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldVisible", false);
                                this.byId("Area_Id").setEnabled(false);
                                this.byId("SubAr_Id").setEnabled(false);
                                this.byId("ODate_Id").setEditable(false);
                                this.byId("OTime_Id").setEditable(false);
                                this.byId("ActnTkn_Id").setEnabled(false);
                                this.byId("Attach_Id").setEnabled(false);
                                this.byId("Status_Id").setEditable(false);
                            }
                            //Changes done by Prabhu
                            // var oArea = oResults[0].Area;
                            // var oStatus = oResults[0].Status;
                            // if(oArea === "RSA/Off Road"){
                            //     that.getView().byId("Status_Id").setVisible(false);
                            //     that.getView().byId("idStatusRSA").setVisible(true);
                            //     that.getView().byId("idStatusRSA").setValue(oStatus);
                            //     that.getView().byId("idRsaLabel").setVisible(true);
                            // }else{
                            //     that.getView().byId("idStatusRSA").setVisible(false);
                            //     that.getView().byId("idRsaLabel").setVisible(false);
                            // }
                            //Changes done by Prabhu
                        }
                    }.bind(this);
                    oError = function (e) {
                        oBusyDialog.close();
                        MessageBox.error(JSON.parse(e.responseText).error.message.value);
                    };
                    var sFilters = [];
                    sFilters.push(new sap.ui.model.Filter("VIN", sap.ui.model.FilterOperator.EQ, oVIN[0]));
                    sFilters.push(new sap.ui.model.Filter("Complaint_Id", sap.ui.model.FilterOperator.EQ, oComplnt_Id));
                    this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/Complaint_infoSet", {
                        filters: sFilters,
                        success: oSuccess,
                        error: oError
                    });
                }
            },
            validateSatus: function (status) {
                if (status === 'New / Open') {
                    return 'E0001';
                }
                else if (status === 'Awaiting Inspection') {
                    return 'E0010';
                }
                else if (status === 'Work In Progress') {
                    return 'E0002';
                }
                else if (status === 'Hold') {
                    return 'E0011';
                }
                else if (status === 'Vehicle Delivered') {
                    return 'E0004';
                }
                else if (status === 'Closed') {
                    return 'E0005';
                }
                else if (status === 'Canceled') {
                    return 'E0006';
                }
                else if (status === 'Reopen') {
                    return 'E0017';
                }
            },
            _ReadDealerData: function () {
                var that = this;
                var oSuccess, oError;
                oBusyDialog.open();
                oSuccess = function (oData) {
                    oBusyDialog.close();
                    that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/DealerData", oData.results);

                }.bind(this);
                oError = function (e) {
                    oBusyDialog.close();
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);
                };
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/DelaerCode_VHSet", {
                    success: oSuccess,
                    error: oError
                });
            },
            _ReadAreaData: function () {
                var that = this;
                var oSuccess, oError;
                oSuccess = function (oData) {
                    that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/AreaData", oData.results);
                }.bind(this);
                oError = function (e) {
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);
                };
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/Area_VHSet", {
                    success: oSuccess,
                    error: oError
                });
            },
            _ReadComplaintSourceData: function () {
                var that = this;
                var oSuccess, oError;
                oSuccess = function (oData) {
                    that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/SourecData", oData.results);

                }.bind(this);
                oError = function (e) {
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);
                };
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/ComplaintSource_VHSet", {
                    success: oSuccess,
                    error: oError
                });
            },
            _ReadComplaintModeData: function () {
                var that = this;
                var oSuccess, oError;

                oSuccess = function (oData) {
                    that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/ModeData", oData.results);
                }.bind(this);
                oError = function (e) {
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);
                };
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/ComplaintMode_VHSet", {
                    success: oSuccess,
                    error: oError
                });
            },
            _ReadBillTypeData: function () {
                var that = this;
                var oSuccess, oError;
                oSuccess = function (oData) {
                    that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/BillTypeData", oData.results);

                }.bind(this);
                oError = function (e) {
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);
                };
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/BillToType_VHSet", {
                    success: oSuccess,
                    error: oError
                });
            },
            _ReadHoldReasonData: function () {
                var that = this;
                var oSuccess, oError;
                oSuccess = function (oData) {
                    that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldData", oData.results);
                }.bind(this);
                oError = function (e) {
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);
                };
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/HoldReason_VHSet", {
                    success: oSuccess,
                    error: oError
                });
            },
            _ReadNotesLogData: function () {
                var that = this;
                var oSuccess, oError;
                var sFilters = [];
                sFilters.push(new sap.ui.model.Filter("Complaint_ID", sap.ui.model.FilterOperator.EQ, oVIN[1]));
                oSuccess = function (oData) {
                    that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/LogsData", oData.results);
                }.bind(this);
                oError = function (e) {
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);
                };
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/Notes_LogSet", {
                    filters: sFilters,
                    success: oSuccess,
                    error: oError
                });
            },
            _ReadAggregateData: function () {
                var that = this;
                var oSuccess, oError;

                oSuccess = function (oData) {
                    that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/AgrgteData", oData.results);
                }.bind(this);
                oError = function (e) {
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);
                };
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/Aggregate_VHSet", {
                    success: oSuccess,
                    error: oError
                });
            },
            _ReadCallerDesignationData: function () {
                var that = this;
                var oSuccess, oError;
                // Success handler
                oSuccess = function (oData) {
                    that.getOwnerComponent()
                        .getModel("ComplaintsModel")
                        .setProperty("/CallerDesignationData", oData.results);
                }.bind(this);

                // Error handler
                oError = function (e) {
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);
                };

                // OData call
                this.getOwnerComponent()
                    .getModel("ZCUST_COMPLAINT_SRV")
                    .read("/Caller_Designation_VHSet", {
                        success: oSuccess,
                        error: oError
                    });

            },
            onBrkdwnLocatn: function () {
                var oComplaintsModel = this.getOwnerComponent().getModel("ComplaintsModel");
                var sPhone = oComplaintsModel.getProperty("/CallercontactNumber");
                var sVin = oComplaintsModel.getProperty("/VIN");
                if (!sPhone) {
                    MessageBox.warning("Caller contact Number is require.");
                    return;
                }
                var that = this;
                that.byId("page").setBusy(true);
                this.getOwnerComponent().getModel("ZSVC_CM_LOCATION_SRV").read("/Customer_LatlongSet(CallercontactNumber='" + sPhone + "',VIN='" + sVin + "')", {
                    success: function (oData) {
                        if (oData.Message === 'S') {
                            that.byId("page").setBusy(false);
                            // that.getView().byId("bdlat_Id").setValue(oData.Latitude);
                            // that.getView().byId("bdlong_Id").setValue(oData.Longitude);
                            oComplaintsModel.setProperty("/ZZ1_BD_latitude", '');
                            oComplaintsModel.setProperty("/ZZ1_BD_longitude", '');
                            MessageBox.success("Location SMS sent successfully");
                            Gen_Num = oData.Gen_Num;
                            var sdler = oComplaintsModel.getProperty("/DealerCode");
                            if (sdler) {
                                that.getBDtoWSDistnc(sdler);
                            }
                        }
                        else {
                            that.byId("page").setBusy(false);
                            MessageBox.error("Breakdown Location is not shared Please try again")
                        }
                    },
                    error: function (oError) {
                        that.byId("page").setBusy(false);
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    }
                });
            },
            onnearbyloc: function () {
                var oJSON = new sap.ui.model.json.JSONModel({
                    'Text': 'OK',
                    'FormTitle':'Nearby Plants',
                            'NearLocTable': true,
                            'NearLocForm': false
                        });
                        this.getView().setModel(oJSON, "PlantVisible");
                var oComplaintsModel = this.getOwnerComponent().getModel("ComplaintsModel");
                var oModel = this.getOwnerComponent().getModel("ZSVC_CM_LOCATION_SRV");
                var that = this;
                var sLat = this.getView().byId("bdlat_Id").getValue();
                var sLong = this.getView().byId("bdlong_Id").getValue();
                // if (!sLat || !sLong) {
                //     sap.m.MessageBox.error("Please get the Brake down Lat long from customer.");
                //     return;
                // }
                var oGenNum = oVIN[0] + "_" + Gen_Num;
                var sFilters = [];
                sFilters.push(new sap.ui.model.Filter("Latitude", sap.ui.model.FilterOperator.EQ, sLat));
                sFilters.push(new sap.ui.model.Filter("Longitude", sap.ui.model.FilterOperator.EQ, sLong));
                sFilters.push(new sap.ui.model.Filter("Gen_Num", sap.ui.model.FilterOperator.EQ, oGenNum));

                //var sPath = "/Dealer_LatlongSet?$filter=(Gen_Num eq '" + sLong + "')";
                oModel.read("/Dealer_LatlongSet", {
                    filters:sFilters,
                    success: function (oData) {
                        // Populate table model
                        if(oData.results[0].Flag === 'E'){
                         MessageBox.error("Please contact customer to share break down lat long");
                        }
                        else {
                            if(!sLat && !sLong){
                        that.byId('bdlat_Id').setValue(oData.results[0].Latitude);
                        that.byId('bdlong_Id').setValue(oData.results[0].Longitude);
                        var sResult = oData.results;
                        oData.results.shift();
                            }
                        var oJSOND = new sap.ui.model.json.JSONModel(oData);
                        that.getView().setModel(oJSOND, "NearbyModel");
                    
                        if (!that._oNearbyDialog) {
                            Fragment.load({
                                id: that.getView().getId(),
                                name: "dicv.zcomplaintsmangt.fragments.NearbyLocations",
                                controller: that
                            }).then(function (oDialog) {
                                that._oNearbyDialog = oDialog;
                                that.getView().addDependent(oDialog);
                                oDialog.open();
                            });
                        } else {
                            that._oNearbyDialog.open();
                        }
                    }
                    

                    },
                    error: function (err) {
                        MessageBox.error(JSON.parse(err.responseText).error.message.value);
                    }
                });
            },
            onCloseNearbyDialog: function () {
                if (this._oNearbyDialog) {
                    this._oNearbyDialog.close();
                }
            },
            _ReadKAMFlag: function (VIN) {
                var that = this;

                this.getOwnerComponent()
                    .getModel("ZCUST_COMPLAINT_SRV")
                    .read("/KAM_CustSet('" + VIN + "')", {
                        success: function (oData) {
                            that.getOwnerComponent()
                                .getModel("ComplaintsModel")
                                .setProperty("/ZZ1_KAM_Flag", oData.ZZ1_KAM_Flag || "");
                            if (oData.ZZ1_KAM_Flag === 'X') {
                                that.byId('IDkamflag').setValue('Yes');
                            }
                            else {
                                that.byId('IDkamflag').setValue('No');
                            }
                        },
                        error: function (e) {
                            that.getOwnerComponent()
                                .getModel("ComplaintsModel")
                                .setProperty("/ZZ1_KAM_Flag", "");
                        }
                    });
            },
            _initFn: function () {
                this._ReadAreaData();
                this._ReadComplaintSourceData();
                this._ReadComplaintModeData();
                this._ReadHoldReasonData();
                this._ReadBillTypeData();
                this._ReadNotesLogData();
                this._ReadAggregateData();
                this._ReadCallerDesignationData();
                var complntData = this.getOwnerComponent().getModel("ComplaintsModel");
                var BindData = complntData.getData();

                var sJson = new JSONModel([]);
                this.getOwnerComponent().setModel(sJson, "VisibleModel");

                if (oVIN[1]) {
                    //this.getOwnerComponent().getModel("VisibleModel").setProperty("/", );
                    this.byId("ODate_Id").setEditable(false);
                    this.byId("OTime_Id").setEditable(false);
                }
                else {
                    this.byId("ODate_Id").setEditable(true);
                    this.byId("OTime_Id").setEditable(true);
                }

            },
            _handleValueHelpSearch: function (oEvent) {
                var sQuery = oEvent.getParameter("value");
                var oFilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("Dealer", sap.ui.model.FilterOperator.Contains, sQuery),
                        new sap.ui.model.Filter("Dealer_desc", sap.ui.model.FilterOperator.Contains, sQuery),

                    ],
                    and: false
                });
                //   var oBinding = sap.ui.core.byId("slID").getBinding("items");
                oEvent.getSource().getBinding("items").filter(oFilter, sap.ui.model.FilterType.Application);

            },
            onSelectDealer: function (oEvent) {
                var that = this;
                var oSeletedDealer = oEvent.getParameter("selectedItem").getProperty("title");
                if (oSeletedDealer) {
                    var productInput = this.byId("DelrDcod_Id");
                    productInput.setValue(oSeletedDealer);
                    var sLat = this.byId("bdlat_Id").getValue();
                    var sLong = this.byId("bdlong_Id").getValue();
                    // if (sLat !== '' && sLong !== '') {
                    //     that.getBDtoWSDistnc(oSeletedDealer);
                    // }
                }
                oEvent.getSource().getBinding("items").filter([]);

                var oModel = that.getOwnerComponent().getModel("ComplaintsModel");
                var oSuccess, oError;
                oBusyDialog.open();
                oSuccess = function (oData) {
                    oBusyDialog.close();
                    var sResults = oData.results[0];
                    var currentDate = new Date();
                    this.byId("AsgnDte_Id").setDateValue(currentDate);
                    this.byId("AsgnTime_Id").setDateValue(currentDate);
                    if (oData.results.length > 0) {
                        oModel.setProperty("/ServicingDealer", sResults.ServicingDealer);
                        oModel.setProperty("/DealerCity", sResults.DealerCity);
                        oModel.setProperty("/JobCardNumber", sResults.JobCardNumber);
                        oModel.setProperty("/JobCardOpenDate", sResults.JobCardOpenDate);
                        oModel.setProperty("/JobCardStatus", sResults.JobCardStatus);
                    }

                }.bind(this);
                oError = function (e) {
                    oBusyDialog.close();
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);

                };
                var sFilters = [];
                sFilters.push(new sap.ui.model.Filter("DealerCode", sap.ui.model.FilterOperator.EQ, oSeletedDealer));
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/Dealer_InformationSet", {
                    filters: sFilters,
                    success: oSuccess,
                    error: oError
                });

                this.byId("DelrDcod_Id").setValueState("None");
            },
            getBDtoWSDistnc: function (sDlr) {
                var that = this;
                var sLong = this.getOwnerComponent().getModel('ComplaintsModel').getProperty("/ZZ1_BD_longitude");
                var sLat = this.getOwnerComponent().getModel('ComplaintsModel').getProperty("/ZZ1_BD_latitude");
                var oSuccess, oError;
                oBusyDialog.open();
                oSuccess = function (oData) {
                    oBusyDialog.close();
                    if (oData.Bd_Ws_Flag !== "") {
                        MessageBox.error(oData.Bd_Ws_Flag);
                    }
                    else {
                        var dsBDWS = oData.ZZ1_Dist_From_BD_To_WS;
                        if (oData.ZZ1_Dist_From_BD_To_WS !== '') {
                            dsBDWS = parseFloat(oData.ZZ1_Dist_From_BD_To_WS).toFixed(2)
                        }
                        that.getOwnerComponent().getModel('ComplaintsModel').setProperty("/ZZ1_Dist_From_BD_To_WS", dsBDWS);
                    }
                }.bind(this);
                oError = function (e) {
                    oBusyDialog.close();
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);

                };
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/Dist_BD_WSSet(DealerCode='" + sDlr + "',Latitude='" + sLat + "',Longitude='" + sLong + "')", {
                    success: oSuccess,
                    error: oError
                });
            },
            onSelectSubArea: function (oEvent) {
                var oSeletedArea = oEvent.getSource().getValue();
                if (oEvent) {
                    this.byId("SubAr_Id").setValueState("None");
                }
            },
            onSelectArea: function (oEvent) {
                var oSeletedArea = oEvent.getSource().getValue();
                this.byId("SubAr_Id").setValue("");
                if (oSeletedArea.toUpperCase() === 'ESCALATION') {
                    var sValue = this.byId("Csource_Id").getValue();
                    var mValue = this.byId("CmplntM_Id").getValue();
                    if (sValue === '' || mValue === '') {
                        return MessageBox.error("Complaint Source and mode is require");
                    }
                }
                this.byId("OffRdLctnLbl_Id").setRequired(false);
                this.byId("LadCrrdLbl_Id").setRequired(false);
                this.byId("TypeRuteLbl_Id").setRequired(false);
                this.byId("DistnLbl_Id").setRequired(false);
                this.byId("NotesLabel_Id").setRequired(false);
                this.byId("DlrLabel_Id").setRequired(false);
                this.byId('BillTyp_Id').setEnabled(true);
                this.byId('Status_Id').setEnabled(true);
                this.byId("BillTypLabel_Id").setRequired(false);
                if (oSeletedArea.toUpperCase() === 'RSA/OFF ROAD') {
                    this.byId("OffRdLctnLbl_Id").setRequired(true);
                    this.byId("LadCrrdLbl_Id").setRequired(true);
                    this.byId("TypeRuteLbl_Id").setRequired(false);
                    this.byId("DistnLbl_Id").setRequired(false);
                    this.byId("DlrLabel_Id").setRequired(true);
                    this.byId("NotesLabel_Id").setRequired(true);
                    this.byId('BillTyp_Id').setEnabled(false);

                }

                if (oSeletedArea.toUpperCase() === 'SERVICE') {
                    this.byId("DlrLabel_Id").setRequired(true);
                }

                if (oSeletedArea.toUpperCase() === 'SSI') {
                    this.byId("DlrLabel_Id").setRequired(true);
                }
                this.onFilterSubArea(oSeletedArea);
            },
            onFilterSubArea: function (oSetArea) {
                var that = this;
                var oStatus = nStatus;
                var oSuccess, oError;
                oBusyDialog.open();
                oSuccess = function (oData) {
                    oBusyDialog.close();
                    if (oSetArea.toUpperCase() === "ESCALATION") {
                        var sValue = this.byId("Csource_Id").getValue();
                        var mValue = this.byId("CmplntM_Id").getValue();
                        if (sValue === 'HQ' && mValue === 'Email') {
                            var obj = { 'SubArea': 'L1' };
                            oData.results[4] = obj;
                            obj = { 'SubArea': 'L2' };
                            oData.results[5] = obj;
                            obj = { 'SubArea': 'L3' };
                            oData.results[6] = obj;
                        }
                    }
                    that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/SubAreaData", oData.results);

                }.bind(this);
                oError = function (e) {
                    oBusyDialog.close();
                    MessageBox.error(JSON.parse(e.responseText).error.message.value);
                };
                var sFilters = [];
                sFilters.push(new sap.ui.model.Filter("SubArea", sap.ui.model.FilterOperator.EQ, oSetArea));
                this.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").read("/Subarea_VHSet", {
                    filters: sFilters,
                    success: oSuccess,
                    error: oError
                });
                this.byId("Area_Id").setValueState("None");
            },
            onSelectSource: function (oEvent) {
                var that = this, nDate, nTime;
                var oSelectedSource = oEvent.getSource().getValue().toUpperCase();
                var oSelectedMode = this.byId("CmplntM_Id").getValue();
                var sData = that.getOwnerComponent().getModel("ComplaintsModel");
                if (oVIN[1] === "") {
                    if (oSelectedSource === "DEALER TEAM") {
                        if (oSelectedMode === "Mobile" || oSelectedMode === "Email") {
                            nDate = "";
                            nTime = "";
                            this.getView().byId("ODate_Id").setEditable(true);
                            this.getView().byId("OTime_Id").setEditable(true);
                        }
                    }
                    else {
                        var oTodayDate = new Date();
                        nDate = oTodayDate.getMonth() + 1 + '.' + oTodayDate.getDate() + '.' + oTodayDate.getFullYear();
                        nTime = oTodayDate.getHours() + ':' + oTodayDate.getMinutes() + ':' + oTodayDate.getSeconds();
                        this.getView().byId("ODate_Id").setEditable(false);
                        this.getView().byId("OTime_Id").setEditable(false);
                    }
                    // sData.setProperty("/OpenDate", nDate);
                    // sData.setProperty("/OpenTime", nTime);
                    this.byId("ODate_Id").setDateValue(oTodayDate);
                    this.byId("OTime_Id").setDateValue(oTodayDate);
                }
            },
            onSelectMode: function (event) {
                var that = this, nDate, nTime;
                var oSelectedMode = event.getSource().getValue();
                var oSelectedSource = this.byId("Csource_Id").getValue().toUpperCase();
                var sData = that.getOwnerComponent().getModel("ComplaintsModel");
                if (oVIN[1] === "") {
                    if (oSelectedSource === "DEALER TEAM" && (oSelectedMode === "Mobile" || oSelectedMode === "Email")) {
                        nDate = "";
                        nTime = "";
                        this.getView().byId("ODate_Id").setEditable(true);
                        this.getView().byId("OTime_Id").setEditable(true);

                    }
                    else {
                        var oTodayDate = new Date();
                        nDate = oTodayDate.getMonth() + 1 + '.' + oTodayDate.getDate() + '.' + oTodayDate.getFullYear();
                        nTime = oTodayDate.getHours() + ':' + oTodayDate.getMinutes() + ':' + oTodayDate.getSeconds();
                        this.getView().byId("ODate_Id").setEditable(false);
                        this.getView().byId("OTime_Id").setEditable(false);
                    }
                    // sData.setProperty("/OpenDate", nDate);
                    // sData.setProperty("/OpenTime", nTime);
                    this.byId("ODate_Id").setDateValue(oTodayDate);
                    this.byId("OTime_Id").setDateValue(oTodayDate);
                }
            },
            onChangeDistnc: function (oEvent) {
                var sVal = oEvent.getSource().getValue();
                var sText = sVal.match(/[^0-9]/g);
                if (sText) {
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Enter numbers only");
                }
                else {
                    oEvent.getSource().setValueState("None");
                }
            },
            onODateChange: function (oEvent) {
                var that = this;
                var oModel = this.getOwnerComponent().getModel("ComplaintsModel");
                var oSelDate = oEvent.getSource().getProperty("dateValue");
                if (!oSelDate) {
                    oModel.setProperty("/OpenTime", "");
                    oModel.setProperty("/MSVStartDate", "");
                    oModel.setProperty("/MSVStartTime", "");
                    oModel.setProperty("/MSVReachDate", "");
                    oModel.setProperty("/MSVReachTime", "");
                    oModel.setProperty("/TimeTakenMSVReach", "");
                    oModel.setProperty("/OnRoadDate", "");
                    oModel.setProperty("/OnRoadTime", "");
                    oModel.setProperty("/TimetakenOnRoad", "");
                    return;
                }
                var oSelectedDate = oEvent.getParameter("value").split("."); // oEvent.getSource().getProperty("dateValue").toLocaleDateString().split('/');
                var sDate = parseInt(oSelectedDate[0]),
                    sMonth = parseInt(oSelectedDate[1]),
                    sYear = parseInt(oSelectedDate[2]);
                var currentDate = new Date();
                var cDate = currentDate.getDate(),
                    cMonth = currentDate.getMonth() + 1,
                    cYear = currentDate.getFullYear();
                //validating open date with current date
                if (sDate > cDate && (sMonth === cMonth && sYear === cYear)) {
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("ODate_Id").setValue("");
                }
                else if (sMonth > cMonth && sYear === cYear) {
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("ODate_Id").setValue("");
                }

                else if (sYear > cYear) {
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("ODate_Id").setValue("");
                }
                oModel.setProperty("/OpenTime", "");
                oModel.setProperty("/MSVStartDate", "");
                oModel.setProperty("/MSVStartTime", "");
                oModel.setProperty("/MSVReachDate", "");
                oModel.setProperty("/MSVReachTime", "");
                oModel.setProperty("/TimeTakenMSVReach", "");
                oModel.setProperty("/OnRoadDate", "");
                oModel.setProperty("/OnRoadTime", "");
                oModel.setProperty("/TimetakenOnRoad", "");
            },
            onOTimeChange: function (oEvent) {
                var sUser = sap.ushell.Container.getUser().getId();
                var oModel = this.getOwnerComponent().getModel("ComplaintsModel");
                var oSelectedTime = oEvent.getSource().getProperty("dateValue");
                if (!oSelectedTime) {
                    oModel.setProperty("/MSVStartDate", "");
                    oModel.setProperty("/MSVStartTime", "");
                    oModel.setProperty("/MSVReachDate", "");
                    oModel.setProperty("/MSVReachTime", "");
                    oModel.setProperty("/TimeTakenMSVReach", "");
                    oModel.setProperty("/OnRoadDate", "");
                    oModel.setProperty("/OnRoadTime", "");
                    oModel.setProperty("/TimetakenOnRoad", "");
                    return;
                }
                var sHrs = oSelectedTime.getHours(),
                    sMin = oSelectedTime.getMinutes(),
                    sSec = oSelectedTime.getSeconds();
                var currentTime = new Date();
                var cDate = currentTime.getDate(),
                    cMonth = currentTime.getMonth() + 1,
                    cYear = currentTime.getFullYear();
                var cHrs = currentTime.getHours(),
                    cMin = currentTime.getMinutes(),
                    cSec = currentTime.getSeconds();
                //validating open time with current time
                var sOpDate = this.byId("ODate_Id").getValue(); //open date
                if (!sOpDate) {
                    MessageBox.warning("Open Date is required to select time");
                    this.byId("OTime_Id").setValue("");
                    return;
                }
                var sOpenDate = sOpDate.split('.');
                var oDate = parseInt(sOpenDate[0]),
                    oMonth = parseInt(sOpenDate[1]),
                    oYear = parseInt(sOpenDate[2]);
                var Csource = this.byId("Csource_Id").getValue();
                var cMode = this.byId("CmplntM_Id").getValue();
                if (Csource.toUpperCase() === 'DEALER TEAM') {
                    if (cMode.toUpperCase() === 'MOBILE' || cMode.toUpperCase() === 'EMAIL') {
                        var fieldName = "openDate";
                        var startDate = cYear + "-" + cMonth + "-" + cDate + " " + cHrs + ":" + cMin + ":" + cSec;
                        var endDate = oYear + "-" + oMonth + "-" + oDate + " " + sHrs + ":" + sMin + ":" + sSec;
                        var sTime = this._oTimeDiffrnc(startDate, endDate, fieldName);
                        var splitTime = sTime.split(":");
                        if (sUser.toUpperCase() !== 'KGANGAR') {
                            if (parseInt(splitTime[0]) > 48) {
                                MessageBox.warning("Open Date and time should not be less than the 48 hours");
                                this.byId("OTime_Id").setValue("");
                                return;
                            }
                            if (parseInt(splitTime[0] === 48 && parseInt(splitTime[1]) > 0)) {
                                MessageBox.warning("Open Date and time should not be less than the 48 hours");
                                this.byId("OTime_Id").setValue("");
                                return;
                            }
                        }
                    }
                }
                if (oDate === cDate && oMonth === cMonth && oYear === cYear) {
                    if (sHrs > cHrs) {
                        MessageBox.warning("Selected time should not be greater than the current time");
                        this.byId("OTime_Id").setValue("");
                    }
                    else if (sMin > cMin && sHrs === cHrs) {
                        MessageBox.warning("Selected time should not be greater than the current time");
                        this.byId("OTime_Id").setValue("");
                    }
                }
                oModel.setProperty("/MSVStartDate", "");
                oModel.setProperty("/MSVStartTime", "");
                oModel.setProperty("/MSVReachDate", "");
                oModel.setProperty("/MSVReachTime", "");
                oModel.setProperty("/TimeTakenMSVReach", "");
                oModel.setProperty("/OnRoadDate", "");
                oModel.setProperty("/OnRoadTime", "");
                oModel.setProperty("/TimetakenOnRoad", "");
            },
            onClickStatus: function (oEvent) {
                nStatus = oEvent.getSource().getSelectedKey();
                var oModel = this.getOwnerComponent().getModel("ComplaintsModel");
                oModel.setProperty("/VisibleNotes", true);
                oModel.setProperty("/VisibleFileds", true);
                oModel.setProperty("/MrdtVisible", true);
                oModel.setProperty("/ResolvedDate", "");
                oModel.setProperty("/ResolvedTime", "");
                this.byId("Area_Id").setEnabled(true);
                this.byId("SubAr_Id").setEnabled(true);
                this.byId("MsvStrtDat_Id").setRequired(false);
                this.byId("MsvStrtT_Id").setRequired(false);
                this.byId("MsvRchD_Id").setRequired(false);
                this.byId("MsvRchT_Id").setRequired(false);
                this.byId("Attach_Id").setEnabled(true);
                this.byId("ActnTkn_Id").setEnabled(true);
                this.byId("IdSave").setEnabled(true);
                this.byId("ActknLabl_Id").setRequired(false);
                var oSelectedStatus = oEvent.getSource().getSelectedKey();
                this.byId("onRdDteLabl_Id").setRequired(false);
                this.byId("onRDTmeLbl_Id").setRequired(false);
                var oArea = this.byId("Area_Id").getValue();
                this.byId("holdRsnLbl_Id").setRequired(false);
                oModel.setProperty("/HoldVisible", false);
                this.byId("HoldRsn_Id").setValue("");
                if (oSelectedStatus === "E0004") {
                    if (oArea.toUpperCase() === 'RSA/OFF ROAD') {
                        this.byId("BillTypLabel_Id").setRequired(true);
                        this.byId("MsvStrtDat_Id").setRequired(true);
                        this.byId("MsvStrtT_Id").setRequired(true);
                        this.byId("MsvRchD_Id").setRequired(true);
                        this.byId("MsvRchT_Id").setRequired(true);
                    }
                    this.byId("onRdDteLabl_Id").setRequired(true);
                    this.byId("onRDTmeLbl_Id").setRequired(true);
                    this.byId("ActknLabl_Id").setRequired(true);
                }
                if (oSelectedStatus === "E0011") {
                    this.byId("holdRsnLbl_Id").setRequired(true)
                    oModel.setProperty("/HoldVisible", true);
                }
                if (oSelectedStatus === "E0002" && oArea.toUpperCase() === "RSA/OFF ROAD") {
                    this.byId("MsvStrtDat_Id").setRequired(true);
                    this.byId("MsvStrtT_Id").setRequired(true);
                }

                if (oComplnt_Id !== "" && (oSelectedStatus === "E0017" && oModel.getProperty("/Role_Ind") !== "X")) {
                    MessageBox.warning("You are not authorized to modify data");
                    oModel.setProperty("/VisibleFileds", false);
                    oModel.setProperty("/VisibleNotes", false);
                    oModel.setProperty("/MrdtVisible", false);
                    this.byId("Area_Id").setEnabled(false);
                    this.byId("SubAr_Id").setEnabled(false);
                    this.byId("ODate_Id").setEditable(false);
                    this.byId("OTime_Id").setEditable(false);
                    this.byId("IdSave").setEnabled(false);
                    this.byId("ActknLabl_Id").setRequired(true);
                    this.byId("ActnTkn_Id").setEnabled(false);
                    this.byId("Attach_Id").setEnabled(false);
                    return;
                }
                if (oSelectedStatus === "E0005" || oSelectedStatus === "E0006") {
                    var currentDate = new Date();
                    // var RsvldDate = currentDate.toLocaleDateString().replaceAll("/", ".");
                    // var RsvldTime = currentDate.toLocaleTimeString();
                    oModel.setProperty("/VisibleFileds", false);
                    oModel.setProperty("/MrdtVisible", false);
                    // oModel.setProperty("/ResolvedDate", RsvldDate);
                    // oModel.setProperty("/ResolvedTime", RsvldTime);
                    this.byId("Area_Id").setEnabled(false);
                    this.byId("SubAr_Id").setEnabled(false);
                    this.byId("ReslvDate_Id").setDateValue(currentDate);
                    this.byId("ResolvTime_Id").setDateValue(currentDate);
                    this.byId("IdSave").setEnabled(true);
                    this.byId("ActknLabl_Id").setRequired(true);
                    this.byId("ActnTkn_Id").setEnabled(true);
                    if (oSelectedStatus === "E0005") {
                        oModel.setProperty("/MrdtVisible", true);
                        // this.byId("MsvRchD_Id").setRequired(true);
                        // this.byId("MsvRchT_Id").setRequired(true);
                        this.byId("onRdDteLabl_Id").setRequired(true);
                        this.byId("onRDTmeLbl_Id").setRequired(true);
                    }
                    this.byId("ODate_Id").setEditable(false);
                    this.byId("OTime_Id").setEditable(false);
                    //setting resolved date value based on status 
                }
                if (oArea.toUpperCase() === "RSA/OFF ROAD" && oCSC === '') {
                    oModel.setProperty("/MrdtVisible", false);
                }

            },
            onMSVStrtDate: function (oEvent) {
                var oModel = this.getOwnerComponent().getModel("ComplaintsModel");
                var oSelectedDate = oEvent.getSource().getProperty("dateValue"); //.toLocaleDateString().split('/');
                if (!oSelectedDate) {
                    oModel.setProperty("/MSVStartTime", "");
                    oModel.setProperty("/MSVReachDate", "");
                    oModel.setProperty("/MSVReachTime", "");
                    oModel.setProperty("/TimeTakenMSVReach", "");
                    oModel.setProperty("/OnRoadDate", "");
                    oModel.setProperty("/OnRoadTime", "");
                    oModel.setProperty("/TimetakenOnRoad", "");
                    this.byId("rdn_Id").setSelectedKey("");
                    this.byId("reasnDly_Id").setRequired(false);
                    this.byId("dlrsn_Id").setSelectedKey("");
                    this.byId("DlyRsnOnRd_Id").setRequired(false);

                    return;
                }
                oSelectedDate = oEvent.getParameter("value").split(".");         //oEvent.getSource().getProperty("dateValue").toLocaleDateString().split('/');
                var sDate = parseInt(oSelectedDate[0]),
                    sMonth = parseInt(oSelectedDate[1]),
                    sYear = parseInt(oSelectedDate[2]);
                var currentDate = new Date();
                var cDate = currentDate.getDate(),
                    cMonth = currentDate.getMonth() + 1,
                    cYear = currentDate.getFullYear();
                var sOpDate = this.byId("ODate_Id").getValue(); //open date
                if (!sOpDate) {
                    MessageBox.warning("Open Date is required to select MSV start date");
                    this.byId("MSD_Id").setValue("");
                    return;
                }
                var sOpenDate = sOpDate.split('.');
                var oDate = parseInt(sOpenDate[0]),
                    oMonth = parseInt(sOpenDate[1]),
                    oYear = parseInt(sOpenDate[2]);
                //validating MSV start date with Open date
                if ((sDate < oDate && sMonth === oMonth && sYear === oYear) || (sMonth < oMonth && sYear === oYear) || (sYear < oYear)) {
                    MessageBox.warning("Selected date should not be less than the Open date");
                    this.byId("MSD_Id").setValue("");
                }
                else if (sDate > cDate && sMonth === cMonth && sYear === cYear) {
                    //validating MSVR start date with current date
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("MSD_Id").setValue("");
                }
                else if (sMonth < oMonth && sYear === oYear) {
                    MessageBox.warning("Selected date should not be less than the open date");
                    this.byId("MSD_Id").setValue("");
                }
                else if (sMonth > cMonth && sYear === cYear) {
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("MSD_Id").setValue("");
                }
                else if (sYear < oYear) {
                    MessageBox.warning("Selected date should not be less than the open date");
                    this.byId("MSD_Id").setValue("");
                }
                else if (sYear > cYear) {
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("MSD_Id").setValue("");
                }
                else {
                    this.byId("MRD_Id").setEditable(true);
                    this.byId("MRT_Id").setEditable(true);
                    this.byId("MST_Id").setEditable(true);

                }
                oModel.setProperty("/MSVStartTime", "");
                oModel.setProperty("/MSVReachDate", "");
                oModel.setProperty("/MSVReachTime", "");
                oModel.setProperty("/TimeTakenMSVReach", "");
                oModel.setProperty("/OnRoadDate", "");
                oModel.setProperty("/OnRoadTime", "");
                oModel.setProperty("/TimetakenOnRoad", "");
            },
            onMSVStrtTime: function (oEvent) {
                var time = "";
                var oModel = this.getOwnerComponent().getModel("ComplaintsModel");
                var oSelectedTime = oEvent.getSource().getProperty("dateValue");
                if (!oSelectedTime) {
                    oModel.setProperty("/MSVReachDate", "");
                    oModel.setProperty("/MSVReachTime", "");
                    oModel.setProperty("/TimeTakenMSVReach", "");
                    oModel.setProperty("/OnRoadDate", "");
                    oModel.setProperty("/OnRoadTime", "");
                    oModel.setProperty("/TimetakenOnRoad", "");
                    this.byId("rdn_Id").setSelectedKey("");
                    this.byId("reasnDly_Id").setRequired(false);
                    this.byId("dlrsn_Id").setSelectedKey("");
                    this.byId("DlyRsnOnRd_Id").setRequired(false);
                    return;
                }
                var sHrs = oSelectedTime.getHours(),
                    sMin = oSelectedTime.getMinutes(),
                    sSec = oSelectedTime.getSeconds();
                var currentTime = new Date();
                var cHrs = currentTime.getHours(),
                    cMin = currentTime.getMinutes(),
                    cSec = currentTime.getSeconds();
                var msDate = this.byId("MSD_Id").getValue();
                if (!msDate) {
                    MessageBox.warning("MSV start date is required");
                    return;
                }
                msDate = msDate.split("."); //msv start date
                var opnDate = this.byId("ODate_Id").getValue();
                if (!opnDate) {
                    MessageBox.warning("Open date & time is required");
                    return;
                }
                opnDate = opnDate.split("."); //open date
                //validating msv start time with open time if both dates are same
                if (parseInt(msDate[0]) === parseInt(opnDate[0]) && parseInt(msDate[1]) === parseInt(opnDate[1]) && parseInt(msDate[2]) === parseInt(opnDate[2])) {
                    var opnTime = this.byId("OTime_Id").getDateValue();
                    if (!opnTime) {
                        MessageBox.warning("Open time is required");
                        return;
                    } // open time
                    if (sHrs < opnTime.getHours()) {
                        MessageBox.warning("Selected time should not be less than the open time");
                        this.byId("MST_Id").setValue("");
                        return;
                    }
                    else if (sHrs === opnTime.getHours() && sMin < opnTime.getMinutes()) {
                        MessageBox.warning("Selected time should not be less than the open time");
                        this.byId("MST_Id").setValue("");
                        return;
                    }
                    else if (sHrs === opnTime.getHours() && sMin === opnTime.getMinutes() && sSec <= opnTime.getSeconds()) {
                        MessageBox.warning("Selected time should not be less than the open time");
                        this.byId("MST_Id").setValue("");
                        return;

                    }
                }
                //validateing msv start time with current time
                if (parseInt(msDate[0]) === currentTime.getDate() && parseInt(msDate[1]) === currentTime.getMonth() + 1 && parseInt(msDate[2]) === currentTime.getFullYear()) {
                    if (sHrs === cHrs && sMin > cMin) {
                        MessageBox.warning("Selected time should not be greater than the current time");
                        this.byId("MST_Id").setValue("");
                        return;
                    }
                    else if (sHrs > cHrs) {
                        MessageBox.warning("Selected time should not be greater than the current time");
                        this.byId("MST_Id").setValue("");
                        return;
                    }
                }
                oModel.setProperty("/MSVReachDate", "");
                oModel.setProperty("/MSVReachTime", "");
                oModel.setProperty("/TimeTakenMSVReach", "");
                oModel.setProperty("/OnRoadDate", "");
                oModel.setProperty("/OnRoadTime", "");
                oModel.setProperty("/TimetakenOnRoad", "");
            },
            onMSVReachDate: function (oEvent) {
                var that = this;
                var time = "";
                var oModel = that.getOwnerComponent().getModel("ComplaintsModel");
                var oSelectedDate = oEvent.getSource().getProperty("dateValue");
                if (!oSelectedDate) {
                    oModel.setProperty("/MSVReachTime", "");
                    oModel.setProperty("/TimeTakenMSVReach", "");
                    oModel.setProperty("/OnRoadDate", "");
                    oModel.setProperty("/OnRoadTime", "");
                    oModel.setProperty("/TimetakenOnRoad", "");
                    this.byId("rdn_Id").setSelectedKey("");
                    this.byId("reasnDly_Id").setRequired(false);
                    this.byId("dlrsn_Id").setSelectedKey("");
                    this.byId("DlyRsnOnRd_Id").setRequired(false);
                    return;
                }
                oSelectedDate = oEvent.getParameter("value").split(".");  //oEvent.getSource().getProperty("dateValue").toLocaleDateString().split('/');
                var sDate = parseInt(oSelectedDate[0]),
                    sMonth = parseInt(oSelectedDate[1]),
                    sYear = parseInt(oSelectedDate[2]);
                var currentDate = new Date();
                var cDate = currentDate.getDate(),
                    cMonth = currentDate.getMonth() + 1,
                    cYear = currentDate.getFullYear();
                var onMSVStrtDate = this.byId("MSD_Id").getValue();
                if (!onMSVStrtDate) {
                    MessageBox.warning("MSV start date is required");
                    oModel.setProperty("/MSVReachDate", "");
                    return;
                }
                onMSVStrtDate = onMSVStrtDate.split('.');
                var strtDate = parseInt(onMSVStrtDate[0]),  //msv start date
                    strtMonth = parseInt(onMSVStrtDate[1]),
                    strtYear = parseInt(onMSVStrtDate[2]);
                //validating msv reach date with msv start date
                if (sDate < strtDate && (sMonth === strtMonth && sYear === strtYear)) {
                    MessageBox.warning("Selected date should not be less than the MSV Start date");
                    this.byId("MRD_Id").setValue("");
                }
                else if (sMonth < strtMonth && sYear === strtYear) {
                    MessageBox.warning("Selected date should not be less than the MSV Start date");
                    this.byId("MRD_Id").setValue("");
                }
                else if (sYear < strtYear) {
                    MessageBox.warning("Selected date should not be less than the MSV Start date");
                    this.byId("MRDI_d").setValue("");
                }
                //validating msv reach date with current date
                else if (sDate > cDate && (sMonth === cMonth && sYear === cYear)) {
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("MRD_Id").setValue("");
                }

                else if (sMonth > cMonth && sYear === cYear) {
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("MRD_Id").setValue("");
                }
                else if (sYear > cYear) {
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("MRD_Id").setValue("");
                }
                else {
                    this.byId("OnRoadD_Id").setEditable(true);
                    this.byId("onRoadT_Id").setEditable(true);
                }
                oModel.setProperty("/MSVReachTime", "");
                oModel.setProperty("/TimeTakenMSVReach", time);
                oModel.setProperty("/OnRoadDate", "");
                oModel.setProperty("/OnRoadTime", "");
                oModel.setProperty("/TimetakenOnRoad", "");
            },
            onMSVReachTime: function (oEvent) {
                var that = this;
                var oModel = that.getOwnerComponent().getModel("ComplaintsModel");
                var opnDate = this.byId("ODate_Id").getValue().split(".");
                var opnTime = this.byId("OTime_Id").getValue();

                var time = "";
                var oSelectedTime = oEvent.getSource().getDateValue();
                if (!oSelectedTime) {
                    oModel.setProperty("/TimeTakenMSVReach", "");
                    oModel.setProperty("/OnRoadDate", "");
                    oModel.setProperty("/OnRoadTime", "");
                    oModel.setProperty("/TimetakenOnRoad", "");
                    this.byId("rdn_Id").setSelectedKey("");
                    this.byId("reasnDly_Id").setRequired(false);
                    this.byId("dlrsn_Id").setSelectedKey("");
                    this.byId("DlyRsnOnRd_Id").setRequired(false);
                    return;
                }
                var msDate = this.byId("MSD_Id").getValue().split("."); // msv satrt date
                var tTime = this.byId("MST_Id").getValue(); //msv start time
                if (!tTime) {
                    MessageBox.warning("MSV start time required");
                    return;
                }
                var msTime = tTime.split(":");
                var mrDate = this.byId("MRD_Id").getValue();
                if (!mrDate) {
                    MessageBox.warning("MSV Reach date is required");
                    oModel.setProperty("/MSVReachTime", "");
                    return;
                }
                mrDate = mrDate.split("."); //msv reach date

                var fieldName = "MSVTimes";

                if (oSelectedTime) {
                    var sHrs = oSelectedTime.getHours(),
                        sMin = oSelectedTime.getMinutes(),
                        sSec = oSelectedTime.getSeconds();
                    var currentTime = new Date();
                    var cHrs = currentTime.getHours(),
                        cMin = currentTime.getMinutes(),
                        cSec = currentTime.getSeconds();
                    // validating msv reach time with msv start time if both dates are same
                    if (parseInt(msDate[1]) === parseInt(mrDate[1]) && parseInt(msDate[0]) === parseInt(mrDate[0]) && parseInt(msDate[2]) === parseInt(mrDate[2])) {
                        var mrTim = oEvent.getParameter("value").split(":"); //msv reach time
                        var strtTm = this.byId("MST_Id").getDateValue();
                        if (sHrs < strtTm.getHours()) {
                            MessageBox.warning("Selected time should not be less than the MSV start time");
                            this.byId("MRT_Id").setValue("");
                            return;
                        }
                        else if (sHrs === strtTm.getHours() && sMin <= strtTm.getMinutes()) {
                            MessageBox.warning("Selected time should not be less than the MSV start time");
                            this.byId("MRT_Id").setValue("");
                            return;
                        }
                        else if (sHrs === strtTm.getHours() && sMin <= strtTm.getMinutes() && sSec <= strtTm.getSeconds()) {
                            MessageBox.warning("Selected time should not be less than the MSV start time");
                            this.byId("MRT_Id").setValue("");
                            return;
                        }
                    }
                    //validating msv reach time with current time
                    if (parseInt(mrDate[2]) === currentTime.getFullYear() && parseInt(mrDate[1]) === currentTime.getMonth() + 1 && parseInt(mrDate[0]) === currentTime.getDate()) {
                        if (sHrs === cHrs && sMin > cMin) {
                            MessageBox.warning("Selected time should not be greater than the current time");
                            this.byId("MRT_Id").setValue("");
                        }
                        else if (sHrs > cHrs) {
                            MessageBox.warning("Selected time should not be greater than the current time");
                            this.byId("MRT_Id").setValue("");
                        }
                    }

                    var startDate = opnDate[2] + "-" + opnDate[1] + "-" + opnDate[0] + " " + opnTime;
                    var endDate = mrDate[2] + "-" + mrDate[1] + "-" + mrDate[0] + " " + oSelectedTime.toLocaleTimeString();
                    time = this._oTimeDiffrnc(startDate, endDate, fieldName);

                }
                oModel.setProperty("/TimeTakenMSVReach", time);
                oModel.setProperty("/OnRoadDate", "");
                oModel.setProperty("/OnRoadTime", "");
                oModel.setProperty("/TimetakenOnRoad", "");
            },
            _oTimeDiffrnc: function (startDate, endDate, fieldName) {
                if (startDate && endDate) {
                    const start = new Date(startDate).getTime();
                    const end = new Date(endDate).getTime();
                    const milliseconds = Math.abs(end - start);  //.toString()
                    var seconds = Math.floor(milliseconds / 1000) % 60;
                    var minutes = Math.floor(milliseconds / 1000 / 60) % 60;
                    var hours = Math.floor(milliseconds / 1000 / 60 / 60);
                    if (seconds.toString().length === 1) {
                        seconds = "0" + seconds;
                        //seconds = parseInt(sec);
                    }

                    if (minutes.toString().length === 1) {
                        minutes = "0" + minutes;
                        //minutes = parseInt(minutes);
                    }

                    if (hours.toString().length === 1) {
                        hours = "0" + hours;
                        // hours = parseInt(hr);
                    }

                    var time = hours + ":" + minutes + ":" + seconds;
                    if (fieldName === "MSVTimes") {
                        if ((parseInt(hours) > 3) || (parseInt(hours) === 3 && parseInt(minutes) > 0) || (parseInt(hours) === 3 && parseInt(minutes) >= 0)) {
                            this.byId("reasnDly_Id").setRequired(true);
                            //settimg reason delay for msv as mandatory
                        }
                        else {
                            this.byId("reasnDly_Id").setRequired(false);
                        }
                    }
                    else if (fieldName === "OnRoadTime") {
                        if ((parseInt(hours) > 12) || (parseInt(hours) === 12 && parseInt(minutes) > 0) || (parseInt(hours) === 12 && parseInt(minutes) >= 0)) {
                            this.byId("DlyRsnOnRd_Id").setRequired(true);
                        }
                        else {
                            this.byId("DlyRsnOnRd_Id").setRequired(false);
                        }
                    }
                }
                return time;
            },
            onRoadDatefn: function (oEvent) {
                var that = this;
                var oModel = that.getOwnerComponent().getModel("ComplaintsModel");
                var oSelectedDate = oEvent.getSource().getProperty("dateValue");
                if (!oSelectedDate) {
                    oModel.setProperty("/OnRoadTime", "");
                    oModel.setProperty("/TimetakenOnRoad", "");
                    this.byId("dlrsn_Id").setSelectedKey("");
                    this.byId("DlyRsnOnRd_Id").setRequired(false);
                    return;
                }
                var oArea = this.byId("Area_Id").getValue();
                var msvRD = this.byId("MRD_Id").getValue();
                if (oArea.toUpperCase() === 'RSA/OFF ROAD' && msvRD === '') {
                    MessageBox.warning("MSV Reach date is required for On Road date");
                    oModel.setProperty("/OnRoadDate", "");
                    this.byId("dlrsn_Id").setSelectedKey("");
                    return;
                }
                var strDte = msvRD.split(".");
                var mrDate = parseInt(strDte[0]),
                    mrMonth = parseInt(strDte[1]),
                    mrYear = parseInt(strDte[2]);


                oSelectedDate = oEvent.getParameter("value").split(".");
                var sDate = parseInt(oSelectedDate[0]),
                    sMonth = parseInt(oSelectedDate[1]),
                    sYear = parseInt(oSelectedDate[2]);
                var currentDate = new Date();
                var cDate = currentDate.getDate(),
                    cMonth = currentDate.getMonth() + 1,
                    cYear = currentDate.getFullYear();
                var ReslvdDate = this.byId("ReslvDate_Id").getDateValue();
                if (ReslvdDate) {
                    var oReslvdDate = ReslvdDate.toLocaleDateString().split('/');
                    var sRDate = parseInt(oReslvdDate[0]),
                        sRMonth = parseInt(oReslvdDate[1]),
                        sRYear = parseInt(oReslvdDate[2]);

                    if (sMonth === sRMonth && sYear === sRYear) {
                        if (sDate > sRDate) {
                            MessageBox.warning("Selected date should not be greater than the Resolved date");
                            this.byId("OnRoadD_Id").setValue("");
                            return;
                        }
                    }
                    else if (sMonth > sRMonth && sYear === sRYear) {
                        MessageBox.warning("Selected date should not be greater than the Resolved date");
                        this.byId("OnRoadD_Id").setValue("");
                        return;
                    }
                    else if (sYear > sRYear) {
                        MessageBox.warning("Selected date should not be greater than the Resolved date");
                        this.byId("OnRoadD_Id").setValue("");
                        return;
                    }
                }
                if (sMonth === cMonth && sYear === cYear) {
                    if (sDate > cDate) {
                        MessageBox.warning("Selected date should not be greater than the current date");
                        this.byId("OnRoadD_Id").setValue("");
                        return;
                    }
                }
                else if (sMonth > cMonth && sYear === cYear) {
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("OnRoadD_Id").setValue("");
                    return;
                }
                else if (sYear > cYear) {
                    MessageBox.warning("Selected date should not be greater than the current date");
                    this.byId("OnRoadD_Id").setValue("");
                    return;
                }
                if (oArea.toUpperCase() === 'RSA/OFF ROAD') {
                    if (sMonth === mrMonth && sYear === mrYear) {
                        if (sDate < mrDate) {
                            MessageBox.warning("Selected date should not be less than the MSV reach date");
                            this.byId("OnRoadD_Id").setValue("");
                            return;
                        }
                    }
                    else if (sMonth < mrMonth && sYear === mrYear) {
                        MessageBox.warning("Selected date not be less than the MSV reach date");
                        this.byId("OnRoadD_Id").setValue("");
                        return;
                    }
                    else if (sYear < mrYear) {
                        MessageBox.warning("Selected date not be less than the MSV reach date");
                        this.byId("OnRoadD_Id").setValue("");
                        return;
                    }
                }
                var openDate = this.byId("ODate_Id").getValue();
                if (openDate === '') {
                    MessageBox.error("Open date is mandatory");
                    this.byId("OnRoadD_Id").setValue("");
                    return;
                }
                var openDate = openDate.split(".");
                var opDate = parseInt(openDate[0]),
                    opMonth = parseInt(openDate[1]),
                    opYear = parseInt(openDate[2]);
                if (sYear === opYear) {
                    if (sMonth === opMonth && sDate < opDate) {
                        MessageBox.error("Selected date should not be less than the open date");
                        this.byId("OnRoadD_Id").setValue("");
                        return;
                    }
                    if (sMonth < opMonth) {
                        MessageBox.error("Selected date should not be less than the open date");
                        this.byId("OnRoadD_Id").setValue("");
                        return;
                    }
                }
                if (sYear < opYear) {
                    MessageBox.error("Selected date should not be less than the open date");
                    this.byId("OnRoadD_Id").setValue("");
                    return;
                }
                this.byId("onRoadT_Id").setEditable(true);
                oModel.setProperty("/OnRoadTime", "");
                oModel.setProperty("/TimetakenOnRoad", "");
            },
            onRoadTimefn: function (oEvent) {
                var that = this;
                var oModel = that.getOwnerComponent().getModel("ComplaintsModel");
                var onRdtimeDfrnc = "";
                var oSelectedTime = oEvent.getSource().getProperty("dateValue");
                if (!oSelectedTime) {
                    oModel.setProperty("/TimetakenOnRoad", onRdtimeDfrnc);
                    this.byId("dlrsn_Id").setSelectedKey("");
                    this.byId("DlyRsnOnRd_Id").setRequired(false);
                    return;
                }

                var msRD = this.byId("MRD_Id").getValue();
                var oArea = this.byId("Area_Id").getValue();
                if (oArea.toUpperCase() === 'RSA/OFF ROAD') {
                    if (!msRD) {
                        MessageBox.warning("MSV Reach date is required for On Road time")
                        oModel.setProperty("/OnRoadTime", "");
                        return;
                    }
                    var msvRD = msRD.split(".");
                    var mrDate = parseInt(msvRD[0]),
                        mrMonth = parseInt(msvRD[1]),
                        mrYear = parseInt(msvRD[2]);
                }
                var opnDate = this.byId("ODate_Id").getValue();
                if (!opnDate) {
                    MessageBox.warning("open date & time is required for On Road time");
                    oModel.setProperty("/OnRoadTime", "");
                    return;
                }
                opnDate = opnDate.split(".");
                var opDate = parseInt(opnDate[0]),
                    opMonth = parseInt(opnDate[1]),
                    opYear = parseInt(opnDate[2]);
                var opnTime = this.byId("OTime_Id").getValue();
                if (opnTime === '') {
                    MessageBox.warning("open date & time is required for On Road time");
                    oModel.setProperty("/OnRoadTime", "");
                    return;
                }
                var fieldName = "OnRoadTime";

                var sHrs = oSelectedTime.getHours(),
                    sMin = oSelectedTime.getMinutes(),
                    sSec = oSelectedTime.getSeconds();
                var currentTime = new Date();
                var cHrs = currentTime.getHours(),
                    cMin = currentTime.getMinutes(),
                    cSec = currentTime.getSeconds();
                var onRdDte = this.byId("OnRoadD_Id").getValue();
                if (!onRdDte) {
                    MessageBox.warning("on road date is required for On Road time");
                    oModel.setProperty("/OnRoadTime", "");
                    return;
                }
                onRdDte = onRdDte.split('.');
                var nODate = parseInt(onRdDte[0]),
                    nOMonth = parseInt(onRdDte[1]),
                    nOYear = parseInt(onRdDte[2]);
                var ReslvdDate = this.byId("ReslvDate_Id").getDateValue();
                if (ReslvdDate) {
                    ReslvdDate = ReslvdDate.toLocaleDateString().split('/');
                    if (nOMonth === parseInt(ReslvdDate[0]) && nOYear === parseInt(ReslvdDate[2])) {
                        if (nODate === parseInt(ReslvdDate[1])) {
                            var ReslvdTime = this.byId("ResolvTime_Id").getDateValue();
                            if (sHrs === ReslvdTime.getHours()) {
                                if (sMin > ReslvdTime.getMinutes()) {
                                    MessageBox.warning("Selected time should be less than the Resolved time");
                                    this.byId("onRoadT_Id").setValue("");
                                    return;
                                }
                            }
                            else if (sHrs > ReslvdTime.getHours()) {
                                MessageBox.warning("Selected time should be less than the Resolved time");
                                this.byId("onRoadT_Id").setValue("");
                                return;
                            }
                        }
                    }
                }
                if (oArea.toUpperCase() === 'RSA/OFF ROAD') {
                    if (mrMonth === nOMonth && mrYear === nOYear) {
                        if (mrDate === nODate) {
                            var mrTime = this.byId("MRT_Id").getDateValue();
                            if (sHrs < mrTime.getHours()) {
                                MessageBox.warning("Selected time should not be less than the MSV reach time");
                                this.byId("onRoadT_Id").setValue("");
                                return;
                            }
                            else if (sHrs === mrTime.getHours() && sMin <= mrTime.getMinutes()) {
                                MessageBox.warning("Selected time should not be less than the MSV reach time");
                                this.byId("onRoadT_Id").setValue("");
                                return;
                            }
                            else if (sHrs === mrTime.getHours() && sMin === mrTime.getMinutes() && sSec <= mrTime.getSeconds()) {
                                MessageBox.warning("Selected time should not be less than the MSV reach time");
                                this.byId("onRoadT_Id").setValue("");
                                return;
                            }
                        }
                    }
                }

                if (nOYear === opYear && nOMonth === opMonth && nODate === opDate) {
                    var opTime = this.byId("OTime_Id").getDateValue();
                    if (sHrs === opTime.getHours()) {
                        if (sMin <= opTime.getMinutes()) {
                            MessageBox.warning("Selected time should be greater than the open time");
                            this.byId("onRoadT_Id").setValue("");
                            return;
                        }
                    }
                    if (sHrs < opTime.getHours()) {
                        MessageBox.warning("Selected time should be greater than the open time");
                        this.byId("onRoadT_Id").setValue("");
                        return;
                    }
                }

                if (nOMonth === currentTime.getMonth() + 1 && nOYear === currentTime.getFullYear()) {
                    if (nODate === currentTime.getDate()) {
                        if (sMin > cMin && sHrs === cHrs) {
                            MessageBox.warning("Selected time should not be greater than the current time");
                            this.byId("onRoadT_Id").setValue("");
                            return;
                        }
                        else if (sHrs > cHrs) {
                            MessageBox.warning("Selected time should not be greater than the current time");
                            this.byId("onRoadT_Id").setValue("");
                            return;
                        }
                        var startDate = opYear + "-" + opMonth + "-" + opDate + " " + opnTime;
                        var endDate = nOYear + "-" + nOMonth + "-" + nODate + " " + oSelectedTime.toLocaleTimeString();
                        onRdtimeDfrnc = this._oTimeDiffrnc(startDate, endDate, fieldName);

                    }
                    else {
                        var startDate = opYear + "-" + opMonth + "-" + opDate + " " + opnTime;
                        var endDate = nOYear + "-" + nOMonth + "-" + nODate + " " + oSelectedTime.toLocaleTimeString();
                        onRdtimeDfrnc = this._oTimeDiffrnc(startDate, endDate, fieldName);
                    }
                }
                else {
                    var startDate = opYear + "-" + opMonth + "-" + opDate + " " + opnTime;
                    var endDate = nOYear + "-" + nOMonth + "-" + nODate + " " + oSelectedTime.toLocaleTimeString();
                    onRdtimeDfrnc = this._oTimeDiffrnc(startDate, endDate, fieldName);

                }
                oModel.setProperty("/TimetakenOnRoad", onRdtimeDfrnc);
            },
            onChangeNumber: function (oEvent) {
                var val = oEvent.getSource().getValue();
                var pattern = /\D/g;
                var txt = val.match(pattern);
                if (txt) {
                    oEvent.getSource().setValueState("Error");
                }
                else {
                    oEvent.getSource().setValueState("None");
                }
            },

            onSavePress: function () {
                var that = this;
                var bindData = this.getOwnerComponent().getModel("ComplaintsModel").getData();
                var actionTkn = this.byId("ActnTkn_Id").getValue();
                var oCallrNme = bindData.CallerName;
                var oAttachments = bindData.OrgAttachments;
                if (oCallrNme === '' || oCallrNme === undefined) {
                    MessageBox.error("Caller Name is mandatory");
                    return;
                }
                var oContctNumbr = bindData.CallercontactNumber;
                if (oContctNumbr === '' || oContctNumbr === undefined) {
                    MessageBox.error("Caller contact number is mandatory");
                    return;
                }
                var oCmplntSrc = this.byId("Csource_Id").getValue();
                var oCmplntMod = this.byId("CmplntM_Id").getValue();
                if (oCmplntSrc === '' || oCmplntMod === '') {
                    MessageBox.error("Complaint source and mode are mandatory");
                    return;
                }
                var opnDat = that.byId("ODate_Id").getValue();
                var opnTm = that.byId("OTime_Id").getDateValue();
                if (!opnDat || !opnTm) {
                    MessageBox.error("Open Date and time is mandatory");
                    return;
                }
                var oMsvStd = this.byId("MSD_Id").getValue();
                var oMsvStT = this.byId("MST_Id").getDateValue();
                var oMsvRd = this.byId("MRD_Id").getValue();
                var oMsvRT = this.byId("MRT_Id").getDateValue();
                var ComplntDesc = this.byId("CmplntDesc_Id").getValue();
                var oBillType = this.byId("BillTyp_Id").getValue();
                var AreaValue = this.byId("Area_Id").getValue();
                var SubAreaValue = this.byId("SubAr_Id").getValue();
                var oDealerCode = this.byId("DelrDcod_Id").getValue();
                var oNotes = this.byId("Notes_Id").getValue();
                var oNotes = this.byId("Notes_Id").getValue();
                var oOffrd = this.byId("OffRdLctn_Id").getValue();
                var oLodCrd = this.byId("LoadCrrd_Id").getValue();
                var oDistnc = this.byId("Distnc_Id").getValue();
                var oTypeRout = this.byId("TypeRout_Id").getValue();
                var oStatus = this.byId("Status_Id").getSelectedItem().getText();
                var BD_Lat = this.byId("bdlat_Id").getValue();
                var BD_Long = this.byId("bdlong_Id").getValue();
                var clrDesgtn = this.byId("callerDesgtn_id").getValue();
                if (oStatus === '') {
                    MessageBox.warning("Status is Mandatory");
                    return;
                }
                if (oStatus === "Hold") {
                    var oHldRsn = this.byId("HoldRsn_Id").getValue();
                    if (oHldRsn === "") {
                        MessageBox.warning("Hold Reason is Mandatory");
                        return;
                    }
                }

                if (AreaValue.toUpperCase() === 'RSA/OFF ROAD' || AreaValue.toUpperCase() === 'SERVICE' || AreaValue.toUpperCase() === 'SSI') {
                    if (oDealerCode === '') {
                        MessageBox.error("Dealer code is mandatory");
                        return;
                    }

                }

                if (AreaValue.toUpperCase() === 'RSA/OFF ROAD') {
                    var sLat = this.byId("bdlat_Id").getValue();
                    var sLong = this.byId("bdlong_Id").getValue();
                    if(Old_New === 'NEW'){
                    if (sLat === '' || sLong === '') {
                        MessageBox.error('Latitude and Longitude are mandatory');
                        return;
                    }
                }
                    if (oNotes === '') {
                        MessageBox.error("Internal notes is mandatory");
                        return;
                    }
                    if (oOffrd === '') {
                        MessageBox.error("Off road location is mandatory");
                        return;
                    }
                    if (oLodCrd === '') {
                        MessageBox.error("Load carried is mandatory");
                        return;
                    }
                    if (clrDesgtn === '') {
                        MessageBox.error("Caller designation is mandatory");
                        return;
                    }
                }
                if (oComplnt_Id !== '' && AreaValue.toUpperCase() === 'SERVICE' && oAttachments.length === 0) {
                    MessageBox.error("Attachment is mandatory");
                    return;
                }
                var oTTknRds = this.byId("TTOnMSV_Id").getValue();
                var oTTknRd = oTTknRds.split(":");
                var oRsnDly = this.byId("rdn_Id").getSelectedKey();
                if ((parseInt(oTTknRd[0]) > 3) || (parseInt(oTTknRd[0]) === 3 && parseInt(oTTknRd[1]) > 0) || (parseInt(oTTknRd[0]) === 3 && parseInt(oTTknRd[2]) > 0)) {
                    if (!oRsnDly) {
                        MessageBox.warning("Reason Delay MSV Reach is mandatory");
                        return;
                    }
                }

                var oTimeTknOnRd = this.byId("TTOnRd_Id").getValue();
                oTimeTknOnRd = oTimeTknOnRd.split(":");
                var oDlrnOnRdVal = this.byId("dlrsn_Id").getSelectedKey();
                if ((parseInt(oTimeTknOnRd[0]) > 12) || (parseInt(oTimeTknOnRd[0]) === 12 && parseInt(oTimeTknOnRd[1]) > 0) || (parseInt(oTimeTknOnRd[0]) === 12 && parseInt(oTimeTknOnRd[2]) > 0)) {
                    if (oDlrnOnRdVal === "") {
                        MessageBox.warning("Dealay Reason for on road is mandatory");
                        return;
                    }
                }
                if (ComplntDesc === "") {
                    MessageBox.warning("Complaint description is mandatory");
                    this.byId("CmplntDesc_Id").setValueState("Error");
                    return;
                }
                if (AreaValue === "") {
                    MessageBox.warning("Area is mandatory");
                    this.byId("Area_Id").setValueState("Error");
                    return;
                }
                if (SubAreaValue === "") {
                    MessageBox.warning("Sub Area is mandatory");
                    this.byId("SubAr_Id").setValueState("Error");
                    return;
                }

                if (oComplnt_Id) {
                    if (oStatus.toUpperCase() === "WORK IN PROGRESS" && AreaValue.toUpperCase() === "RSA/OFF ROAD") {
                        if (!oMsvStd) {
                            MessageBox.warning("MSV start date is mandatory");
                            return;
                        }
                        else if (!oMsvStT) {
                            MessageBox.warning("MSV start time is mandatory");
                            return;
                        }
                    }
                    if (oStatus.toUpperCase() === "CLOSED") {
                        var actionTkn = this.byId("ActnTkn_Id").getValue();
                        if (!actionTkn) {
                            MessageBox.warning("Actoin taken is mandatory");
                            return;
                        }
                        if (AreaValue.toUpperCase() === "RSA/OFF ROAD") {

                            // if (oBillType === '') {
                            //     MessageBox.error("Bill type is mandatory");
                            //     return;
                            // }
                            if (!oMsvStd) {
                                MessageBox.warning("MSV start date is mandatory");
                                return;
                            }
                            else if (!oMsvStT) {
                                MessageBox.warning("MSV start time is mandatory");
                                return;
                            }
                            if (!oMsvRd || !oMsvRT) {
                                MessageBox.warning("MSV reach date and time is mandatory");
                                return;
                            }
                            var onRd = this.byId("OnRoadD_Id").getValue();
                            var onTme = this.byId("onRoadT_Id").getValue();
                            if (!onRd || !onTme) {
                                MessageBox.warning("On road date and time is mandatory");
                                return;
                            }
                        }
                    }
                    if (oStatus.toUpperCase() === "CANCELED") {

                        if (!actionTkn) {
                            MessageBox.warning("Action taken is mandatory");
                            return;
                        }
                    }
                    if (oStatus.toUpperCase() === "VEHICLE DELIVERED") {
                        var onRd = this.byId("OnRoadD_Id").getValue();
                        var onTme = this.byId("onRoadT_Id").getValue();
                        if (!onRd || !onTme) {
                            MessageBox.warning("On road date and time is mandatory");
                            return;
                        }
                        if (actionTkn === '') {
                            MessageBox.warning("Action taken is mandatory");
                            return;
                        }
                        // if (oBillType === '' && AreaValue.toUpperCase() === "RSA/OFF ROAD") {
                        //     MessageBox.error("Bill type is mandatory");
                        //     return;
                        // }
                    }
                }

                this.oPostData(bindData);
            },
            oPostData: function (bindData) {
                var that = this;
                var tTknmsv, tTknonR, onRdDat, opnDat, opnTm, onRdTme, reslvDat, rslvdTm, oPayload;
                var oMsvStd = this.byId("MSD_Id").getValue();
                var oMsvStT = this.byId("MST_Id").getDateValue();
                var oMsvRd = this.byId("MRD_Id").getValue();
                var oMsvRT = this.byId("MRT_Id").getDateValue();
                var ComplntDesc = this.byId("CmplntDesc_Id").getValue();
                var AreaValue = this.byId("Area_Id").getValue();
                var SubAreaValue = this.byId("SubAr_Id").getValue();
                var oDealerCode = this.byId("DelrDcod_Id").getValue();
                var oAsngdDt = this.byId("AsgnDte_Id").getValue();
                var oAsgndTm = this.byId("AsgnTime_Id").getDateValue();
                var stTknmsv = this.byId("TTOnMSV_Id").getValue();
                if (stTknmsv !== '') {
                    var nVal = stTknmsv.split(":")[1];
                    if (nVal.length !== 2) {
                        tTknmsv = stTknmsv.split(":")[0] + ":0" + oVal + ":00";
                    }
                    else {
                        tTknmsv = stTknmsv + ":00";
                    }
                }
                var stTknonR = this.byId("TTOnRd_Id").getValue();
                if (stTknonR !== '') {
                    var oVal = stTknonR.split(':')[1];
                    if (oVal.length !== 2) {
                        tTknonR = stTknonR.split(":")[0] + ":0" + oVal + ":00";
                    }
                    else {
                        tTknonR = stTknonR + ":00";
                    }
                }
                onRdDat = this.byId("OnRoadD_Id").getValue();
                opnDat = this.byId("ODate_Id").getValue();
                opnTm = this.byId("OTime_Id").getDateValue()
                onRdTme = this.byId("onRoadT_Id").getDateValue();
                reslvDat = this.byId("ReslvDate_Id").getValue();
                rslvdTm = this.byId("ResolvTime_Id").getDateValue();

                oPayload = {
                    "ServicingDealer": this.byId("ServcDelr_Id").getValue() || "",
                    "AssignedDate": oAsngdDt || "",
                    "AssignedTime": oAsgndTm ? oAsgndTm.toString() : "",
                    "License_Plate": oVIN[0],
                    "Complaint_Id": bindData.Complaint_Id || "",
                    "DealerCode": oDealerCode,
                    "ComplaintDescription": ComplntDesc || "",
                    "ActionTaken": bindData.ActionTaken || "",
                    "MSVStartDate": oMsvStd || "",
                    "MSVStartTime": oMsvStT ? oMsvStT.toString() : "",
                    "MSVReachDate": oMsvRd || "",
                    "MSVReachTime": oMsvRT ? oMsvRT.toString() : "",
                    "TimeTakenMSVReach": tTknmsv || "",
                    "TimetakenOnRoad": tTknonR || "",
                    "ReasonDelayMSVReach": this.byId("rdn_Id").getSelectedKey() || "",
                    "OnRoadDate": onRdDat || "",
                    "OnRoadTime": onRdTme ? onRdTme.toString() : "",
                    "DelayReasonOnroad": this.byId("dlrsn_Id").getSelectedKey() || "",
                    "ComplaintSource": this.byId("Csource_Id").getValue() || "",
                    "ComplaintMode": this.byId("CmplntM_Id").getValue() || "",
                    "OpenDate": opnDat || "",
                    "OpenTime": opnTm ? opnTm.toString() : "",
                    "HoldReason": this.byId("HoldRsn_Id").getValue() || "",
                    "BilltoType": this.byId("BillTyp_Id").getValue() || "",
                    "CostEstimation": bindData.CostEstimation || "",
                    "ResolvedDate": reslvDat || "",
                    "ResolvedTime": rslvdTm ? rslvdTm.toString() : "",
                    "Area": AreaValue || "",
                    "SubArea": SubAreaValue || "",
                    "OffRoadLocation": bindData.OffRoadLocation || "",
                    "LoadCarried": bindData.LoadCarried || "",
                    "TypeOfRoute": bindData.TypeOfRoute || "",
                    "DistanceinKM": bindData.DistanceinKM || "",
                    "CallerName": bindData.CallerName || "",
                    "CallercontactNumber": bindData.CallercontactNumber || "",
                    "SMSCurrentCaller": bindData.SMSCurrentCaller || "",
                    "Status": this.byId("Status_Id").getSelectedItem().getText() || "",
                    "Role_Ind": "",
                    "Notes": bindData.Notes || "",
                    "Object_Key": "",
                    "Aggregate": bindData.Aggregate || "",
                    "ZZ1_Caller_Mobile_Numb": "",
                    "ZZ1_Caller_Name": "",
                    "ZZ1_BD_latitude": bindData.ZZ1_BD_latitude || "",
                    "ZZ1_BD_longitude": bindData.ZZ1_BD_longitude || "",
                    "ZZ1_KAM_Flag": bindData.ZZ1_KAM_Flag === 'Yes' ? 'X' : '' || "",
                    "ZZ1_Dist_From_BD_To_WS": bindData.ZZ1_Dist_From_BD_To_WS,
                    "ZZ1_Caller_Designation": bindData.ZZ1_Caller_Designation || "",
                    "Gen_Num": bindData.Gen_Num || Gen_Num
                }
                oBusyDialog.open();
                var sPath = "";
                var oSuccess, oError;
                if (oComplnt_Id) {
                    oSubmit = "updated";
                    this.aCmplntId = oComplnt_Id;
                }
                else {
                    oSubmit = "submitted";
                }
                oSuccess = function (oData, Response) {
                    oBusyDialog.close();
                    that.aCmplntId = oData.Complaint_Id ? oData.Complaint_Id : oComplnt_Id;
                    if (oData.Rsa_Flag === 'Y') {
                        MessageBox.warning('Please close /Cancel the open complaints on this vehicle');
                        return;
                    }
                    else {
                        that._succesMsgFn(oSubmit);
                    }


                }.bind(this),
                    oError = function (e) {
                        oBusyDialog.close();
                        MessageBox.error(e.message);
                    }
                that.getOwnerComponent().getModel("ZCUST_COMPLAINT_SRV").create("/Compl_CreateSet", oPayload, {
                    success: oSuccess,
                    error: oError
                });
            },
            _succesMsgFn: function (submt) {
                var that = this;
                MessageBox.success("Complaint has been " + submt + " " + that.aCmplntId, {
                    action: [MessageBox.Action.Ok],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleNotes", false);
                        that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/VisibleFileds", false);
                        that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/MrdtVisible", false);
                        that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/HoldVisible", false); that.byId("Status_Id").setEditable(false);
                        that.byId("Area_Id").setEnabled(false);
                        that.byId("SubAr_Id").setEnabled(false);
                        that.byId("ODate_Id").setEditable(false);
                        that.byId("OTime_Id").setEditable(false);
                        that.byId("IdSave").setEnabled(false);
                        that.byId("ActnTkn_Id").setEnabled(false);


                        if (oComplnt_Id !== '') {
                            that.byId("Attach_Id").setEnabled(false);
                            that.byId("List_Id").setMode('None');
                            that.byId("Link_Id").setEnabled(false);
                        }
                    }
                })
            },
            handleValueHelp: function () {
                var oView = this.getView();
                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "dicv.zcomplaintsmangt.fragments.DealerCode",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    });
                }

                // open value help dialog
                this._pValueHelpDialog.then(function (oValueHelpDialog) {
                    oValueHelpDialog.open();
                });
            },
            _handleValueHelpClose: function () {
                this._pValueHelpDialog.then(function (oValueHelpDialog) {
                    oValueHelpDialog.close();
                });
            },
            onTextAreaVal: function (oEvent) {
                var oVal = oEvent.getSource().getValue();
                if (oVal.length > 200) {
                    this.byId("CmplntDesc_Id").setValueState("Error");
                    this.byId("CmplntDesc_Id").setvalueStateText("Description should be in 200 letters only")
                }
                else {
                    this.byId("CmplntDesc_Id").setValueState("None");
                }
            },
            onValueUpdate: function (oEvent) {
                var oVal = oEvent.getSource().getValue();
                if (oVal.length > 0) {
                    oEvent.getSource().setValueState("None");
                }
            },

            _onUploadFile: function (oEvent) {
                var msgTxt = '';
                var fileName = oEvent.getParameter("fileName");
                if (oEvent.getParameter("status") === 201) {
                    MessageBox.success("File Uploaded Success");
                    var sData = this.getOwnerComponent().getModel("ComplaintsModel").getProperty("/OrgAttachments");
                    var obj = $.parseJSON(oEvent.getParameter("responseRaw")).d;
                    sData.push(obj);
                    this.getOwnerComponent().getModel("ComplaintsModel").refresh(true);
                } else {
                    MessageBox.error("File not uploaded");
                }
            },
            _getToken: function () {
                var sToken = "",
                    oControl = this;
                this.getOwnerComponent().getModel("CV_ATTACHMENT_SRV").refreshSecurityToken(function (e, o) {
                    sToken = oControl.getOwnerComponent().getModel("CV_ATTACHMENT_SRV").getSecurityToken();
                }, function (e) {
                    oControl._showErrorMessage($(e.responseText).find("message").first().text(), "");
                }, false);
                return sToken;
            },
            _onBeforeUploadFile: function (oEvent) {
                if (this.aCmplntId === '') {
                    MessageBox.warning("Please submit the complaint to upload files");
                    return;
                }
                var oStatus = this.byId("Status_Id").getSelectedItem().getText();
                if (oStatus.toUpperCase() === "CLOSED" || oStatus.toUpperCase() === "CANCELED") {
                    return;
                }
                var oUploadCollection = oEvent.getSource();
                // Header Token
                //  var sFields = this.oModel.getHeaders();
                oUploadCollection.removeAllHeaderParameters();
                var oCustomerHeaderToken = new sap.ui.unified.FileUploaderParameter({
                    name: "x-csrf-token",
                    value: this._getToken()
                });
                oUploadCollection.insertHeaderParameter(oCustomerHeaderToken);
                oEvent.getSource().insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "objectkey",
                    value: btoa(encodeURIComponent(this.aCmplntId))
                }));
                oEvent.getSource().insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "objecttype",
                    value: "BUS2000223"
                }));
                oEvent.getSource().insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "semanticobjecttype",
                    value: ""
                }));
                oEvent.getSource().insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "documentType",
                    value: ""
                }));
                oEvent.getSource().insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "documentNumber",
                    value: ""
                }));
                oEvent.getSource().insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "documentVersion",
                    value: ""
                }));
                oEvent.getSource().insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "documentPart",
                    value: ""
                }));
                oEvent.getSource().insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "Accept",
                    value: "application/json"
                }));
                oEvent.getSource().insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "slug",
                    value: btoa(encodeURIComponent(oEvent.getSource().getValue()))
                }));
                oEvent.getSource().insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "customStuff",
                    value: "customDatas"
                }));
                oUploadCollection.upload();
            },
            getAttachments: function (oComplnt_Id) {
                var that = this;
                this.getOwnerComponent().getModel("CV_ATTACHMENT_SRV").callFunction("/GetAllOriginals", {
                    method: "GET",
                    urlParameters: {
                        /* Object type and Object key come from backend S4FND13*/
                        ObjectType: "BUS2000223",
                        ObjectKey: oComplnt_Id ? oComplnt_Id : "",
                        SemanticObjectType: "",
                    },
                    success: function (oData, resp) {
                        var results = oData.results;
                        // that.getOwnerComponent().getModel("ComplaintsModel").setProperty("/OrgAttachments", oData.results);
                        that._setAttachmentModel(oData.results);
                    },
                    error: function (oError) {
                        var er = oError;
                    }
                });
            },
            onPressLink: function (oEvent) {
                var oStatus = this.byId("Status_Id").getSelectedItem().getText();
                if (oStatus.toUpperCase() === "CLOSED" || oStatus.toUpperCase() === "CANCELED") {
                    return;
                }
                var oData = oEvent.getSource().getBindingContext("ComplaintsModel").getObject();
                var _url = "/sap/opu/odata/sap/CV_ATTACHMENT_SRV/OriginalContentSet";
                var sParameters = "(Documenttype='" + oData.Documenttype + "',Documentnumber='" + oData.Documentnumber + "',Documentpart='" + oData.Documentpart + "',Documentversion='" + oData.Documentversion + "',ApplicationId='" + oData.ApplicationId + "',FileId='" + oData.FileId + "')/$value";
                var sPath = _url + sParameters;
                sap.m.URLHelper.redirect(sPath, true);
            },
            handleDeleteFiles: function (oEvent) {
                var that = this;
                var oStatus = this.byId("Status_Id").getSelectedItem().getText();
                if (oStatus.toUpperCase() === "CLOSED" || oStatus.toUpperCase() === "CANCELED") {
                    return;
                }
                var sFileInfo = oEvent.getParameter("listItem").getBindingContext("ComplaintsModel").getObject();
                var dialog = new sap.m.Dialog({
                    title: "Delete File",
                    type: "Message",
                    content: new sap.m.Text({
                        text: "Are you sure you want to delete file"
                    }),
                    beginButton: new sap.m.Button({
                        text: "OK", /*Cancel Button S4FND26*/
                        enabled: true,
                        press: function (oEvent) {
                            that._onDeleteFn(sFileInfo)
                            dialog.close();
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel", /*Cancel Button S4FND27*/
                        press: function () {
                            dialog.close();
                        }
                    }),
                    afterClose: function () {
                        dialog.destroy();
                    }
                });
                dialog.open();
            },
            _onDeleteFn: function (sFileInfo) {
                var that = this;
                var sParameters = "FileId='" + sFileInfo.FileId + "',ApplicationId='" + sFileInfo.ApplicationId + "',Documentnumber='" + sFileInfo.Documentnumber + "',Documenttype='" + sFileInfo.Documenttype + "',Documentpart='" + sFileInfo.Documentpart + "',Documentversion='" + sFileInfo.Documentversion + "'";
                var uri = "/OriginalContentSet(" + encodeURIComponent(sParameters) + ")";
                this.oModelData.remove(uri, {
                    headers: {
                        "objectkey": btoa(encodeURIComponent(oComplnt_Id)),
                        "objecttype": 'BUS2000223',
                        "semanticobjecttype": '',
                        markfordeletion: true
                    },
                    success: function () {
                        that._deleteFileHandler(sFileInfo, true);
                    },
                    error: function (oError) {
                        that._deleteFileHandler(sFileInfo, false);
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value, "");
                    }
                });
            },
            _deleteFileHandler: function (sItem, isSuccess) {
                var that = this;
                var oData = this.getOwnerComponent().getModel("ComplaintsModel").getData();
                var aItems = oData.OrgAttachments;
                var oResult = {};
                oResult.fileName = sItem.Filename;
                if (isSuccess) {
                    jQuery.each(aItems, function (index) {
                        if (aItems[index] && aItems[index] === sItem)
                            aItems.splice(index, 1);
                        that._setAttachmentModel(aItems);
                    });
                    MessageBox.success("File has been deleted");
                } else {
                    MessageBox.error("File not deleted");
                }
            },

            _setAttachmentModel: function (dataItems) {
                this.getOwnerComponent().getModel("ComplaintsModel").setProperty("/OrgAttachments", dataItems);
            },
            onSelectMSVReach: function (oEvent) {
                const oComboBox = oEvent.getSource();
                const sSelectedKey = oComboBox.getSelectedKey();
                const sNewValue = oEvent.getParameter("newValue");

                // If no valid key was selected but a value was typed
                if (!sSelectedKey && sNewValue) {
                    oComboBox.setValueStateText("Please select a value from the list.");
                    oComboBox.setValue("");
                }
            },
            onGetPlantData: function (oEvent) {
                var that = this;
                var oJSON = new sap.ui.model.json.JSONModel({
                    'Text': 'Back',
                    'FormTitle': 'RSA Details',
                    'NearLocTable': false,
                    'NearLocForm': true
                });
                that.getView().setModel(oJSON, "PlantVisible");

                var sVal = oEvent.getSource().getText();
                var sFilters = [];
                sFilters.push(new sap.ui.model.Filter("Dealer", sap.ui.model.FilterOperator.EQ, sVal));
                that.getOwnerComponent().getModel("ZSVC_CM_LOCATION_SRV").read("/Rsa_DetailsSet", {
                    filters: sFilters,
                    success: function (resp) {
                        var sResults = resp;
                        var oJSON = new sap.ui.model.json.JSONModel(resp.results);
                        that.getView().setModel(oJSON, "PlantModel");
                    },
                    error: function (oError) {

                        MessageBox.error(JSON.parse(oError.responseText).error.message.value, "");
                    }
                });
            },
            onBackPlantsTable: function (oEvent) {
                var bText = oEvent.getSource().getText();
                var that = this;
                var oModel = that.getOwnerComponent().getModel("ComplaintsModel");
                var oSelcDlr = this.byId('NearbyTable');
                 var oSelDlrPath = oSelcDlr.getSelectedIndex();
                var sDistnce = this.getView().getModel("NearbyModel").getData().results[oSelDlrPath].Distance;
                    oModel.setProperty("/ZZ1_Dist_From_BD_To_WS", sDistnce);
                if (bText === 'OK') {
                    var oIndex = oSelcDlr.getSelectedIndex();
                    var oPlnt = oSelcDlr.getRows()[oIndex].getAggregation('cells')[0].getText();
                    that.getOwnerComponent().getModel("ZSVC_CM_LOCATION_SRV").read("/Dealer_InfoSet('" + oPlnt + "')", {

                        success: function (resp) {
                            var sResults = resp;
                            oModel.setProperty("/ServicingDealer", sResults.ServicingDealer);
                            oModel.setProperty("/DealerCity", sResults.DealerCity);
                            oModel.setProperty("/DealerCode", sResults.DealerCode);
                            oModel.setProperty("/AssignedDate", sResults.AssignedDate);
                            oModel.setProperty("/AssignedTime", sResults.AssignedTime);
                            oModel.setProperty("/JobCardNumber", sResults.JobCardNumber);
                            oModel.setProperty("/JobCardOpenDate", sResults.JobCardOpenDate);
                            oModel.setProperty("/JobCardStatus", sResults.JobCardStatus);
                            //that.getBDtoWSDistnc(sResults.DealerCode);
                        },
                        error: function (oError) {

                            MessageBox.error(JSON.parse(oError.responseText).error.message.value, "");
                        }
                    });
                    this.onCloseNearbyDialog();
                }
                else {
                    var oJSON = new sap.ui.model.json.JSONModel({
                        'Text': 'OK',
                        'FormTitle': 'Nearby Plants',
                        'NearLocTable': true,
                        'NearLocForm': false
                    });
                    this.getView().setModel(oJSON, "PlantVisible");

                }
            }
        });
    });