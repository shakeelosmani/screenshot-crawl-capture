/*	make sure to run npm install before running npm start */

/*
	input - string url
	uses js-crawler to crawl and find all the top level links
	(can be changed to deeper linking in the config)
	output - array of string urls
*/
async function startRoot(url) {
	let urlToProcess = url;
	let Crawler = require('js-crawler');
	let crawler = new Crawler().configure({
		shouldCrawl: function (parsedUrl) {
			return parsedUrl.indexOf(urlToProcess) >= 0;
		}
	});

	return new Promise(function (resolve, reject) {
		crawler.crawl({
			url: urlToProcess,
			success: function (page) {
			},
			failure: function (page) {
				return reject(page);
			},
			finished: function (crawledUrls) {
				return resolve(crawledUrls);
			}
		});
	})
};

/*
	input array of string urls
	utility function to return unqiue values in an array
	outputs array of urls removing any duplicate
*/
function processData(urlArray) {
	return [...new Set(urlArray)];
}

/*
	input string url
	uses puppeteer to take a screenshot of the given url and stores to path
	upon successful completion returns the file name
*/
async function getPic(url) {

	let puppeteer = require('puppeteer');

	process.setMaxListeners(Infinity);

	let browser = await puppeteer.launch();
	let page = await browser.newPage();

	let dt = new Date();
	let modUrl = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();

	await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });

	await page.setViewport({ width: 1920, height: 1080 })

	await page.screenshot({ path: './output/' + dt.toLocaleDateString() + '/' + modUrl + '.png', fullPage: true });

	await browser.close();

	return modUrl + '.png';
}


/*
	input is array data
	generates a html tenplate and writes it to the file
	returns void
*/
function writeOutputHtml(data) {
	var template = `
		<!doctype html>
		<html lang="en">
			<head>
				<title>Screen shots of the Website as on ${new Date().toLocaleDateString()}</title>
				<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
				<style>
					body {
						width:100%;
						max-width:1920px;
					}
					.container {
						width:95%;
						margin:0 auto;
					}
					img {
						width:100%;
					}
				</style>
				<script>
					var $root = $('html, body');

					$('a[href^="#"]').click(function () {
							$root.animate({
									scrollTop: $( $.attr(this, 'href') ).offset().top
							}, 500);

							return false;
					});
				</script>
			</head>
			<body>
					<div class="container">
						<ul>
						${data.map(function (item, i) {
		return `<li><a href="#${item}">${item}</a></li>`
	}).join("")}
						</ul>
						<br>
						<br>
						${data.map(function (item, i) {
		return `<img id="${item}" src="output/${new Date().toLocaleDateString()}/${item}">`
	}).join("")}
					</div>
			</body>
		</html>
	`;

	var fs = require('fs');

	var fileName = `screenshots${new Date().toLocaleDateString()}.html`;
	var stream = fs.createWriteStream(fileName);

	stream.once('open', function (fd) {
		stream.end(template);
	});
}

/*
	input has not been configured but can be a commandline param easily
	main entry point of the application, chains all thenables and calls the chain of fns
	returns void
*/
function main(url) {
	let fs = require('fs');
	let dt = new Date();
	let mainDir = './output';
	let contnetDir = './output/' + dt.toLocaleDateString();
	if (!fs.existsSync(mainDir)) {
		fs.mkdirSync(mainDir);
	}
	if (!fs.existsSync(contnetDir)) {
		fs.mkdirSync(contnetDir);
	}
	startRoot(url).then(function (crawledUrl) {
		let resultSet = processData(crawledUrl);
		let dataArray = [];
		let innerCounter = 0;
		resultSet.forEach(function (item, idx) {
			getPic(item).then(function (data) {
				innerCounter += 1;
				dataArray.push(data);
				if (innerCounter == resultSet.length) {
					writeOutputHtml(dataArray);
				}
			}).catch(function (error) {
				console.error(error);
			});
		})
	}).catch(function (error) {
		console.log("Error " + error);
	});
}

//just call the main method
let url = process.argv[0]
if(!url) {
 throw new Error("Must send an url")	
} else{
  main(url);
}
