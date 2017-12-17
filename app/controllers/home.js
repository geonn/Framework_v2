var args = arguments[0] || {};
var loading = Alloy.createController("loading");

function navToDemo(){
	Alloy.Globals.Navigator.open("demo");
}

function doLogout(){
	var user = require("user");
	user.logout(function(){
		Alloy.Globals.Navigator.navGroup.close();
		var win = Alloy.createController("auth/login").getView();
    	win.open();
	});
}

function refresh(){
	
}

function init(){
	$.win.add(loading.getView());
	var AppVersionControl = require('AppVersionControl');
	//AppVersionControl.checkAndUpdate();
}

init();

Ti.App.addEventListener('home:refresh',refresh);

$.win.addEventListener("close", function(){
	Ti.App.removeEventListener('home:refresh',refresh);
	$.destroy();
});
