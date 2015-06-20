var path = require("path");
var stream = require("stream");
var notifier = require('node-notifier');

var gulp = require("gulp");
var sass = require("gulp-sass");
var concat = require("gulp-concat");
var minifyCss = require("gulp-minify-css");
var merge2 = require("merge2");

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
		var cssList = projectTarget.css;
		
		compileList.push(
			cssCompile(cssList,isDebug)
				.pipe(concat(projectName + ".css"))
				.pipe(gulp.dest(path.join(dest,config.cssDir)))
				.on("end",function(projectName){
					console.log("プロジェクト[" + projectName + "]のCSSコンパイルが完了しました！");
				}.bind(null,projectName))
		);
	}
	stream.add(compileList);
	
	return stream;
}

function cssCompile(cssList,isDebug){
	var stream = merge2();
	var createCompiler = _createCompiler();
	
	var outputList = [];
	var oldState = null;
	var tmp = [];
	
	for(var i=0,iLen=cssList.length;i<iLen;++i){
		var isSCSS = (cssList[i]["::ext"]==="scss");
		var isSASS = (cssList[i]["::ext"]==="sass");
		var isMinified = (cssList[i]["::tag"].indexOf("min")!==-1);
		var newState = isMinified | (isSCSS<<1) | (isSASS<<2);
		var path = cssList[i]["::path"];
		
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
			MINIFIED_NORMAL: 1,
			UNMINIFIED_SCSS: 2,
			MINIFIED_SCSS: 3,
			UNMINIFIED_SASS: 4,
			MINIFIED_SASS: 5,
		};
		return function(src,state){
			switch(state){
				case STATE.UNMINIFIED_NORMAL:
				case STATE.MINIFIED_NORMAL:
					return compileNormal(src,!((state&1)|isDebug),cnt++);
				case STATE.UNMINIFIED_SCSS:
				case STATE.MINIFIED_SCSS:
					return compileSCSS(src,!((state&1)|isDebug),cnt++);
				case STATE.UNMINIFIED_SASS:
				case STATE.MINIFIED_SASS:
					return compileSASS(src,!((state&1)|isDebug),cnt++);
			}
			return null;
		}
	}
	
	return stream;
}

function compileSCSS(src,useMinify,id){
	return _compileSASSorSCSS(src,useMinify,id,"scss");
}

function compileSASS(src,useMinify,id){
	return _compileSASSorSCSS(src,useMinify,id,"sass");
}

function _compileSASSorSCSS(src,useMinify,id,type){
	var output = gulp.src(src)
		.pipe(concat("all"+id+"."+type))
		.pipe(sass())
		.on("error",function(err){
			//エラーが出たらバルーンを垂れ流す
			var title = src.map(function(e){ return path.basename(e); }).join(",");
			console.log(type.toUpperCase() + "でエラーが発生(" + title + ")");
			console.log(err.messageFormatted);
			notifier.notify({
				message: err.message,
				title: type.toUpperCase() + "Error("+ title +")"
			});
			
			this.emit("end");
		})
	if(useMinify){
		output = output.pipe(minifyCss());
	}
	output = output.on("end",function(){
		//console.log(src);
		//console.log("のconcat && " + type + (useMinify?" && minify":"") + "が完了しました!");
	});
	return output;
}

function compileNormal(src,useMinify,id){
	var output = gulp.src(src)
		.pipe(concat("all"+id+".css"));
	if(useMinify){
		output = output.pipe(minifyCss());
	}
	output = output.on("end",function(){
		//console.log(src);
		//console.log("のconcat" + (useMinify?" && minify":"") + "が完了しました!");
	});
	return output;
}