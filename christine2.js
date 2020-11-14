(function() {
  var Path, analiseType, cleanUpFile, cleanupLines, coffee, coffeescriptTagFilter, commentFilter, countSpaces, createNewFile, emptyFilter, finaliseStyle, finaliseTag, formatAttributes, formatLevels, formatScripts, formatStrings, formatTag, formatTagStyles, fs, headTagFilter, headTagType, headTags, ignorableType, indentLines, loadChrisModule, moduleFilter, moduleType, processHierarchy, processModules, processTypes, scriptTagFilter, scriptTagType, scriptType, selfClosingTags, sortByBodyHead, sortByTypes, stringFilter, stringType, styleAttributeFilter, styleAttributeType, styleClassFilter, styleClassType, tagAttributeFilter, tagAttributeType, tagFilter, tagType, typeAllScripts;

  fs = require('fs');

  Path = require('path');

  coffee = require('coffeescript');

  // LINE TYPES
  selfClosingTags = ['br', 'img', 'input', 'hr', 'meta', 'link'];

  headTags = ['meta', 'title', 'style', 'class', 'link', 'base'];

  tagType = 0; //if found tag#id.class

  tagFilter = /^[\ \t]*\w+\ *([.#][\w-_]+\ *)*$/i;

  tagAttributeType = 1; //if found attribute = "value"

  // need to replace double quote and ampersand after
  // to &#34; and &#38
  tagAttributeFilter = /^[\t\ ]*[\w-_@$&#]+[\t\ ]*=[\ \t]*[^\n]*$/;

  styleClassType = 2; // if found style selector 

  styleClassFilter = /^[\t\ ]*style[\t\ ]*(?<selector>[^\n]+)$/i;

  styleAttributeType = 3; //if found attribute: something

  styleAttributeFilter = /^\s*[^"' ]+ *: *.*/i;

  stringType = 4; //if found "string"

  stringFilter = /^[\t\ ]*".*"/i;

  scriptTagFilter = /^\s*(script|coffeescript|javascript|coffee)/i;

  coffeescriptTagFilter = /^\s*(coffeescript|coffee)/i;

  scriptType = 5; //if it is under the script tag

  scriptTagType = 9;

  headTagType = 7;

  headTagFilter = /^\s*(meta|title|link|base)/i;

  moduleType = 8;

  moduleFilter = /^\s*include\s*".+.chris"/i;

  ignorableType = -2;

  emptyFilter = /^[\W\s_]*$/;

  commentFilter = /^\s*#/i;

  exports.christinize = function(sourceText, options = {
      indent: 4,
      modulesDirectory: './'
    }) {
    var chrisFile, doctype;
    chrisFile = {
      source: [],
      inProgressLines: {
        source: 'html',
        type: tagType,
        level: -1,
        attributes: [],
        styles: [],
        children: [],
        indent: options.indent
      },
      final: ''
    };
    chrisFile.inProgressLines.parent = chrisFile.inProgressLines;
    chrisFile.source = cleanupLines(sourceText.split('\n'));
    chrisFile.source = processModules(chrisFile.source, options.modulesDirectory);
    processHierarchy(chrisFile);
    processTypes(chrisFile.inProgressLines);
    sortByTypes(chrisFile.inProgressLines);
    sortByBodyHead(chrisFile);
    finaliseTag(chrisFile.inProgressLines);
    doctype = '<!doctype html>';
    if (options.indent) {
      doctype += '\n';
    }
    chrisFile.final = doctype + chrisFile.inProgressLines.final;
    return chrisFile.final;
  };

  createNewFile = function(sourceText, options = {
      indent: 4,
      modulesDirectory: './'
    }) {
    var chrisFile;
    console.log(options);
    return chrisFile = {
      source: cleanupLines(sourceText.split('\n')),
      inProgressLines: {
        source: 'html',
        type: tagType,
        level: -1,
        attributes: [],
        styles: [],
        children: [],
        indent: options.indent
      },
      options: options,
      final: ''
    };
  };

  loadChrisModule = function(moduleFilePath) {
    var msls;
    msls = fs.readFileSync(moduleFilePath, 'utf8');
    msls = cleanupLines(msls.split('\n'));
    return msls;
  };

  processModules = function(ls, f) {
    var chrisModulePath, j, k, l, moduleLevel, moduleLevelFilter, moduleLines, ref, ref1, resultLs, x;
    resultLs = new Array;
    moduleLevelFilter = /^\s*/;
    for (x = j = 0, ref = ls.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (moduleFilter.test(ls[x])) {
        chrisModulePath = ls[x].split('"')[1];
        moduleLines = loadChrisModule(chrisModulePath);
        moduleLevel = moduleLevelFilter.exec(ls[x]);
        for (l = k = 0, ref1 = moduleLines.length; (0 <= ref1 ? k < ref1 : k > ref1); l = 0 <= ref1 ? ++k : --k) {
          moduleLines[l] = moduleLevel + moduleLines[l];
        }
        moduleLines = processModules(moduleLines, path.dirname(`${f}/${chrisModulePath}`));
        resultLs = resultLs.concat(moduleLines);
      } else {
        resultLs.push(ls[x]);
      }
    }
    return resultLs;
  };

  sortByBodyHead = function(file) {
    var addedToHead, bodyTag, headTag, headTagTemplate, j, k, len, len1, ref, styleTag, tag;
    headTag = {
      source: 'head',
      type: tagType,
      parent: file.inProgressLines,
      level: -1,
      attributes: [],
      styles: [],
      children: []
    };
    styleTag = {
      source: 'style',
      type: headTagType,
      parent: headTag,
      level: 0,
      attributes: [],
      styles: [],
      children: []
    };
    headTag.children.push(styleTag);
    bodyTag = {
      source: 'body',
      type: tagType,
      parent: file.inProgressLines,
      level: -1,
      attributes: [],
      styles: [],
      children: []
    };
    ref = file.inProgressLines.children;
    for (j = 0, len = ref.length; j < len; j++) {
      tag = ref[j];
      addedToHead = false;
      for (k = 0, len1 = headTags.length; k < len1; k++) {
        headTagTemplate = headTags[k];
        if (tag.source === headTagTemplate) {
          addedToHead = true;
          tag.parent = headTag;
          headTag.children.push(tag);
        }
      }
      if (!addedToHead) {
        if (tag.type === styleClassType) {
          tag.parent = styleTag;
          styleTag.children.push(tag);
        } else {
          tag.parent = bodyTag;
          bodyTag.children.push(tag);
        }
      }
    }
    bodyTag.styles = file.inProgressLines.styles;
    bodyTag.attributes = file.inProgressLines.attributes;
    file.inProgressLines.styles = new Array;
    file.inProgressLines.attributes = new Array;
    file.inProgressLines.children = new Array;
    file.inProgressLines.children.push(headTag);
    file.inProgressLines.children.push(bodyTag);
    formatLevels(file.inProgressLines);
    return indentLines(file.inProgressLines);
  };

  indentLines = function(tag) {
    var child, j, len, ref, results;
    ref = tag.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      child.indentation = child.level * tag.indent;
      child.indent = tag.indent;
      if (child.children) {
        results.push(indentLines(child));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  cleanupLines = function(sourceLines) {
    var j, len, line, newSourceLines;
    newSourceLines = new Array;
    for (j = 0, len = sourceLines.length; j < len; j++) {
      line = sourceLines[j];
      if (analiseType(line) !== -2) {
        newSourceLines.push(line);
      }
    }
    return newSourceLines;
  };

  analiseType = function(line) {
    var lineType;
    lineType = -2;
    if (commentFilter.test(line)) {
      lineType = ignorableType;
    }
    if (emptyFilter.test(line)) {
      lineType = ignorableType;
    }
    if (styleAttributeFilter.test(line)) {
      lineType = styleAttributeType;
    }
    if (tagFilter.test(line)) {
      lineType = tagType;
      if (scriptTagFilter.test(line)) {
        lineType = scriptTagType;
      }
    }
    if (headTagFilter.test(line)) {
      lineType = headTagType;
    }
    if (styleClassFilter.test(line)) {
      lineType = styleClassType;
    }
    if (tagAttributeFilter.test(line)) {
      lineType = tagAttributeType;
    }
    if (stringFilter.test(line)) {
      lineType = stringType;
    }
    if (moduleFilter.test(line)) {
      lineType = moduleType;
    }
    return lineType;
  };

  countSpaces = function(line) {
    var spaces;
    spaces = 0;
    if (line[0] === ' ') {
      while (line[spaces] === ' ') {
        spaces += 1;
      }
    }
    return spaces;
  };

  processHierarchy = function(file) {
    var currentChild, currentParent, j, line, lineLevel, newLine, ref, results;
    currentParent = file.inProgressLines;
    currentChild = file.inProgressLines;
    results = [];
    for (line = j = 0, ref = file.source.length; (0 <= ref ? j < ref : j > ref); line = 0 <= ref ? ++j : --j) {
      lineLevel = countSpaces(file.source[line]);
      if (lineLevel > currentParent.level) {
        if (lineLevel > currentChild.level) {
          currentParent = currentChild;
        }
        newLine = {
          source: file.source[line].slice(lineLevel),
          children: [],
          parent: currentParent,
          level: lineLevel,
          attributes: [],
          styles: []
        };
        currentParent.children.push(newLine);
        results.push(currentChild = newLine);
      } else {
        while (lineLevel <= currentParent.level) {
          currentParent = currentParent.parent;
        }
        newLine = {
          source: file.source[line].slice(lineLevel),
          children: [],
          parent: currentParent,
          level: lineLevel,
          attributes: [],
          styles: []
        };
        currentParent.children.push(newLine);
        results.push(currentChild = newLine);
      }
    }
    return results;
  };

  processTypes = function(line) {
    var j, len, ref, results;
    ref = line.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      line = ref[j];
      if (line.source) {
        line.type = analiseType(line.source);
      } else {
        line.type = -2;
      }
      if (line.children.length > 0) {
        results.push(processTypes(line));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  sortByTypes = function(lines) {
    var j, k, lastChild, len, line, ref, ref1, results;
    ref = lines.children;
    // extract the styles, attributes and strings to their parents
    for (j = 0, len = ref.length; j < len; j++) {
      line = ref[j];
      if (line.type === scriptTagType) {
        typeAllScripts(line);
      }
    }
    lastChild = lines.children.length - 1;
    results = [];
    for (line = k = ref1 = lastChild; (ref1 <= 0 ? k <= 0 : k >= 0); line = ref1 <= 0 ? ++k : --k) {
      if (lines.children[line].children.length > 0) {
        sortByTypes(lines.children[line]);
      }
      if (lines.children[line].type === tagAttributeType) {
        if (!lines.children[line].parent.attributes) {
          lines.children[line].parent.attributes = new Array;
        }
        lines.children[line].parent.attributes.push(lines.children[line].source);
        lines.children[line].parent.children.splice(line, 1);
        continue;
      }
      if (lines.children[line].type === styleAttributeType) {
        if (!lines.children[line].parent.styles) {
          lines.children[line].parent.styles = new Array;
        }
        lines.children[line].parent.styles.push(lines.children[line].source);
        lines.children[line].parent.children.splice(line, 1);
        continue;
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  typeAllScripts = function(scriptLine) {
    var codeLine, j, len, ref, results;
    if (scriptLine.children.length > 0) {
      ref = scriptLine.children;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        codeLine = ref[j];
        codeLine.type = scriptType;
        codeLine.final = codeLine.source;
        if (codeLine.children.length > 0) {
          results.push(typeAllScripts(codeLine));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  finaliseTag = function(line) {
    var addSpaces, attribute, child, childLines, coffeeScript, i, j, k, l, len, len1, len2, len3, len4, lineStyle, linesOfChildren, m, n, newFinal, o, p, ref, ref1, ref2, ref3, ref4, style;
    addSpaces = '';
    if (line.indent > 0) {
      for (i = j = 0, ref = line.indent; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        addSpaces += ' ';
      }
    }
    if (line.type === styleClassType) {
      finaliseStyle(line);
    }
    if (line.type === tagType || line.type === scriptTagType || line.type === headTagType) {
      coffeeScript = false;
      formatTag(line);
      if (line.type === scriptTagType) {
        if (coffeescriptTagFilter.test(line.source)) {
          line.source = 'script';
          coffeeScript = true;
        }
      }
      line.final = '<' + line.source;
      if (line.styles.length > 0) {
        lineStyle = 'style = ';
        formatTagStyles(line);
        ref1 = line.styles;
        for (k = 0, len = ref1.length; k < len; k++) {
          style = ref1[k];
          lineStyle += style + ';';
        }
        line.attributes.push(lineStyle);
      }
      formatAttributes(line);
      if (line.attributes.length > 0) {
        line.final += ' ';
        ref2 = line.attributes;
        for (m = 0, len1 = ref2.length; m < len1; m++) {
          attribute = ref2[m];
          line.final += attribute + ' ';
        }
        line.final = line.final.slice(0, -1);
      }
      line.final += '>';
      if (line.indent > 0) {
        line.final += '\n';
      }
      if (line.children.length > 0) {
        formatStrings(line);
        if (line.type === scriptTagType) {
          line.indent = 4;
        }
        formatScripts(line);
        ref3 = line.children;
        for (n = 0, len2 = ref3.length; n < len2; n++) {
          child = ref3[n];
          finaliseTag(child);
        }
        linesOfChildren = '';
        ref4 = line.children;
        for (o = 0, len3 = ref4.length; o < len3; o++) {
          child = ref4[o];
          newFinal = '';
          childLines = child.final.split('\n');
          for (p = 0, len4 = childLines.length; p < len4; p++) {
            l = childLines[p];
            if (l.length > 0) {
              l = addSpaces + l;
              newFinal += l + '\n';
            }
          }
          if (line.indent > 0) {
            newFinal += '\n';
          }
          newFinal = newFinal.slice(0, -1);
          child.final = newFinal;
          linesOfChildren += newFinal;
        }
        if (coffeeScript) {
          linesOfChildren = coffee.compile(linesOfChildren);
        }
        line.final += linesOfChildren;
      }
      if (!line.selfClosing) {
        return line.final += '</' + line.source + '>';
      }
    }
  };

  //line.final += '\n' if line.indent > 0
  finaliseStyle = function(styleTag) {
    var addSpaces, finalTag, i, j, k, len, ref, ref1, style, tagDetails;
    addSpaces = '';
    if (styleTag.indent > 0) {
      for (i = j = 0, ref = styleTag.indent; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        addSpaces += ' ';
      }
    }
    finalTag = '';
    tagDetails = styleClassFilter.exec(styleTag.source);
    finalTag += tagDetails.groups.selector.replace(/\ *$/, ' ');
    finalTag += '{';
    formatTagStyles(styleTag);
    ref1 = styleTag.styles;
    for (k = 0, len = ref1.length; k < len; k++) {
      style = ref1[k];
      if (styleTag.indent > 0) {
        finalTag += '\n';
        finalTag += addSpaces;
      }
      finalTag += `${style};`;
    }
    if (styleTag.indent > 0) {
      finalTag += '\n';
    }
    finalTag += '}';
    return styleTag.final = finalTag;
  };

  formatTag = function(tag) {
    var allClasses, j, len, selfClosingTag, tagClassFilter, tagClassFound, tagDetails, tagDetailsFilter, tagIdFilter, tagIdFound;
    tagDetailsFilter = /^[\ \t]*(?<tag>\w+)\ *(?<attributes>([.#][\w-_]+\ *)+)?$/g;
    tagIdFilter = /#(?<id>\w+)/;
    tagClassFilter = /\.(?<class>[\w-_]+)/g;
    tagDetails = tagDetailsFilter.exec(tag.source);
    tag.source = tagDetails.groups.tag;
    tagClassFound = tagClassFilter.exec(tagDetails.groups.attributes);
    if (tagClassFound != null) {
      allClasses = "";
      while (tagClassFound != null) {
        allClasses += tagClassFound.groups.class + " ";
        tagClassFound = tagClassFilter.exec(tagDetails.groups.attributes);
      }
      tag.attributes.unshift(`class=${allClasses.slice(0, -1)}`);
    }
    tagIdFound = tagIdFilter.exec(tagDetails.groups.attributes);
    if (tagIdFound != null) {
      tag.attributes.unshift(`id=${tagIdFound.groups.id}`);
    }
    tag.selfClosing = false;
    for (j = 0, len = selfClosingTags.length; j < len; j++) {
      selfClosingTag = selfClosingTags[j];
      if (tag.source === selfClosingTag) {
        tag.selfClosing = true;
      }
    }
    /*
        tagArray = tag.source.split /\s+/
        tag.source = tagArray[0]

        tag.selfClosing = false
        for selfClosingTag in selfClosingTags
            if tag.source == selfClosingTag
    tag.selfClosing = true

        tagArray.splice(0,1)

        if tagArray.length > 0
            if tagArray[0] != 'is'
    tag.attributes.push 'id "' + tagArray[0] + '"'
    tagArray.splice(0,1)

            if tagArray[0] == 'is'
    tagArray.splice(0,1)
    tagClasses = 'class "'
    for tagClass in tagArray
        tagClasses += tagClass + ' '

    tagClasses = tagClasses.slice 0, -1
    tagClasses += '"'

    tag.attributes.push tagClasses*/
    tag.final = '';
    return tag;
  };

  formatAttributes = function(tag) {
    var attribute, attributeDetails, attributeDetailsFilter, attributeName, attributeValue, newattributes;
    if (tag.attributes.length > 0) {
      newattributes = (function() {
        var j, len, ref, results;
        ref = tag.attributes;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          attribute = ref[j];
          attributeDetailsFilter = /^[\t\ ]*(?<attribute>[\w-_@$&#]+)[\t\ ]*=[\t\ ]*(?<value>[^\n]*)$/;
          attributeDetails = attributeDetailsFilter.exec(attribute);
          attributeName = attributeDetails.groups.attribute;
          attributeValue = attributeDetails.groups.value;
          results.push(`${attributeName}="${attributeValue}"`);
        }
        return results;
      })();
      return tag.attributes = newattributes;
    }
  };

  formatStrings = function(tag) {
    var child, cleanString, fullStringSearch, j, len, ref, results;
    ref = tag.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      if (child.type === stringType) {
        fullStringSearch = /\".*\"/;
        cleanString = child.source.match(fullStringSearch)[0];
        cleanString = cleanString.slice(1, -1);
        child.final = cleanString;
        if (child.indent > 0 + "\n") {
          results.push(child.final += '\n');
        } else {
          results.push(void 0);
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  formatScripts = function(tag) {
    var addSpaces, child, i, j, k, len, len1, len2, m, n, newScriptChildFinal, ref, ref1, ref2, results, scriptChildLine, scriptChildSliced;
    indentLines(tag);
    ref = tag.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      addSpaces = '';
      if (child.indent > 0) {
        for (i = k = 0, ref1 = child.indent; (0 <= ref1 ? k < ref1 : k > ref1); i = 0 <= ref1 ? ++k : --k) {
          addSpaces += ' ';
        }
      }
      if (child.type === scriptType) {
        if (child.children.length > 0) {
          child.final += '\n';
          formatScripts(child);
          ref2 = child.children;
          for (m = 0, len1 = ref2.length; m < len1; m++) {
            scriptChildLine = ref2[m];
            scriptChildSliced = scriptChildLine.final.split('\n');
            scriptChildSliced.pop();
            newScriptChildFinal = '';
            for (n = 0, len2 = scriptChildSliced.length; n < len2; n++) {
              i = scriptChildSliced[n];
              newScriptChildFinal += addSpaces + i + '\n';
            }
            scriptChildLine.final = newScriptChildFinal;
            child.final += scriptChildLine.final;
          }
          child.final = child.final.slice(0, -1);
        }
        results.push(child.final += '\n');
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  formatTagStyles = function(tag) {
    var afterArray, attributeAfter, cleanStyleattribute, dividerPosition, j, k, len, ref, ref1, results, style, x;
    ref = tag.styles;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      style = ref[j];
      dividerPosition = style.indexOf(':');
      attributeAfter = style.slice(dividerPosition + 1);
      cleanStyleattribute = style.split(':')[0] + ':';
      afterArray = attributeAfter.split(' ');
      for (x = k = 0, ref1 = afterArray.length; (0 <= ref1 ? k < ref1 : k > ref1); x = 0 <= ref1 ? ++k : --k) {
        if (afterArray[x] !== '') {
          cleanStyleattribute += afterArray[x];
          if (x < afterArray.length - 1) {
            cleanStyleattribute += ' ';
          }
        }
      }
      results.push(style = cleanStyleattribute);
    }
    return results;
  };

  formatLevels = function(tag) {
    var child, j, len, ref, results;
    ref = tag.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      child.level = tag.level + 1;
      if (child.children) {
        results.push(formatLevels(child));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  cleanUpFile = function(sFile) {
    var carriageTabTest, rFile;
    carriageTabTest = /[\r\t]/gmi;
    rFile = sFile;
    while (carriageTabTest.test(rFile)) {
      rFile = rFile.replace('\r', '\n').replace('\t', '    ');
    }
    return rFile;
  };

  exports.christinizeFile = function(chrisFilePath, options = {
      indent: 4,
      modulesDirectory: './'
    }) {
    var chrisRootFolder, christinizedFile, sourceFile;
    sourceFile = fs.readFileSync(chrisFilePath, 'utf8');
    sourceFile = cleanUpFile(sourceFile);
    chrisRootFolder = Path.dirname(chrisFilePath);
    return christinizedFile = this.christinize(sourceFile, indent);
  };

  //fs.writeFile('./' + chrisFilePath + '.html', christinizedFile)
  //christinizedFile
  exports.christinizeAndSave = function(chrisSource, options = {
      indent: 4,
      modulesDirectory: './'
    }) {
    var christinizedFile;
    christinizedFile = this.christinize(chrisSource, options);
    return fs.writeFile('./chrisPreview.html', christinizedFile);
  };

  exports.buildFile = function(chrisFilePath, options = {
      indent: 4
    }) {
    var christinizedFile, sourceFile;
    options.modulesDirectory = path.dirname(chrisFilePath);
    sourceFile = fs.readFileSync(chrisFilePath, 'utf8');
    sourceFile = cleanUpFile(sourceFile);
    christinizedFile = this.christinize(sourceFile, options);
    chrisFilePath = chrisFilePath.replace(/\.chris$/i, '.html');
    fs.writeFileSync('./' + chrisFilePath, christinizedFile);
    return christinizedFile;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxNQUFBLEVBQUEscUJBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxnQkFBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsYUFBQSxFQUFBLFNBQUEsRUFBQSxlQUFBLEVBQUEsRUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsZUFBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxjQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxhQUFBLEVBQUEsVUFBQSxFQUFBLGVBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsb0JBQUEsRUFBQSxrQkFBQSxFQUFBLGdCQUFBLEVBQUEsY0FBQSxFQUFBLGtCQUFBLEVBQUEsZ0JBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBQSxHQUFTLE9BQUEsQ0FBUSxjQUFSLEVBRlQ7OztFQVFBLGVBQUEsR0FBa0IsQ0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLE9BQWQsRUFBdUIsSUFBdkIsRUFBNkIsTUFBN0IsRUFBcUMsTUFBckM7O0VBQ2xCLFFBQUEsR0FBVyxDQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLE9BQWxCLEVBQTJCLE9BQTNCLEVBQW9DLE1BQXBDLEVBQTRDLE1BQTVDOztFQUVYLE9BQUEsR0FBc0IsRUFYdEI7O0VBWUEsU0FBQSxHQUFzQjs7RUFFdEIsZ0JBQUEsR0FBdUIsRUFk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LElBQUMsQ0FBQSxXQUFELENBQWEsVUFBYixFQUF5QixNQUF6QjtFQVZHLEVBdm9CMUI7Ozs7RUFzcEJBLE9BQU8sQ0FBQyxrQkFBUixHQUE2QixRQUFBLENBQUMsV0FBRCxFQUNaLFVBQVU7TUFDUCxNQUFBLEVBQVMsQ0FERjtNQUVQLGdCQUFBLEVBQW1CO0lBRlosQ0FERSxDQUFBO0FBTXpCLFFBQUE7SUFBQSxnQkFBQSxHQUFtQixJQUFDLENBQUEsV0FBRCxDQUFhLFdBQWIsRUFBMEIsT0FBMUI7V0FDbkIsRUFBRSxDQUFDLFNBQUgsQ0FBYSxxQkFBYixFQUFvQyxnQkFBcEM7RUFQeUI7O0VBVTdCLE9BQU8sQ0FBQyxTQUFSLEdBQW9CLFFBQUEsQ0FBQyxhQUFELEVBQ0gsVUFBVTtNQUNQLE1BQUEsRUFBUztJQURGLENBRFAsQ0FBQTtBQUtoQixRQUFBLGdCQUFBLEVBQUE7SUFBQSxPQUFPLENBQUMsZ0JBQVIsR0FBMkIsSUFBSSxDQUFDLE9BQUwsQ0FBYSxhQUFiO0lBQzNCLFVBQUEsR0FBYSxFQUFFLENBQUMsWUFBSCxDQUFnQixhQUFoQixFQUErQixNQUEvQjtJQUNiLFVBQUEsR0FBYSxXQUFBLENBQVksVUFBWjtJQUViLGdCQUFBLEdBQW1CLElBQUMsQ0FBQSxXQUFELENBQWEsVUFBYixFQUF5QixPQUF6QjtJQUVuQixhQUFBLEdBQWdCLGFBQWEsQ0FBQyxPQUFkLENBQXNCLFdBQXRCLEVBQW1DLE9BQW5DO0lBQ2hCLEVBQUUsQ0FBQyxhQUFILENBQWlCLElBQUEsR0FBTyxhQUF4QixFQUF1QyxnQkFBdkM7V0FDQTtFQWJnQjtBQWhxQnBCIiwic291cmNlc0NvbnRlbnQiOlsiZnMgPSByZXF1aXJlICdmcydcblBhdGggPSByZXF1aXJlICdwYXRoJ1xuY29mZmVlID0gcmVxdWlyZSAnY29mZmVlc2NyaXB0J1xuXG5cblxuIyBMSU5FIFRZUEVTXG5cbnNlbGZDbG9zaW5nVGFncyA9IFsnYnInLCAnaW1nJywgJ2lucHV0JywgJ2hyJywgJ21ldGEnLCAnbGluayddXG5oZWFkVGFncyA9IFsnbWV0YScsICd0aXRsZScsICdzdHlsZScsICdjbGFzcycsICdsaW5rJywgJ2Jhc2UnXVxuXG50YWdUeXBlICAgICAgICAgICAgID0gMCAjaWYgZm91bmQgdGFnI2lkLmNsYXNzXG50YWdGaWx0ZXIgICAgICAgICAgID0gL15bXFwgXFx0XSpcXHcrXFwgKihbLiNdW1xcdy1fXStcXCAqKSokL2lcblxudGFnQXR0cmlidXRlVHlwZSAgICAgPSAxICNpZiBmb3VuZCBhdHRyaWJ1dGUgPSBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAjIG5lZWQgdG8gcmVwbGFjZSBkb3VibGUgcXVvdGUgYW5kIGFtcGVyc2FuZCBhZnRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICMgdG8gJiMzNDsgYW5kICYjMzhcbnRhZ0F0dHJpYnV0ZUZpbHRlciAgID0gL15bXFx0XFwgXSpbXFx3LV9AJCYjXStbXFx0XFwgXSo9W1xcIFxcdF0qW15cXG5dKiQvXG5cbnN0eWxlQ2xhc3NUeXBlICAgICAgPSAyICMgaWYgZm91bmQgc3R5bGUgc2VsZWN0b3IgXG5zdHlsZUNsYXNzRmlsdGVyICAgID0gL15bXFx0XFwgXSpzdHlsZVtcXHRcXCBdKig/PHNlbGVjdG9yPlteXFxuXSspJC9pXG5cbnN0eWxlQXR0cmlidXRlVHlwZSAgID0gMyAjaWYgZm91bmQgYXR0cmlidXRlOiBzb21ldGhpbmdcbnN0eWxlQXR0cmlidXRlRmlsdGVyID0gL15cXHMqW15cIicgXSsgKjogKi4qL2lcblxuc3RyaW5nVHlwZSAgICAgICAgICA9IDQgI2lmIGZvdW5kIFwic3RyaW5nXCJcbnN0cmluZ0ZpbHRlciAgICAgICAgPSAvXltcXHRcXCBdKlwiLipcIi9pXG5cbnNjcmlwdFRhZ0ZpbHRlciAgICAgPSAvXlxccyooc2NyaXB0fGNvZmZlZXNjcmlwdHxqYXZhc2NyaXB0fGNvZmZlZSkvaVxuY29mZmVlc2NyaXB0VGFnRmlsdGVyID0gL15cXHMqKGNvZmZlZXNjcmlwdHxjb2ZmZWUpL2lcbnNjcmlwdFR5cGUgICAgICAgICAgPSA1ICNpZiBpdCBpcyB1bmRlciB0aGUgc2NyaXB0IHRhZ1xuc2NyaXB0VGFnVHlwZSAgICAgICA9IDlcblxuaGVhZFRhZ1R5cGUgICAgICAgICA9IDdcbmhlYWRUYWdGaWx0ZXIgICAgICAgPSAvXlxccyoobWV0YXx0aXRsZXxsaW5rfGJhc2UpL2lcblxubW9kdWxlVHlwZSAgICAgICAgICA9IDhcbm1vZHVsZUZpbHRlciAgICAgICAgPSAvXlxccyppbmNsdWRlXFxzKlwiLisuY2hyaXNcIi9pXG5cbmlnbm9yYWJsZVR5cGUgICAgICAgPSAtMlxuZW1wdHlGaWx0ZXIgICAgICAgICA9IC9eW1xcV1xcc19dKiQvXG5jb21tZW50RmlsdGVyICAgICAgID0gL15cXHMqIy9pXG5cblxuXG5cblxuXG5cblxuZXhwb3J0cy5jaHJpc3Rpbml6ZSA9ICAoc291cmNlVGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZW50IDogNFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZXNEaXJlY3RvcnkgOiAnLi8nXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSAtPlxuICAgIGNocmlzRmlsZSA9XG4gICAgICAgIHNvdXJjZSA6IFtdXG4gICAgICAgIGluUHJvZ3Jlc3NMaW5lcyA6IFxuICAgICAgICAgICAgc291cmNlIDogJ2h0bWwnXG4gICAgICAgICAgICB0eXBlIDogdGFnVHlwZVxuICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgYXR0cmlidXRlcyA6IFtdXG4gICAgICAgICAgICBzdHlsZXMgOiBbXVxuICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgaW5kZW50IDogb3B0aW9ucy5pbmRlbnRcblxuICAgICAgICBmaW5hbCA6ICcnXG4gICAgXG5cbiAgICBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzLnBhcmVudCA9IGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgIGNocmlzRmlsZS5zb3VyY2UgPSBjbGVhbnVwTGluZXMgc291cmNlVGV4dC5zcGxpdCAnXFxuJ1xuXG4gICAgY2hyaXNGaWxlLnNvdXJjZSA9IHByb2Nlc3NNb2R1bGVzIGNocmlzRmlsZS5zb3VyY2UsIG9wdGlvbnMubW9kdWxlc0RpcmVjdG9yeVxuICAgIHByb2Nlc3NIaWVyYXJjaHkgY2hyaXNGaWxlXG4gICAgcHJvY2Vzc1R5cGVzIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcbiAgICBzb3J0QnlUeXBlcyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgc29ydEJ5Qm9keUhlYWQgY2hyaXNGaWxlXG4gICAgZmluYWxpc2VUYWcgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgXG4gICAgZG9jdHlwZSA9ICc8IWRvY3R5cGUgaHRtbD4nXG4gICAgZG9jdHlwZSArPSAnXFxuJyBpZiBvcHRpb25zLmluZGVudFxuXG4gICAgY2hyaXNGaWxlLmZpbmFsID0gZG9jdHlwZSArIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMuZmluYWxcblxuICAgIGNocmlzRmlsZS5maW5hbFxuXG5cblxuXG5cblxuXG5jcmVhdGVOZXdGaWxlID0gKHNvdXJjZVRleHQsXG4gICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGVudCA6IDRcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlc0RpcmVjdG9yeSA6ICcuLydcbiAgICAgICAgICAgICAgICB9KSAtPlxuICAgIFxuICAgIGNvbnNvbGUubG9nIG9wdGlvbnNcbiAgICBcbiAgICBjaHJpc0ZpbGUgPVxuICAgICAgICBzb3VyY2UgOiBjbGVhbnVwTGluZXMgc291cmNlVGV4dC5zcGxpdCAnXFxuJ1xuICAgICAgICBpblByb2dyZXNzTGluZXMgOiBcbiAgICAgICAgICAgIHNvdXJjZSA6ICdodG1sJ1xuICAgICAgICAgICAgdHlwZSA6IHRhZ1R5cGVcbiAgICAgICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMgOiBbXVxuICAgICAgICAgICAgc3R5bGVzIDogW11cbiAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgIGluZGVudCA6IG9wdGlvbnMuaW5kZW50XG4gICAgICAgIFxuICAgICAgICBvcHRpb25zIDogb3B0aW9uc1xuICAgICAgICBmaW5hbCA6ICcnXG5cblxuXG5cbmxvYWRDaHJpc01vZHVsZSA9IChtb2R1bGVGaWxlUGF0aCkgLT5cbiAgICBtc2xzID0gZnMucmVhZEZpbGVTeW5jKG1vZHVsZUZpbGVQYXRoLCAndXRmOCcpXG4gICAgbXNscyA9IGNsZWFudXBMaW5lcyhtc2xzLnNwbGl0ICdcXG4nKVxuICAgIG1zbHNcblxucHJvY2Vzc01vZHVsZXMgPSAobHMsIGYpIC0+XG4gICAgcmVzdWx0THMgPSBuZXcgQXJyYXlcbiAgICBtb2R1bGVMZXZlbEZpbHRlciA9IC9eXFxzKi9cblxuICAgIGZvciB4IGluIFswLi4ubHMubGVuZ3RoXVxuICAgICAgICBpZiBtb2R1bGVGaWx0ZXIudGVzdCBsc1t4XVxuICAgICAgICAgICAgY2hyaXNNb2R1bGVQYXRoID0gbHNbeF0uc3BsaXQoJ1wiJylbMV1cbiAgICAgICAgICAgIG1vZHVsZUxpbmVzID0gbG9hZENocmlzTW9kdWxlIGNocmlzTW9kdWxlUGF0aFxuXG4gICAgICAgICAgICBtb2R1bGVMZXZlbCA9IG1vZHVsZUxldmVsRmlsdGVyLmV4ZWMobHNbeF0pXG4gICAgICAgICAgICBmb3IgbCBpbiBbMC4uLm1vZHVsZUxpbmVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBtb2R1bGVMaW5lc1tsXSA9IG1vZHVsZUxldmVsICsgbW9kdWxlTGluZXNbbF0gXG5cbiAgICAgICAgICAgIG1vZHVsZUxpbmVzID0gcHJvY2Vzc01vZHVsZXMgbW9kdWxlTGluZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSBcIiN7Zn0vI3tjaHJpc01vZHVsZVBhdGh9XCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmVzdWx0THMgPSByZXN1bHRMcy5jb25jYXQgbW9kdWxlTGluZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0THMucHVzaCBsc1t4XVxuXG4gICAgcmVzdWx0THNcbiAgICAgICAgICAgIFxuXG5cbnNvcnRCeUJvZHlIZWFkID0gKGZpbGUpIC0+XG4gICAgaGVhZFRhZyA9XG4gICAgICAgIHNvdXJjZSA6ICdoZWFkJ1xuICAgICAgICB0eXBlIDogdGFnVHlwZVxuICAgICAgICBwYXJlbnQ6IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgYXR0cmlidXRlcyA6IFtdXG4gICAgICAgIHN0eWxlcyA6IFtdXG4gICAgICAgIGNoaWxkcmVuIDogW11cblxuICAgIFxuICAgIHN0eWxlVGFnID1cbiAgICAgICAgc291cmNlIDogJ3N0eWxlJ1xuICAgICAgICB0eXBlIDogaGVhZFRhZ1R5cGVcbiAgICAgICAgcGFyZW50OiBoZWFkVGFnXG4gICAgICAgIGxldmVsIDogMFxuICAgICAgICBhdHRyaWJ1dGVzIDogW11cbiAgICAgICAgc3R5bGVzIDogW11cbiAgICAgICAgY2hpbGRyZW4gOiBbXVxuXG4gICAgaGVhZFRhZy5jaGlsZHJlbi5wdXNoIHN0eWxlVGFnXG5cblxuICAgIGJvZHlUYWcgPVxuICAgICAgICBzb3VyY2UgOiAnYm9keSdcbiAgICAgICAgdHlwZSA6IHRhZ1R5cGVcbiAgICAgICAgcGFyZW50OiBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgICAgICBsZXZlbCA6IC0xXG4gICAgICAgIGF0dHJpYnV0ZXMgOiBbXVxuICAgICAgICBzdHlsZXMgOiBbXVxuICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgXG5cbiAgICBmb3IgdGFnIGluIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuXG4gICAgICAgIGFkZGVkVG9IZWFkID0gbm9cblxuICAgICAgICBmb3IgaGVhZFRhZ1RlbXBsYXRlIGluIGhlYWRUYWdzXG4gICAgICAgICAgICBpZiB0YWcuc291cmNlID09IGhlYWRUYWdUZW1wbGF0ZVxuICAgICAgICAgICAgICAgIGFkZGVkVG9IZWFkID0geWVzXG4gICAgICAgICAgICAgICAgdGFnLnBhcmVudCA9IGhlYWRUYWdcbiAgICAgICAgICAgICAgICBoZWFkVGFnLmNoaWxkcmVuLnB1c2ggdGFnXG5cbiAgICAgICAgaWYgbm90IGFkZGVkVG9IZWFkXG4gICAgICAgICAgICBpZiB0YWcudHlwZSA9PSBzdHlsZUNsYXNzVHlwZVxuICAgICAgICAgICAgICAgIHRhZy5wYXJlbnQgPSBzdHlsZVRhZ1xuICAgICAgICAgICAgICAgIHN0eWxlVGFnLmNoaWxkcmVuLnB1c2ggdGFnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGFnLnBhcmVudCA9IGJvZHlUYWdcbiAgICAgICAgICAgICAgICBib2R5VGFnLmNoaWxkcmVuLnB1c2ggdGFnXG5cbiAgICBib2R5VGFnLnN0eWxlcyA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzLnN0eWxlc1xuICAgIGJvZHlUYWcuYXR0cmlidXRlcyA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmF0dHJpYnV0ZXNcblxuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLnN0eWxlcyA9IG5ldyBBcnJheVxuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmF0dHJpYnV0ZXMgPSBuZXcgQXJyYXlcbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlbiA9IG5ldyBBcnJheVxuXG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW4ucHVzaCBoZWFkVGFnXG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW4ucHVzaCBib2R5VGFnXG5cbiAgICBmb3JtYXRMZXZlbHMgZmlsZS5pblByb2dyZXNzTGluZXNcbiAgICBpbmRlbnRMaW5lcyBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG5cblxuaW5kZW50TGluZXMgPSAodGFnKSAtPlxuICAgIGZvciBjaGlsZCBpbiB0YWcuY2hpbGRyZW5cbiAgICAgICAgY2hpbGQuaW5kZW50YXRpb24gPSBjaGlsZC5sZXZlbCAqIHRhZy5pbmRlbnRcbiAgICAgICAgY2hpbGQuaW5kZW50ID0gdGFnLmluZGVudFxuXG4gICAgICAgIGlmIGNoaWxkLmNoaWxkcmVuXG4gICAgICAgICAgICBpbmRlbnRMaW5lcyBjaGlsZFxuXG5cblxuXG5jbGVhbnVwTGluZXMgPSAoc291cmNlTGluZXMpIC0+XG4gICAgbmV3U291cmNlTGluZXMgPSBuZXcgQXJyYXlcblxuICAgIGZvciBsaW5lIGluIHNvdXJjZUxpbmVzXG4gICAgICAgIGlmIGFuYWxpc2VUeXBlKGxpbmUpICE9IC0yXG4gICAgICAgICAgICBuZXdTb3VyY2VMaW5lcy5wdXNoIGxpbmVcbiAgICBcbiAgICBuZXdTb3VyY2VMaW5lc1xuXG5cbmFuYWxpc2VUeXBlID0gKGxpbmUpIC0+XG4gICAgbGluZVR5cGUgPSAtMlxuXG4gICAgbGluZVR5cGUgPSBpZ25vcmFibGVUeXBlIGlmIGNvbW1lbnRGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBpZ25vcmFibGVUeXBlIGlmIGVtcHR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3R5bGVBdHRyaWJ1dGVUeXBlIGlmIHN0eWxlQXR0cmlidXRlRmlsdGVyLnRlc3QgbGluZVxuICAgIGlmIHRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICAgICAgbGluZVR5cGUgPSB0YWdUeXBlIFxuICAgICAgICBpZiBzY3JpcHRUYWdGaWx0ZXIudGVzdCBsaW5lXG4gICAgICAgICAgICBsaW5lVHlwZSA9IHNjcmlwdFRhZ1R5cGVcblxuICAgIGxpbmVUeXBlID0gaGVhZFRhZ1R5cGUgaWYgaGVhZFRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlQ2xhc3NUeXBlIGlmIHN0eWxlQ2xhc3NGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB0YWdBdHRyaWJ1dGVUeXBlIGlmIHRhZ0F0dHJpYnV0ZUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0cmluZ1R5cGUgaWYgc3RyaW5nRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gbW9kdWxlVHlwZSBpZiBtb2R1bGVGaWx0ZXIudGVzdCBsaW5lXG4gICAgXG4gICAgbGluZVR5cGVcblxuXG5cblxuY291bnRTcGFjZXMgPSAobGluZSkgLT5cbiAgICBzcGFjZXMgPSAwXG4gICAgaWYgbGluZVswXSA9PSAnICdcbiAgICAgICAgd2hpbGUgbGluZVtzcGFjZXNdID09ICcgJ1xuICAgICAgICAgICAgc3BhY2VzICs9IDFcbiAgICBcbiAgICBzcGFjZXNcblxuXG5cblxuXG5cbnByb2Nlc3NIaWVyYXJjaHkgPSAoZmlsZSkgLT5cbiAgICBjdXJyZW50UGFyZW50ID0gZmlsZS5pblByb2dyZXNzTGluZXNcbiAgICBjdXJyZW50Q2hpbGQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgZm9yIGxpbmUgaW4gWzAuLi5maWxlLnNvdXJjZS5sZW5ndGhdXG4gICAgICAgIGxpbmVMZXZlbCA9IGNvdW50U3BhY2VzIGZpbGUuc291cmNlW2xpbmVdXG5cbiAgICAgICAgaWYgbGluZUxldmVsID4gY3VycmVudFBhcmVudC5sZXZlbFxuICAgICAgICAgICAgaWYgbGluZUxldmVsID4gY3VycmVudENoaWxkLmxldmVsXG4gICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudENoaWxkXG5cbiAgICAgICAgICAgIG5ld0xpbmUgPVxuICAgICAgICAgICAgICAgIHNvdXJjZSA6IGZpbGUuc291cmNlW2xpbmVdLnNsaWNlIGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBwYXJlbnQgOiBjdXJyZW50UGFyZW50XG4gICAgICAgICAgICAgICAgbGV2ZWwgOiBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzIDogW11cbiAgICAgICAgICAgICAgICBzdHlsZXMgOiBbXVxuXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50LmNoaWxkcmVuLnB1c2ggbmV3TGluZVxuICAgICAgICAgICAgY3VycmVudENoaWxkID0gbmV3TGluZVxuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIGxpbmVMZXZlbCA8PSBjdXJyZW50UGFyZW50LmxldmVsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQucGFyZW50XG5cbiAgICAgICAgICAgIG5ld0xpbmUgPVxuICAgICAgICAgICAgICAgIHNvdXJjZSA6IGZpbGUuc291cmNlW2xpbmVdLnNsaWNlIGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBwYXJlbnQgOiBjdXJyZW50UGFyZW50XG4gICAgICAgICAgICAgICAgbGV2ZWwgOiBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzIDogW11cbiAgICAgICAgICAgICAgICBzdHlsZXMgOiBbXVxuXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50LmNoaWxkcmVuLnB1c2ggbmV3TGluZVxuICAgICAgICAgICAgY3VycmVudENoaWxkID0gbmV3TGluZVxuXG5cblxuXG5cblxuXG5wcm9jZXNzVHlwZXMgPSAobGluZSkgLT5cbiAgICBmb3IgbGluZSBpbiBsaW5lLmNoaWxkcmVuXG4gICAgICAgIGlmIGxpbmUuc291cmNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSBhbmFsaXNlVHlwZSBsaW5lLnNvdXJjZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSAtMlxuICAgICAgICBcbiAgICAgICAgaWYgbGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICBwcm9jZXNzVHlwZXMgbGluZVxuXG5cblxuXG5cblxuc29ydEJ5VHlwZXMgPSAobGluZXMpIC0+XG4gICAgIyBleHRyYWN0IHRoZSBzdHlsZXMsIGF0dHJpYnV0ZXMgYW5kIHN0cmluZ3MgdG8gdGhlaXIgcGFyZW50c1xuXG4gICAgZm9yIGxpbmUgaW4gbGluZXMuY2hpbGRyZW5cbiAgICAgICAgaWYgbGluZS50eXBlID09IHNjcmlwdFRhZ1R5cGVcbiAgICAgICAgICAgIHR5cGVBbGxTY3JpcHRzIGxpbmVcblxuICAgIGxhc3RDaGlsZCA9IGxpbmVzLmNoaWxkcmVuLmxlbmd0aCAtIDFcblxuICAgIGZvciBsaW5lIGluIFtsYXN0Q2hpbGQuLjBdXG4gICAgICAgIGlmIGxpbmVzLmNoaWxkcmVuW2xpbmVdLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHNvcnRCeVR5cGVzIGxpbmVzLmNoaWxkcmVuW2xpbmVdXG5cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSB0YWdBdHRyaWJ1dGVUeXBlXG4gICAgICAgICAgICBpZiAhbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuYXR0cmlidXRlcyA9IG5ldyBBcnJheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuYXR0cmlidXRlcy5wdXNoIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnNvdXJjZVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICBcbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSBzdHlsZUF0dHJpYnV0ZVR5cGVcbiAgICAgICAgICAgIGlmICFsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzXG4gICAgICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlcyA9IG5ldyBBcnJheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzLnB1c2ggbGluZXMuY2hpbGRyZW5bbGluZV0uc291cmNlXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlIGxpbmUgLCAxXG5cbiAgICAgICAgICAgIGNvbnRpbnVlXG5cblxuXG5cblxuXG50eXBlQWxsU2NyaXB0cyA9IChzY3JpcHRMaW5lKSAtPlxuICAgIGlmIHNjcmlwdExpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICBmb3IgY29kZUxpbmUgaW4gc2NyaXB0TGluZS5jaGlsZHJlblxuICAgICAgICAgICAgY29kZUxpbmUudHlwZSA9IHNjcmlwdFR5cGVcbiAgICAgICAgICAgIGNvZGVMaW5lLmZpbmFsID0gY29kZUxpbmUuc291cmNlXG4gICAgICAgICAgICB0eXBlQWxsU2NyaXB0cyhjb2RlTGluZSkgaWYgY29kZUxpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuXG5cblxuXG5cbmZpbmFsaXNlVGFnID0gKGxpbmUpIC0+XG4gICAgYWRkU3BhY2VzID0gJydcbiAgICBpZiBsaW5lLmluZGVudCA+IDBcbiAgICAgICAgYWRkU3BhY2VzICs9ICcgJyBmb3IgaSBpbiBbMC4uLmxpbmUuaW5kZW50XVxuXG4gICAgaWYgbGluZS50eXBlIGlzIHN0eWxlQ2xhc3NUeXBlXG4gICAgICAgIGZpbmFsaXNlU3R5bGUgbGluZVxuXG4gICAgaWYgbGluZS50eXBlIGlzIHRhZ1R5cGUgb3IgXG4gICAgICAgbGluZS50eXBlIGlzIHNjcmlwdFRhZ1R5cGUgb3IgXG4gICAgICAgbGluZS50eXBlIGlzIGhlYWRUYWdUeXBlXG5cbiAgICAgICAgY29mZmVlU2NyaXB0ID0gZmFsc2VcbiAgICAgICAgZm9ybWF0VGFnIGxpbmVcblxuICAgICAgICBpZiBsaW5lLnR5cGUgPT0gc2NyaXB0VGFnVHlwZVxuICAgICAgICAgICAgaWYgY29mZmVlc2NyaXB0VGFnRmlsdGVyLnRlc3QgbGluZS5zb3VyY2VcbiAgICAgICAgICAgICAgICBsaW5lLnNvdXJjZSA9ICdzY3JpcHQnXG4gICAgICAgICAgICAgICAgY29mZmVlU2NyaXB0ID0gdHJ1ZVxuXG4gICAgICAgIGxpbmUuZmluYWwgPSAnPCcgKyBsaW5lLnNvdXJjZVxuXG4gICAgICAgIGlmIGxpbmUuc3R5bGVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGxpbmVTdHlsZSA9ICdzdHlsZSA9ICdcblxuICAgICAgICAgICAgZm9ybWF0VGFnU3R5bGVzIGxpbmVcblxuICAgICAgICAgICAgZm9yIHN0eWxlIGluIGxpbmUuc3R5bGVzXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlICs9IHN0eWxlICsgJzsnXG5cbiAgICAgICAgICAgIGxpbmUuYXR0cmlidXRlcy5wdXNoIGxpbmVTdHlsZVxuICAgICAgICBcbiAgICAgICAgZm9ybWF0QXR0cmlidXRlcyBsaW5lXG4gICAgICAgIFxuXG4gICAgICAgIGlmIGxpbmUuYXR0cmlidXRlcy5sZW5ndGggPiAwXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9ICcgJ1xuICAgICAgICAgICAgZm9yIGF0dHJpYnV0ZSBpbiBsaW5lLmF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICBsaW5lLmZpbmFsICs9IGF0dHJpYnV0ZSArICcgJ1xuICAgICAgICBcbiAgICAgICAgICAgIGxpbmUuZmluYWwgPSBsaW5lLmZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgIGxpbmUuZmluYWwgKz0gJz4nXG4gICAgICAgIGxpbmUuZmluYWwgKz0gJ1xcbicgaWYgbGluZS5pbmRlbnQgPiAwXG5cblxuICAgICAgICBpZiBsaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGZvcm1hdFN0cmluZ3MgbGluZVxuXG4gICAgICAgICAgICBpZiBsaW5lLnR5cGUgPT0gc2NyaXB0VGFnVHlwZVxuICAgICAgICAgICAgICAgIGxpbmUuaW5kZW50ID0gNFxuXG4gICAgICAgICAgICBmb3JtYXRTY3JpcHRzIGxpbmVcblxuICAgICAgICAgICAgZm9yIGNoaWxkIGluIGxpbmUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmaW5hbGlzZVRhZyBjaGlsZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lc09mQ2hpbGRyZW4gPSAnJ1xuXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIG5ld0ZpbmFsID0gJydcbiAgICAgICAgICAgICAgICBjaGlsZExpbmVzID0gY2hpbGQuZmluYWwuc3BsaXQgJ1xcbidcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgbCBpbiBjaGlsZExpbmVzXG4gICAgICAgICAgICAgICAgICAgIGlmIGwubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IGFkZFNwYWNlcyArIGxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZpbmFsICs9IGwgKyAnXFxuJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5ld0ZpbmFsICs9ICdcXG4nIGlmIGxpbmUuaW5kZW50ID4gMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5ld0ZpbmFsID0gbmV3RmluYWwuc2xpY2UgMCwgLTFcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCA9IG5ld0ZpbmFsXG4gICAgICAgICAgICAgICAgbGluZXNPZkNoaWxkcmVuICs9IG5ld0ZpbmFsXG5cbiAgICAgICAgICAgIGlmIGNvZmZlZVNjcmlwdFxuICAgICAgICAgICAgICAgIGxpbmVzT2ZDaGlsZHJlbiA9IGNvZmZlZS5jb21waWxlIGxpbmVzT2ZDaGlsZHJlblxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9IGxpbmVzT2ZDaGlsZHJlblxuICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgbGluZS5zZWxmQ2xvc2luZ1xuICAgICAgICAgICAgbGluZS5maW5hbCArPSAnPC8nICsgbGluZS5zb3VyY2UgKyAnPidcbiAgICAgICAgICAgICNsaW5lLmZpbmFsICs9ICdcXG4nIGlmIGxpbmUuaW5kZW50ID4gMFxuICAgIFxuXG5cblxuZmluYWxpc2VTdHlsZSA9IChzdHlsZVRhZykgLT5cbiAgICBhZGRTcGFjZXMgPSAnJ1xuICAgIGlmIHN0eWxlVGFnLmluZGVudCA+IDBcbiAgICAgICAgYWRkU3BhY2VzICs9ICcgJyBmb3IgaSBpbiBbMC4uLnN0eWxlVGFnLmluZGVudF1cblxuICAgIGZpbmFsVGFnID0gJydcblxuICAgIHRhZ0RldGFpbHMgPSBzdHlsZUNsYXNzRmlsdGVyLmV4ZWMgc3R5bGVUYWcuc291cmNlXG5cbiAgICBmaW5hbFRhZyArPSB0YWdEZXRhaWxzLmdyb3Vwcy5zZWxlY3Rvci5yZXBsYWNlIC9cXCAqJC8sICcgJ1xuICAgIGZpbmFsVGFnICs9ICd7J1xuICAgIFxuICAgIGZvcm1hdFRhZ1N0eWxlcyBzdHlsZVRhZ1xuXG4gICAgZm9yIHN0eWxlIGluIHN0eWxlVGFnLnN0eWxlc1xuICAgICAgICBpZiBzdHlsZVRhZy5pbmRlbnQgPiAwXG4gICAgICAgICAgICBmaW5hbFRhZyArPSAnXFxuJ1xuICAgICAgICAgICAgZmluYWxUYWcgKz0gYWRkU3BhY2VzXG5cbiAgICAgICAgZmluYWxUYWcgKz0gXCIje3N0eWxlfTtcIlxuICAgIFxuICAgIGlmIHN0eWxlVGFnLmluZGVudCA+IDBcbiAgICAgICAgZmluYWxUYWcgKz0gJ1xcbidcblxuICAgIGZpbmFsVGFnICs9ICd9J1xuICAgIHN0eWxlVGFnLmZpbmFsID0gZmluYWxUYWdcblxuXG5cblxuICAgIFxuZm9ybWF0VGFnID0gKHRhZykgLT5cbiAgICB0YWdEZXRhaWxzRmlsdGVyID0gL15bXFwgXFx0XSooPzx0YWc+XFx3KylcXCAqKD88YXR0cmlidXRlcz4oWy4jXVtcXHctX10rXFwgKikrKT8kL2dcbiAgICB0YWdJZEZpbHRlciA9IC8jKD88aWQ+XFx3KykvXG4gICAgdGFnQ2xhc3NGaWx0ZXIgPSAvXFwuKD88Y2xhc3M+W1xcdy1fXSspL2dcbiAgICBcbiAgICB0YWdEZXRhaWxzID0gdGFnRGV0YWlsc0ZpbHRlci5leGVjIHRhZy5zb3VyY2VcbiAgICB0YWcuc291cmNlID0gdGFnRGV0YWlscy5ncm91cHMudGFnXG5cbiAgICBcblxuICAgIHRhZ0NsYXNzRm91bmQgPSB0YWdDbGFzc0ZpbHRlci5leGVjIHRhZ0RldGFpbHMuZ3JvdXBzLmF0dHJpYnV0ZXNcbiAgICBpZiB0YWdDbGFzc0ZvdW5kP1xuICAgICAgICBhbGxDbGFzc2VzID0gXCJcIlxuICAgICAgICB3aGlsZSB0YWdDbGFzc0ZvdW5kP1xuICAgICAgICAgICAgYWxsQ2xhc3NlcyArPSB0YWdDbGFzc0ZvdW5kLmdyb3Vwcy5jbGFzcyArIFwiIFwiXG4gICAgICAgICAgICB0YWdDbGFzc0ZvdW5kID0gdGFnQ2xhc3NGaWx0ZXIuZXhlYyB0YWdEZXRhaWxzLmdyb3Vwcy5hdHRyaWJ1dGVzXG4gICAgXG4gICAgICAgIHRhZy5hdHRyaWJ1dGVzLnVuc2hpZnQgXCJjbGFzcz0je2FsbENsYXNzZXMuc2xpY2UgMCwgLTF9XCJcblxuXG5cbiAgICB0YWdJZEZvdW5kID0gdGFnSWRGaWx0ZXIuZXhlYyB0YWdEZXRhaWxzLmdyb3Vwcy5hdHRyaWJ1dGVzXG4gICAgaWYgdGFnSWRGb3VuZD9cbiAgICAgICAgdGFnLmF0dHJpYnV0ZXMudW5zaGlmdCBcImlkPSN7dGFnSWRGb3VuZC5ncm91cHMuaWR9XCJcblxuXG5cbiAgICB0YWcuc2VsZkNsb3NpbmcgPSBub1xuXG4gICAgZm9yIHNlbGZDbG9zaW5nVGFnIGluIHNlbGZDbG9zaW5nVGFnc1xuICAgICAgICBpZiB0YWcuc291cmNlIGlzIHNlbGZDbG9zaW5nVGFnXG4gICAgICAgICAgICB0YWcuc2VsZkNsb3NpbmcgPSB5ZXNcbiAgICBcbiAgICAjIyNcbiAgICB0YWdBcnJheSA9IHRhZy5zb3VyY2Uuc3BsaXQgL1xccysvXG4gICAgdGFnLnNvdXJjZSA9IHRhZ0FycmF5WzBdXG5cbiAgICB0YWcuc2VsZkNsb3NpbmcgPSBmYWxzZVxuICAgIGZvciBzZWxmQ2xvc2luZ1RhZyBpbiBzZWxmQ2xvc2luZ1RhZ3NcbiAgICAgICAgaWYgdGFnLnNvdXJjZSA9PSBzZWxmQ2xvc2luZ1RhZ1xuICAgICAgICAgICAgdGFnLnNlbGZDbG9zaW5nID0gdHJ1ZVxuXG4gICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcblxuICAgIGlmIHRhZ0FycmF5Lmxlbmd0aCA+IDBcbiAgICAgICAgaWYgdGFnQXJyYXlbMF0gIT0gJ2lzJ1xuICAgICAgICAgICAgdGFnLmF0dHJpYnV0ZXMucHVzaCAnaWQgXCInICsgdGFnQXJyYXlbMF0gKyAnXCInXG4gICAgICAgICAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuICAgICAgICBcbiAgICAgICAgaWYgdGFnQXJyYXlbMF0gPT0gJ2lzJ1xuICAgICAgICAgICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgPSAnY2xhc3MgXCInXG4gICAgICAgICAgICBmb3IgdGFnQ2xhc3MgaW4gdGFnQXJyYXlcbiAgICAgICAgICAgICAgICB0YWdDbGFzc2VzICs9IHRhZ0NsYXNzICsgJyAnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgPSB0YWdDbGFzc2VzLnNsaWNlIDAsIC0xXG4gICAgICAgICAgICB0YWdDbGFzc2VzICs9ICdcIidcblxuICAgICAgICAgICAgdGFnLmF0dHJpYnV0ZXMucHVzaCB0YWdDbGFzc2VzIyMjXG5cbiAgICB0YWcuZmluYWwgPSAnJ1xuICAgIHRhZ1xuXG5cbmZvcm1hdEF0dHJpYnV0ZXMgPSAodGFnKSAtPlxuICAgIGlmIHRhZy5hdHRyaWJ1dGVzLmxlbmd0aCA+IDBcbiAgICAgICAgbmV3YXR0cmlidXRlcyA9XG4gICAgICAgICAgICBmb3IgYXR0cmlidXRlIGluIHRhZy5hdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlRGV0YWlsc0ZpbHRlciA9IC9eW1xcdFxcIF0qKD88YXR0cmlidXRlPltcXHctX0AkJiNdKylbXFx0XFwgXSo9W1xcdFxcIF0qKD88dmFsdWU+W15cXG5dKikkL1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZURldGFpbHMgPSBhdHRyaWJ1dGVEZXRhaWxzRmlsdGVyLmV4ZWMgYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZURldGFpbHMuZ3JvdXBzLmF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlID0gYXR0cmlidXRlRGV0YWlscy5ncm91cHMudmFsdWVcblxuICAgICAgICAgICAgICAgIFwiI3thdHRyaWJ1dGVOYW1lfT1cXFwiI3thdHRyaWJ1dGVWYWx1ZX1cXFwiXCJcblxuICAgICAgICB0YWcuYXR0cmlidXRlcyA9IG5ld2F0dHJpYnV0ZXNcblxuXG5mb3JtYXRTdHJpbmdzID0gKHRhZykgLT5cbiAgICBmb3IgY2hpbGQgaW4gdGFnLmNoaWxkcmVuXG4gICAgICAgIGlmIGNoaWxkLnR5cGUgaXMgc3RyaW5nVHlwZVxuICAgICAgICAgICAgZnVsbFN0cmluZ1NlYXJjaCA9IC9cXFwiLipcXFwiL1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgPSBjaGlsZC5zb3VyY2UubWF0Y2goZnVsbFN0cmluZ1NlYXJjaClbMF1cbiAgICAgICAgICAgIGNsZWFuU3RyaW5nID0gY2xlYW5TdHJpbmcuc2xpY2UgMSwgLTFcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsID0gY2xlYW5TdHJpbmdcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nIGlmIGNoaWxkLmluZGVudCA+IDAgKyBcIlxcblwiXG5cblxuXG5cbmZvcm1hdFNjcmlwdHMgPSAodGFnKSAtPlxuICAgIGluZGVudExpbmVzIHRhZ1xuXG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuICAgICAgICBhZGRTcGFjZXMgPSAnJ1xuXG4gICAgICAgIGlmIGNoaWxkLmluZGVudCA+IDBcbiAgICAgICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLi5jaGlsZC5pbmRlbnRdXG4gICAgICAgIFxuICAgICAgICBpZiBjaGlsZC50eXBlID09IHNjcmlwdFR5cGVcblxuICAgICAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nXG4gICAgICAgICAgICAgICAgZm9ybWF0U2NyaXB0cyBjaGlsZFxuXG4gICAgICAgICAgICAgICAgZm9yIHNjcmlwdENoaWxkTGluZSBpbiBjaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDaGlsZFNsaWNlZCA9IHNjcmlwdENoaWxkTGluZS5maW5hbC5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDaGlsZFNsaWNlZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBuZXdTY3JpcHRDaGlsZEZpbmFsID0gJydcbiAgICAgICAgICAgICAgICAgICAgZm9yIGkgaW4gc2NyaXB0Q2hpbGRTbGljZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1NjcmlwdENoaWxkRmluYWwgKz0gYWRkU3BhY2VzICsgaSArICdcXG4nXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENoaWxkTGluZS5maW5hbCA9IG5ld1NjcmlwdENoaWxkRmluYWxcblxuICAgICAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCArPSBzY3JpcHRDaGlsZExpbmUuZmluYWxcbiAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCA9IGNoaWxkLmZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjaGlsZC5maW5hbCArPSAnXFxuJ1xuXG5cblxuXG5mb3JtYXRUYWdTdHlsZXMgPSAodGFnKSAtPlxuICAgIGZvciBzdHlsZSBpbiB0YWcuc3R5bGVzXG4gICAgICAgIGRpdmlkZXJQb3NpdGlvbiA9IHN0eWxlLmluZGV4T2YgJzonXG4gICAgICAgIGF0dHJpYnV0ZUFmdGVyID0gc3R5bGUuc2xpY2UgKGRpdmlkZXJQb3NpdGlvbiArIDEpXG4gICAgICAgIGNsZWFuU3R5bGVhdHRyaWJ1dGUgPSBzdHlsZS5zcGxpdCgnOicpWzBdICsgJzonXG4gICAgICAgIGFmdGVyQXJyYXkgPSBhdHRyaWJ1dGVBZnRlci5zcGxpdCAnICdcblxuICAgICAgICBmb3IgeCBpbiBbMC4uLmFmdGVyQXJyYXkubGVuZ3RoXVxuICAgICAgICAgICAgaWYgYWZ0ZXJBcnJheVt4XSAhPSAnJ1xuICAgICAgICAgICAgICAgIGNsZWFuU3R5bGVhdHRyaWJ1dGUgKz0gYWZ0ZXJBcnJheVt4XVxuICAgICAgICAgICAgICAgIGNsZWFuU3R5bGVhdHRyaWJ1dGUgKz0gJyAnIGlmIHggPCBhZnRlckFycmF5Lmxlbmd0aCAtIDFcblxuICAgICAgICBzdHlsZSA9IGNsZWFuU3R5bGVhdHRyaWJ1dGVcblxuXG5mb3JtYXRMZXZlbHMgPSAodGFnKSAtPlxuICAgIGZvciBjaGlsZCBpbiB0YWcuY2hpbGRyZW5cbiAgICAgICAgY2hpbGQubGV2ZWwgPSB0YWcubGV2ZWwgKyAxXG5cbiAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICAgIGZvcm1hdExldmVscyBjaGlsZFxuXG5cbmNsZWFuVXBGaWxlID0gKHNGaWxlKSAtPlxuICAgIGNhcnJpYWdlVGFiVGVzdCA9IC9bXFxyXFx0XS9nbWlcblxuICAgIHJGaWxlID0gc0ZpbGVcbiAgICB3aGlsZSBjYXJyaWFnZVRhYlRlc3QudGVzdChyRmlsZSlcbiAgICAgICAgckZpbGUgPSByRmlsZS5yZXBsYWNlKCdcXHInLCAnXFxuJykucmVwbGFjZSgnXFx0JywgJyAgICAnKVxuICAgIHJGaWxlXG5cblxuXG5leHBvcnRzLmNocmlzdGluaXplRmlsZSA9IChjaHJpc0ZpbGVQYXRoLFxuICAgICAgICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQgOiA0XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZXNEaXJlY3RvcnkgOiAnLi8nXG4gICAgICAgICAgICAgICAgfSkgLT5cblxuICAgIHNvdXJjZUZpbGUgPSBmcy5yZWFkRmlsZVN5bmMoY2hyaXNGaWxlUGF0aCwgJ3V0ZjgnKVxuICAgIHNvdXJjZUZpbGUgPSBjbGVhblVwRmlsZShzb3VyY2VGaWxlKSBcblxuICAgIGNocmlzUm9vdEZvbGRlciA9IFBhdGguZGlybmFtZSBjaHJpc0ZpbGVQYXRoXG4gICAgY2hyaXN0aW5pemVkRmlsZSA9IEBjaHJpc3Rpbml6ZShzb3VyY2VGaWxlLCBpbmRlbnQpXG5cbiAgICAjZnMud3JpdGVGaWxlKCcuLycgKyBjaHJpc0ZpbGVQYXRoICsgJy5odG1sJywgY2hyaXN0aW5pemVkRmlsZSlcbiAgICAjY2hyaXN0aW5pemVkRmlsZVxuXG5leHBvcnRzLmNocmlzdGluaXplQW5kU2F2ZSA9IChjaHJpc1NvdXJjZSxcbiAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50IDogNFxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVzRGlyZWN0b3J5IDogJy4vJ1xuICAgICAgICAgICAgICAgIH0pIC0+XG5cbiAgICBjaHJpc3Rpbml6ZWRGaWxlID0gQGNocmlzdGluaXplKGNocmlzU291cmNlLCBvcHRpb25zKVxuICAgIGZzLndyaXRlRmlsZSgnLi9jaHJpc1ByZXZpZXcuaHRtbCcsIGNocmlzdGluaXplZEZpbGUpXG5cblxuZXhwb3J0cy5idWlsZEZpbGUgPSAoY2hyaXNGaWxlUGF0aCxcbiAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50IDogNFxuICAgICAgICAgICAgICAgIH0pIC0+XG4gICAgXG4gICAgb3B0aW9ucy5tb2R1bGVzRGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lIGNocmlzRmlsZVBhdGhcbiAgICBzb3VyY2VGaWxlID0gZnMucmVhZEZpbGVTeW5jKGNocmlzRmlsZVBhdGgsICd1dGY4JylcbiAgICBzb3VyY2VGaWxlID0gY2xlYW5VcEZpbGUoc291cmNlRmlsZSlcblxuICAgIGNocmlzdGluaXplZEZpbGUgPSBAY2hyaXN0aW5pemUoc291cmNlRmlsZSwgb3B0aW9ucylcblxuICAgIGNocmlzRmlsZVBhdGggPSBjaHJpc0ZpbGVQYXRoLnJlcGxhY2UoL1xcLmNocmlzJC9pLCAnLmh0bWwnKVxuICAgIGZzLndyaXRlRmlsZVN5bmMoJy4vJyArIGNocmlzRmlsZVBhdGgsIGNocmlzdGluaXplZEZpbGUpXG4gICAgY2hyaXN0aW5pemVkRmlsZSJdfQ==
//# sourceURL=coffeescript