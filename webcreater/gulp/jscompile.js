var path = require("path");
var stream = require("stream");
var notifier = require('node-notifier');

var gulp = require("gulp");
var browserify = require('browserify');
var babelify = require('babelify');
var concat = require("gulp-concat");
var uglify = require('gulp-uglify');
var through2 = require("through2");
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
		var jsList = projectTarget.js;
		
		compileList.push(
			jsCompile(jsList,isDebug)
				.pipe(concat(projectName + ".js"))
				.pipe(gulp.dest(path.join(dest,config.jsDir)))
				.on("end",function(projectName){
					console.log("プロジェクト[" + projectName + "]のJSコンパイルが完了しました！");
				}.bind(null,projectName))
		);
	}
	stream.add(compileList);
	
	return stream;
}

function jsCompile(jsList,isDebug){
	var stream = merge2();
	var createCompiler = _createCompiler();
	
	var outputList = [];
	var oldState = null;
	var tmp = [];
	
	for(var i=0,iLen=jsList.length;i<iLen;++i){
		var isES6 = (jsList[i]["::tag"].indexOf("es6")!==-1);
		var isMinified = (jsList[i]["::tag"].indexOf("min")!==-1);
		var newState = isMinified | (isES6<<1);
		var path = jsList[i]["::path"];
		
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
			UNMINIFIED_ES6: 2,
			MINIFIED_ES6: 3,
		};
		return function(src,state){
			switch(state){
				case STATE.UNMINIFIED_NORMAL:
				case STATE.MINIFIED_NORMAL:
					return compileNormal(src,!((state&1)|isDebug),cnt++);
				case STATE.UNMINIFIED_ES6:
				case STATE.MINIFIED_ES6:
					return compileES6(src,!((state&1)|isDebug),cnt++);
			}
			return null;
		}
	}
	
	return stream;
}

function compileES6(src,useMinify,id){
	var output = gulp.src(src)
		.pipe(concat("all"+id+".js"))
		.pipe(through2.obj(function(file,enc,next){ //まずthrugh2を使ってpipe処理を横取りする(最高に闇)
			//browserifyは第一引数にBufferを直接与えてもうんともすんとも言わないので、streamに変換する(最高に闇)
			var st = new stream.Readable();
			//streamには、Bufferを与えることが出来ないので、stringに変換してからpushする(最高に闇)
			st.push(file.contents.toString());
			st.push(null);
			//変換したstreamをbrowserifyに渡して変換する(闇ではない)
			return browserify(st)
				.transform(babelify.configure({
					optional: ["runtime"]
				}))
				.bundle(function(err, res){
					if(err){
						//エラーが出たらバルーンを垂れ流す
						var title = src.map(function(e){ return path.basename(e); }).join(",");
						console.log("Browserifyでエラーが発生(" + title + ")");
						console.log(err.codeFrame);
						notifier.notify({
							message: err.codeFrame.replace(/\u001b\[\d+m/g,""),
							title: "ES6Error("+ title +")"
						});
						next(null,file);
						return;
					}
					//変換完了したら、コールバックを使って、このpipe処理の終了処理をする(Bufferの更新と完了通知)(闇)
					file.contents = res;
					next(null, file);
				});
		}))
		.on("error",function(err){
			this.emit("end");
		})
	if(useMinify){
		output = output.pipe(uglify({preserveComments: 'some'}));
	}
	output = output.on("end",function(){
		//console.log(src);
		//console.log("のconcat && browserify" + (useMinify?" && minify":"") + "が完了しました!");
	});
	return output;
}

function compileNormal(src,useMinify,id){
	var output = gulp.src(src)
		.pipe(concat("all"+id+".js"));
	if(useMinify){
		output = output.pipe(uglify({preserveComments: 'some'}));
	}
	output = output.on("end",function(){
		//console.log(src);
		//console.log("のconcat" + (useMinify?" && minify":"") + "が完了しました!");
	});
	return output;
}