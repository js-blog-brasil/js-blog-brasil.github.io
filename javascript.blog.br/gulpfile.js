var gulp       = require('gulp'),
	gutil      = require('gulp-util'),
	fs         = require('fs'),
	hbs        = require('handlebars'),
	markdown   = require('gulp-markdown-to-json'), // *-*
	less       = require('gulp-less'),
	cssmin     = require('gulp-cssmin'),
	htmlmin    = require('gulp-minify-html');

hbs.registerPartial(
	'header',
	fs.readFileSync('partials/header.hbs', 'utf-8')
);

gulp.task('postsToJson', function() {
  return gulp.src('posts/**/*.md')
	.pipe(gutil.buffer())
	.pipe(markdown('posts.json'))
	.pipe(gulp.dest('build/'));
});

gulp.task('postsToHtml', function() {
	var posts = require('./build/posts.json'),
		template = fs.readFileSync('templates/post.hbs', 'utf-8'),
		key,
		post;

		function deleteFolder(path) {
			var files = [];
			if( fs.existsSync(path) ) {
				files = fs.readdirSync(path);
				files.forEach(function(file,index){
					var curPath = path + "/" + file;
					if(fs.lstatSync(curPath).isDirectory()) { // recurse
						deleteFolder(curPath);
					} else { // delete file
						fs.unlinkSync(curPath);
					}
				});
				fs.rmdirSync(path);
			}
		}

		deleteFolder('build/posts');
		fs.mkdirSync('build/posts');

		template = hbs.compile(template);

		for ( key in posts ) {
			post = template(posts[key]);

			fs.writeFileSync('build/posts/' + posts[key].slug + '.html', post);
		}
});

gulp.task('buildIndex',function() {
	var posts = require('./build/posts.json'),
		template = fs.readFileSync('templates/index.hbs', 'utf-8'),
		data = [],
		key;

	template = hbs.compile(template);

	//parse posts to array
	for ( key in posts ) data.push(posts[key]);
		
	data.forEach(function(post){
		console.log(typeof post.date);
	});

	fs.writeFileSync('build/index.html', template({ data: data}));
});