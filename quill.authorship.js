/*
* to be used with browerify, included quill module
*/
var Quill = require('quill2');
var Parchment = Quill.import('parchment');
var Delta = require('quill-delta');


function parseAuthor(authorStr) {
  let parsed = authorStr? authorStr.split(";") : null;
  if (parsed == null || parsed.length != 2) {
    return null;
  }

  return {authorId: parsed[0],
          editedTime: parsed[1]};
}


class AuthorClassAttributor extends Parchment.ClassAttributor {
  constructor(...args) {
    super(...args);
    this.authorEditedTimeClass = new Parchment.ClassAttributor('author', 'ql-authorEditedTime')
  }
  add(node, value) {
    let author = parseAuthor(value);
    if (super.add(node, author.authorId)) {
      this.authorEditedTimeClass.add(node, author.editedTime);
      let that = this;
      node.onmouseover = function(e) {
        const event = that.buildEvent("author-over", author, e);
        that.dispatchEvent(node, event);
        e.preventDefault();
      }
      node.onmouseleave = function(e) {
        const event = that.buildEvent("author-leave", author, e);
        that.dispatchEvent(node, event);
        e.preventDefault();
      }
    }
    return true;
  }

  remove(node) {
    this.authorEditedTimeClass.remove(node);
    super.remove(node);
  }

  value(node) {
    let id = super.value(node);
    let editedTime = this.authorEditedTimeClass.value(node);
    return id ? `${id};${editedTime}` : '';
  }

  buildEvent(name, dataset, e) {
    const event = new Event(name, {
      bubbles: true,
      cancelable: true
    });
    event.value = Object.assign({}, dataset);
    event.event = e;
    return event;
  }

  dispatchEvent(node, event) {
    let quillContainerNode = null;
    let checkNode = node;
    do {
      checkNode = checkNode.parentNode;
      if (checkNode.className.match('ql-editor')) {
        quillContainerNode = checkNode.parentNode;
      }
    } while (!quillContainerNode);

    quillContainerNode.dispatchEvent(event);
  }
}


function simpleFormatDatetime(dt) {
  if (dt)
    return dt.toLocaleString();
  return "";
}

class Authorship {
  constructor(quill, options) {
    this.quill = quill;
    this.options = {buildTooltipDom: this.buildTooltip,
                    cssClassTooltipContainer: "ql-author-tooltip-container",
                    cssClassTooltipArea: "ql-author-tooltip-area",
                    cssClassTooltipAvatar: "ql-author-tooltip-avatar",
                    // cssClassTooltipAvatarImg: "ql-author-tooltip-avatar-img",
                    cssClassTooltipInfo: "ql-author-tooltip-info",
                    cssClassTooltipName: "ql-author-tooltip-name",
                    // cssClassTooltipEditedTime: "ql-author-tooltip-edited-time",
                    datetimeToString: simpleFormatDatetime,
                    getAuthorDetail: null,
                    // onAuthorClicked: function (e){console.log("Clicked on:", e.data)},
                    ...options};

    this.isEnabled;

    if(this.options.enabled) {
      this.enable();
    this.isEnabled = true;
    }
    if(!this.options.authorId) {
      return;
    }

    let AuthorClass = new AuthorClassAttributor('author', 'ql-author', {
      scope: Parchment.Scope.INLINE
    });

    Quill.register(AuthorClass, true);

    // For IME keyboards detection. If IME keyboards, only add author attribute
    // on `compositionend` where actual character appears (like in Chinese Pinyin keyboards)
    let compositionstart = false;
    let authorDeltaToApply = null;
    this.quill.scroll.domNode.addEventListener('compositionstart', function () {
      compositionstart = true;
      authorDeltaToApply= null;
    });
    this.quill.scroll.domNode.addEventListener('compositionend', function () {
      compositionstart = false;
      if (authorDeltaToApply) {
        quill.updateContents(authorDeltaToApply, Quill.sources.SILENT);
        authorDeltaToApply=null;
      }
    });
    /*this.quill.scroll.domNode.addEventListener('input', function (event) {
      console.log(event.isComposing, 'event.isComposing')
    });
    this.quill.scroll.domNode.addEventListener('compositionupdate', function () {

    });*/

    this.quill.on(Quill.events.EDITOR_CHANGE, (eventName, delta, oldDelta, source) => {

      if (eventName == Quill.events.TEXT_CHANGE && source == 'user') {
        let authorDelta = new Delta();
        let authorFormat = `${this.options.authorId};${new Date().getTime().toString()}`; // bug is here how to apply Attributor class to delta?
//let authorFormat = {underline: true};
        delta.ops.forEach((op) => {
          if(op.delete) {
            return;
          }
          if(op.insert || (op.retain && op.attributes)) {
            // Add authorship to insert/format
            op.attributes = op.attributes || {};

            // Bug fix for Chinese keyboards which show Pinyin first before Chinese text, and also other keyboards like Tamil
            if (op.attributes.author) {
              let author = parseAuthor(op.attributes.author);
              if (author.authorId == this.options.authorId) {
                return;
              }
            }
            // End bug fix
            op.attributes.author = authorFormat;
            // Apply authorship to our own editor
            authorDelta.retain(op.retain || op.insert.length || 1, {author: authorFormat});

          } else {
            authorDelta.retain(op.retain);
          }
        });

        // if IME keyboard (e.g. CH Pinyin), only update the delta with author attribute
        // on `compositionend`. If non-IME keyboard (e.g. English) there will be no `compositionstart`
        authorDeltaToApply = authorDelta; // copy it to apply later at `conpositionend` for IME keyboards
        if (!compositionstart) { // if non-IME keyboards, else wait for the `compositionend` to fire (see above)

          this.quill.updateContents(authorDelta, Quill.sources.SILENT);
        }

      }
    });
    this.addAuthor(this.options.authorId, this.options.color);

    // for authorship color on/off toolbar item
    let toolbar = this.quill.getModule('toolbar');
    if(toolbar) {
      toolbar.addHandler('authorship-toggle', function() {

      });
      let customButton = document.querySelector('button.ql-authorship-toggle');

      let authorshipObj = this;
      if (customButton)
        customButton.addEventListener('click', function() {
          // toggle on/off authorship colors
          authorshipObj.enable(!authorshipObj.isEnabled);
        });
    }

    // to delete the other author background style.
    quill.clipboard.addMatcher('span', function(node, delta) {

      delta.ops.forEach(function(op) {
        op.attributes["background"] && delete op.attributes["background"];
      });
      return delta;
    });

    // Author tooltip container.
    this.tooltipContainer = document.createElement("div");
    this.tooltipContainer.style.cssText = "diplay:none";
    this.quill.container.appendChild(this.tooltipContainer);
    let that = this;
    this.tooltipContainer.onmouseover = function(e) {
      that.cursorOnTooltip = true;
    }
    this.tooltipContainer.onmouseleave = function(e) {
      that.cursorOnTooltip = false;
      that.removeTooltip(that.hoverOnAuthor);
    }
    this.tooltipContainer.onclick = function(e) {
      if (that.options.onAuthorClicked) {
        e.data = that.tooltipData;
        that.options.onAuthorClicked(e);
      }
    }
    this.quill.container.addEventListener("author-over", (event) => {
      that.onAuthorMouseOver(event.event, event.value);
    });
    this.quill.container.addEventListener("author-leave", (event) => {
      that.onAuthorMouseLeave(event.event, event.value);
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
    if(!this.styleElement) {
      this.authors = {};
      this.styleElement = document.createElement('style');
      this.styleElement.type = 'text/css';
      this.styleElement.classList.add('ql-authorship-style'); // in case for some manipulation
      this.styleElement.classList.add('ql-authorship-style-'+this.options.authorId); // in case for some manipulation
      document.documentElement.getElementsByTagName('head')[0].appendChild(this.styleElement);
    }
    this.authors[id] = color;
    this.updateStyle();
  }

  authorStyle(id, color) {
    return ".ql-authorship .ql-author-" + id + " { " + "background-color:" + color + "; }\n";
  }

  updateStyle() {
    let css = "";
    for (const [key, value] of Object.entries(this.authors)) {
      css += this.authorStyle(key, value);
    }
    this.styleElement.innerHTML = css; // bug fix
    // this.styleElement.sheet.insertRule(css, 0);
  }

  buildTooltip(authorship, authorDetail) {
    if (!authorDetail) return;
    let tooltip = document.createElement("div");
    tooltip.className = authorship.options.cssClassTooltipArea;

    if (authorDetail.authorAvatarUrl) {
      let avatar = document.createElement("div");
      let img = document.createElement("img");
      avatar.className = authorship.options.cssClassTooltipAvatar;
      img.setAttribute("src", authorDetail.authorAvatarUrl);
      img.className = authorship.options.cssClassTooltipAvatarImg;
      avatar.appendChild(img);
      tooltip.appendChild(avatar);
    }

    let info = document.createElement("div");
    info.className = authorship.options.cssClassTooltipInfo;
    tooltip.appendChild(info);

    let name = document.createElement("div");
    name.innerHTML = authorDetail.authorName;
    name.className = authorship.options.cssClassTooltipName;
    let time = document.createElement("div");
    let editedTime = new Date(parseInt(authorDetail.editedTime));
    time.innerHTML = authorship.options.datetimeToString(editedTime);
    time.className = authorship.options.cssClassTooltipEditedTime;
    info.appendChild(name);
    info.appendChild(time);

    return tooltip;
  }

  onAuthorMouseOver(e, author) {
    if (this.hoverOnAuthor == author) return;

    if (this.hoverOnAuthor || this.tooltipContainer.firstChild) {
      this.removeTooltip(this.hoverOnAuthor);
    }

    this.hoverOnAuthor = author;
    let target = e.target;
    let containerW = this.quill.container.clientWidth;
    let containerStyle = window.getComputedStyle(this.quill.container, null);
    let paddingL = parseInt(containerStyle.paddingLeft);
    let paddingR = parseInt(containerStyle.paddingRight);
    let contentW = containerW - paddingL - paddingR;
    let firstLineW = Math.min(this.quill.container.offsetLeft + contentW + paddingL - target.offsetLeft, target.offsetWidth);
    let left = target.offsetLeft + firstLineW/2;
    this.tooltipContainer.style.cssText = `left:${left}px;top:${target.offsetTop}px`;

    let authorDetail = this.options.getAuthorDetail(author);
    let tooltipDom = this.options.buildTooltipDom(this, authorDetail);
    this.tooltipData = author;
    this.tooltipContainer.appendChild(tooltipDom);
    this.tooltipContainer.className = this.options.cssClassTooltipContainer;

    // Mark cursor on tooltip.
    this.cursorOnTooltip = false;
  }

  onAuthorMouseLeave(e, author) {
    let that = this;
    window.setTimeout(function(){
      that.removeTooltip(author);
    }, 300);
  }

  removeTooltip(author) {
    if (this.hoverOnAuthor && (author.authorId !== this.hoverOnAuthor.authorId || this.cursorOnTooltip)) return;

    this.hoverOnAuthor = null;
    if (this.tooltipContainer.firstChild) this.tooltipContainer.firstChild.remove();
    this.tooltipContainer.style.cssText = "display:none";
  }
}

Authorship.DEFAULTS = {
  authorId: null,
  color: 'transparent',
  enabled: false
};

Quill.register('modules/authorship', Authorship);
