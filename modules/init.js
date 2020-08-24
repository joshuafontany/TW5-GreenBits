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
exports.after = ["startup"];
exports.synchronous = false;

exports.startup = async function(callback) {
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
					const tagText = "$:/tags/greenbits/"+dataTitle.split('/')[dataTitle.split('/').length]
					//console.log(json);
					if(!!json.companies) {
						for (let index = 0; index < json.companies.length; index++) {
							const c = json.companies[index];
							if(!!c.users) {
								c.users = [];
							}
							var jsonTitle = dataTitle+"/"+c.id
							var tiddler = $tw.wiki.getTiddler(jsonTitle);
							if(tiddler && !tiddler.fields.type == "application/json") tiddler.fields.type = "application/json";
							var newTiddler = new $tw.Tiddler(tiddler,{title: jsonTitle, tags: tagText, text:JSON.stringify(c, null, 2)});
							$tw.wiki.saveTiddler(newTiddler);
						}
					}else{
						var tiddlers = $tw.wiki.filterTiddlers("[tag["+tagText+"]]");
						for(var t=0;t<tiddlers.length; t++) {
							$tw.wiki.deleteTiddler(tiddlers[t]);
							console.log("Deleted: "+ tiddlers[t]);
						}
						var jsonTitle = dataTitle+"/"+c.id
						var newTiddler = new $tw.Tiddler({title: jsonTitle, type: "application/json", tags: tagText, text:JSON.stringify(c, null, 2)});
						$tw.wiki.saveTiddler(newTiddler);
					}
				} else {
					console.log(response.status+": "+url);
				}
			} catch (error) {
				console.log(error);
			}
		};

		const updateCompanies = async(locId) => {
			//call the GreenBits API
			$tw.greenbits.headers = {
				"Content-Type": "application/json",
				"Authorization": 'Token token="'+$tw.greenbits.token+'"',
				"X-GB-CompanyId": locId
			}
			var options =  { method: 'get', headers: $tw.greenbits.headers }

			var url = $tw.greenbits.url+"/companies"
			var dataTitle = "$:/data/greenbits/location"
			await getData(url, options, dataTitle);	
		}	

		const updateLocation = async(locId) => {
			//call the GreenBits API
			$tw.greenbits.headers = {
				"Content-Type": "application/json",
				"Authorization": 'Token token="'+$tw.greenbits.token+'"',
				"X-GB-CompanyId": locId
			}
			var options =  { method: 'get', headers: $tw.greenbits.headers }

			url = $tw.greenbits.url+"/inventory_items?sellable=true"
			dataTitle = "$:/data/greenbits/location/"+locId+"/inventory_items"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/products?by_active=true"
			dataTitle = "$:/data/greenbits/location/"+locId+"/products"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/product_types"
			dataTitle = "$:/data/greenbits/location/"+locId+"/product_types"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/brands"
			dataTitle = "$:/data/greenbits/location/"+locId+"/brands"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/strains"
			dataTitle = "$:/data/greenbits/location/"+locId+"/strains"
			await getData(url, options, dataTitle);
		}

		if($tw.greenbits.update){
			var locations = [];
			locations[0] = process.env.GREENBITS_COMPANY_IDS.split(';')[2];
			//first, update the user's locations info
			updateCompanies(locations[0])
			//then, update all the locations
			for (let index = 0; index < locations.length; index++) {
				const locId = locations[index];
				await updateLocation(locId);
				console.log("LocId updated: "+locId);
			}
		}
	}
	callback();
};

})();
