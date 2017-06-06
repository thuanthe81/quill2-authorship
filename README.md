# quill-authorship

Authorship plugin for [Quill Editor](https://github.com/quilljs/quill). This plug-in is used to mark which part of a document is written by which author in quill delta, and is used to highlight background of text to show who wrote which part.


## Usage

```html
<link rel='stylesheet' type='text/css' href='node_modules/quill-authorship/quill.authorship.css' />
```

```js

require('./node_modules/quill-authorship/quill.authorship.js');

let toolbarOptions = [
	['authorship-toggle'] // authorship color on/off
];

let options = {
	theme: 'snow',
	modules: {
		toolbar: toolbarOptions,	
		// authorship id and color setting
		authorship: {
			enabled: true,
			authorId: 1, // Current author id
			color: red // Current author color
		}
	}
};

quill = new Quill('#editor', options);

```

## MIT License

Copyright (c) 2017 by Win Min Tun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

