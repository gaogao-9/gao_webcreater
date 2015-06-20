var fs = require("fs");
var path = require("path");

exports.html = html;
exports.js = js;
exports.css = css;

function html(dir){
	return directoryLookup(dir,["html","htm","ejs","ect"]);
};

function js(dir){
	return directoryLookup(dir,["js"]);
};

function css(dir){
	return directoryLookup(dir,["css","scss","sass"]);
};

function directoryLookup(dir,exts){
	var files = _directoryLookup(dir,[],[]);
	if(exts){
		exts = exts.map(function(e){ return e.toLowerCase(); });
		files = files.filter(function(e){
			return exts.indexOf(e.ext) !== -1;
		});
	}
	
	var output = {};
	for(var i=0,iLen=files.length;i<iLen;++i){
		var tmp = output;
		for(var j=0,jLen=files[i].dirnames.length;j<jLen;++j){
			tmp[files[i].dirnames[j]] = tmp[files[i].dirnames[j]] || {};
			tmp = tmp[files[i].dirnames[j]];
		}
		tmp[files[i].name] = tmp[files[i].name] || {};
		
		var keys = Object.keys(files[i]);
		for(var j=keys.length;j--;){
			if(keys[j]==="dirnames") continue;
			tmp[files[i].name]["::"+keys[j]] = files[i][keys[j]];
		}
	}
	
	return output;
}

function _directoryLookup(dir,dirnames,output){
	try{
		var items = fs.readdirSync(dir);
	}
	catch(err){
		fs.mkdirSync(dir);
		var items = fs.readdirSync(dir);
	}
	items.forEach(function(item){
		var _path = path.join(dir,item);
		var stat = fs.statSync(_path);
		if(stat.isFile()){
			var arr = item.split(".");
			var name = arr.shift();
			arr = arr.map(function(e){ return e.toLowerCase(); });
			var ext = arr.pop().toLowerCase();
			
			var obj = {
				path: path.resolve(_path),
				dirnames: dirnames,
				name: name,
				ext: ext,
				tag: arr
			};
			output.push(obj);
			return;
		}
		if(stat.isDirectory()){
			return; //(思ったよりも使い勝手が悪かったので)再帰的に呼ばないようにする
			var newDirnames = dirnames.concat();
			newDirnames.push(item);
			return _directoryLookup(_path,newDirnames,output);
		}
	});
	
	return output;
}