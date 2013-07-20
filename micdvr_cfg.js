"use strict"

/**
* MicDVR CFG
*
* @author Pavel Rojtberg
* @copyright 2013 Pavel Rojtberg
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
* License as published by the Free Software Foundation; either
* version 3 of the License, or any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU AFFERO GENERAL PUBLIC LICENSE for more details.
*
* You should have received a copy of the GNU Affero General Public
* License along with this library. If not, see <http://www.gnu.org/licenses/>.
*
*/

var output;

$(function(){
	$("button").button()
	$("#accordion").accordion({heightStyle: "content", disabled: true})
	//$(document).tooltip()
})

function load_file(files) {
	if(files.length == 0) {
		console.log("got no file")
		return
	}
	
	var f = files[0]
	
	if(f.type != "text/plain") {
		console.log(files[0].type)
		alert("wrong content type")
		return
	}
	
	var reader = new FileReader()
	reader.onloadend = parse_file;
	reader.readAsText(f)
}

function parse_doc(docstr) {
	var ret = {}
	var tok = docstr.split(",")
	ret["_doc"] = tok[0]
	
	for(var i = 1; i < tok.length; i++) {
		var tok2 = tok[i].split(":")
		if(tok2.length == 2)
			ret[tok2[0]] = tok2[1]
	}
	
	return ret
}

function parse_cfg(cfgstr) {
	var ret = []
	var tok = cfgstr.split("=")
	ret[0] = tok[0]
	ret[1] = tok[1].match(/\[(.+)\]/)[1]
	return ret
}

function make_option(cfg, doc) {
	var ret = "<tr>"
	ret += "<td>"+cfg[0]+"</td>"
	ret += "<td><select name='"+cfg[0]+"'>"

	for(var opt in doc) {
		if(opt == "_doc" || !doc[opt]) {
			continue
		}
				
		if(cfg[1] == opt) {
			ret += "<option selected='selected' value='"+opt+"'>"
		} else {
			ret += "<option value='"+opt+"'>"
		}
			
		ret += doc[opt]+"</option>"
	}
	
	if(cfg[0] == "Date time") {
		ret += "<option selected='selected' value='????/??/??-??:??:??'>"+cfg[1]+"</option>"
		ret += "<option value='_datetime'>Set Current</option>"
	}
	
	ret += "</select></td>"
	ret += "<td>"+doc["_doc"]+"</td>"
	ret += "</tr>"
	return ret
}

var model = []

function parse_file(ev) {
	var txt = ev.target.result
	var lines = txt.split("\n")
	
	var fw_ver = "unknown"
	var boot_ver = "unknown"
			
	for(var i in lines) {
		if(lines[i].indexOf("{MicroDVR") == 0) {
			fw_ver = lines[i].match(/{MicroDVR.* (\S+)}/)[1]
			model.push(["", lines[i]])
			continue
		}
		
		if(lines[i].indexOf("{LDMICDVR") == 0) {
			boot_ver = lines[i].match(/{LDMICDVR,(\S+),.*}/)[1]
			model.push(["", lines[i]])
			continue
		}
		
		if(lines[i].indexOf("Set Time Lapse Shooting")==0) {
			lines[i] = lines[i].replace(",", ";,") // fix incorrect format
		}
		
		var tok = lines[i].split(";") // cfg, doc
		model.push([tok[0], tok[1]])
	}

	console.log("firmware version "+fw_ver)
	console.log("bootloader version "+boot_ver)
	create_interface()
}

function create_interface() {
	var config = $("#config")
	
	config.empty()
	config.append("<tr class='thead'><td>Option</td><td>Value</td><td>Description</td></tr>")
	
	for(var i in model) {
		if(!model[i][0]) {
			continue
		}
		
		var cfg = parse_cfg(model[i][0])
		var doc = parse_doc(model[i][1])
		config.append(make_option(cfg, doc))
	}
	
	$("#accordion").accordion("refresh")
	$("#accordion").accordion({active: 1, disabled: false})
}

// writer
function update_model() {
	var newdata = {}
	
	$("select").each(function() {
		var select = $(this)
		newdata[select.attr("name")] = select.find("option:selected").attr("value")
	})
	
	for(var i in model) {
		if(!model[i][0])
			continue
		
		var key = model[i][0].split("=")[0]
		var val = newdata[key]
		
		if(val == "_datetime") {
			var d = new Date()
			val = ""+d.getFullYear()+"/"+d.getMonth()+"/"+d.getDate()+"-"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()
		}
		
		model[i][0] = key+"=["+val+"]"
	}
}

function serialize() {
	var out = [];
	
	for(var i in model) {
		var line = ""
		if(model[i][0]) {
			line += model[i][0]+";"
		}
		line += model[i][1]
		out.push(line)
	}
	
	return out.join("\n")
}

function new_file() {
	update_model()
	var cfgstr = serialize()
    var blob = new Blob([cfgstr], {type: "text/plain;charset=utf-8"})
	var url = window.URL.createObjectURL(blob)
	$("#outfile").attr("href", url)
	$("#outfile")[0].click()
}