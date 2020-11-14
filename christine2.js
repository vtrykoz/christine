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
    lineType = -1;
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
      console.log(line.attributes);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxNQUFBLEVBQUEscUJBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxnQkFBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsYUFBQSxFQUFBLFNBQUEsRUFBQSxlQUFBLEVBQUEsRUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsZUFBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxjQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxhQUFBLEVBQUEsVUFBQSxFQUFBLGVBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsb0JBQUEsRUFBQSxrQkFBQSxFQUFBLGdCQUFBLEVBQUEsY0FBQSxFQUFBLGtCQUFBLEVBQUEsZ0JBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBQSxHQUFTLE9BQUEsQ0FBUSxjQUFSLEVBRlQ7OztFQVFBLGVBQUEsR0FBa0IsQ0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLE9BQWQsRUFBdUIsSUFBdkIsRUFBNkIsTUFBN0IsRUFBcUMsTUFBckM7O0VBQ2xCLFFBQUEsR0FBVyxDQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLE9BQWxCLEVBQTJCLE9BQTNCLEVBQW9DLE1BQXBDLEVBQTRDLE1BQTVDOztFQUVYLE9BQUEsR0FBc0IsRUFYdEI7O0VBWUEsU0FBQSxHQUFzQjs7RUFFdEIsZ0JBQUEsR0FBdUIsRUFk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QUFJLENBQUMsT0FBTCxDQUFhLGFBQWI7V0FDbEIsZ0JBQUEsR0FBbUIsSUFBQyxDQUFBLFdBQUQsQ0FBYSxVQUFiLEVBQXlCLE1BQXpCO0VBVkcsRUF4b0IxQjs7OztFQXVwQkEsT0FBTyxDQUFDLGtCQUFSLEdBQTZCLFFBQUEsQ0FBQyxXQUFELEVBQ1osVUFBVTtNQUNQLE1BQUEsRUFBUyxDQURGO01BRVAsZ0JBQUEsRUFBbUI7SUFGWixDQURFLENBQUE7QUFNekIsUUFBQTtJQUFBLGdCQUFBLEdBQW1CLElBQUMsQ0FBQSxXQUFELENBQWEsV0FBYixFQUEwQixPQUExQjtXQUNuQixFQUFFLENBQUMsU0FBSCxDQUFhLHFCQUFiLEVBQW9DLGdCQUFwQztFQVB5Qjs7RUFVN0IsT0FBTyxDQUFDLFNBQVIsR0FBb0IsUUFBQSxDQUFDLGFBQUQsRUFDSCxVQUFVO01BQ1AsTUFBQSxFQUFTO0lBREYsQ0FEUCxDQUFBO0FBS2hCLFFBQUEsZ0JBQUEsRUFBQTtJQUFBLE9BQU8sQ0FBQyxnQkFBUixHQUEyQixJQUFJLENBQUMsT0FBTCxDQUFhLGFBQWI7SUFDM0IsVUFBQSxHQUFhLEVBQUUsQ0FBQyxZQUFILENBQWdCLGFBQWhCLEVBQStCLE1BQS9CO0lBQ2IsVUFBQSxHQUFhLFdBQUEsQ0FBWSxVQUFaO0lBRWIsZ0JBQUEsR0FBbUIsSUFBQyxDQUFBLFdBQUQsQ0FBYSxVQUFiLEVBQXlCLE9BQXpCO0lBRW5CLGFBQUEsR0FBZ0IsYUFBYSxDQUFDLE9BQWQsQ0FBc0IsV0FBdEIsRUFBbUMsT0FBbkM7SUFDaEIsRUFBRSxDQUFDLGFBQUgsQ0FBaUIsSUFBQSxHQUFPLGFBQXhCLEVBQXVDLGdCQUF2QztXQUNBO0VBYmdCO0FBanFCcEIiLCJzb3VyY2VzQ29udGVudCI6WyJmcyA9IHJlcXVpcmUgJ2ZzJ1xuUGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5jb2ZmZWUgPSByZXF1aXJlICdjb2ZmZWVzY3JpcHQnXG5cblxuXG4jIExJTkUgVFlQRVNcblxuc2VsZkNsb3NpbmdUYWdzID0gWydicicsICdpbWcnLCAnaW5wdXQnLCAnaHInLCAnbWV0YScsICdsaW5rJ11cbmhlYWRUYWdzID0gWydtZXRhJywgJ3RpdGxlJywgJ3N0eWxlJywgJ2NsYXNzJywgJ2xpbmsnLCAnYmFzZSddXG5cbnRhZ1R5cGUgICAgICAgICAgICAgPSAwICNpZiBmb3VuZCB0YWcjaWQuY2xhc3NcbnRhZ0ZpbHRlciAgICAgICAgICAgPSAvXltcXCBcXHRdKlxcdytcXCAqKFsuI11bXFx3LV9dK1xcICopKiQvaVxuXG50YWdBdHRyaWJ1dGVUeXBlICAgICA9IDEgI2lmIGZvdW5kIGF0dHJpYnV0ZSA9IFwidmFsdWVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICMgbmVlZCB0byByZXBsYWNlIGRvdWJsZSBxdW90ZSBhbmQgYW1wZXJzYW5kIGFmdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIyB0byAmIzM0OyBhbmQgJiMzOFxudGFnQXR0cmlidXRlRmlsdGVyICAgPSAvXltcXHRcXCBdKltcXHctX0AkJiNdK1tcXHRcXCBdKj1bXFwgXFx0XSpbXlxcbl0qJC9cblxuc3R5bGVDbGFzc1R5cGUgICAgICA9IDIgIyBpZiBmb3VuZCBzdHlsZSBzZWxlY3RvciBcbnN0eWxlQ2xhc3NGaWx0ZXIgICAgPSAvXltcXHRcXCBdKnN0eWxlW1xcdFxcIF0qKD88c2VsZWN0b3I+W15cXG5dKykkL2lcblxuc3R5bGVBdHRyaWJ1dGVUeXBlICAgPSAzICNpZiBmb3VuZCBhdHRyaWJ1dGU6IHNvbWV0aGluZ1xuc3R5bGVBdHRyaWJ1dGVGaWx0ZXIgPSAvXlxccypbXlwiJyBdKyAqOiAqLiovaVxuXG5zdHJpbmdUeXBlICAgICAgICAgID0gNCAjaWYgZm91bmQgXCJzdHJpbmdcIlxuc3RyaW5nRmlsdGVyICAgICAgICA9IC9eW1xcdFxcIF0qXCIuKlwiL2lcblxuc2NyaXB0VGFnRmlsdGVyICAgICA9IC9eXFxzKihzY3JpcHR8Y29mZmVlc2NyaXB0fGphdmFzY3JpcHR8Y29mZmVlKS9pXG5jb2ZmZWVzY3JpcHRUYWdGaWx0ZXIgPSAvXlxccyooY29mZmVlc2NyaXB0fGNvZmZlZSkvaVxuc2NyaXB0VHlwZSAgICAgICAgICA9IDUgI2lmIGl0IGlzIHVuZGVyIHRoZSBzY3JpcHQgdGFnXG5zY3JpcHRUYWdUeXBlICAgICAgID0gOVxuXG5oZWFkVGFnVHlwZSAgICAgICAgID0gN1xuaGVhZFRhZ0ZpbHRlciAgICAgICA9IC9eXFxzKihtZXRhfHRpdGxlfGxpbmt8YmFzZSkvaVxuXG5tb2R1bGVUeXBlICAgICAgICAgID0gOFxubW9kdWxlRmlsdGVyICAgICAgICA9IC9eXFxzKmluY2x1ZGVcXHMqXCIuKy5jaHJpc1wiL2lcblxuaWdub3JhYmxlVHlwZSAgICAgICA9IC0yXG5lbXB0eUZpbHRlciAgICAgICAgID0gL15bXFxXXFxzX10qJC9cbmNvbW1lbnRGaWx0ZXIgICAgICAgPSAvXlxccyojL2lcblxuXG5cblxuXG5cblxuXG5leHBvcnRzLmNocmlzdGluaXplID0gIChzb3VyY2VUZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRlbnQgOiA0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlc0RpcmVjdG9yeSA6ICcuLydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pIC0+XG4gICAgY2hyaXNGaWxlID1cbiAgICAgICAgc291cmNlIDogW11cbiAgICAgICAgaW5Qcm9ncmVzc0xpbmVzIDogXG4gICAgICAgICAgICBzb3VyY2UgOiAnaHRtbCdcbiAgICAgICAgICAgIHR5cGUgOiB0YWdUeXBlXG4gICAgICAgICAgICBsZXZlbCA6IC0xXG4gICAgICAgICAgICBhdHRyaWJ1dGVzIDogW11cbiAgICAgICAgICAgIHN0eWxlcyA6IFtdXG4gICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICBpbmRlbnQgOiBvcHRpb25zLmluZGVudFxuXG4gICAgICAgIGZpbmFsIDogJydcbiAgICBcblxuICAgIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMucGFyZW50ID0gY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgY2hyaXNGaWxlLnNvdXJjZSA9IGNsZWFudXBMaW5lcyBzb3VyY2VUZXh0LnNwbGl0ICdcXG4nXG5cbiAgICBjaHJpc0ZpbGUuc291cmNlID0gcHJvY2Vzc01vZHVsZXMgY2hyaXNGaWxlLnNvdXJjZSwgb3B0aW9ucy5tb2R1bGVzRGlyZWN0b3J5XG4gICAgcHJvY2Vzc0hpZXJhcmNoeSBjaHJpc0ZpbGVcbiAgICBwcm9jZXNzVHlwZXMgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIHNvcnRCeVR5cGVzIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcbiAgICBzb3J0QnlCb2R5SGVhZCBjaHJpc0ZpbGVcbiAgICBmaW5hbGlzZVRhZyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICBcbiAgICBkb2N0eXBlID0gJzwhZG9jdHlwZSBodG1sPidcbiAgICBkb2N0eXBlICs9ICdcXG4nIGlmIG9wdGlvbnMuaW5kZW50XG5cbiAgICBjaHJpc0ZpbGUuZmluYWwgPSBkb2N0eXBlICsgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lcy5maW5hbFxuXG4gICAgY2hyaXNGaWxlLmZpbmFsXG5cblxuXG5cblxuXG5cbmNyZWF0ZU5ld0ZpbGUgPSAoc291cmNlVGV4dCxcbiAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50IDogNFxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVzRGlyZWN0b3J5IDogJy4vJ1xuICAgICAgICAgICAgICAgIH0pIC0+XG4gICAgXG4gICAgY29uc29sZS5sb2cgb3B0aW9uc1xuICAgIFxuICAgIGNocmlzRmlsZSA9XG4gICAgICAgIHNvdXJjZSA6IGNsZWFudXBMaW5lcyBzb3VyY2VUZXh0LnNwbGl0ICdcXG4nXG4gICAgICAgIGluUHJvZ3Jlc3NMaW5lcyA6IFxuICAgICAgICAgICAgc291cmNlIDogJ2h0bWwnXG4gICAgICAgICAgICB0eXBlIDogdGFnVHlwZVxuICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgYXR0cmlidXRlcyA6IFtdXG4gICAgICAgICAgICBzdHlsZXMgOiBbXVxuICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgaW5kZW50IDogb3B0aW9ucy5pbmRlbnRcbiAgICAgICAgXG4gICAgICAgIG9wdGlvbnMgOiBvcHRpb25zXG4gICAgICAgIGZpbmFsIDogJydcblxuXG5cblxubG9hZENocmlzTW9kdWxlID0gKG1vZHVsZUZpbGVQYXRoKSAtPlxuICAgIG1zbHMgPSBmcy5yZWFkRmlsZVN5bmMobW9kdWxlRmlsZVBhdGgsICd1dGY4JylcbiAgICBtc2xzID0gY2xlYW51cExpbmVzKG1zbHMuc3BsaXQgJ1xcbicpXG4gICAgbXNsc1xuXG5wcm9jZXNzTW9kdWxlcyA9IChscywgZikgLT5cbiAgICByZXN1bHRMcyA9IG5ldyBBcnJheVxuICAgIG1vZHVsZUxldmVsRmlsdGVyID0gL15cXHMqL1xuXG4gICAgZm9yIHggaW4gWzAuLi5scy5sZW5ndGhdXG4gICAgICAgIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxzW3hdXG4gICAgICAgICAgICBjaHJpc01vZHVsZVBhdGggPSBsc1t4XS5zcGxpdCgnXCInKVsxXVxuICAgICAgICAgICAgbW9kdWxlTGluZXMgPSBsb2FkQ2hyaXNNb2R1bGUgY2hyaXNNb2R1bGVQYXRoXG5cbiAgICAgICAgICAgIG1vZHVsZUxldmVsID0gbW9kdWxlTGV2ZWxGaWx0ZXIuZXhlYyhsc1t4XSlcbiAgICAgICAgICAgIGZvciBsIGluIFswLi4ubW9kdWxlTGluZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIG1vZHVsZUxpbmVzW2xdID0gbW9kdWxlTGV2ZWwgKyBtb2R1bGVMaW5lc1tsXSBcblxuICAgICAgICAgICAgbW9kdWxlTGluZXMgPSBwcm9jZXNzTW9kdWxlcyBtb2R1bGVMaW5lcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lIFwiI3tmfS8je2NocmlzTW9kdWxlUGF0aH1cIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXN1bHRMcyA9IHJlc3VsdExzLmNvbmNhdCBtb2R1bGVMaW5lc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXN1bHRMcy5wdXNoIGxzW3hdXG5cbiAgICByZXN1bHRMc1xuICAgICAgICAgICAgXG5cblxuc29ydEJ5Qm9keUhlYWQgPSAoZmlsZSkgLT5cbiAgICBoZWFkVGFnID1cbiAgICAgICAgc291cmNlIDogJ2hlYWQnXG4gICAgICAgIHR5cGUgOiB0YWdUeXBlXG4gICAgICAgIHBhcmVudDogZmlsZS5pblByb2dyZXNzTGluZXNcbiAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICBhdHRyaWJ1dGVzIDogW11cbiAgICAgICAgc3R5bGVzIDogW11cbiAgICAgICAgY2hpbGRyZW4gOiBbXVxuXG4gICAgXG4gICAgc3R5bGVUYWcgPVxuICAgICAgICBzb3VyY2UgOiAnc3R5bGUnXG4gICAgICAgIHR5cGUgOiBoZWFkVGFnVHlwZVxuICAgICAgICBwYXJlbnQ6IGhlYWRUYWdcbiAgICAgICAgbGV2ZWwgOiAwXG4gICAgICAgIGF0dHJpYnV0ZXMgOiBbXVxuICAgICAgICBzdHlsZXMgOiBbXVxuICAgICAgICBjaGlsZHJlbiA6IFtdXG5cbiAgICBoZWFkVGFnLmNoaWxkcmVuLnB1c2ggc3R5bGVUYWdcblxuXG4gICAgYm9keVRhZyA9XG4gICAgICAgIHNvdXJjZSA6ICdib2R5J1xuICAgICAgICB0eXBlIDogdGFnVHlwZVxuICAgICAgICBwYXJlbnQ6IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgYXR0cmlidXRlcyA6IFtdXG4gICAgICAgIHN0eWxlcyA6IFtdXG4gICAgICAgIGNoaWxkcmVuIDogW11cbiAgICBcblxuICAgIGZvciB0YWcgaW4gZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW5cbiAgICAgICAgYWRkZWRUb0hlYWQgPSBub1xuXG4gICAgICAgIGZvciBoZWFkVGFnVGVtcGxhdGUgaW4gaGVhZFRhZ3NcbiAgICAgICAgICAgIGlmIHRhZy5zb3VyY2UgPT0gaGVhZFRhZ1RlbXBsYXRlXG4gICAgICAgICAgICAgICAgYWRkZWRUb0hlYWQgPSB5ZXNcbiAgICAgICAgICAgICAgICB0YWcucGFyZW50ID0gaGVhZFRhZ1xuICAgICAgICAgICAgICAgIGhlYWRUYWcuY2hpbGRyZW4ucHVzaCB0YWdcblxuICAgICAgICBpZiBub3QgYWRkZWRUb0hlYWRcbiAgICAgICAgICAgIGlmIHRhZy50eXBlID09IHN0eWxlQ2xhc3NUeXBlXG4gICAgICAgICAgICAgICAgdGFnLnBhcmVudCA9IHN0eWxlVGFnXG4gICAgICAgICAgICAgICAgc3R5bGVUYWcuY2hpbGRyZW4ucHVzaCB0YWdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0YWcucGFyZW50ID0gYm9keVRhZ1xuICAgICAgICAgICAgICAgIGJvZHlUYWcuY2hpbGRyZW4ucHVzaCB0YWdcblxuICAgIGJvZHlUYWcuc3R5bGVzID0gZmlsZS5pblByb2dyZXNzTGluZXMuc3R5bGVzXG4gICAgYm9keVRhZy5hdHRyaWJ1dGVzID0gZmlsZS5pblByb2dyZXNzTGluZXMuYXR0cmlidXRlc1xuXG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuc3R5bGVzID0gbmV3IEFycmF5XG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuYXR0cmlidXRlcyA9IG5ldyBBcnJheVxuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuID0gbmV3IEFycmF5XG5cbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlbi5wdXNoIGhlYWRUYWdcbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlbi5wdXNoIGJvZHlUYWdcblxuICAgIGZvcm1hdExldmVscyBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGluZGVudExpbmVzIGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cblxuXG5pbmRlbnRMaW5lcyA9ICh0YWcpIC0+XG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuICAgICAgICBjaGlsZC5pbmRlbnRhdGlvbiA9IGNoaWxkLmxldmVsICogdGFnLmluZGVudFxuICAgICAgICBjaGlsZC5pbmRlbnQgPSB0YWcuaW5kZW50XG5cbiAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICAgIGluZGVudExpbmVzIGNoaWxkXG5cblxuXG5cbmNsZWFudXBMaW5lcyA9IChzb3VyY2VMaW5lcykgLT5cbiAgICBuZXdTb3VyY2VMaW5lcyA9IG5ldyBBcnJheVxuXG4gICAgZm9yIGxpbmUgaW4gc291cmNlTGluZXNcbiAgICAgICAgaWYgYW5hbGlzZVR5cGUobGluZSkgIT0gLTJcbiAgICAgICAgICAgIG5ld1NvdXJjZUxpbmVzLnB1c2ggbGluZVxuICAgIFxuICAgIG5ld1NvdXJjZUxpbmVzXG5cblxuYW5hbGlzZVR5cGUgPSAobGluZSkgLT5cbiAgICBsaW5lVHlwZSA9IC0xXG5cbiAgICBsaW5lVHlwZSA9IGlnbm9yYWJsZVR5cGUgaWYgY29tbWVudEZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IGlnbm9yYWJsZVR5cGUgaWYgZW1wdHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHlsZUF0dHJpYnV0ZVR5cGUgaWYgc3R5bGVBdHRyaWJ1dGVGaWx0ZXIudGVzdCBsaW5lXG4gICAgaWYgdGFnRmlsdGVyLnRlc3QgbGluZVxuICAgICAgICBsaW5lVHlwZSA9IHRhZ1R5cGUgXG4gICAgICAgIGlmIHNjcmlwdFRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICAgICAgICAgIGxpbmVUeXBlID0gc2NyaXB0VGFnVHlwZVxuXG4gICAgbGluZVR5cGUgPSBoZWFkVGFnVHlwZSBpZiBoZWFkVGFnRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3R5bGVDbGFzc1R5cGUgaWYgc3R5bGVDbGFzc0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHRhZ0F0dHJpYnV0ZVR5cGUgaWYgdGFnQXR0cmlidXRlRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3RyaW5nVHlwZSBpZiBzdHJpbmdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBtb2R1bGVUeXBlIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBcbiAgICBsaW5lVHlwZVxuXG5cblxuXG5jb3VudFNwYWNlcyA9IChsaW5lKSAtPlxuICAgIHNwYWNlcyA9IDBcbiAgICBpZiBsaW5lWzBdID09ICcgJ1xuICAgICAgICB3aGlsZSBsaW5lW3NwYWNlc10gPT0gJyAnXG4gICAgICAgICAgICBzcGFjZXMgKz0gMVxuICAgIFxuICAgIHNwYWNlc1xuXG5cblxuXG5cblxucHJvY2Vzc0hpZXJhcmNoeSA9IChmaWxlKSAtPlxuICAgIGN1cnJlbnRQYXJlbnQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGN1cnJlbnRDaGlsZCA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICBmb3IgbGluZSBpbiBbMC4uLmZpbGUuc291cmNlLmxlbmd0aF1cbiAgICAgICAgbGluZUxldmVsID0gY291bnRTcGFjZXMgZmlsZS5zb3VyY2VbbGluZV1cblxuICAgICAgICBpZiBsaW5lTGV2ZWwgPiBjdXJyZW50UGFyZW50LmxldmVsXG4gICAgICAgICAgICBpZiBsaW5lTGV2ZWwgPiBjdXJyZW50Q2hpbGQubGV2ZWxcbiAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Q2hpbGRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgbGluZUxldmVsIDw9IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cblxuXG5cblxuXG5cbnByb2Nlc3NUeXBlcyA9IChsaW5lKSAtPlxuICAgIGZvciBsaW5lIGluIGxpbmUuY2hpbGRyZW5cbiAgICAgICAgaWYgbGluZS5zb3VyY2VcbiAgICAgICAgICAgIGxpbmUudHlwZSA9IGFuYWxpc2VUeXBlIGxpbmUuc291cmNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxpbmUudHlwZSA9IC0yXG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHByb2Nlc3NUeXBlcyBsaW5lXG5cblxuXG5cblxuXG5zb3J0QnlUeXBlcyA9IChsaW5lcykgLT5cbiAgICAjIGV4dHJhY3QgdGhlIHN0eWxlcywgYXR0cmlidXRlcyBhbmQgc3RyaW5ncyB0byB0aGVpciBwYXJlbnRzXG5cbiAgICBmb3IgbGluZSBpbiBsaW5lcy5jaGlsZHJlblxuICAgICAgICBpZiBsaW5lLnR5cGUgPT0gc2NyaXB0VGFnVHlwZVxuICAgICAgICAgICAgdHlwZUFsbFNjcmlwdHMgbGluZVxuXG4gICAgbGFzdENoaWxkID0gbGluZXMuY2hpbGRyZW4ubGVuZ3RoIC0gMVxuXG4gICAgZm9yIGxpbmUgaW4gW2xhc3RDaGlsZC4uMF1cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0uY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgc29ydEJ5VHlwZXMgbGluZXMuY2hpbGRyZW5bbGluZV1cblxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHRhZ0F0dHJpYnV0ZVR5cGVcbiAgICAgICAgICAgIGlmICFsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuYXR0cmlidXRlc1xuICAgICAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5hdHRyaWJ1dGVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5hdHRyaWJ1dGVzLnB1c2ggbGluZXMuY2hpbGRyZW5bbGluZV0uc291cmNlXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlIGxpbmUgLCAxXG5cbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHN0eWxlQXR0cmlidXRlVHlwZVxuICAgICAgICAgICAgaWYgIWxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXNcbiAgICAgICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXMucHVzaCBsaW5lcy5jaGlsZHJlbltsaW5lXS5zb3VyY2VcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5jaGlsZHJlbi5zcGxpY2UgbGluZSAsIDFcblxuICAgICAgICAgICAgY29udGludWVcblxuXG5cblxuXG5cbnR5cGVBbGxTY3JpcHRzID0gKHNjcmlwdExpbmUpIC0+XG4gICAgaWYgc2NyaXB0TGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgIGZvciBjb2RlTGluZSBpbiBzY3JpcHRMaW5lLmNoaWxkcmVuXG4gICAgICAgICAgICBjb2RlTGluZS50eXBlID0gc2NyaXB0VHlwZVxuICAgICAgICAgICAgY29kZUxpbmUuZmluYWwgPSBjb2RlTGluZS5zb3VyY2VcbiAgICAgICAgICAgIHR5cGVBbGxTY3JpcHRzKGNvZGVMaW5lKSBpZiBjb2RlTGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG5cblxuXG5cblxuZmluYWxpc2VUYWcgPSAobGluZSkgLT5cbiAgICBhZGRTcGFjZXMgPSAnJ1xuICAgIGlmIGxpbmUuaW5kZW50ID4gMFxuICAgICAgICBhZGRTcGFjZXMgKz0gJyAnIGZvciBpIGluIFswLi4ubGluZS5pbmRlbnRdXG5cbiAgICBpZiBsaW5lLnR5cGUgaXMgc3R5bGVDbGFzc1R5cGVcbiAgICAgICAgZmluYWxpc2VTdHlsZSBsaW5lXG5cbiAgICBpZiBsaW5lLnR5cGUgaXMgdGFnVHlwZSBvciBcbiAgICAgICBsaW5lLnR5cGUgaXMgc2NyaXB0VGFnVHlwZSBvciBcbiAgICAgICBsaW5lLnR5cGUgaXMgaGVhZFRhZ1R5cGVcblxuICAgICAgICBjb2ZmZWVTY3JpcHQgPSBmYWxzZVxuICAgICAgICBmb3JtYXRUYWcgbGluZVxuXG4gICAgICAgIGlmIGxpbmUudHlwZSA9PSBzY3JpcHRUYWdUeXBlXG4gICAgICAgICAgICBpZiBjb2ZmZWVzY3JpcHRUYWdGaWx0ZXIudGVzdCBsaW5lLnNvdXJjZVxuICAgICAgICAgICAgICAgIGxpbmUuc291cmNlID0gJ3NjcmlwdCdcbiAgICAgICAgICAgICAgICBjb2ZmZWVTY3JpcHQgPSB0cnVlXG5cbiAgICAgICAgbGluZS5maW5hbCA9ICc8JyArIGxpbmUuc291cmNlXG5cbiAgICAgICAgaWYgbGluZS5zdHlsZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgbGluZVN0eWxlID0gJ3N0eWxlID0gJ1xuXG4gICAgICAgICAgICBmb3JtYXRUYWdTdHlsZXMgbGluZVxuXG4gICAgICAgICAgICBmb3Igc3R5bGUgaW4gbGluZS5zdHlsZXNcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGUgKz0gc3R5bGUgKyAnOydcblxuICAgICAgICAgICAgbGluZS5hdHRyaWJ1dGVzLnB1c2ggbGluZVN0eWxlXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyBsaW5lLmF0dHJpYnV0ZXNcbiAgICAgICAgZm9ybWF0QXR0cmlidXRlcyBsaW5lXG4gICAgICAgIFxuXG4gICAgICAgIGlmIGxpbmUuYXR0cmlidXRlcy5sZW5ndGggPiAwXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9ICcgJ1xuICAgICAgICAgICAgZm9yIGF0dHJpYnV0ZSBpbiBsaW5lLmF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICBsaW5lLmZpbmFsICs9IGF0dHJpYnV0ZSArICcgJ1xuICAgICAgICBcbiAgICAgICAgICAgIGxpbmUuZmluYWwgPSBsaW5lLmZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgIGxpbmUuZmluYWwgKz0gJz4nXG4gICAgICAgIGxpbmUuZmluYWwgKz0gJ1xcbicgaWYgbGluZS5pbmRlbnQgPiAwXG5cblxuICAgICAgICBpZiBsaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGZvcm1hdFN0cmluZ3MgbGluZVxuXG4gICAgICAgICAgICBpZiBsaW5lLnR5cGUgPT0gc2NyaXB0VGFnVHlwZVxuICAgICAgICAgICAgICAgIGxpbmUuaW5kZW50ID0gNFxuXG4gICAgICAgICAgICBmb3JtYXRTY3JpcHRzIGxpbmVcblxuICAgICAgICAgICAgZm9yIGNoaWxkIGluIGxpbmUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmaW5hbGlzZVRhZyBjaGlsZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lc09mQ2hpbGRyZW4gPSAnJ1xuXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIG5ld0ZpbmFsID0gJydcbiAgICAgICAgICAgICAgICBjaGlsZExpbmVzID0gY2hpbGQuZmluYWwuc3BsaXQgJ1xcbidcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgbCBpbiBjaGlsZExpbmVzXG4gICAgICAgICAgICAgICAgICAgIGlmIGwubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IGFkZFNwYWNlcyArIGxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZpbmFsICs9IGwgKyAnXFxuJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5ld0ZpbmFsICs9ICdcXG4nIGlmIGxpbmUuaW5kZW50ID4gMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5ld0ZpbmFsID0gbmV3RmluYWwuc2xpY2UgMCwgLTFcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCA9IG5ld0ZpbmFsXG4gICAgICAgICAgICAgICAgbGluZXNPZkNoaWxkcmVuICs9IG5ld0ZpbmFsXG5cbiAgICAgICAgICAgIGlmIGNvZmZlZVNjcmlwdFxuICAgICAgICAgICAgICAgIGxpbmVzT2ZDaGlsZHJlbiA9IGNvZmZlZS5jb21waWxlIGxpbmVzT2ZDaGlsZHJlblxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9IGxpbmVzT2ZDaGlsZHJlblxuICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgbGluZS5zZWxmQ2xvc2luZ1xuICAgICAgICAgICAgbGluZS5maW5hbCArPSAnPC8nICsgbGluZS5zb3VyY2UgKyAnPidcbiAgICAgICAgICAgICNsaW5lLmZpbmFsICs9ICdcXG4nIGlmIGxpbmUuaW5kZW50ID4gMFxuICAgIFxuXG5cblxuZmluYWxpc2VTdHlsZSA9IChzdHlsZVRhZykgLT5cbiAgICBhZGRTcGFjZXMgPSAnJ1xuICAgIGlmIHN0eWxlVGFnLmluZGVudCA+IDBcbiAgICAgICAgYWRkU3BhY2VzICs9ICcgJyBmb3IgaSBpbiBbMC4uLnN0eWxlVGFnLmluZGVudF1cblxuICAgIGZpbmFsVGFnID0gJydcblxuICAgIHRhZ0RldGFpbHMgPSBzdHlsZUNsYXNzRmlsdGVyLmV4ZWMgc3R5bGVUYWcuc291cmNlXG5cbiAgICBmaW5hbFRhZyArPSB0YWdEZXRhaWxzLmdyb3Vwcy5zZWxlY3Rvci5yZXBsYWNlIC9cXCAqJC8sICcgJ1xuICAgIGZpbmFsVGFnICs9ICd7J1xuICAgIFxuICAgIGZvcm1hdFRhZ1N0eWxlcyBzdHlsZVRhZ1xuXG4gICAgZm9yIHN0eWxlIGluIHN0eWxlVGFnLnN0eWxlc1xuICAgICAgICBpZiBzdHlsZVRhZy5pbmRlbnQgPiAwXG4gICAgICAgICAgICBmaW5hbFRhZyArPSAnXFxuJ1xuICAgICAgICAgICAgZmluYWxUYWcgKz0gYWRkU3BhY2VzXG5cbiAgICAgICAgZmluYWxUYWcgKz0gXCIje3N0eWxlfTtcIlxuICAgIFxuICAgIGlmIHN0eWxlVGFnLmluZGVudCA+IDBcbiAgICAgICAgZmluYWxUYWcgKz0gJ1xcbidcblxuICAgIGZpbmFsVGFnICs9ICd9J1xuICAgIHN0eWxlVGFnLmZpbmFsID0gZmluYWxUYWdcblxuXG5cblxuICAgIFxuZm9ybWF0VGFnID0gKHRhZykgLT5cbiAgICB0YWdEZXRhaWxzRmlsdGVyID0gL15bXFwgXFx0XSooPzx0YWc+XFx3KylcXCAqKD88YXR0cmlidXRlcz4oWy4jXVtcXHctX10rXFwgKikrKT8kL2dcbiAgICB0YWdJZEZpbHRlciA9IC8jKD88aWQ+XFx3KykvXG4gICAgdGFnQ2xhc3NGaWx0ZXIgPSAvXFwuKD88Y2xhc3M+W1xcdy1fXSspL2dcbiAgICBcbiAgICB0YWdEZXRhaWxzID0gdGFnRGV0YWlsc0ZpbHRlci5leGVjIHRhZy5zb3VyY2VcbiAgICB0YWcuc291cmNlID0gdGFnRGV0YWlscy5ncm91cHMudGFnXG5cbiAgICBcblxuICAgIHRhZ0NsYXNzRm91bmQgPSB0YWdDbGFzc0ZpbHRlci5leGVjIHRhZ0RldGFpbHMuZ3JvdXBzLmF0dHJpYnV0ZXNcbiAgICBpZiB0YWdDbGFzc0ZvdW5kP1xuICAgICAgICBhbGxDbGFzc2VzID0gXCJcIlxuICAgICAgICB3aGlsZSB0YWdDbGFzc0ZvdW5kP1xuICAgICAgICAgICAgYWxsQ2xhc3NlcyArPSB0YWdDbGFzc0ZvdW5kLmdyb3Vwcy5jbGFzcyArIFwiIFwiXG4gICAgICAgICAgICB0YWdDbGFzc0ZvdW5kID0gdGFnQ2xhc3NGaWx0ZXIuZXhlYyB0YWdEZXRhaWxzLmdyb3Vwcy5hdHRyaWJ1dGVzXG4gICAgXG4gICAgICAgIHRhZy5hdHRyaWJ1dGVzLnVuc2hpZnQgXCJjbGFzcz0je2FsbENsYXNzZXMuc2xpY2UgMCwgLTF9XCJcblxuXG5cbiAgICB0YWdJZEZvdW5kID0gdGFnSWRGaWx0ZXIuZXhlYyB0YWdEZXRhaWxzLmdyb3Vwcy5hdHRyaWJ1dGVzXG4gICAgaWYgdGFnSWRGb3VuZD9cbiAgICAgICAgdGFnLmF0dHJpYnV0ZXMudW5zaGlmdCBcImlkPSN7dGFnSWRGb3VuZC5ncm91cHMuaWR9XCJcblxuXG5cbiAgICB0YWcuc2VsZkNsb3NpbmcgPSBub1xuXG4gICAgZm9yIHNlbGZDbG9zaW5nVGFnIGluIHNlbGZDbG9zaW5nVGFnc1xuICAgICAgICBpZiB0YWcuc291cmNlIGlzIHNlbGZDbG9zaW5nVGFnXG4gICAgICAgICAgICB0YWcuc2VsZkNsb3NpbmcgPSB5ZXNcbiAgICBcbiAgICAjIyNcbiAgICB0YWdBcnJheSA9IHRhZy5zb3VyY2Uuc3BsaXQgL1xccysvXG4gICAgdGFnLnNvdXJjZSA9IHRhZ0FycmF5WzBdXG5cbiAgICB0YWcuc2VsZkNsb3NpbmcgPSBmYWxzZVxuICAgIGZvciBzZWxmQ2xvc2luZ1RhZyBpbiBzZWxmQ2xvc2luZ1RhZ3NcbiAgICAgICAgaWYgdGFnLnNvdXJjZSA9PSBzZWxmQ2xvc2luZ1RhZ1xuICAgICAgICAgICAgdGFnLnNlbGZDbG9zaW5nID0gdHJ1ZVxuXG4gICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcblxuICAgIGlmIHRhZ0FycmF5Lmxlbmd0aCA+IDBcbiAgICAgICAgaWYgdGFnQXJyYXlbMF0gIT0gJ2lzJ1xuICAgICAgICAgICAgdGFnLmF0dHJpYnV0ZXMucHVzaCAnaWQgXCInICsgdGFnQXJyYXlbMF0gKyAnXCInXG4gICAgICAgICAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuICAgICAgICBcbiAgICAgICAgaWYgdGFnQXJyYXlbMF0gPT0gJ2lzJ1xuICAgICAgICAgICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgPSAnY2xhc3MgXCInXG4gICAgICAgICAgICBmb3IgdGFnQ2xhc3MgaW4gdGFnQXJyYXlcbiAgICAgICAgICAgICAgICB0YWdDbGFzc2VzICs9IHRhZ0NsYXNzICsgJyAnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgPSB0YWdDbGFzc2VzLnNsaWNlIDAsIC0xXG4gICAgICAgICAgICB0YWdDbGFzc2VzICs9ICdcIidcblxuICAgICAgICAgICAgdGFnLmF0dHJpYnV0ZXMucHVzaCB0YWdDbGFzc2VzIyMjXG5cbiAgICB0YWcuZmluYWwgPSAnJ1xuICAgIHRhZ1xuXG5cbmZvcm1hdEF0dHJpYnV0ZXMgPSAodGFnKSAtPlxuICAgIGlmIHRhZy5hdHRyaWJ1dGVzLmxlbmd0aCA+IDBcbiAgICAgICAgbmV3YXR0cmlidXRlcyA9XG4gICAgICAgICAgICBmb3IgYXR0cmlidXRlIGluIHRhZy5hdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlRGV0YWlsc0ZpbHRlciA9IC9eW1xcdFxcIF0qKD88YXR0cmlidXRlPltcXHctX0AkJiNdKylbXFx0XFwgXSo9W1xcdFxcIF0qKD88dmFsdWU+W15cXG5dKikkL1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZURldGFpbHMgPSBhdHRyaWJ1dGVEZXRhaWxzRmlsdGVyLmV4ZWMgYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZURldGFpbHMuZ3JvdXBzLmF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlID0gYXR0cmlidXRlRGV0YWlscy5ncm91cHMudmFsdWVcblxuICAgICAgICAgICAgICAgIFwiI3thdHRyaWJ1dGVOYW1lfT1cXFwiI3thdHRyaWJ1dGVWYWx1ZX1cXFwiXCJcblxuICAgICAgICB0YWcuYXR0cmlidXRlcyA9IG5ld2F0dHJpYnV0ZXNcblxuXG5mb3JtYXRTdHJpbmdzID0gKHRhZykgLT5cbiAgICBmb3IgY2hpbGQgaW4gdGFnLmNoaWxkcmVuXG4gICAgICAgIGlmIGNoaWxkLnR5cGUgaXMgc3RyaW5nVHlwZVxuICAgICAgICAgICAgZnVsbFN0cmluZ1NlYXJjaCA9IC9cXFwiLipcXFwiL1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgPSBjaGlsZC5zb3VyY2UubWF0Y2goZnVsbFN0cmluZ1NlYXJjaClbMF1cbiAgICAgICAgICAgIGNsZWFuU3RyaW5nID0gY2xlYW5TdHJpbmcuc2xpY2UgMSwgLTFcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsID0gY2xlYW5TdHJpbmdcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nIGlmIGNoaWxkLmluZGVudCA+IDAgKyBcIlxcblwiXG5cblxuXG5cbmZvcm1hdFNjcmlwdHMgPSAodGFnKSAtPlxuICAgIGluZGVudExpbmVzIHRhZ1xuXG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuICAgICAgICBhZGRTcGFjZXMgPSAnJ1xuXG4gICAgICAgIGlmIGNoaWxkLmluZGVudCA+IDBcbiAgICAgICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLi5jaGlsZC5pbmRlbnRdXG4gICAgICAgIFxuICAgICAgICBpZiBjaGlsZC50eXBlID09IHNjcmlwdFR5cGVcblxuICAgICAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nXG4gICAgICAgICAgICAgICAgZm9ybWF0U2NyaXB0cyBjaGlsZFxuXG4gICAgICAgICAgICAgICAgZm9yIHNjcmlwdENoaWxkTGluZSBpbiBjaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDaGlsZFNsaWNlZCA9IHNjcmlwdENoaWxkTGluZS5maW5hbC5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDaGlsZFNsaWNlZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBuZXdTY3JpcHRDaGlsZEZpbmFsID0gJydcbiAgICAgICAgICAgICAgICAgICAgZm9yIGkgaW4gc2NyaXB0Q2hpbGRTbGljZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1NjcmlwdENoaWxkRmluYWwgKz0gYWRkU3BhY2VzICsgaSArICdcXG4nXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENoaWxkTGluZS5maW5hbCA9IG5ld1NjcmlwdENoaWxkRmluYWxcblxuICAgICAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCArPSBzY3JpcHRDaGlsZExpbmUuZmluYWxcbiAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCA9IGNoaWxkLmZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjaGlsZC5maW5hbCArPSAnXFxuJ1xuXG5cblxuXG5mb3JtYXRUYWdTdHlsZXMgPSAodGFnKSAtPlxuICAgIGZvciBzdHlsZSBpbiB0YWcuc3R5bGVzXG4gICAgICAgIGRpdmlkZXJQb3NpdGlvbiA9IHN0eWxlLmluZGV4T2YgJzonXG4gICAgICAgIGF0dHJpYnV0ZUFmdGVyID0gc3R5bGUuc2xpY2UgKGRpdmlkZXJQb3NpdGlvbiArIDEpXG4gICAgICAgIGNsZWFuU3R5bGVhdHRyaWJ1dGUgPSBzdHlsZS5zcGxpdCgnOicpWzBdICsgJzonXG4gICAgICAgIGFmdGVyQXJyYXkgPSBhdHRyaWJ1dGVBZnRlci5zcGxpdCAnICdcblxuICAgICAgICBmb3IgeCBpbiBbMC4uLmFmdGVyQXJyYXkubGVuZ3RoXVxuICAgICAgICAgICAgaWYgYWZ0ZXJBcnJheVt4XSAhPSAnJ1xuICAgICAgICAgICAgICAgIGNsZWFuU3R5bGVhdHRyaWJ1dGUgKz0gYWZ0ZXJBcnJheVt4XVxuICAgICAgICAgICAgICAgIGNsZWFuU3R5bGVhdHRyaWJ1dGUgKz0gJyAnIGlmIHggPCBhZnRlckFycmF5Lmxlbmd0aCAtIDFcblxuICAgICAgICBzdHlsZSA9IGNsZWFuU3R5bGVhdHRyaWJ1dGVcblxuXG5mb3JtYXRMZXZlbHMgPSAodGFnKSAtPlxuICAgIGZvciBjaGlsZCBpbiB0YWcuY2hpbGRyZW5cbiAgICAgICAgY2hpbGQubGV2ZWwgPSB0YWcubGV2ZWwgKyAxXG5cbiAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICAgIGZvcm1hdExldmVscyBjaGlsZFxuXG5cbmNsZWFuVXBGaWxlID0gKHNGaWxlKSAtPlxuICAgIGNhcnJpYWdlVGFiVGVzdCA9IC9bXFxyXFx0XS9nbWlcblxuICAgIHJGaWxlID0gc0ZpbGVcbiAgICB3aGlsZSBjYXJyaWFnZVRhYlRlc3QudGVzdChyRmlsZSlcbiAgICAgICAgckZpbGUgPSByRmlsZS5yZXBsYWNlKCdcXHInLCAnXFxuJykucmVwbGFjZSgnXFx0JywgJyAgICAnKVxuICAgIHJGaWxlXG5cblxuXG5leHBvcnRzLmNocmlzdGluaXplRmlsZSA9IChjaHJpc0ZpbGVQYXRoLFxuICAgICAgICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQgOiA0XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZXNEaXJlY3RvcnkgOiAnLi8nXG4gICAgICAgICAgICAgICAgfSkgLT5cblxuICAgIHNvdXJjZUZpbGUgPSBmcy5yZWFkRmlsZVN5bmMoY2hyaXNGaWxlUGF0aCwgJ3V0ZjgnKVxuICAgIHNvdXJjZUZpbGUgPSBjbGVhblVwRmlsZShzb3VyY2VGaWxlKSBcblxuICAgIGNocmlzUm9vdEZvbGRlciA9IFBhdGguZGlybmFtZSBjaHJpc0ZpbGVQYXRoXG4gICAgY2hyaXN0aW5pemVkRmlsZSA9IEBjaHJpc3Rpbml6ZShzb3VyY2VGaWxlLCBpbmRlbnQpXG5cbiAgICAjZnMud3JpdGVGaWxlKCcuLycgKyBjaHJpc0ZpbGVQYXRoICsgJy5odG1sJywgY2hyaXN0aW5pemVkRmlsZSlcbiAgICAjY2hyaXN0aW5pemVkRmlsZVxuXG5leHBvcnRzLmNocmlzdGluaXplQW5kU2F2ZSA9IChjaHJpc1NvdXJjZSxcbiAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50IDogNFxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVzRGlyZWN0b3J5IDogJy4vJ1xuICAgICAgICAgICAgICAgIH0pIC0+XG5cbiAgICBjaHJpc3Rpbml6ZWRGaWxlID0gQGNocmlzdGluaXplKGNocmlzU291cmNlLCBvcHRpb25zKVxuICAgIGZzLndyaXRlRmlsZSgnLi9jaHJpc1ByZXZpZXcuaHRtbCcsIGNocmlzdGluaXplZEZpbGUpXG5cblxuZXhwb3J0cy5idWlsZEZpbGUgPSAoY2hyaXNGaWxlUGF0aCxcbiAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50IDogNFxuICAgICAgICAgICAgICAgIH0pIC0+XG4gICAgXG4gICAgb3B0aW9ucy5tb2R1bGVzRGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lIGNocmlzRmlsZVBhdGhcbiAgICBzb3VyY2VGaWxlID0gZnMucmVhZEZpbGVTeW5jKGNocmlzRmlsZVBhdGgsICd1dGY4JylcbiAgICBzb3VyY2VGaWxlID0gY2xlYW5VcEZpbGUoc291cmNlRmlsZSlcblxuICAgIGNocmlzdGluaXplZEZpbGUgPSBAY2hyaXN0aW5pemUoc291cmNlRmlsZSwgb3B0aW9ucylcblxuICAgIGNocmlzRmlsZVBhdGggPSBjaHJpc0ZpbGVQYXRoLnJlcGxhY2UoL1xcLmNocmlzJC9pLCAnLmh0bWwnKVxuICAgIGZzLndyaXRlRmlsZVN5bmMoJy4vJyArIGNocmlzRmlsZVBhdGgsIGNocmlzdGluaXplZEZpbGUpXG4gICAgY2hyaXN0aW5pemVkRmlsZSJdfQ==
//# sourceURL=coffeescript