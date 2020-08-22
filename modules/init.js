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

exports.startup = async function() {
	if($tw.node) {
		require('dotenv').config();
		const fetch = require('node-fetch');
		console.log(process.env.GREENBITS_API);
		$tw.greenbits = $tw.greenbits || {};
		$tw.greenbits.url = process.env.GREENBITS_API;
		$tw.greenbits.token = process.env.GREENBITS_TOKEN;
		$tw.greenbits.update = process.env.GREENBITS_UPDATE === "true" || false;

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

		const getData = async(url, options, dataTitle) => {
			try {
				const response = await fetch(url, options);
				if(checkStatus(response) == true){
					console.log(response.status+": "+url);
					const json = await response.json();
					//console.log(json);
					if(!!json.companies) {
						for (let index = 0; index < json.companies.length; index++) {
							const c = json.companies[index];
							if(!!c.users) {
								c.users = [];
								json.companies[index] = c;
							}
						}

					}
					$tw.wiki.setText(dataTitle, "type", null, "application/json");
					$tw.wiki.setText(dataTitle, "text", null, JSON.stringify(json, null, 2));
				} else {
					console.log(response.status+": "+url);
				}
			} catch (error) {
				console.log(error);
			}
		};

		const updateLocation = async(locId) => {
			//call the GreenBits API
			$tw.greenbits.headers = {
				"Content-Type": "application/json",
				"Authorization": 'Token token="'+$tw.greenbits.token+'"',
				"X-GB-CompanyId": locId
			}
			var options =  { method: 'get', headers: $tw.greenbits.headers }

			var url = $tw.greenbits.url+"/companies"
			var dataTitle = "$:/data/greenbits/"+$tw.greenbits.headers["X-GB-CompanyId"]+"/companies"
			await getData(url, options, dataTitle);	

			url = $tw.greenbits.url+"/inventory_items?sellable=true"
			dataTitle = "$:/data/greenbits/"+$tw.greenbits.headers["X-GB-CompanyId"]+"/inventory"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/products?by_active=true"
			dataTitle = "$:/data/greenbits/"+$tw.greenbits.headers["X-GB-CompanyId"]+"/products"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/product_types"
			dataTitle = "$:/data/greenbits/"+$tw.greenbits.headers["X-GB-CompanyId"]+"/product_types"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/brands"
			dataTitle = "$:/data/greenbits/"+$tw.greenbits.headers["X-GB-CompanyId"]+"/brands"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/strains"
			dataTitle = "$:/data/greenbits/"+$tw.greenbits.headers["X-GB-CompanyId"]+"/strains"
			await getData(url, options, dataTitle);
		}

		if($tw.greenbits.update){
			var locations = [];
			locations[0] = process.env.GREENBITS_COMPANY_IDS.split(';')[2];
			for (let index = 0; index < locations.length; index++) {
				const locId = locations[index];
				await updateLocation(locId);
				console.log("LocId updated: "+locId);
			}
		}
	}
};

})();
