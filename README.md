# ext-cgi-fs
File system CGI for ExtJS AJAX proxy

## Questions and Bug Reports
* mailing list: Victor.Vazin@gmail.com

## Installation
Install the ext-cgi-fs and it's dependencies by executing
the following `NPM` command.
```
npm install ext-cgi-fs --save
```
## Troubleshooting
The ext-cgi-mongo depends on several other packages. These are.

* node-uuid

Ensure, that your user has write permission to wherever the node modules
are being installed.

QuickStart
==========
Simple AJAX request in ExtJS style:
```
Ext.Ajax.request({

	url: 'file',
	method: 'GET',
	params: { filePath: fullFileName },
	success: function(res, opts) {
	
		var fileContent = res.responseText;
		
	},
	failure: function(res, opts) {...}

});
```
## Next Steps
 * [server example](https://www.npmjs.com/package/sd-server)
