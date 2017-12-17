/*********************
*** SETTING / API ***
**********************/
var API_DOMAIN = "gohr.geonn.com.my";
// APP authenticate user and key
var USER  = 'gohr';
var KEY   = '80175304721014532l49f7207c8943981';

//API that call in sequence 
var APILoadingList = [
	//{url: "dateNow", type: "api_function", method: "sync_server_time", checkId: "0"},
	//{url: "getCategoryList", type: "api_model", model: "category", checkId: "5"},
];

/*********************
**** API FUNCTION*****
**********************/

exports.loadAPIBySequence = function (e){ //counter,
	var counter = (typeof e.counter == "undefined")?0:e.counter;
	console.log(counter+" "+APILoadingList.length);
	if(counter >= APILoadingList.length){
		Ti.App.fireEvent('app:loadingViewFinish');
		console.log("fired?");
		return false;
	}
	
	var api = APILoadingList[counter];
	var checker = Alloy.createCollection('updateChecker'); 
	var isUpdate = checker.getCheckerById(api['checkId']);
	var params ="";
	
	if(isUpdate != "" && last_update_on){
		params = {last_updated: isUpdate.updated};
	}
	
	var url = api['url'];
	console.log(url);
	console.log(params.last_updated);
	API.callByPost({
		url: url,
		params: params
	},{
		onload: function(responseText){
			if(api['type'] == "api_function"){
				eval("_.isFunction("+api['method']+") && "+api['method']+"(responseText)");
			}else if(api['type'] == "api_model"){
				var res = JSON.parse(responseText);
				var arr = res.data; 
		       	var model = Alloy.createCollection(api['model']);
		        model.saveArray(arr);
		        checker.updateModule(APILoadingList[counter]['checkId'],APILoadingList[counter]['model'],currentDateTime());
			}
			Ti.App.fireEvent('app:update_loading_text', {text: APILoadingList[counter]['model']+" loading..."});
			counter++;
			API.loadAPIBySequence({counter: counter});
		},
		onerror: function(err){
			Ti.App.fireEvent('app:update_loading_text', {text: APILoadingList[counter]['model']+" loading..."});
			counter++;
			API.loadAPIBySequence({counter: counter});
		}
	});
};

// call API by post method
exports.callByPost = function(e, handler){
	
	var deviceToken = Ti.App.Properties.getString('deviceToken');
	if(deviceToken != ""){ 
		var url = "http://"+API_DOMAIN+"/api/"+e.url+"?user="+USER+"&key="+KEY;
		console.log(url);
		var _result = contactServerByPost(url, e.params || {});   
		_result.onload = function(ex) {  
			console.log(this.responseText);
			try{
				JSON.parse(this.responseText);
			}
			catch(e){
				console.log(this.responseText);
				console.log('callbypost JSON exception');
				console.log(e);
				COMMON.createAlert("Error", e.message, handler.onexception);
				return;
			}
			_.isFunction(handler.onload) && handler.onload(this.responseText); 
		};
		
		_result.onerror = function(ex) {
			//-1001	The request timed out.
			if(ex.code == "-1009"){		//The Internet connection appears to be offline.
				COMMON.createAlert("Error", ex.error, handler.onerror);
				return;
			}
			if(_.isNumber(e.retry_times)){
				console.log(e.retry_times);
				e.retry_times --;
				if(e.retry_times > 0){
					API.callByPost(e, handler);
				}else{
					console.log('onerror msg');
					console.log(ex);
					COMMON.createAlert("Error", ex.error, handler.onerror);
				}
			}else{
				console.log('onerror msg without no');
				console.log(ex);
				e.retry_times = 2;
				API.callByPost(e, handler);
			}
		};
	}
};

// call API by post method
exports.callByPostImage = function(e, onload, onerror) { 
	var client = Ti.Network.createHTTPClient({
		timeout : 5000
	});
	var url = eval(e.url);
	var _result = contactServerByPostImage(url, e.params || {});
	_result.onload = function(e) { 
		console.log('success');
		onload && onload(this.responseText); 
	};
	
	_result.onerror = function(ex) { 
		console.log("onerror");
		API.callByPostImage(e, onload);
		//onerror && onerror();
	};
};

// update user device token
exports.updateNotificationToken = function(e){
	
	var deviceToken = Ti.App.Properties.getString('deviceToken');
	if(deviceToken != ""){ 
		var records = {};
		records['version'] =  Ti.Platform.version;
		records['os'] =  Ti.Platform.osname;
		records['model'] =  Ti.Platform.model;
		records['macaddress'] =  Ti.Platform.macaddress;  
		records['token'] =  deviceToken;    
		var url = updateTokenUrl ;
		var _result = contactServerByPost(url,records);   
		_result.onload = function(e) {  
		};
		
		_result.onerror = function(e) { 
		};
	}
};

/*********************
 * Private function***
 *********************/
function sync_server_time(responseText){
	var res = JSON.parse(responseText);
	if(res.status != "error"){
		COMMON.sync_time(res.data);
	}
}

function contactServerByGet(url) { 
	var client = Ti.Network.createHTTPClient({
		timeout : 5000
	});
	client.open("GET", url);
	client.send(); 
	return client;
};

function contactServerByPost(url,records) { 
	var client = Ti.Network.createHTTPClient({
		timeout : 5000
	});
	if(OS_ANDROID){
	 	client.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
	 }
	client.open("POST", url);
	client.send(records);
	return client;
};

function contactServerByPostImage(url, records) { 
	var client = Ti.Network.createHTTPClient({
		timeout : 5000
	});
	client.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');  
	client.open("POST", url);
	client.send(records); 
	return client;
};

function onErrorCallback(e) { 
	// Handle your errors in here
	COMMON.createAlert("Error", e);
};
