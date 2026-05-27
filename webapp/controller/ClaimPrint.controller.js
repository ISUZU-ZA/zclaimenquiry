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

        return Controller.extend("isuzu.com.zclaimenquiry.controller.ClaimPrint", {
            onInit: function () {
                this.getView().addEventDelegate({
                    onAfterShow: () => {
                        let oTable = this.byId("claimTable");
                        let oModel = this.getView().getModel("claimEnquiryPrint");
                        let aData = oModel.getProperty("/report") || [];

                        if (oTable && oTable.setRowMode) {
                            oTable.setRowMode(new sap.ui.table.rowmodes.Fixed({
                                rowCount: aData.length
                            }));
                        }

                        if (oTable) {
                            oTable.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Auto);
                        }
                    }
                });
            },

            onPrintPress: function () {
                var oTable = this.byId("claimTable");
                var oModel = this.getView().getModel("claimEnquiryPrint");
                var aData = oModel.getProperty("/report") || [];

                // Force table to show all rows (no scrollbar placeholders)
                oTable.setRowMode(new sap.ui.table.rowmodes.Fixed({
                    rowCount: aData.length
                }));
                oTable.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);

                // Force rerender, then wait for rowsUpdated (fully rendered)
                oTable.attachEventOnce("rowsUpdated", function () {
                    // Scroll to top just in case
                    oTable.setFirstVisibleRow(0);

                    window.print();
                });

                oTable.rerender();
            },
            formatCurrentDateTime: function () {
                var now = new Date();
                return "Date & Time: " + now.toLocaleString(); // Customize format if needed
            },

            
            onNavBack: function () {
                // Go back to the previous page or main view
                var oHistory = sap.ui.core.routing.History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("Routemain", {}, true); // adjust route name as needed
                }
            },

        });
    }
);