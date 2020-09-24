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
					var tagArr = dataTitle.split('/');
					var tag = tagArr[tagArr.length-1];
					var tagText = "$:/tags/greenbits/"+tag;
					//console.log(json);
					if(tag === 'location') {
						for (let index = 0; index < json.companies.length; index++) {
							const c = json.companies[index];
							if(!!c.users) {
								c.users = [];
							}
							var jsonTitle = dataTitle+"/"+c.id
							var tiddler = $tw.wiki.getTiddler(jsonTitle);
							var modificationFields = $tw.wiki.getModificationFields();
							var newTiddler = new $tw.Tiddler(tiddler,{title: jsonTitle, type: "application/json", tags: tagText, text:JSON.stringify(c, null, 2)}, modificationFields);
							$tw.wiki.addTiddler(newTiddler);
							//console.log("Added: "+ newTiddler.fields.title);
						}
					}else{
						var tiddlers = $tw.wiki.filterTiddlers("[tag["+tagText+"]]");
						for(var t=0;t<tiddlers.length; t++) {
							$tw.wiki.deleteTiddler(tiddlers[t]);
							//console.log("Deleted: "+ tiddlers[t]);
						}
						if (json[tag] && json[tag].length >= 1) {
							var respArr = json[tag];
							for (let index = 0; index < respArr.length; index++) {
								var item = respArr[index];
								var jsonTitle = dataTitle+"/"+item.id;
								var newTiddler = new $tw.Tiddler({title: jsonTitle, type: "application/json", tags: tagText, text:JSON.stringify(item, null, 2)});
								$tw.wiki.addTiddler(newTiddler);
								//console.log("Added: "+ newTiddler.fields.title);
							}
						}
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
			var url = "", dataTitle = "";
			//call the GreenBits API
			$tw.greenbits.headers = {
				"Content-Type": "application/json",
				"Authorization": 'Token token="'+$tw.greenbits.token+'"',
				"X-GB-CompanyId": locId
			}
			var options =  { method: 'get', headers: $tw.greenbits.headers }

			url = $tw.greenbits.url+"/product_types"
			dataTitle = "$:/data/greenbits/location/"+locId+"/product_types"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/brands"
			dataTitle = "$:/data/greenbits/location/"+locId+"/brands"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/strains"
			dataTitle = "$:/data/greenbits/location/"+locId+"/strains"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/inventory_items?sellable=true"
			dataTitle = "$:/data/greenbits/location/"+locId+"/inventory_items"
			await getData(url, options, dataTitle);

			url = $tw.greenbits.url+"/products?by_active=true"
			dataTitle = "$:/data/greenbits/location/"+locId+"/products"
			await getData(url, options, dataTitle);
		}

		if($tw.greenbits.update){
			var locations = [];
			locations = process.env.GREENBITS_COMPANY_IDS.split(';');
			//first, update the user's locations info
			updateCompanies(locations[0])
			//then, update all the locations
			for (let index = 0; index < locations.length; index++) {
				const locId = locations[index];
				await updateLocation(locId);

				var tiddlers = [], filterText = "[all[tiddlers+shadows]prefix[$:/data/greenbits/location/"+locId+"/products/]]";
				tiddlers = $tw.wiki.filterTiddlers(filterText);
				if(tiddlers.length > 0) {
					//console.log("Products: "+tiddlers.length);
					for (let index = 0; index < tiddlers.length; index++) {
						const title = tiddlers[index];
						var tid = $tw.wiki.getTiddler(title), newTid = {fields:{}};
						var jsonData = JSON.parse(tid.fields.text);
						newTid.fields["name"] = jsonData["name"];
						newTid.fields["tags"] = jsonData["tags"];
						newTid.fields["sell_price"] = (jsonData["sell_price"] / 100).toFixed(2);
						newTid.fields["product_type"] = $tw.wiki.getTextReference("$:/data/greenbits/location/"+locId+"/product_types/"+jsonData["product_type_id"]+"##name");
						newTid.fields["flower_type"] = $tw.wiki.getTextReference("$:/config/greenbits/enums/product/flower_type##"+jsonData["flower_type"]);
						newTid.fields["concentrate_type"] = $tw.wiki.getTextReference("$:/config/greenbits/enums/product/concentrate_type##"+jsonData["concentrate_type"]);
						newTid.fields["brand"] = $tw.wiki.getTextReference("$:/data/greenbits/location/"+locId+"/brands/"+jsonData["brand_id"]+"##name");
						if(jsonData["strain_id"] && typeof(jsonData["strain_id"]) != "null") newTid.fields["strain"] = $tw.wiki.getTextReference("$:/data/greenbits/location/"+locId+"/strains/"+jsonData["strain_id"]+"##name");
						if ($tw.wiki.getTextReference("$:/data/greenbits/location/"+locId+"/product_types/"+jsonData["product_type_id"]+"##test_results_unit") == 0) {
							newTid.fields["test_results_thc"] = ((parseFloat(jsonData["test_results_thc"]) || 0) * 100).toFixed(2)+" %";
							newTid.fields["test_results_cbd"] = ((parseFloat(jsonData["test_results_cbd"]) || 0) * 100).toFixed(2)+" %";	
						} else if ($tw.wiki.getTextReference("$:/data/greenbits/location/"+locId+"/product_types/"+jsonData["product_type_id"]+"##test_results_unit") == 1) {
							newTid.fields["test_results_thc"] = (parseFloat(jsonData["test_results_thc"]) || 0).toFixed(2)+" mg";
							newTid.fields["test_results_cbd"] = (parseFloat(jsonData["test_results_cbd"]) || 0).toFixed(2)+" mg";
						}

						$tw.wiki.addTiddler(new $tw.Tiddler(tid, newTid.fields, $tw.wiki.getCreationFields()));
					}
				}
				console.log("LocId updated: "+locId);
			}
		}
	}
	callback();
};

})();
