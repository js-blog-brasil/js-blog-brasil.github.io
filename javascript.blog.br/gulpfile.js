var fs          = require('fs'),
	hbs         = require('handlebars'),
	gulp        = require('gulp'),
	gutil       = require('gulp-util'),
	watch       = require('gulp-watch'),
	cssmin      = require('gulp-cssmin'),
	htmlmin     = require('gulp-minify-html'),
	connect     = require('gulp-connect'),
	markdown    = require('gulp-markdown-to-json'), // *-*
	less        = require('gulp-less'),
	less_prefix = require('less-plugin-autoprefix'),
	auto_prefix = new less_prefix({browsers: ['last 3 versions']}),
	deploy_dir  = './build/';

hbs.registerPartial(
	'header',
	fs.readFileSync('partials/header.hbs', 'utf-8')
);

gulp.task('postsToJson', function() {
	return gulp.src('posts/**/*.md')
		.pipe(gutil.buffer())
		.pipe(markdown('posts.json'))
		.pipe(gulp.dest(deploy_dir));
});

gulp.task('postsToHtml', ['postsToJson'], function() {
	var posts = require(deploy_dir + 'posts.json'),
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

		deleteFolder(deploy_dir + 'posts');
		fs.mkdirSync(deploy_dir + 'posts');

		template = hbs.compile(template);

		for ( key in posts ) {
			post = template(posts[key]);

			fs.writeFileSync(deploy_dir + 'posts/' + posts[key].slug + '.html', post);
		}
});

gulp.task('buildIndex', ['postsToJson'], function() {
	var posts = require(deploy_dir + 'posts.json'),
		template = fs.readFileSync('templates/index.hbs', 'utf-8'),
		data = [],
		key;

	function dateToString(date){
		var dia = date.getDate().toString(),
			mes = (date.getMonth() + 1).toString(),
			ano = date.getFullYear();

		return [
				dia.length === 2 ? dia : '0' + dia,
				mes.length === 2 ? mes : '0' + mes,
				ano
			].join('-');
	}

	template = hbs.compile(template);

	//parse posts to array
	for ( key in posts ) data.push(posts[key]);
	
	//converte post.date
	data.forEach(function(post){
		post.date = new Date(post.date);
		post.dateString = dateToString(post.date);
	});

	//post sort by date
	data.sort(function(a, b) {
		return a.date.getTime() < b.date.getTime();
	});

	fs.writeFileSync(deploy_dir + 'index.html', template({ data: data}));
});

gulp.task('html', ['postsToHtml','buildIndex'], function() {
	gulp.src(deploy_dir + '**/*.html')
		.pipe(htmlmin())
		.pipe(gulp.dest(deploy_dir))
		.pipe(connect.reload());
});

gulp.task('less', function () {
	return gulp.src('./less/*.less')
		.pipe(less({
			plugins: [auto_prefix]
		}))
		.pipe(gulp.dest(deploy_dir + '/css'));
});

gulp.task('css', ['less'], function() {
	return gulp.src(deploy_dir + 'css/*.css')
	    .pipe(cssmin())
	    .pipe(gulp.dest(deploy_dir + '/css'))
	    .pipe(connect.reload());
});

gulp.task('server', function () {
	connect.server({
		root: deploy_dir,
		port: 8000,
		livereload: true
	});
});

gulp.task('watch', function() {
	gulp.watch([
			'posts/**/*.md', 
			'templates/**/*.hbs',
			'partials/**/*.hbs'
		], ['html']
	);
	gulp.watch(['./less/*.less'], ['css']);
});

gulp.task('build', ['css', 'html']);

gulp.task('default', ['build', 'watch', 'server']);