//	File system CGI for ExtJS AJAX proxy.
//		Version 0.0.1.
//			Copyright (c) Jungle Software, 2016.

var uuid = require('node-uuid'),

		spawn = require('child_process').spawn,
		querystring = require('querystring'),
		url = require('url'),
		fs = require('fs');

(function (namespace) {
	'use strict';

	var Cgi = function() {
		if (!(this instanceof namespace.Cgi)) {
			return new namespace.Cgi();
		}
	};

	Cgi.prototype = {

		_resErr: function (res, err, errMsg) {

			res.writeHead(err, {'Content-Type': 'text/plain'});
			res.end(errMsg);

		},

		_createLeaf: function (name) {

			return {

				entity: 'file',
				name: name,
				alias: name + '-alias',

				id: uuid.v1(),
				leaf: true

			}
		},

		_createNode: function (name) {

			return {

				entity: 'folder',
				name: name,
				alias: name + '-alias',

				id: uuid.v1(),
				leaf: false,
				children: []

			}
		},

		_createTree: function (folderPath, parentNode) {

			var i, stat, item, branch = fs.readdirSync(folderPath);

			for(i = 0; i < branch.length; i += 1) {

				if(branch[i].charAt(0) !== '.') {

					stat = fs.statSync(folderPath + branch[i])
					if(stat.isFile()) { item = this._createLeaf(branch[i]); }
					else { item = this._createNode(branch[i]); }

					if(parentNode.id === 'root') {

						item.path = '/';
						item.parentId = 'root';

					} else {

						item.path = parentNode.path + parentNode.name + '/';
						item.parentId = parentNode.id;

					}

					parentNode.children.push(item);
					if(stat.isDirectory()) { this._createTree(folderPath + item.name + '/', item) }

				}
			}

			return parentNode;
		},

		POST: function (req, res, fileData) {

			var qstring = url.parse(req.url).query,
					postCmd = querystring.parse(qstring)['postCmd'],
					inputPath, filePath, copy, sox;

			if(postCmd) {

				inputPath = homePath + querystring.parse(qstring)['inputPath'];
				filePath = querystring.parse(qstring)['filePath'];
				if(postCmd === 'copy') {

					copy = spawn('cp', [inputPath, filePath]);
					copy.on('error', function (err) {

						console.log('Failed to start copy...');
						this._resErr(res, 403, 'POST error. Failed to start copy...');

					}.bind(this));
					copy.stderr.on('data', (data) => { console.log('copy stderr: ' + data); });
					copy.on('close', function (code) {

						if (code) {

							console.log('copy exit code: ' + code);
							this._resErr(res, 403, 'POST error. Copy exit with non 0 result...');

						}
						else {

							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.end();

						}
					}.bind(this));

				} else if (postCmd === 'silence') {

					sox = spawn('sox', [

						inputPath, filePath,
						'silence', '1', '0.2', '0.1%', '-2', '0.2', '0.1%'

					]);
					sox.on('error', function (err) {

						console.log('Failed to start SoX...');
						this._resErr(res, 403, 'POST error. Failed to start SoX...');

					}.bind(this));
					sox.stderr.on('data', (data) => { console.log('SoX stderr: ' + data); });
					sox.on('close', function (code) {

						if (code) {

							console.log('SoX exit code: ' + code);
							this._resErr(res, 403, 'POST error. Sox exit with non 0 result...');

						}
						else {

							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.end();

						}
					}.bind(this));

				} else { this._resErr(res, 400, 'POST error. Bad postCmd value...'); }

			} else {

				filePath = homePath + querystring.parse(qstring)['filePath'];
				fs.writeFile(filePath, fileData, function(err) {

					if (err) { this._resErr(res, 404, 'Write error: ' + filePath); }
					else {

						res.writeHead(200, {'Content-Type': 'text/plain'});
						res.end();

					}
				});
			}
		},

		GET: function (req, res) {

			var qstring = url.parse(req.url).query,
					getCmd = querystring.parse(qstring)['getCmd'],
					rootPath, fileTree, filePath;

			if(getCmd) {

				rootPath = homePath + querystring.parse(qstring)['rootPath'];
				if(getCmd === 'stat') {

					fs.stat(rootPath, function(err, stat) {

						if (err) {

							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.end("false");

						} else {

							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.end("true");

						}

					});

				} else if (getCmd === 'fileTree') {

					fileTree = this._createTree(rootPath, { text: ".", id: "root", children: [] });

					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.end(JSON.stringify(fileTree));

				} else { this._resErr(res, 400, 'GET error. Bad getCmd value...'); }

			} else {

				filePath = homePath + querystring.parse(qstring)['filePath'];
				fs.readFile(filePath, function(err, fileData) {

					if (err) { this._resErr(res, 404, 'Read error: ' + filePath); }
					else {

						res.writeHead(200, {'Content-Type': 'text/plain'});
						res.end(fileData);

					}

				}.bind(this));
			}
		},

		PUT: function (req, res, fileData) {

			var qstring = url.parse(req.url).query,
					filePath = homePath + querystring.parse(qstring)['filePath'];

			fs.writeFile(filePath, fileData, function(err) {

				if (err) { this._resErr(res, 404, 'Update error: ' + filePath); }
				else {

					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.end();

				}
			});
		},

		DELETE: function (req, res, fileData) {

			var qstring = url.parse(req.url).query,
					filePath = homePath + querystring.parse(qstring)['filePath'];

			fs.unlink(filePath, function(err) {

				if (err) { this._resErr(res, 404, 'Delete error: ' + filePath); }
				else {

					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.end();

				}
			}.bind(this));
		}
	};

	namespace.Cgi = Cgi;

}(this));
