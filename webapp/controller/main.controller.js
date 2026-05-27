sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/MessageBox',
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet",
    'sap/ui/model/type/String',
    'sap/ui/table/rowmodes/Fixed',
    'sap/ui/table/library'
],
    function (Controller, JSONModel, Filter, FilterOperator, MessageBox, Fragment, Spreadsheet, TypeString, FixedRowMode, TableLib) {
        "use strict";

        return Controller.extend("isuzu.com.zclaimenquiry.controller.main", {
            onInit: function () {
                const sDisplay = {
                    fileDisplay: false,
                    zclaim: ""
                };
                const oDisplayModel = new sap.ui.model.json.JSONModel(sDisplay);
                this.getOwnerComponent().setModel(oDisplayModel, "displayModel");

                Fragment.load({
                    id: this.getView().getId(),
                    name: 'isuzu.com.zclaimenquiry.view.fragment.uploadfile',
                    controller: this,
                }).then(
                    function (oUploadDialog) {
                        this._oUploadDialog = oUploadDialog;
                        this.getView().addDependent(this._oUploadDialog);
                        // oUploadDialog.open();
                    }.bind(this),
                );

                Fragment.load({
                    name: 'isuzu.com.zclaimenquiry.view.fragment.ClaimPrint',
                    controller: this,
                }).then(
                    function (oClaimPrint) {
                        this._oClaimPrint = oClaimPrint;
                        this.getView().addDependent(this._oClaimPrint);
                    }.bind(this),
                );
            },
            onSearch: function (oEvent) {
                // let sError = this.onSearchValidation(oEvent);

                // if (sError) {
                //     return;
                // }
                this.getResultBackend(oEvent);
                // this.updateTableCountInTitle();
            },
            onSearchValidation: function (oEvent) {
                var sFiltersSet = oEvent.getParameter('selectionSet');

                if (sFiltersSet[0].getValue() && sFiltersSet[2].getValue()) {
                    MessageBox.error(this.onGetText('BothSelection'));
                    return true;
                }

                this.updateTableCountInTitle();
            },
            onGetText: function (sTextId) {
                let oi18n = this.getView().getModel("i18n").getResourceBundle();
                return oi18n.getText(sTextId)
            },
            getResultBackend: function (oEvent) {
                let oModel = this.getView().getModel();
                let oView = this.getView();
                let aFilters = this.prepareFilters(oEvent);
                sap.ui.core.BusyIndicator.show();
                oModel.read("/ClaimEnquirySet", {
                    filters: aFilters,
                    success: (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        let oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData({ report: oData.results });
                        oView.setModel(oJSONModel, "claimEnquiry");
                        this.updateTableCountInTitle();
                    },
                    error: (oError) => {
                        console.log(oError);
                        sap.ui.core.BusyIndicator.hide();
                        const sErrorText = JSON.parse(oError.responseText);
                        MessageBox.error(sErrorText.error.message.value); // Or show toast, etc.
                    }
                });
            },
            prepareFilters: function (oEvent) {
                let aFilters = [];
                var sFiltersSet = oEvent.getParameter('selectionSet');

                if (sFiltersSet[0].getValue()) {
                    let oDateRange = {};
                    let sSdate = sFiltersSet[0].getValue();
                    let aDateParts = sSdate.split(" - ");
                    if (aDateParts.length === 2) {
                        let oStartDate = new Date(aDateParts[0].trim());
                        let oEndDate = new Date(aDateParts[1].trim());
                        oStartDate.setHours(0, 0, 0, 0);   // Start of day
                        oEndDate.setHours(23, 59, 59, 999); // End of day

                        oDateRange.date = {
                            low: oStartDate,
                            high: oEndDate
                        };
                    }
                    aFilters.push(new sap.ui.model.Filter({
                        path: "Zclaimdte",
                        operator: sap.ui.model.FilterOperator.BT,
                        value1: oDateRange.date.low,
                        value2: oDateRange.date.high
                    }));
                }

                if (sFiltersSet[1].getValue() && sFiltersSet[2].getValue()) {
                    aFilters.push(new sap.ui.model.Filter("Zinvno", "BT", sFiltersSet[1].getValue(), sFiltersSet[2].getValue()));
                }
                else if (sFiltersSet[1].getValue()) {
                    aFilters.push(new sap.ui.model.Filter("Zinvno", "EQ", sFiltersSet[1].getValue()));
                }
                else if (sFiltersSet[2].getValue()) {
                    aFilters.push(new sap.ui.model.Filter("Zinvno", "EQ", sFiltersSet[2].getValue()));
                }

                if (sFiltersSet[3].getValue() && sFiltersSet[4].getValue()) {
                    aFilters.push(new sap.ui.model.Filter("Zmatnr", "BT", sFiltersSet[3].getValue(), sFiltersSet[4].getValue()));
                }
                else if (sFiltersSet[3].getValue()) {
                    aFilters.push(new sap.ui.model.Filter("Zmatnr", "EQ", sFiltersSet[3].getValue()));
                }
                else if (sFiltersSet[4].getValue()) {
                    aFilters.push(new sap.ui.model.Filter("Zmatnr", "EQ", sFiltersSet[4].getValue()));
                }

                if (sFiltersSet[5].getValue() && sFiltersSet[6].getValue()) {
                    aFilters.push(new sap.ui.model.Filter("Zclaim", "BT", sFiltersSet[5].getValue(), sFiltersSet[6].getValue()));
                }
                else if (sFiltersSet[5].getValue()) {
                    aFilters.push(new sap.ui.model.Filter("Zclaim", "EQ", sFiltersSet[5].getValue()));
                }
                else if (sFiltersSet[6].getValue()) {
                    aFilters.push(new sap.ui.model.Filter("Zclaim", "EQ", sFiltersSet[6].getValue()));
                }

                if (sFiltersSet[7].getSelectedKey()) {
                    aFilters.push(new sap.ui.model.Filter("Zstatus", "EQ", sFiltersSet[7].getSelectedKey()));
                }
                if (sFiltersSet[8].getSelected()) {
                    aFilters.push(new sap.ui.model.Filter("Showclaimdoc", "EQ", "X"));
                }
                return aFilters;

            },
            FilterSearch: function (oEvent) {
                const sQuery = oEvent.getParameter("newValue");
                var oTable = this.byId("_IDGenTable1");
                var oBinding = oTable.getBinding("items");
                // Define which columns to search on (e.g. Name1, Fltown, Fltcat)
                var aFilters = [
                    new sap.ui.model.Filter({ path: "Zclaim", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                    new sap.ui.model.Filter({ path: "Ztype", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                    new sap.ui.model.Filter({ path: "Zstatustext", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                    new sap.ui.model.Filter({ path: "Docoutstand", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                    new sap.ui.model.Filter({ path: "Zmatnr", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                    new sap.ui.model.Filter({ path: "Zmatdesc", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                    new sap.ui.model.Filter({ path: "Dgcl", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                    new sap.ui.model.Filter({ path: "Profl", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                    new sap.ui.model.Filter({ path: "Zqty", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                    new sap.ui.model.Filter({ path: "Zinvno", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
                    new sap.ui.model.Filter({ path: "Zcrednote", operator: sap.ui.model.FilterOperator.Contains, value1: sQuery, caseSensitive: false })

                ];

                // Combine them with OR
                var oCombinedFilter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                });

                // Apply filter
                oBinding.filter(oCombinedFilter);

                this.updateTableCountInTitle();
            },
            onExport: function () {
                // const oTable = this.byId("_IDGenTable1");
                // const aSelectedItems = oTable.getRows();
                // const aFleetSalesReport = aSelectedItems.map(function (oItem) {
                //     const oCtx = oItem.getBindingContext("fltSalesReportModel");
                //     return oCtx ? oCtx.getObject() : null;
                // });

                var oTable = this.byId("_IDGenTable1");
                var oBinding = oTable.getBinding("items");

                // Get contexts (records)
                var aContexts = oBinding.getContexts(0, oBinding.getLength());

                // Extract data
                var aData = aContexts.map(function (oContext) {
                    return oContext.getObject(); // or oContext.getModel().getProperty(oContext.getPath())
                });

                const aCols = this.createColumnConfig();
                const oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: "Level"
                    },
                    dataSource: aData,
                    fileName: "ClaimEnquiry.xlsx",
                    worker: false
                };

                const oSheet = new sap.ui.export.Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });
            },
            createColumnConfig: function () {
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                let aCol = [];
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Zclaim"), // i18n>Config
                            property: "Zclaim",
                            type: "string"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Zclaimdte"), // i18n>Config
                            property: "Zclaimdte",
                            type: "Date"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Ztype"), // i18n>Config
                            property: "Ztype",
                            type: "string"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Zstatus"), // i18n>Config
                            property: "Zstatustext",
                            type: "string"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Docoutstand"), // i18n>Config
                            property: "Docoutstand",
                            type: "string"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Partn"), // i18n>Config
                            property: "Zmatnr",
                            type: "string"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Zmatdesc"), // i18n>Config
                            property: "Zmatdesc",
                            type: "string"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Dgcl"), // i18n>Config
                            property: "Dgcl",
                            type: "string"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Profl"), // i18n>Config
                            property: "Profl",
                            type: "string"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Zqty"), // i18n>Config
                            property: "Zqty",
                            type: "string"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Zinvno"), // i18n>Config
                            property: "Zinvno",
                            type: "string"
                        }
                    );
                
                    aCol.push(
                        {
                            label: oResourceBundle.getText("Zcrednote"), // i18n>Config
                            property: "Zcrednote",
                            type: "string"
                        }
                    );
                
                return aCol;
            },
            updateTableCountInTitle: function () {
                const oTable = this.byId("_IDGenTable1");
                const oBinding = oTable.getBinding("items");

                if (oBinding && typeof oBinding.getLength === "function") {
                    const iCount = oBinding.getLength();
                    const sTitle = `Items (${iCount} items)`;
                    this.byId("tableTitle").setText(sTitle);
                } else {
                    this.byId("tableTitle").setText("Items (0 items)");
                }
            },
            onUpload: function (oEvent) {
                let oButton = oEvent.getSource();
                let oContext = oButton.getBindingContext("claimEnquiry");
                let oRowData = oContext.getObject();
                let oModel = this.getView().getModel();
                let aFilters = [];
                aFilters.push(new sap.ui.model.Filter("FileName", "EQ", oRowData.Zclaim));
                let sDisplayModel = this.getView().getModel("displayModel");
                sDisplayModel.setProperty('/zclaim', oRowData.Zclaim);

                let oView = this.getView();
                sap.ui.core.BusyIndicator.show();
                oModel.read("/attachmentSet", {
                    filters: aFilters,
                    success: (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        let oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData({ report: oData.results });
                        oView.setModel(oJSONModel, "claimFiles");
                        let sDisplayModel = this.getView().getModel("displayModel");
                        if (oData.results.length > 0) {
                            sDisplayModel.setProperty('/fileDisplay', true);
                        }
                        else {
                            sDisplayModel.setProperty('/fileDisplay', false);
                        }
                        this._oUploadDialog.open();
                    },
                    error: (oError) => {
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            },
            onUploadCancelPress: function (oEvent) {
                this._oUploadDialog.close();
                // this._oUploadDialog.destroy();
            },
            onFileChange: function (oEvent) {

                var oFile = oEvent.getParameter("files")[0];
                var reader = new FileReader();
                reader.onload = function (e) {
                    var sBase64 = btoa(
                        new Uint8Array(e.target.result)
                            .reduce((data, byte) => data + String.fromCharCode(byte), '')
                    );

                    // Call OData create
                    sap.ui.core.BusyIndicator.show();
                    let sData = this.getView().getModel("displayModel").getData();
                    this.getView().getModel().create("/attachmentSet", {
                        FileName: oFile.name,
                        MimeType: oFile.type,
                        Zclaim: sData.zclaim,
                        Content: sBase64
                    }, {
                        success: () => {
                            sap.ui.core.BusyIndicator.hide();
                            MessageBox.information("File Uploaded successfully");
                            this.onUploadCancelPress();
                        },
                        error: (oError) => {
                            console.log(oError);
                            sap.ui.core.BusyIndicator.hide();
                            this.onUploadCancelPress();
                            const sErrorText = JSON.parse(oError.responseText);
                            MessageBox.error(sErrorText.error.message.value); // Or show toast, etc.
                        }
                    });
                }.bind(this);

                reader.readAsArrayBuffer(oFile);
                this.byId("fileUploader1").clear();
            },
            // onCancel: function (oEvent) {
            //     let oButton = oEvent.getSource();
            //     let oContext = oButton.getBindingContext("claimFiles");
            //     let oRowData = oContext.getObject();
            //     let aFilters = [];
            //     // aFilters.push(new sap.ui.model.Filter("FileName", "EQ", oRowData.FileName));
            //     // aFilters.push(new sap.ui.model.Filter("MimeType", "EQ", 'DELETE'));
            //     // aFilters.push(new sap.ui.model.Filter("Content", "EQ", oRowData.Content));                               
            //     sap.ui.core.BusyIndicator.show();
            //     this.getView().getModel().create("/attachmentSet", {
            //         FileName: oRowData.FileName,
            //         MimeType: 'DELETE',
            //         Content: oRowData.Content
            //     }, {
            //         success: () => {
            //             sap.ui.core.BusyIndicator.hide();
            //             MessageBox.information("File Deleted successfully");
            //             this.onUploadCancelPress();
            //         },
            //         error: (oError) => {
            //             console.log(oError);
            //             sap.ui.core.BusyIndicator.hide();
            //             const sErrorText = JSON.parse(oError.responseText);
            //             MessageBox.error(sErrorText.error.message.value); // Or show toast, etc.
            //         }
            //     });
            // },

            onCancel: function (oEvent) {
                let oButton = oEvent.getSource();
                let oContext = oButton.getBindingContext("claimFiles");
                let oRowData = oContext.getObject();
                        
                MessageBox.confirm("Do you want to delete this Document?", {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    emphasizedAction: sap.m.MessageBox.Action.YES,
                
                    onClose: (oAction) => {
                        if (oAction === sap.m.MessageBox.Action.YES) {
                        
                            sap.ui.core.BusyIndicator.show();
                        
                            this.getView().getModel().create("/attachmentSet", {
                                FileName: oRowData.FileName,
                                MimeType: 'DELETE',
                                Content: oRowData.Content
                            }, {
                                success: () => {
                                    sap.ui.core.BusyIndicator.hide();
                                    MessageBox.information("File Deleted successfully");
                                    this.onUploadCancelPress();
                                },
                                error: (oError) => {
                                    console.log(oError);
                                    sap.ui.core.BusyIndicator.hide();
                                    const sErrorText = JSON.parse(oError.responseText);
                                    MessageBox.error(sErrorText.error.message.value);
                                }
                            });
                        
                        }
                    }
                });
            },
            onPrint: function (oEvent) {
                let oButton = oEvent.getSource();
                let oContext = oButton.getBindingContext("claimEnquiry");
                let oRowData = oContext.getObject();
                let oModel = this.getView().getModel();
                let aFilters = [];
                aFilters.push(new sap.ui.model.Filter("Zclaim", "EQ", oRowData.Zclaim));
                let oView = this.getView();
                sap.ui.core.BusyIndicator.show();
                oModel.read("/ClaimEnquiryPrintSet", {
                    filters: aFilters,
                    success: (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        let oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData({ report: oData.results });
                        // oView.setModel(oJSONModel, "claimEnquiryPrint");
                        this.getOwnerComponent().setModel(oJSONModel, "claimEnquiryPrint");
                        let oRouter = this.getOwnerComponent().getRouter();
                        oRouter.navTo("ClaimPrint");

                    },
                    error: (oError) => {
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            },
        });
    });
