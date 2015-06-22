//npm様～～～～～ｗｗｗｗ
var gulp = require("gulp");
var runSequence = require("run-sequence");

//自前実装
var project = require("./gulp/project");
var htmlcompile = require("./gulp/htmlcompile");
var jscompile = require("./gulp/jscompile");
var csscompile = require("./gulp/csscompile");

gulp.task("default",["compile-debug","watch"]);

gulp.task("watch",function(callback){
	gulp.watch(["./src/ejs/*.js",],function(eve){
		var projects = project("html");
		_htmlcompile(projects,true);
	});
	gulp.watch([
		"./src/html/*.html",
		"./src/html/*.htm",
		"./src/html/*.ejs",
		"./src/html/*.ect"
	],function(eve){
		var projects = project("html",{includePath: eve.path});
		_htmlcompile(projects,true);
	});
	gulp.watch(["./src/js/*.js"],function(eve){
		var projects = project("js",{includePath: eve.path});
		_jscompile(projects,true);
	});
	gulp.watch(["./src/css/*.css","./src/css/*.scss","./src/css/*.sass"],function(eve){
		var projects = project("css",{includePath: eve.path});
		_csscompile(projects,true);
	});
});

gulp.task("compile-debug",function(callback){
	return runSequence(
		[
			"htmlcompile-debug",
			"jscompile-debug",
			"csscompile-debug",
		],
		callback
	);
});

gulp.task("compile",function(callback){
	return runSequence(
		[
			"htmlcompile",
			"jscompile",
			"csscompile",
		],
		callback
	);
});

gulp.task("htmlcompile-debug",function(callback){
	var projects = project("html");
	_htmlcompile(projects,true).on('queueDrain',function(){
		callback();
	});
});

gulp.task("jscompile-debug",function(callback){
	var projects = project("js");
	_jscompile(projects,true).on('queueDrain',function(){
		callback();
	});
});

gulp.task("csscompile-debug",function(callback){
	var projects = project("css");
	_csscompile(projects,true).on('queueDrain',function(){
		callback();
	});
});

gulp.task("htmlcompile",function(callback){
	var projects = project("html");
	_htmlcompile(projects,false).on('queueDrain',function(){
		callback();
	});
});

gulp.task("jscompile",function(callback){
	var projects = project("js");
	_jscompile(projects,false).on('queueDrain',function(){
		callback();
	});
});

gulp.task("csscompile",function(callback){
	var projects = project("css");
	_csscompile(projects,false).on('queueDrain',function(){
		callback();
	});
});

function _htmlcompile(projects,isDebug){
	return htmlcompile(projects,{isDebug: isDebug});
}

function _jscompile(projects,isDebug){
	return jscompile(projects,{isDebug: isDebug});
}

function _csscompile(projects,isDebug){
	return csscompile(projects,{isDebug: isDebug});
}