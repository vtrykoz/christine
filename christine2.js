(function() {
  var Path, analiseType, cleanUpFile, cleanupLines, coffee, coffeescriptTagFilter, commentFilter, countSpaces, createNewFile, emptyFilter, finaliseStyle, finaliseTag, formatAttributes, formatLevels, formatScripts, formatStrings, formatTag, formatTagStyles, fs, headTagFilter, headTagType, headTags, ignorableType, indentLines, loadChrisModule, moduleFilter, moduleType, processHierarchy, processModules, processTypes, scriptTagFilter, scriptTagType, scriptType, selfClosingTags, sortByBodyHead, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagAttributeFilter, tagAttributeType, tagFilter, tagType, typeAllScripts, variableFilter, variableType;

  fs = require('fs');

  Path = require('path');

  coffee = require('coffeescript');

  // LINE TYPES
  selfClosingTags = ['br', 'img', 'input', 'hr', 'meta', 'link'];

  headTags = ['meta', 'title', 'style', 'class', 'link', 'base'];

  tagType = 0; //if found tag#id.class

  tagFilter = /^[\ \t]*\w+\ *([.#][\w-_]+\ *)*$/i;

  tagAttributeType = 1; //if found attribut = "value"

  // need to replace double quote and ampersand after
  // to &#34; and &#38
  tagAttributeFilter = /^\s*[\w\-]+ *".*"/;

  styleClassType = 2; //if this is tag and the tag is style

  styleClassFilter = /^\s*(style|class)\s+[\w:_-]+/i;

  stylePropertyType = 3; //if found property: something

  stylePropertyFilter = /^\s*[^"' ]+ *: *.*/i;

  stringType = 4; //if found "string"

  stringFilter = /^\s*".*"/i;

  scriptTagFilter = /^\s*(script|coffeescript|javascript|coffee)/i;

  coffeescriptTagFilter = /^\s*(coffeescript|coffee)/i;

  scriptType = 5; //if it is under the script tag

  scriptTagType = 9;

  variableType = 6; // if found name = something

  variableFilter = /^\s*\w+\s*=\s*[\w\W]+/i;

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

  // processVariables
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
        moduleLines = loadChrisModule(`${f}/${chrisModulePath}`);
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
    var addedToHead, bodyTag, headTag, headTagTemplate, j, k, len, len1, ref, tag;
    headTag = {
      source: 'head',
      type: tagType,
      parent: file.inProgressLines,
      level: -1,
      attributes: [],
      styles: [],
      children: []
    };
    headTag.children.push({
      source: 'style',
      type: headTagType,
      parent: headTag,
      level: 0,
      attributes: [],
      styles: [],
      children: []
    });
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
    if (stylePropertyFilter.test(line)) {
      lineType = stylePropertyType;
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
    if (variableFilter.test(line)) {
      lineType = variableType;
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
      if (lines.children[line].type === stylePropertyType) {
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
    var addSpaces, child, childLines, coffeeScript, i, j, k, l, len, len1, len2, len3, len4, lineStyle, linesOfChildren, m, n, newFinal, o, p, property, ref, ref1, ref2, ref3, ref4, style;
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
        lineStyle = 'style "';
        formatTagStyles(line);
        ref1 = line.styles;
        for (k = 0, len = ref1.length; k < len; k++) {
          style = ref1[k];
          lineStyle += style + ';';
        }
        lineStyle += '"';
        line.attributes.push(lineStyle);
      }
      formatAttributes(line);
      if (line.attributes.length > 0) {
        line.final += ' ';
        ref2 = line.attributes;
        for (m = 0, len1 = ref2.length; m < len1; m++) {
          property = ref2[m];
          line.final += property + ' ';
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
    var addSpaces, finalTag, i, j, k, len, ref, ref1, style, tagArray;
    addSpaces = '';
    if (styleTag.indent > 0) {
      for (i = j = 0, ref = styleTag.indent; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        addSpaces += ' ';
      }
    }
    finalTag = '#';
    tagArray = styleTag.source.split(' ');
    if (tagArray[0] === 'class') {
      finalTag = '.';
    }
    if (tagArray[1] === 'tag') {
      finalTag = '';
      finalTag += tagArray[2];
    } else {
      finalTag += tagArray[1];
    }
    finalTag += '{';
    formatTagStyles(styleTag);
    ref1 = styleTag.styles;
    for (k = 0, len = ref1.length; k < len; k++) {
      style = ref1[k];
      if (styleTag.indent > 0) {
        finalTag += '\n';
        finalTag += addSpaces;
      }
      finalTag += style;
    }
    if (styleTag.indent > 0) {
      finalTag += '\n';
    }
    finalTag += '}';
    return styleTag.final = finalTag;
  };

  formatTag = function(tag) {
    var allClasses, tagClassFilter, tagClassFound, tagDetails, tagDetailsFilter, tagIdFilter, tagIdFound;
    tagDetailsFilter = /^[\ \t]*(?<tag>\w+)\ *(?<attributes>([.#][\w-_]+\ *)+)?$/g;
    tagIdFilter = /#(?<id>\w+)/;
    tagClassFilter = /\.(?<class>[\w-_]+)/g;
    tagDetails = tagDetailsFilter.exec(tag.source);
    tag.source = tagDetails.groups.tag;
    tagIdFound = tagIdFilter.exec(tagDetails.groups.attributes);
    if (tagIdFound != null) {
      tag.attributes.push(`id "${tagIdFound.groups.id}"`);
    }
    tagClassFound = tagClassFilter.exec(tagDetails.groups.attributes);
    if (tagClassFound != null) {
      allClasses = "";
      while (tagClassFound != null) {
        allClasses += tagClassFound.groups.class + " ";
        tagClassFound = tagClassFilter.exec(tagDetails.groups.attributes);
      }
      tag.attributes.push(`class "${allClasses.slice(0, allClasses.length - 1)}"`);
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
    var j, len, newProperty, newattributes, property, propertyDetails, propertyDetailsSearch, propertyName, propertyNameSearch, ref;
    if (tag.attributes.length > 0) {
      newattributes = new Array;
      ref = tag.attributes;
      for (j = 0, len = ref.length; j < len; j++) {
        property = ref[j];
        newProperty = '=';
        propertyNameSearch = /^[\w\-]+( *)?"/i;
        propertyName = property.match(propertyNameSearch)[0];
        propertyName = propertyName.split(" ")[0];
        propertyName = propertyName.split('"')[0];
        newProperty = propertyName + newProperty;
        propertyDetailsSearch = /\".*\"/;
        propertyDetails = property.match(propertyDetailsSearch)[0];
        newProperty += propertyDetails;
        newattributes.push(newProperty);
      }
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
    var afterArray, cleanStyleProperty, dividerPosition, j, k, len, propertyAfter, ref, ref1, results, style, x;
    ref = tag.styles;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      style = ref[j];
      dividerPosition = style.indexOf(':');
      propertyAfter = style.slice(dividerPosition + 1);
      cleanStyleProperty = style.split(':')[0] + ':';
      afterArray = propertyAfter.split(' ');
      for (x = k = 0, ref1 = afterArray.length; (0 <= ref1 ? k < ref1 : k > ref1); x = 0 <= ref1 ? ++k : --k) {
        if (afterArray[x] !== '') {
          cleanStyleProperty += afterArray[x];
          if (x < afterArray.length - 1) {
            cleanStyleProperty += ' ';
          }
        }
      }
      results.push(style = cleanStyleProperty);
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
      indent: 4,
      modulesDirectory: './'
    }) {
    var chrisRootFolder, christinizedFile, sourceFile;
    sourceFile = fs.readFileSync(chrisFilePath, 'utf8');
    sourceFile = cleanUpFile(sourceFile);
    chrisRootFolder = Path.dirname(chrisFilePath);
    christinizedFile = this.christinize(sourceFile, indent);
    fs.writeFile('./' + chrisFilePath + '.html', christinizedFile);
    return christinizedFile;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxNQUFBLEVBQUEscUJBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxnQkFBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsYUFBQSxFQUFBLFNBQUEsRUFBQSxlQUFBLEVBQUEsRUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsZUFBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxjQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxhQUFBLEVBQUEsVUFBQSxFQUFBLGVBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxjQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLGtCQUFBLEVBQUEsZ0JBQUEsRUFBQSxTQUFBLEVBQUEsT0FBQSxFQUFBLGNBQUEsRUFBQSxjQUFBLEVBQUE7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUFBLEdBQVMsT0FBQSxDQUFRLGNBQVIsRUFGVDs7O0VBUUEsZUFBQSxHQUFrQixDQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsT0FBZCxFQUF1QixJQUF2QixFQUE2QixNQUE3QixFQUFxQyxNQUFyQzs7RUFDbEIsUUFBQSxHQUFXLENBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsT0FBbEIsRUFBMkIsT0FBM0IsRUFBb0MsTUFBcEMsRUFBNEMsTUFBNUM7O0VBRVgsT0FBQSxHQUFzQixFQVh0Qjs7RUFZQSxTQUFBLEdBQXNCOztF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QUFDLENBQUEsV0FBRCxDQUFhLFVBQWIsRUFBeUIsTUFBekI7SUFHbkIsRUFBRSxDQUFDLFNBQUgsQ0FBYSxJQUFBLEdBQU8sYUFBUCxHQUF1QixPQUFwQyxFQUE2QyxnQkFBN0M7V0FDQTtFQWRnQjtBQXpxQnBCIiwic291cmNlc0NvbnRlbnQiOlsiZnMgPSByZXF1aXJlICdmcydcblBhdGggPSByZXF1aXJlICdwYXRoJ1xuY29mZmVlID0gcmVxdWlyZSAnY29mZmVlc2NyaXB0J1xuXG5cblxuIyBMSU5FIFRZUEVTXG5cbnNlbGZDbG9zaW5nVGFncyA9IFsnYnInLCAnaW1nJywgJ2lucHV0JywgJ2hyJywgJ21ldGEnLCAnbGluayddXG5oZWFkVGFncyA9IFsnbWV0YScsICd0aXRsZScsICdzdHlsZScsICdjbGFzcycsICdsaW5rJywgJ2Jhc2UnXVxuXG50YWdUeXBlICAgICAgICAgICAgID0gMCAjaWYgZm91bmQgdGFnI2lkLmNsYXNzXG50YWdGaWx0ZXIgICAgICAgICAgID0gL15bXFwgXFx0XSpcXHcrXFwgKihbLiNdW1xcdy1fXStcXCAqKSokL2lcblxudGFnQXR0cmlidXRlVHlwZSAgICAgPSAxICNpZiBmb3VuZCBhdHRyaWJ1dCA9IFwidmFsdWVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICMgbmVlZCB0byByZXBsYWNlIGRvdWJsZSBxdW90ZSBhbmQgYW1wZXJzYW5kIGFmdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIyB0byAmIzM0OyBhbmQgJiMzOFxudGFnQXR0cmlidXRlRmlsdGVyICAgPSAvXlxccypbXFx3XFwtXSsgKlwiLipcIi9cblxuc3R5bGVDbGFzc1R5cGUgICAgICA9IDIgI2lmIHRoaXMgaXMgdGFnIGFuZCB0aGUgdGFnIGlzIHN0eWxlXG5zdHlsZUNsYXNzRmlsdGVyICAgID0gL15cXHMqKHN0eWxlfGNsYXNzKVxccytbXFx3Ol8tXSsvaVxuXG5zdHlsZVByb3BlcnR5VHlwZSAgID0gMyAjaWYgZm91bmQgcHJvcGVydHk6IHNvbWV0aGluZ1xuc3R5bGVQcm9wZXJ0eUZpbHRlciA9IC9eXFxzKlteXCInIF0rICo6ICouKi9pXG5cbnN0cmluZ1R5cGUgICAgICAgICAgPSA0ICNpZiBmb3VuZCBcInN0cmluZ1wiXG5zdHJpbmdGaWx0ZXIgICAgICAgID0gL15cXHMqXCIuKlwiL2lcblxuc2NyaXB0VGFnRmlsdGVyICAgICA9IC9eXFxzKihzY3JpcHR8Y29mZmVlc2NyaXB0fGphdmFzY3JpcHR8Y29mZmVlKS9pXG5jb2ZmZWVzY3JpcHRUYWdGaWx0ZXIgPSAvXlxccyooY29mZmVlc2NyaXB0fGNvZmZlZSkvaVxuc2NyaXB0VHlwZSAgICAgICAgICA9IDUgI2lmIGl0IGlzIHVuZGVyIHRoZSBzY3JpcHQgdGFnXG5zY3JpcHRUYWdUeXBlICAgICAgID0gOVxuXG52YXJpYWJsZVR5cGUgICAgICAgID0gNiAjIGlmIGZvdW5kIG5hbWUgPSBzb21ldGhpbmdcbnZhcmlhYmxlRmlsdGVyICAgICAgPSAvXlxccypcXHcrXFxzKj1cXHMqW1xcd1xcV10rL2lcblxuaGVhZFRhZ1R5cGUgICAgICAgICA9IDdcbmhlYWRUYWdGaWx0ZXIgICAgICAgPSAvXlxccyoobWV0YXx0aXRsZXxsaW5rfGJhc2UpL2lcblxubW9kdWxlVHlwZSAgICAgICAgICA9IDhcbm1vZHVsZUZpbHRlciAgICAgICAgPSAvXlxccyppbmNsdWRlXFxzKlwiLisuY2hyaXNcIi9pXG5cbmlnbm9yYWJsZVR5cGUgICAgICAgPSAtMlxuZW1wdHlGaWx0ZXIgICAgICAgICA9IC9eW1xcV1xcc19dKiQvXG5jb21tZW50RmlsdGVyICAgICAgID0gL15cXHMqIy9pXG5cblxuXG5cblxuXG5cblxuZXhwb3J0cy5jaHJpc3Rpbml6ZSA9ICAoc291cmNlVGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZW50IDogNFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZXNEaXJlY3RvcnkgOiAnLi8nXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSAtPlxuICAgIGNocmlzRmlsZSA9XG4gICAgICAgIHNvdXJjZSA6IFtdXG4gICAgICAgIGluUHJvZ3Jlc3NMaW5lcyA6IFxuICAgICAgICAgICAgc291cmNlIDogJ2h0bWwnXG4gICAgICAgICAgICB0eXBlIDogdGFnVHlwZVxuICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgYXR0cmlidXRlcyA6IFtdXG4gICAgICAgICAgICBzdHlsZXMgOiBbXVxuICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgaW5kZW50IDogb3B0aW9ucy5pbmRlbnRcblxuICAgICAgICBmaW5hbCA6ICcnXG4gICAgXG5cbiAgICBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzLnBhcmVudCA9IGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgIGNocmlzRmlsZS5zb3VyY2UgPSBjbGVhbnVwTGluZXMgc291cmNlVGV4dC5zcGxpdCAnXFxuJ1xuXG4gICAgY2hyaXNGaWxlLnNvdXJjZSA9IHByb2Nlc3NNb2R1bGVzIGNocmlzRmlsZS5zb3VyY2UsIG9wdGlvbnMubW9kdWxlc0RpcmVjdG9yeVxuICAgIHByb2Nlc3NIaWVyYXJjaHkgY2hyaXNGaWxlXG4gICAgcHJvY2Vzc1R5cGVzIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcbiAgICBzb3J0QnlUeXBlcyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgc29ydEJ5Qm9keUhlYWQgY2hyaXNGaWxlXG4gICAgZmluYWxpc2VUYWcgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgXG4gICAgZG9jdHlwZSA9ICc8IWRvY3R5cGUgaHRtbD4nXG4gICAgZG9jdHlwZSArPSAnXFxuJyBpZiBvcHRpb25zLmluZGVudFxuXG4gICAgY2hyaXNGaWxlLmZpbmFsID0gZG9jdHlwZSArIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMuZmluYWxcblxuICAgIGNocmlzRmlsZS5maW5hbFxuXG5cblxuXG4jIHByb2Nlc3NWYXJpYWJsZXNcblxuXG5cbmNyZWF0ZU5ld0ZpbGUgPSAoc291cmNlVGV4dCxcbiAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50IDogNFxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVzRGlyZWN0b3J5IDogJy4vJ1xuICAgICAgICAgICAgICAgIH0pIC0+XG4gICAgXG4gICAgY29uc29sZS5sb2cgb3B0aW9uc1xuICAgIFxuICAgIGNocmlzRmlsZSA9XG4gICAgICAgIHNvdXJjZSA6IGNsZWFudXBMaW5lcyBzb3VyY2VUZXh0LnNwbGl0ICdcXG4nXG4gICAgICAgIGluUHJvZ3Jlc3NMaW5lcyA6IFxuICAgICAgICAgICAgc291cmNlIDogJ2h0bWwnXG4gICAgICAgICAgICB0eXBlIDogdGFnVHlwZVxuICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgYXR0cmlidXRlcyA6IFtdXG4gICAgICAgICAgICBzdHlsZXMgOiBbXVxuICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgaW5kZW50IDogb3B0aW9ucy5pbmRlbnRcbiAgICAgICAgXG4gICAgICAgIG9wdGlvbnMgOiBvcHRpb25zXG4gICAgICAgIGZpbmFsIDogJydcblxuXG5cblxubG9hZENocmlzTW9kdWxlID0gKG1vZHVsZUZpbGVQYXRoKSAtPlxuICAgIG1zbHMgPSBmcy5yZWFkRmlsZVN5bmMobW9kdWxlRmlsZVBhdGgsICd1dGY4JylcbiAgICBtc2xzID0gY2xlYW51cExpbmVzKG1zbHMuc3BsaXQgJ1xcbicpXG4gICAgbXNsc1xuXG5wcm9jZXNzTW9kdWxlcyA9IChscywgZikgLT5cbiAgICByZXN1bHRMcyA9IG5ldyBBcnJheVxuICAgIG1vZHVsZUxldmVsRmlsdGVyID0gL15cXHMqL1xuXG4gICAgZm9yIHggaW4gWzAuLi5scy5sZW5ndGhdXG4gICAgICAgIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxzW3hdXG4gICAgICAgICAgICBjaHJpc01vZHVsZVBhdGggPSBsc1t4XS5zcGxpdCgnXCInKVsxXVxuICAgICAgICAgICAgbW9kdWxlTGluZXMgPSBsb2FkQ2hyaXNNb2R1bGUgXCIje2Z9LyN7Y2hyaXNNb2R1bGVQYXRofVwiIFxuXG4gICAgICAgICAgICBtb2R1bGVMZXZlbCA9IG1vZHVsZUxldmVsRmlsdGVyLmV4ZWMobHNbeF0pXG4gICAgICAgICAgICBmb3IgbCBpbiBbMC4uLm1vZHVsZUxpbmVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBtb2R1bGVMaW5lc1tsXSA9IG1vZHVsZUxldmVsICsgbW9kdWxlTGluZXNbbF0gXG5cbiAgICAgICAgICAgIG1vZHVsZUxpbmVzID0gcHJvY2Vzc01vZHVsZXMgbW9kdWxlTGluZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSBcIiN7Zn0vI3tjaHJpc01vZHVsZVBhdGh9XCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmVzdWx0THMgPSByZXN1bHRMcy5jb25jYXQgbW9kdWxlTGluZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0THMucHVzaCBsc1t4XVxuXG4gICAgcmVzdWx0THNcbiAgICAgICAgICAgIFxuXG5cbnNvcnRCeUJvZHlIZWFkID0gKGZpbGUpIC0+XG4gICAgaGVhZFRhZyA9XG4gICAgICAgIHNvdXJjZSA6ICdoZWFkJ1xuICAgICAgICB0eXBlIDogdGFnVHlwZVxuICAgICAgICBwYXJlbnQ6IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgYXR0cmlidXRlcyA6IFtdXG4gICAgICAgIHN0eWxlcyA6IFtdXG4gICAgICAgIGNoaWxkcmVuIDogW11cbiAgICBcbiAgICBoZWFkVGFnLmNoaWxkcmVuLnB1c2hcbiAgICAgICAgc291cmNlIDogJ3N0eWxlJ1xuICAgICAgICB0eXBlIDogaGVhZFRhZ1R5cGVcbiAgICAgICAgcGFyZW50OiBoZWFkVGFnXG4gICAgICAgIGxldmVsIDogMFxuICAgICAgICBhdHRyaWJ1dGVzIDogW11cbiAgICAgICAgc3R5bGVzIDogW11cbiAgICAgICAgY2hpbGRyZW4gOiBbXVxuXG5cbiAgICBib2R5VGFnID1cbiAgICAgICAgc291cmNlIDogJ2JvZHknXG4gICAgICAgIHR5cGUgOiB0YWdUeXBlXG4gICAgICAgIHBhcmVudDogZmlsZS5pblByb2dyZXNzTGluZXNcbiAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICBhdHRyaWJ1dGVzIDogW11cbiAgICAgICAgc3R5bGVzIDogW11cbiAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgIFxuXG4gICAgZm9yIHRhZyBpbiBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlblxuICAgICAgICBhZGRlZFRvSGVhZCA9IG5vXG5cbiAgICAgICAgZm9yIGhlYWRUYWdUZW1wbGF0ZSBpbiBoZWFkVGFnc1xuICAgICAgICAgICAgaWYgdGFnLnNvdXJjZSA9PSBoZWFkVGFnVGVtcGxhdGVcbiAgICAgICAgICAgICAgICBhZGRlZFRvSGVhZCA9IHllc1xuICAgICAgICAgICAgICAgIHRhZy5wYXJlbnQgPSBoZWFkVGFnXG4gICAgICAgICAgICAgICAgaGVhZFRhZy5jaGlsZHJlbi5wdXNoIHRhZ1xuXG4gICAgICAgIGlmIG5vdCBhZGRlZFRvSGVhZFxuICAgICAgICAgICAgaWYgdGFnLnR5cGUgPT0gc3R5bGVDbGFzc1R5cGVcbiAgICAgICAgICAgICAgICB0YWcucGFyZW50ID0gc3R5bGVUYWdcbiAgICAgICAgICAgICAgICBzdHlsZVRhZy5jaGlsZHJlbi5wdXNoIHRhZ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRhZy5wYXJlbnQgPSBib2R5VGFnXG4gICAgICAgICAgICAgICAgYm9keVRhZy5jaGlsZHJlbi5wdXNoIHRhZ1xuXG4gICAgYm9keVRhZy5zdHlsZXMgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5zdHlsZXNcbiAgICBib2R5VGFnLmF0dHJpYnV0ZXMgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5hdHRyaWJ1dGVzXG5cbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5zdHlsZXMgPSBuZXcgQXJyYXlcbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5hdHRyaWJ1dGVzID0gbmV3IEFycmF5XG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW4gPSBuZXcgQXJyYXlcblxuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuLnB1c2ggaGVhZFRhZ1xuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuLnB1c2ggYm9keVRhZ1xuXG4gICAgZm9ybWF0TGV2ZWxzIGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgaW5kZW50TGluZXMgZmlsZS5pblByb2dyZXNzTGluZXNcblxuXG5cbmluZGVudExpbmVzID0gKHRhZykgLT5cbiAgICBmb3IgY2hpbGQgaW4gdGFnLmNoaWxkcmVuXG4gICAgICAgIGNoaWxkLmluZGVudGF0aW9uID0gY2hpbGQubGV2ZWwgKiB0YWcuaW5kZW50XG4gICAgICAgIGNoaWxkLmluZGVudCA9IHRhZy5pbmRlbnRcblxuICAgICAgICBpZiBjaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgaW5kZW50TGluZXMgY2hpbGRcblxuXG5cblxuY2xlYW51cExpbmVzID0gKHNvdXJjZUxpbmVzKSAtPlxuICAgIG5ld1NvdXJjZUxpbmVzID0gbmV3IEFycmF5XG5cbiAgICBmb3IgbGluZSBpbiBzb3VyY2VMaW5lc1xuICAgICAgICBpZiBhbmFsaXNlVHlwZShsaW5lKSAhPSAtMlxuICAgICAgICAgICAgbmV3U291cmNlTGluZXMucHVzaCBsaW5lXG4gICAgXG4gICAgbmV3U291cmNlTGluZXNcblxuXG5hbmFsaXNlVHlwZSA9IChsaW5lKSAtPlxuICAgIGxpbmVUeXBlID0gLTFcblxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBjb21tZW50RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBlbXB0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlUHJvcGVydHlUeXBlIGlmIHN0eWxlUHJvcGVydHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgaWYgdGFnRmlsdGVyLnRlc3QgbGluZVxuICAgICAgICBsaW5lVHlwZSA9IHRhZ1R5cGUgXG4gICAgICAgIGlmIHNjcmlwdFRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICAgICAgICAgIGxpbmVUeXBlID0gc2NyaXB0VGFnVHlwZVxuXG4gICAgbGluZVR5cGUgPSBoZWFkVGFnVHlwZSBpZiBoZWFkVGFnRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3R5bGVDbGFzc1R5cGUgaWYgc3R5bGVDbGFzc0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHRhZ0F0dHJpYnV0ZVR5cGUgaWYgdGFnQXR0cmlidXRlRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3RyaW5nVHlwZSBpZiBzdHJpbmdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB2YXJpYWJsZVR5cGUgaWYgdmFyaWFibGVGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBtb2R1bGVUeXBlIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBcbiAgICBsaW5lVHlwZVxuXG5cblxuXG5jb3VudFNwYWNlcyA9IChsaW5lKSAtPlxuICAgIHNwYWNlcyA9IDBcbiAgICBpZiBsaW5lWzBdID09ICcgJ1xuICAgICAgICB3aGlsZSBsaW5lW3NwYWNlc10gPT0gJyAnXG4gICAgICAgICAgICBzcGFjZXMgKz0gMVxuICAgIFxuICAgIHNwYWNlc1xuXG5cblxuXG5cblxucHJvY2Vzc0hpZXJhcmNoeSA9IChmaWxlKSAtPlxuICAgIGN1cnJlbnRQYXJlbnQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGN1cnJlbnRDaGlsZCA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICBmb3IgbGluZSBpbiBbMC4uLmZpbGUuc291cmNlLmxlbmd0aF1cbiAgICAgICAgbGluZUxldmVsID0gY291bnRTcGFjZXMgZmlsZS5zb3VyY2VbbGluZV1cblxuICAgICAgICBpZiBsaW5lTGV2ZWwgPiBjdXJyZW50UGFyZW50LmxldmVsXG4gICAgICAgICAgICBpZiBsaW5lTGV2ZWwgPiBjdXJyZW50Q2hpbGQubGV2ZWxcbiAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Q2hpbGRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgbGluZUxldmVsIDw9IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cblxuXG5cblxuXG5cbnByb2Nlc3NUeXBlcyA9IChsaW5lKSAtPlxuICAgIGZvciBsaW5lIGluIGxpbmUuY2hpbGRyZW5cbiAgICAgICAgaWYgbGluZS5zb3VyY2VcbiAgICAgICAgICAgIGxpbmUudHlwZSA9IGFuYWxpc2VUeXBlIGxpbmUuc291cmNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxpbmUudHlwZSA9IC0yXG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHByb2Nlc3NUeXBlcyBsaW5lXG5cblxuXG5cblxuXG5zb3J0QnlUeXBlcyA9IChsaW5lcykgLT5cbiAgICAjIGV4dHJhY3QgdGhlIHN0eWxlcywgYXR0cmlidXRlcyBhbmQgc3RyaW5ncyB0byB0aGVpciBwYXJlbnRzXG5cbiAgICBmb3IgbGluZSBpbiBsaW5lcy5jaGlsZHJlblxuICAgICAgICBpZiBsaW5lLnR5cGUgPT0gc2NyaXB0VGFnVHlwZVxuICAgICAgICAgICAgdHlwZUFsbFNjcmlwdHMgbGluZVxuXG4gICAgbGFzdENoaWxkID0gbGluZXMuY2hpbGRyZW4ubGVuZ3RoIC0gMVxuXG4gICAgZm9yIGxpbmUgaW4gW2xhc3RDaGlsZC4uMF1cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0uY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgc29ydEJ5VHlwZXMgbGluZXMuY2hpbGRyZW5bbGluZV1cblxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHRhZ0F0dHJpYnV0ZVR5cGVcbiAgICAgICAgICAgIGlmICFsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuYXR0cmlidXRlc1xuICAgICAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5hdHRyaWJ1dGVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5hdHRyaWJ1dGVzLnB1c2ggbGluZXMuY2hpbGRyZW5bbGluZV0uc291cmNlXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlIGxpbmUgLCAxXG5cbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHN0eWxlUHJvcGVydHlUeXBlXG4gICAgICAgICAgICBpZiAhbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlc1xuICAgICAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXMgPSBuZXcgQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlcy5wdXNoIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnNvdXJjZVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuXG5cblxuXG5cblxudHlwZUFsbFNjcmlwdHMgPSAoc2NyaXB0TGluZSkgLT5cbiAgICBpZiBzY3JpcHRMaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgZm9yIGNvZGVMaW5lIGluIHNjcmlwdExpbmUuY2hpbGRyZW5cbiAgICAgICAgICAgIGNvZGVMaW5lLnR5cGUgPSBzY3JpcHRUeXBlXG4gICAgICAgICAgICBjb2RlTGluZS5maW5hbCA9IGNvZGVMaW5lLnNvdXJjZVxuICAgICAgICAgICAgdHlwZUFsbFNjcmlwdHMoY29kZUxpbmUpIGlmIGNvZGVMaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcblxuXG5cblxuXG5maW5hbGlzZVRhZyA9IChsaW5lKSAtPlxuICAgIGFkZFNwYWNlcyA9ICcnXG4gICAgaWYgbGluZS5pbmRlbnQgPiAwXG4gICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLi5saW5lLmluZGVudF1cblxuICAgIGlmIGxpbmUudHlwZSA9PSBzdHlsZUNsYXNzVHlwZVxuICAgICAgICBmaW5hbGlzZVN0eWxlIGxpbmVcblxuICAgIGlmIGxpbmUudHlwZSBpcyB0YWdUeXBlIG9yIFxuICAgICAgIGxpbmUudHlwZSBpcyBzY3JpcHRUYWdUeXBlIG9yIFxuICAgICAgIGxpbmUudHlwZSBpcyBoZWFkVGFnVHlwZVxuXG4gICAgICAgIGNvZmZlZVNjcmlwdCA9IGZhbHNlXG4gICAgICAgIGZvcm1hdFRhZyBsaW5lXG5cbiAgICAgICAgaWYgbGluZS50eXBlID09IHNjcmlwdFRhZ1R5cGVcbiAgICAgICAgICAgIGlmIGNvZmZlZXNjcmlwdFRhZ0ZpbHRlci50ZXN0IGxpbmUuc291cmNlXG4gICAgICAgICAgICAgICAgbGluZS5zb3VyY2UgPSAnc2NyaXB0J1xuICAgICAgICAgICAgICAgIGNvZmZlZVNjcmlwdCA9IHRydWVcblxuICAgICAgICBsaW5lLmZpbmFsID0gJzwnICsgbGluZS5zb3VyY2VcblxuICAgICAgICBpZiBsaW5lLnN0eWxlcy5sZW5ndGggPiAwXG4gICAgICAgICAgICBsaW5lU3R5bGUgPSAnc3R5bGUgXCInXG5cbiAgICAgICAgICAgIGZvcm1hdFRhZ1N0eWxlcyBsaW5lXG5cbiAgICAgICAgICAgIGZvciBzdHlsZSBpbiBsaW5lLnN0eWxlc1xuICAgICAgICAgICAgICAgIGxpbmVTdHlsZSArPSBzdHlsZSArICc7J1xuXG4gICAgICAgICAgICBsaW5lU3R5bGUgKz0gJ1wiJ1xuICAgICAgICAgICAgbGluZS5hdHRyaWJ1dGVzLnB1c2ggbGluZVN0eWxlXG4gICAgICAgIFxuXG4gICAgICAgIGZvcm1hdEF0dHJpYnV0ZXMgbGluZVxuICAgICAgICBcblxuICAgICAgICBpZiBsaW5lLmF0dHJpYnV0ZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgbGluZS5maW5hbCArPSAnICdcbiAgICAgICAgICAgIGZvciBwcm9wZXJ0eSBpbiBsaW5lLmF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICBsaW5lLmZpbmFsICs9IHByb3BlcnR5ICsgJyAnXG4gICAgICAgIFxuICAgICAgICAgICAgbGluZS5maW5hbCA9IGxpbmUuZmluYWwuc2xpY2UgMCwgLTFcbiAgICAgICAgbGluZS5maW5hbCArPSAnPidcbiAgICAgICAgbGluZS5maW5hbCArPSAnXFxuJyBpZiBsaW5lLmluZGVudCA+IDBcblxuXG4gICAgICAgIGlmIGxpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgZm9ybWF0U3RyaW5ncyBsaW5lXG5cbiAgICAgICAgICAgIGlmIGxpbmUudHlwZSA9PSBzY3JpcHRUYWdUeXBlXG4gICAgICAgICAgICAgICAgbGluZS5pbmRlbnQgPSA0XG5cbiAgICAgICAgICAgIGZvcm1hdFNjcmlwdHMgbGluZVxuXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGZpbmFsaXNlVGFnIGNoaWxkXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzT2ZDaGlsZHJlbiA9ICcnXG5cbiAgICAgICAgICAgIGZvciBjaGlsZCBpbiBsaW5lLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgbmV3RmluYWwgPSAnJ1xuICAgICAgICAgICAgICAgIGNoaWxkTGluZXMgPSBjaGlsZC5maW5hbC5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciBsIGluIGNoaWxkTGluZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgbC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgICAgICBsID0gYWRkU3BhY2VzICsgbFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RmluYWwgKz0gbCArICdcXG4nXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbmV3RmluYWwgKz0gJ1xcbicgaWYgbGluZS5pbmRlbnQgPiAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbmV3RmluYWwgPSBuZXdGaW5hbC5zbGljZSAwLCAtMVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNoaWxkLmZpbmFsID0gbmV3RmluYWxcbiAgICAgICAgICAgICAgICBsaW5lc09mQ2hpbGRyZW4gKz0gbmV3RmluYWxcblxuICAgICAgICAgICAgaWYgY29mZmVlU2NyaXB0XG4gICAgICAgICAgICAgICAgbGluZXNPZkNoaWxkcmVuID0gY29mZmVlLmNvbXBpbGUgbGluZXNPZkNoaWxkcmVuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gbGluZXNPZkNoaWxkcmVuXG4gICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBsaW5lLnNlbGZDbG9zaW5nXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9ICc8LycgKyBsaW5lLnNvdXJjZSArICc+J1xuICAgICAgICAgICAgI2xpbmUuZmluYWwgKz0gJ1xcbicgaWYgbGluZS5pbmRlbnQgPiAwXG4gICAgXG5cblxuXG5maW5hbGlzZVN0eWxlID0gKHN0eWxlVGFnKSAtPlxuICAgIGFkZFNwYWNlcyA9ICcnXG4gICAgaWYgc3R5bGVUYWcuaW5kZW50ID4gMFxuICAgICAgICBhZGRTcGFjZXMgKz0gJyAnIGZvciBpIGluIFswLi4uc3R5bGVUYWcuaW5kZW50XVxuXG4gICAgZmluYWxUYWcgPSAnIydcblxuICAgIHRhZ0FycmF5ID0gc3R5bGVUYWcuc291cmNlLnNwbGl0ICcgJ1xuXG4gICAgZmluYWxUYWcgPSAnLicgaWYgdGFnQXJyYXlbMF0gPT0gJ2NsYXNzJ1xuXG4gICAgaWYgdGFnQXJyYXlbMV0gPT0gJ3RhZydcbiAgICAgICAgZmluYWxUYWcgPSAnJ1xuICAgICAgICBmaW5hbFRhZyArPSB0YWdBcnJheVsyXVxuICAgIGVsc2VcbiAgICAgICAgZmluYWxUYWcgKz0gdGFnQXJyYXlbMV1cblxuICAgIGZpbmFsVGFnICs9ICd7J1xuICAgIFxuICAgIGZvcm1hdFRhZ1N0eWxlcyBzdHlsZVRhZ1xuXG4gICAgZm9yIHN0eWxlIGluIHN0eWxlVGFnLnN0eWxlc1xuICAgICAgICBpZiBzdHlsZVRhZy5pbmRlbnQgPiAwXG4gICAgICAgICAgICBmaW5hbFRhZyArPSAnXFxuJ1xuICAgICAgICAgICAgZmluYWxUYWcgKz0gYWRkU3BhY2VzXG5cbiAgICAgICAgZmluYWxUYWcgKz0gc3R5bGVcbiAgICBcbiAgICBpZiBzdHlsZVRhZy5pbmRlbnQgPiAwXG4gICAgICAgIGZpbmFsVGFnICs9ICdcXG4nXG5cbiAgICBmaW5hbFRhZyArPSAnfSdcbiAgICBzdHlsZVRhZy5maW5hbCA9IGZpbmFsVGFnXG5cblxuXG5cbiAgICBcbmZvcm1hdFRhZyA9ICh0YWcpIC0+XG4gICAgdGFnRGV0YWlsc0ZpbHRlciA9IC9eW1xcIFxcdF0qKD88dGFnPlxcdyspXFwgKig/PGF0dHJpYnV0ZXM+KFsuI11bXFx3LV9dK1xcICopKyk/JC9nXG4gICAgdGFnSWRGaWx0ZXIgPSAvIyg/PGlkPlxcdyspL1xuICAgIHRhZ0NsYXNzRmlsdGVyID0gL1xcLig/PGNsYXNzPltcXHctX10rKS9nXG4gICAgXG4gICAgdGFnRGV0YWlscyA9IHRhZ0RldGFpbHNGaWx0ZXIuZXhlYyB0YWcuc291cmNlXG4gICAgdGFnLnNvdXJjZSA9IHRhZ0RldGFpbHMuZ3JvdXBzLnRhZ1xuXG4gICAgdGFnSWRGb3VuZCA9IHRhZ0lkRmlsdGVyLmV4ZWMgdGFnRGV0YWlscy5ncm91cHMuYXR0cmlidXRlc1xuICAgIGlmIHRhZ0lkRm91bmQ/XG4gICAgICAgIHRhZy5hdHRyaWJ1dGVzLnB1c2ggXCJpZCBcXFwiI3t0YWdJZEZvdW5kLmdyb3Vwcy5pZH1cXFwiXCJcblxuICAgIHRhZ0NsYXNzRm91bmQgPSB0YWdDbGFzc0ZpbHRlci5leGVjIHRhZ0RldGFpbHMuZ3JvdXBzLmF0dHJpYnV0ZXNcbiAgICBpZiB0YWdDbGFzc0ZvdW5kP1xuICAgICAgICBhbGxDbGFzc2VzID0gXCJcIlxuICAgICAgICB3aGlsZSB0YWdDbGFzc0ZvdW5kP1xuICAgICAgICAgICAgYWxsQ2xhc3NlcyArPSB0YWdDbGFzc0ZvdW5kLmdyb3Vwcy5jbGFzcyArIFwiIFwiXG4gICAgICAgICAgICB0YWdDbGFzc0ZvdW5kID0gdGFnQ2xhc3NGaWx0ZXIuZXhlYyB0YWdEZXRhaWxzLmdyb3Vwcy5hdHRyaWJ1dGVzXG4gICAgXG4gICAgICAgIHRhZy5hdHRyaWJ1dGVzLnB1c2ggXCJjbGFzcyBcXFwiI3thbGxDbGFzc2VzLnNsaWNlIDAsIGFsbENsYXNzZXMubGVuZ3RoIC0gMX1cXFwiXCJcblxuICAgICMjI1xuICAgIHRhZ0FycmF5ID0gdGFnLnNvdXJjZS5zcGxpdCAvXFxzKy9cbiAgICB0YWcuc291cmNlID0gdGFnQXJyYXlbMF1cblxuICAgIHRhZy5zZWxmQ2xvc2luZyA9IGZhbHNlXG4gICAgZm9yIHNlbGZDbG9zaW5nVGFnIGluIHNlbGZDbG9zaW5nVGFnc1xuICAgICAgICBpZiB0YWcuc291cmNlID09IHNlbGZDbG9zaW5nVGFnXG4gICAgICAgICAgICB0YWcuc2VsZkNsb3NpbmcgPSB0cnVlXG5cbiAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuXG4gICAgaWYgdGFnQXJyYXkubGVuZ3RoID4gMFxuICAgICAgICBpZiB0YWdBcnJheVswXSAhPSAnaXMnXG4gICAgICAgICAgICB0YWcuYXR0cmlidXRlcy5wdXNoICdpZCBcIicgKyB0YWdBcnJheVswXSArICdcIidcbiAgICAgICAgICAgIHRhZ0FycmF5LnNwbGljZSgwLDEpXG4gICAgICAgIFxuICAgICAgICBpZiB0YWdBcnJheVswXSA9PSAnaXMnXG4gICAgICAgICAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuICAgICAgICAgICAgdGFnQ2xhc3NlcyA9ICdjbGFzcyBcIidcbiAgICAgICAgICAgIGZvciB0YWdDbGFzcyBpbiB0YWdBcnJheVxuICAgICAgICAgICAgICAgIHRhZ0NsYXNzZXMgKz0gdGFnQ2xhc3MgKyAnICdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGFnQ2xhc3NlcyA9IHRhZ0NsYXNzZXMuc2xpY2UgMCwgLTFcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgKz0gJ1wiJ1xuXG4gICAgICAgICAgICB0YWcuYXR0cmlidXRlcy5wdXNoIHRhZ0NsYXNzZXMjIyNcblxuICAgIHRhZy5maW5hbCA9ICcnXG4gICAgdGFnXG5cblxuZm9ybWF0QXR0cmlidXRlcyA9ICh0YWcpIC0+XG4gICAgaWYgdGFnLmF0dHJpYnV0ZXMubGVuZ3RoID4gMFxuICAgICAgICBuZXdhdHRyaWJ1dGVzID0gbmV3IEFycmF5XG5cbiAgICAgICAgZm9yIHByb3BlcnR5IGluIHRhZy5hdHRyaWJ1dGVzXG4gICAgICAgICAgICBuZXdQcm9wZXJ0eSA9ICc9J1xuXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWVTZWFyY2ggPSAvXltcXHdcXC1dKyggKik/XCIvaVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHkubWF0Y2gocHJvcGVydHlOYW1lU2VhcmNoKVswXVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHlOYW1lLnNwbGl0KFwiIFwiKVswXVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHlOYW1lLnNwbGl0KCdcIicpWzBdXG5cbiAgICAgICAgICAgIG5ld1Byb3BlcnR5ID0gcHJvcGVydHlOYW1lICsgbmV3UHJvcGVydHlcblxuICAgICAgICAgICAgcHJvcGVydHlEZXRhaWxzU2VhcmNoID0gL1xcXCIuKlxcXCIvXG4gICAgICAgICAgICBwcm9wZXJ0eURldGFpbHMgPSBwcm9wZXJ0eS5tYXRjaChwcm9wZXJ0eURldGFpbHNTZWFyY2gpWzBdXG4gICAgICAgICAgICBuZXdQcm9wZXJ0eSArPSBwcm9wZXJ0eURldGFpbHNcblxuICAgICAgICAgICAgbmV3YXR0cmlidXRlcy5wdXNoIG5ld1Byb3BlcnR5XG5cbiAgICAgICAgdGFnLmF0dHJpYnV0ZXMgPSBuZXdhdHRyaWJ1dGVzXG5cblxuZm9ybWF0U3RyaW5ncyA9ICh0YWcpIC0+XG4gICAgXG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuXG4gICAgICAgIGlmIGNoaWxkLnR5cGUgPT0gc3RyaW5nVHlwZVxuICAgICAgICAgICAgZnVsbFN0cmluZ1NlYXJjaCA9IC9cXFwiLipcXFwiL1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgPSBjaGlsZC5zb3VyY2UubWF0Y2goZnVsbFN0cmluZ1NlYXJjaClbMF1cbiAgICAgICAgICAgIGNsZWFuU3RyaW5nID0gY2xlYW5TdHJpbmcuc2xpY2UgMSwgLTFcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsID0gY2xlYW5TdHJpbmdcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nIGlmIGNoaWxkLmluZGVudCA+IDAgKyBcIlxcblwiXG5cblxuXG5cbmZvcm1hdFNjcmlwdHMgPSAodGFnKSAtPlxuICAgIGluZGVudExpbmVzIHRhZ1xuXG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuICAgICAgICBhZGRTcGFjZXMgPSAnJ1xuXG4gICAgICAgIGlmIGNoaWxkLmluZGVudCA+IDBcbiAgICAgICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLi5jaGlsZC5pbmRlbnRdXG4gICAgICAgIFxuICAgICAgICBpZiBjaGlsZC50eXBlID09IHNjcmlwdFR5cGVcblxuICAgICAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nXG4gICAgICAgICAgICAgICAgZm9ybWF0U2NyaXB0cyBjaGlsZFxuXG4gICAgICAgICAgICAgICAgZm9yIHNjcmlwdENoaWxkTGluZSBpbiBjaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDaGlsZFNsaWNlZCA9IHNjcmlwdENoaWxkTGluZS5maW5hbC5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDaGlsZFNsaWNlZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBuZXdTY3JpcHRDaGlsZEZpbmFsID0gJydcbiAgICAgICAgICAgICAgICAgICAgZm9yIGkgaW4gc2NyaXB0Q2hpbGRTbGljZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1NjcmlwdENoaWxkRmluYWwgKz0gYWRkU3BhY2VzICsgaSArICdcXG4nXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENoaWxkTGluZS5maW5hbCA9IG5ld1NjcmlwdENoaWxkRmluYWxcblxuICAgICAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCArPSBzY3JpcHRDaGlsZExpbmUuZmluYWxcbiAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCA9IGNoaWxkLmZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjaGlsZC5maW5hbCArPSAnXFxuJ1xuXG5cblxuXG5mb3JtYXRUYWdTdHlsZXMgPSAodGFnKSAtPlxuICAgIGZvciBzdHlsZSBpbiB0YWcuc3R5bGVzXG4gICAgICAgIGRpdmlkZXJQb3NpdGlvbiA9IHN0eWxlLmluZGV4T2YgJzonXG4gICAgICAgIHByb3BlcnR5QWZ0ZXIgPSBzdHlsZS5zbGljZSAoZGl2aWRlclBvc2l0aW9uICsgMSlcbiAgICAgICAgY2xlYW5TdHlsZVByb3BlcnR5ID0gc3R5bGUuc3BsaXQoJzonKVswXSArICc6J1xuICAgICAgICBhZnRlckFycmF5ID0gcHJvcGVydHlBZnRlci5zcGxpdCAnICdcblxuICAgICAgICBmb3IgeCBpbiBbMC4uLmFmdGVyQXJyYXkubGVuZ3RoXVxuICAgICAgICAgICAgaWYgYWZ0ZXJBcnJheVt4XSAhPSAnJ1xuICAgICAgICAgICAgICAgIGNsZWFuU3R5bGVQcm9wZXJ0eSArPSBhZnRlckFycmF5W3hdXG4gICAgICAgICAgICAgICAgY2xlYW5TdHlsZVByb3BlcnR5ICs9ICcgJyBpZiB4IDwgYWZ0ZXJBcnJheS5sZW5ndGggLSAxXG5cbiAgICAgICAgc3R5bGUgPSBjbGVhblN0eWxlUHJvcGVydHlcblxuXG5mb3JtYXRMZXZlbHMgPSAodGFnKSAtPlxuICAgIGZvciBjaGlsZCBpbiB0YWcuY2hpbGRyZW5cbiAgICAgICAgY2hpbGQubGV2ZWwgPSB0YWcubGV2ZWwgKyAxXG5cbiAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICAgIGZvcm1hdExldmVscyBjaGlsZFxuXG5cbmNsZWFuVXBGaWxlID0gKHNGaWxlKSAtPlxuICAgIGNhcnJpYWdlVGFiVGVzdCA9IC9bXFxyXFx0XS9nbWlcblxuICAgIHJGaWxlID0gc0ZpbGVcbiAgICB3aGlsZSBjYXJyaWFnZVRhYlRlc3QudGVzdChyRmlsZSlcbiAgICAgICAgckZpbGUgPSByRmlsZS5yZXBsYWNlKCdcXHInLCAnXFxuJykucmVwbGFjZSgnXFx0JywgJyAgICAnKVxuICAgIHJGaWxlXG5cblxuXG5leHBvcnRzLmNocmlzdGluaXplRmlsZSA9IChjaHJpc0ZpbGVQYXRoLFxuICAgICAgICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQgOiA0XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZXNEaXJlY3RvcnkgOiAnLi8nXG4gICAgICAgICAgICAgICAgfSkgLT5cblxuICAgIHNvdXJjZUZpbGUgPSBmcy5yZWFkRmlsZVN5bmMoY2hyaXNGaWxlUGF0aCwgJ3V0ZjgnKVxuICAgIHNvdXJjZUZpbGUgPSBjbGVhblVwRmlsZShzb3VyY2VGaWxlKSBcblxuICAgIGNocmlzUm9vdEZvbGRlciA9IFBhdGguZGlybmFtZSBjaHJpc0ZpbGVQYXRoXG4gICAgY2hyaXN0aW5pemVkRmlsZSA9IEBjaHJpc3Rpbml6ZShzb3VyY2VGaWxlLCBpbmRlbnQpXG5cbiAgICAjZnMud3JpdGVGaWxlKCcuLycgKyBjaHJpc0ZpbGVQYXRoICsgJy5odG1sJywgY2hyaXN0aW5pemVkRmlsZSlcbiAgICAjY2hyaXN0aW5pemVkRmlsZVxuXG5leHBvcnRzLmNocmlzdGluaXplQW5kU2F2ZSA9IChjaHJpc1NvdXJjZSxcbiAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50IDogNFxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVzRGlyZWN0b3J5IDogJy4vJ1xuICAgICAgICAgICAgICAgIH0pIC0+XG5cbiAgICBjaHJpc3Rpbml6ZWRGaWxlID0gQGNocmlzdGluaXplKGNocmlzU291cmNlLCBvcHRpb25zKVxuICAgIGZzLndyaXRlRmlsZSgnLi9jaHJpc1ByZXZpZXcuaHRtbCcsIGNocmlzdGluaXplZEZpbGUpXG5cblxuZXhwb3J0cy5idWlsZEZpbGUgPSAoY2hyaXNGaWxlUGF0aCxcbiAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50IDogNFxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVzRGlyZWN0b3J5IDogJy4vJ1xuICAgICAgICAgICAgICAgIH0pIC0+XG4gICAgXG4gICAgc291cmNlRmlsZSA9IGZzLnJlYWRGaWxlU3luYyhjaHJpc0ZpbGVQYXRoLCAndXRmOCcpXG4gICAgc291cmNlRmlsZSA9IGNsZWFuVXBGaWxlKHNvdXJjZUZpbGUpXG5cbiAgICBjaHJpc1Jvb3RGb2xkZXIgPSBQYXRoLmRpcm5hbWUgY2hyaXNGaWxlUGF0aFxuICAgIGNocmlzdGluaXplZEZpbGUgPSBAY2hyaXN0aW5pemUoc291cmNlRmlsZSwgaW5kZW50KVxuXG5cbiAgICBmcy53cml0ZUZpbGUoJy4vJyArIGNocmlzRmlsZVBhdGggKyAnLmh0bWwnLCBjaHJpc3Rpbml6ZWRGaWxlKVxuICAgIGNocmlzdGluaXplZEZpbGUiXX0=
//# sourceURL=coffeescript