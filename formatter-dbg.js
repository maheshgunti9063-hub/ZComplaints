sap.ui.define([], function() {
	"use strict";
	return {
        stringtodate:function(st){
			if(st === null || st === "" || st === undefined){
                return "";
            }else{
			 var pattern = "01.01.1970 " + st;
			// var dt = new Date(st.replace(pattern,'$3-$2-$1'));	
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "dd.MM.YYYY"});
    
			return  oDateFormat.format(new Date(st));
			}
		},
		formatTimetaken:function(timtkn){
			if(timtkn){
			var oTime = timtkn.split(":");
			return oTime[0] + ":" + oTime[1];
			}
		},
		formatGetBrkdwnBtn:function(sArea, sMSVRCHDate){
		var Enabled = false;
       if(sArea === 'RSA/Off Road'){
		if(sMSVRCHDate !== '' || sMSVRCHDate !== undefined){
			Enabled = true;
		}
	   }
	   return Enabled;
		},
		formatDistance:function(distnce){
			if(distnce !== ''){
				distnce = distnce /1000;
				distnce = parseFloat(distnce);
				return distnce.toFixed(3);
			}
			else {
				return '';
			}
		}
    };
});