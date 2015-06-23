var path = require("path");
var stream = require("stream");
var notifier = require('node-notifier');
var through2 = require("through2");

var gulp = require("gulp");
var concat = require("gulp-concat");
var ejs = require("gulp-ejs");
var ejsmin = require("gulp-ejsmin");
var htmlmin = require("gulp-htmlmin");
var merge2 = require("merge2");

var compilePath = require("./compilePath");
var config = require("./../config");

//出力用
module.exports = compile;

function compile(project,opt){
	if(!project) throw new Error("第一引数にはprojectを与えてください");
	if(!opt) opt = {};
	var isDebug = !!opt.isDebug;
	var dest = path.join("./",config.outputDir);
	
	var stream = merge2();
	var compileList = [];
	var projectNames = Object.keys(project);
	for(var i=0,iLen=projectNames.length;i<iLen;++i){
		var projectName = projectNames[i];
		var projectTarget = project[projectName];
		var htmlList = projectTarget.html;
		
		var task = htmlCompile(htmlList,isDebug)
			.pipe(concat(projectName + ".html"));
		
		//if(!isDebug){
		if(true){ //改行つぶしは常にやっておかないと表示に影響が出る
			task = task
				.pipe(ejsmin({removeComment: true}))
				.pipe(through2.obj(function(file,enc,next){
					var str = file.contents.toString().replace(/[\n\r]/g,"");
					file.contents = new Buffer(str);
					next(null, file);
				}));
		}
		
		task = task.pipe(gulp.dest(path.join(dest,config.htmlDir)))
			.on("end",function(projectName){
				console.log("プロジェクト[" + projectName + "]のHTMLコンパイルが完了しました！");
			}.bind(null,projectName));
		
		compileList.push(task);
	}
	stream.add(compileList);
	
	return stream;
}

function htmlCompile(htmlList,isDebug){
	var stream = merge2();
	var createCompiler = _createCompiler();
	
	var outputList = [];
	var oldState = null;
	var tmp = [];
	
	for(var i=0,iLen=htmlList.length;i<iLen;++i){
		var isEJS = (htmlList[i]["::ext"]==="ejs");
		var isECT = (htmlList[i]["::ext"]==="ect");
		var isMinified = (htmlList[i]["::tag"].indexOf("min")!==-1);
		var newState = isMinified | (isEJS<<1) | (isECT<<2);
		var path = htmlList[i]["::path"];
		
		if((oldState !== null) && (oldState !== newState)){
			var compiler = createCompiler(tmp,oldState);
			if(compiler !== null){
				outputList.push(compiler);
			}
			
			tmp = [];
		}
		
		tmp.push(path);
		
		oldState = newState;
	}
	if(tmp.length){
		var compiler = createCompiler(tmp,oldState);
		if(compiler !== null){
			outputList.push(compiler);
		}
	}
	stream.add(outputList); //concat出来るES6をconcatし、それ以外はそのまま渡すストリーム群を並列処理して連結
	
	function _createCompiler(){
		var cnt = 0;
		var STATE = {
			UNMINIFIED_NORMAL: 0,
			MINIFIED_NORMAL:   1,
			UNMINIFIED_EJS:    2,
			MINIFIED_EJS:      3,
			UNMINIFIED_ECT:    4,
			MINIFIED_ECT:      5,
		};
		return function(src,state){
			switch(state){
				case STATE.UNMINIFIED_NORMAL:
				case STATE.MINIFIED_NORMAL:
					return compileNormal(src,!((state&1)|isDebug),cnt++);
				case STATE.UNMINIFIED_EJS:
				case STATE.MINIFIED_EJS:
					return compileEJS(src,!((state&1)|isDebug),cnt++);
				case STATE.UNMINIFIED_ECT:
				case STATE.MINIFIED_ECT:
					return compileECT(src,!((state&1)|isDebug),cnt++);
			}
			return null;
		}
	}
	
	return stream;
}

function compileEJS(src,useMinify,id){
	return _compileEJSorECT(src,useMinify,id,"ejs");
}

function compileECT(src,useMinify,id){
	return _compileEJSorECT(src,useMinify,id,"ect");
}

function _compileEJSorECT(src,useMinify,id,type){
	var stream = merge2();
	var outputList = [];
	
	if(type==="ejs"){
		var html = compilePath.html(path.join("./",config.inputDir,config.htmlDir));
		var js   = compilePath.js(path.join("./",config.inputDir,config.jsDir));
		var css  = compilePath.css(path.join("./",config.inputDir,config.cssDir));
		var ejsp  = compilePath.ejs(path.join("./",config.inputDir,config.ejsDir));
	}
	for(var i=0,iLen=src.length;i<iLen;++i){
		var output = gulp.src(src[i]);
		if(type==="ejs"){
			var tmplate;
			try{
				var reqPath = path.resolve("./",config.inputDir,config.ejsDir,path.basename(src[i],type)+"js");
				delete(require.cache[reqPath]); //リロードするためにキャッシュは消し去る
				template = require(reqPath)(html,js,css,ejsp);
			}
			catch(err){
				template = {};
			}
			output = output
				.pipe(ejs(template))
				.on("error",function(title,err){
					console.log(err.message);
					notifier.notify({
						message: err.message,
						title: "EJSError("+ title +")"
					});
					this.emit("end");
				}.bind(output,path.basename(src[i])));
		}
		outputList.push(output);
	}
	stream.add(outputList)
		.pipe(concat("all"+id+".html"));
	if(useMinify){
		stream = stream.pipe(ejsmin({removeComment: true}));
	}
	stream = stream.on("end",function(){
		//console.log(src);
		//console.log("のconcat && " + type + (useMinify?" && minify":"") + "が完了しました!");
	});
	return stream;
}

function compileNormal(src,useMinify,id){
	var output = gulp.src(src)
		.pipe(concat("all"+id+".html"));
	if(useMinify){
		output = output.pipe(htmlmin());
	}
	output = output.on("end",function(){
		//console.log(src);
		//console.log("のconcat" + (useMinify?" && minify":"") + "が完了しました!");
	});
	return output;
}