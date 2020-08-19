/*\
title: $:/plugins/joshuafontany/oembed/init.js
type: application/javascript
module-type: startup

oembetter initialisation
https://github.com/apostrophecms/oembetter

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "greenbits-init";
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	if($tw.node) {
		require('dotenv').config();
		const fetch = require('node-fetch');
		console.log(process.env.API_URL);
		$tw.greenbits = $tw.greenbits || {};
		$tw.greenbits.url = process.env.API_URL;
		$tw.greenbits.token = process.env.ACCESS_TOKEN;

		$tw.greenbits.headers = {
		"Content-Type": "application/json",
		"Authorization": 'Token token="'+$tw.greenbits.token+'"'
		}
		function checkStatus (res) {
			if (res.status >= 200 && res.status < 300) {
				return true
			} else {
				return false;
				/*
				let err = new Error(res.statusText)
				err.response = res
				throw err
				*/
			}
		  }
		
		const getData = async (url, options) => {
			try {
				var configTitle = "$:/config/plugins/joshuafontany/greenbits/api"
				$tw.wiki.setText(configTitle, null, "url", $tw.greenbits.url);
				const response = await fetch(url, options);
				if(checkStatus(response) == true){
					console.log(url);
					console.log(response.status);
					const json = await response.json();
					console.log(json);
					$tw.wiki.setText(configTitle, null, "companies", json.companies);
				} else {
					console.log(response.status+": "+url);
				}
			} catch (error) {
			  console.log(error);
			}
		  };

		//var companyIDs = process.env.COMPANY_IDS.split(';');
		var url = $tw.greenbits.url+"companies"
		var options =  { method: 'get', headers: $tw.greenbits.headers }	
		getData(url, options);	
	}
};

})();
