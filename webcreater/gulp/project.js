//既存のやつ
var path = require("path");

//自前実装
var compilePath = require("./compilePath");
var projectPath = require("./../projectpath");
var config = require("./../config");

//出力用
module.exports = create;

function create(type,opt){
	if(!opt) opt = {};
	var includePath = opt.includePath || null;
	
	var html = compilePath.html(path.join("./",config.inputDir,config.htmlDir));
	var js   = compilePath.js(path.join("./",config.inputDir,config.jsDir));
	var css  = compilePath.css(path.join("./",config.inputDir,config.cssDir));
	
	var res = projectPath(html,js,css);
	
	//正当性チェックをする
	var projects = Object.keys(res);
	for(var i=projects.length;i--;){
		var projectName = projects[i];
		var project = res[projectName];
		switch(type){
			case "html":
				project.html = project.html || [];
				project.html = project.html.filter(validatePath.bind(null,projectName,type));
				break;
			case "js":
				project.js = project.js || [];
				project.js   = project.js.filter(validatePath.bind(null,projectName,type));
				break;
			case "css":
				project.css = project.css || [];
				project.css  = project.css.filter(validatePath.bind(null,projectName,type));
				break;
		}
	}
	
	//指定されたパスに関連するプロジェクトだけにフィルターする(オプションが存在する場合限定)
	if(includePath){
		var projects = Object.keys(res);
		for(var i=projects.length;i--;){
			var projectName = projects[i];
			var project = res[projectName];
			
			//指定したパスがどこかに含まれていたら、そのプロジェクトを選択対象にする
			if((type==="html") && project.html.some(filterPath.bind(null,includePath))) continue;
			if((type==="js") && project.js.some(filterPath.bind(null,includePath))) continue;
			if((type==="css") && project.css.some(filterPath.bind(null,includePath))) continue;
			
			//どこにもなければ、関係のないプロジェクトなので、除外する
			delete res[projectName];
		}
	}
	
	return res;
}

function validatePath(projectName,type,item,index){
	if(!item){
		console.warn("プロジェクト名" + projectName + "(" + type + "): " + index + "番目の要素が不正です(item: " + item + ")");
		return false;
	}
	if(!item["::name"]){
		console.warn("プロジェクト名" + projectName + "(" + type + "): " + index + "番目の[\"::name\"]が不正です(item: " + item + ")");
		return false;
	}
	if(!item["::path"]){
		console.warn("プロジェクト名" + projectName + "(" + type + "): " + index + "番目の[\"::path\"]が不正です(item: " + item + ")");
		return false;
	}
	if(!item["::ext"]){
		console.warn("プロジェクト名" + projectName + "(" + type + "): " + index + "番目の[\"::ext\"]が不正です(item: " + item + ")");
		return false;
	}
	if(!item["::tag"]){
		console.warn("プロジェクト名" + projectName + "(" + type + "): " + index + "番目の[\"::tag\"]が不正です(item: " + item + ")");
		return false;
	}
	
	return true;
}

function filterPath(includePath,item,index){
	return includePath === item["::path"];
}