/*
* to be used with browerify, included quill module
*/
var Quill = require('quill');
var Parchment = Quill.import('parchment');
var Delta = require('quill-delta');

let AuthorClass = new Parchment.Attributor.Class('author', 'ql-author', {
  scope: Parchment.Scope.INLINE
});

class Authorship {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;
    this.isEnabled;
	
    if(this.options.enabled) {
      this.enable();
	  this.isEnabled = true;
    }
    if(!this.options.authorId) {
      return;
    }

    Quill.register(AuthorClass, true);
		
    this.quill.on(Quill.events.EDITOR_CHANGE, (eventName, delta, oldDelta, source) => {

      if (eventName == Quill.events.TEXT_CHANGE && source == 'user') {
        let authorDelta = new Delta();
        let authorFormat = { author: this.options.authorId }; // bug is here how to apply Attributor class to delta?
		//let authorFormat = {underline: true};
        delta.ops.forEach((op) => {
          if(op.delete) {
            return;
          }
          if(op.insert || (op.retain && op.attributes)) {
            // Add authorship to insert/format
            op.attributes = op.attributes || {};

            // Bug fix for Chinese keyboards which show Pinyin first before Chinese text, and also other keyboards like Tamil
            if (op.attributes.author && op.attributes.author === this.options.authorId) {
              return;
            }
            // End bug fix
            op.attributes.author = this.options.authorId;
            // Apply authorship to our own editor
            authorDelta.retain(op.retain || op.insert.length || 1, authorFormat);
			
          } else {
            authorDelta.retain(op.retain);
          }
        });
        this.quill.updateContents(authorDelta, Quill.sources.SILENT); 
      }
    });

    // to delete the other author background style.
    quill.clipboard.addMatcher('span', function(node, delta) {

      delta.ops.forEach(function(op) {
        op.attributes["background"] && delete op.attributes["background"];
      });
      return delta;
    });
  }

  enable(enabled = true) {
    this.quill.root.classList.toggle('ql-authorship', enabled);
	  this.isEnabled = enabled;
  }

  disable() {
    this.enable(false);
	  this.isEnabled = false;
  }

  addAuthor(id, color) {
    let css = ".ql-authorship .ql-author-" + id + " { " + "background-color:" + color + "; }\n";
    this.addStyle(css);
  }

  addStyle(css) {
    if(!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.type = 'text/css';
      this.styleElement.classList.add('ql-authorship-style'); // in case for some manipulation
      this.styleElement.classList.add('ql-authorship-style-'+this.options.authorId); // in case for some manipulation
      document.documentElement.getElementsByTagName('head')[0].appendChild(this.styleElement);
    }
	
    this.styleElement.innerHTML = this.styleElement.innerHTML+css;
  }
}

Authorship.DEFAULTS = {
  authorId: null,
  color: 'transparent',
  enabled: false
};

Quill.register('modules/authorship', Authorship);
