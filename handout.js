var fs = require('fs');
var Handlebars = require('handlebars');
var through = require('through2');
var markdown = require('markdown').markdown;
var path = require('path');


const PLUGIN_NAME = 'orfalius';


var processText = function(element) {
  element.slice(1).forEach(function(subElement) {
    if(subElement instanceof Array) {

      // link

      if(subElement[0] == 'a') {
        if(subElement[1].href.startsWith('http')) {
          subElement[1].target = '_blank';
        }
      }

      // code

      if(subElement[0] == 'code') {
        var subSubElement = subElement[1];

        var subClassName = 'prettybox prettyprint';

        if(subSubElement.startsWith('\\>') || subSubElement.startsWith('>')) {
          subElement[1] = subSubElement.slice(1);

          if(subSubElement.startsWith('>')) {
            subClassName = 'nostalbox nostalprint';
          }
        }

        subElement.splice(1, 0, {class: subClassName});
      }
    }
  });
};


var replaceMath = function(match, length) {
  return match.substring(length, match.length - length).replace(/<\/?em>/g, '_');
};

var replaceDisplayMath = function(contents) {
  return contents.replace(/\$\$\$[^$]*\$\$\$/g, function(match) { return '\\[' + replaceMath(match, 3) + '\\]'; });
};

var replaceInlineMath = function(contents) {
  return contents.replace(/\$\$[^$]*\$\$/g, function(match) { return '\\(' + replaceMath(match, 2) + '\\)'; });
};


module.exports = function(templatePath) {
  var templateSource = fs.readFileSync(templatePath).toString();
  var template = Handlebars.compile(templateSource);

  return through.obj(function(file, encoding, callback) {
    if(file.isBuffer()) {
      var prefix;

      if(path.basename(path.dirname(file.path)) == 'error') {
        prefix = '/';
      }
      else {
        var depth = -1;

        for(var c of path.relative('.', file.path)) {
          if(c == path.sep) {
            depth += 1;
          }
        }

        prefix = '../'.repeat(depth);
      }

      var markdownSource = file.contents.toString();
      var markdownTree = markdown.parse(markdownSource);
      var htmlTree = markdown.toHTMLTree(markdownTree);

      htmlTree.slice(1).forEach(function(element) {

        /* subsubheading */

        if(element[0] == 'h3') {
          element.splice(1, element.length - 1, ['a', {href: ''}, 'continuar'], ' ou ', ['a', {href: ''}, 'terminar']);
        }

        /* paragraph */

        else if(element[0] == 'p') {
          var subElement = element[1];

          // anchor

          if(typeof subElement == 'string' && subElement.startsWith('@')) {
            element.splice(0, element.length, 'a', {id: subElement.slice(1)});
          }

          // video

          else if(typeof subElement == 'string' && subElement.startsWith('&')) {
            words = subElement.split('&');

            element.splice(1, element.length - 1, {class: 'figure'}, ['video', {'src': 'vid/' + words[1], 'poster': 'img/' + words[2], 'controls': 'true'}]);
          }

          // image

          else if(subElement instanceof Array && subElement[0] == 'img') {
            element.splice(1, 0, {class: 'figure'});

            subElement[1].title = subElement[1].alt;

            var src = subElement[1].src;

            subElement[1].src = 'img/' + src;

            if(prefix == '/') {
              subElement[1].src = '/' + subElement[1].src;
            }

            if(src.slice(-3) != 'svg') {
              subElement[1].class = 'raster';
            }
          }

          // text

          else {
            processText(element);
          }
        }

        /* list */

        else if(element[0] == 'ul' || element[0] == 'ol') {
          element.slice(1).forEach(function(subElement) {
            if(subElement[1] instanceof Array && subElement[1][0] == 'p') {
              processText(subElement[1]);
            }
            else {
              processText(subElement);
            }
          });
        }

        /* preformatted */

        else if(element[0] == 'pre') {
          var subElement = element[1];

          var subSubElement = subElement[1];

          var className = 'prettybox';
          var subClassName = 'prettyprint';

          if(subSubElement.startsWith('\\>') || subSubElement.startsWith('>')) {
            subElement[1] = subSubElement.slice(1);

            if(subSubElement.startsWith('>')) {
              className = 'nostalbox';
              subClassName = 'nostalprint';
            }
          }

          element.splice(1, 0, {class: className});
          subElement.splice(1, 0, {class: subClassName});
        }
      });

      var title = htmlTree[1][1];

      var contents = markdown.renderJsonML(htmlTree);
      contents = replaceDisplayMath(contents);
      contents = replaceInlineMath(contents);

      var html = template({title: title, prefix: prefix, contents: contents});

      file.contents = new Buffer.from(html);
      file.path = file.path.slice(0, -2) + 'html';
    }

    return callback(null, file);
  });
};
