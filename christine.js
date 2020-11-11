(function() {
  var Path, analiseType, checkSelfClosing, chrisRootFolder, cleanUpFile, cleanUpLines, coffee, commentFilter, countSpaces, debugMode, emptyFilter, formatHtml, formatProperty, formatString, formatStyleProperty, formatTag, formatVariable, fs, getHierarchy, headTagFilter, headTagType, headTags, ignorableType, loadChrisModule, moduleFilter, moduleType, processHead, processModules, processStyleTag, processTag, processVariables, scriptType, selfClosingTags, shtml, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

  selfClosingTags = ['br', 'img', 'input', 'hr', 'meta', 'link'];

  headTags = ['meta', 'title', 'style', 'class', 'link'];

  formatHtml = false;

  debugMode = false;

  chrisRootFolder = '';

  fs = require('fs');

  Path = require('path');

  coffee = require('coffee-script');

  // LINE TYPES
  tagType = 0; //if no another type found and this is not a script

  tagFilter = /^\s*[\w\-]+ *(( +\w+)?( *)?( +is( +.*)?)?)?$/i;

  tagPropertyType = 1; //if found property "something"

  tagPropertyFilter = /^\s*[\w\-]+ *".*"/;

  styleClassType = 2; //if this is tag and the tag is style

  styleClassFilter = /^\s*(style|class)\s+[\w:_-]+/i;

  stylePropertyType = 3; //if found property: something

  stylePropertyFilter = /^\s*[^"' ]+ *: *.*/i;

  stringType = 4; //if found "string"

  stringFilter = /^\s*".*"/i;

  scriptType = 5; //if it is under the script tag

  variableType = 6; // if found name = something

  variableFilter = /^\s*\w+\s*=\s*[\w\W]+/i;

  headTagType = 7;

  headTagFilter = /^\s*(meta|title|link|base)/i;

  moduleType = 8;

  moduleFilter = /^\s*include\s*".+.chris"/i;

  ignorableType = -2;

  emptyFilter = /^[\W\s_]*$/;

  commentFilter = /^\s*#/i;

  countSpaces = function(l) {
    var x;
    x = 0;
    if (l[0] === " ") {
      while (l[x] === " ") {
        x += 1;
      }
    }
    return x;
  };

  analiseType = function(l) {
    var ln;
    ln = -1;
    if (commentFilter.test(l)) {
      ln = ignorableType;
    }
    if (emptyFilter.test(l)) {
      ln = ignorableType;
    }
    if (stylePropertyFilter.test(l)) {
      ln = stylePropertyType;
    }
    if (tagFilter.test(l)) {
      ln = tagType;
    }
    if (headTagFilter.test(l)) {
      ln = headTagType;
    }
    if (styleClassFilter.test(l)) {
      ln = styleClassType;
    }
    if (tagPropertyFilter.test(l)) {
      ln = tagPropertyType;
    }
    if (stringFilter.test(l)) {
      ln = stringType;
    }
    if (variableFilter.test(l)) {
      ln = variableType;
    }
    if (moduleFilter.test(l)) {
      ln = moduleType;
    }
    return ln;
  };

  getHierarchy = function(lines) {
    var currentLevel, currentRealLevel, j, lastLineOfLevel, lineLevels, lineParents, n, ref, x;
    lineLevels = [];
    lineParents = [];
    lastLineOfLevel = [-1];
    currentLevel = [0];
    currentRealLevel = 0;
    for (x = j = 0, ref = lines.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      n = countSpaces(lines[x]);
      //lines[x] = lines[x].slice(n)
      if (n > currentLevel[currentRealLevel]) {
        lastLineOfLevel.push(x - 1);
        currentLevel.push(n);
        currentRealLevel += 1;
      }
      while (n < currentLevel[currentRealLevel]) {
        if (n < currentLevel[currentRealLevel]) {
          currentLevel.pop();
          lastLineOfLevel.pop();
          currentRealLevel -= 1;
        }
      }
      lineLevels.push(currentRealLevel);
      lineParents[x] = lastLineOfLevel[lastLineOfLevel.length - 1];
    }
    return lineParents;
  };

  formatVariable = function(l) {
    var c, exportArray, varContent, varName, w;
    exportArray = [];
    varContent = '';
    varName = l.split('=')[0];
    w = 0;
    while (varName.split(' ')[w] === '') {
      w += 1;
    }
    varName = varName.split(' ')[w];
    c = l.split('=');
    c = c[1].split(' ');
    w = 0;
    while (w < c.length) {
      if (c[w] !== '') {
        if (varContent !== '') {
          varContent += ' ';
        }
        varContent += c[w];
      }
      w += 1;
    }
    exportArray[0] = varName;
    exportArray[1] = varContent;
    return exportArray;
  };

  processVariables = function(ls, tps) {
    var f, j, k, ref, ref1, varContents, varNames, x;
    varNames = [];
    varContents = [];
    for (x = j = 0, ref = ls.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (tps[x] === variableType) {
        varNames.push(formatVariable(ls[x])[0]);
        varContents.push(formatVariable(ls[x])[1]);
      }
      if (tps[x] === stylePropertyType) {
        for (f = k = 0, ref1 = varNames.length; (0 <= ref1 ? k < ref1 : k > ref1); f = 0 <= ref1 ? ++k : --k) {
          ls[x] = ls[x].replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]);
        }
      }
    }
    return ls;
  };

  // Module processing functions
  loadChrisModule = function(moduleFilePath) {
    var mls, msls;
    msls = fs.readFileSync(moduleFilePath, 'utf8');
    msls = cleanUpFile(msls);
    mls = msls.split('\n');
    return mls;
  };

  processModules = function(ls, f) {
    var chrisModulePath, j, k, l, moduleLevel, moduleLevelFilter, moduleLines, ref, ref1, resultLs, x;
    resultLs = [];
    moduleLevelFilter = /^\s*/;
    for (x = j = 0, ref = ls.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (moduleFilter.test(ls[x])) {
        chrisModulePath = ls[x].split('"')[1];
        moduleLines = loadChrisModule(f + '/' + chrisModulePath);
        moduleLevel = moduleLevelFilter.exec(ls[x]);
        for (l = k = 0, ref1 = moduleLines.length; (0 <= ref1 ? k < ref1 : k > ref1); l = 0 <= ref1 ? ++k : --k) {
          moduleLines[l] = moduleLevel + moduleLines[l];
        }
        moduleLines = processModules(moduleLines, Path.dirname(f + '/' + chrisModulePath));
        resultLs = resultLs.concat(moduleLines);
      } else {
        resultLs.push(ls[x]);
      }
    }
    return resultLs;
  };

  // MAIN CHRISTINE FUNCTION
  exports.christinize = function(st) {
    return shtml(st);
  };

  cleanUpLines = function(ls) {
    var j, newLs, ref, x;
    newLs = [];
    for (x = j = 0, ref = ls.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (analiseType(ls[x]) !== -2) {
        newLs.push(ls[x]);
      }
    }
    return newLs;
  };

  shtml = function(sourceText) {
    var j, k, lineNums, lineParents, lineTypes, lines, m, ref, ref1, ref2, resultLines, resultText, t, x;
    lines = [];
    resultLines = [];
    lineTypes = [];
    lineParents = [];
    lineNums = [];
    resultText = '';
    lines = sourceText.split('\n');
    lines = processModules(lines, chrisRootFolder);
    lines = cleanUpLines(lines, lineTypes);
// process types and filter lines
    for (x = j = 0, ref = lines.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      t = analiseType(lines[x]);
      lineTypes.push(t);
      resultLines.push(lines[x]);
    }
    resultLines = processVariables(resultLines, lineTypes);
    lineParents = getHierarchy(resultLines);
    for (x = k = 0, ref1 = resultLines.length; (0 <= ref1 ? k < ref1 : k > ref1); x = 0 <= ref1 ? ++k : --k) {
      lineNums.push(x);
    }
    if (debugMode) {
      for (x = m = 0, ref2 = resultLines.length; (0 <= ref2 ? m < ref2 : m > ref2); x = 0 <= ref2 ? ++m : --m) {
        resultText += `#${lineNums[x]} ${lineTypes[x]} ${resultLines[x]} - ${lineParents[x]}\n`;
      }
    }
    resultText += '<!doctype html>';
    resultText += '<html>';
    resultText += processHead(resultLines, lineParents, lineTypes, lineNums);
    resultText += processTag("body", -1, resultLines, lineParents, lineTypes, lineNums);
    resultText += '</html>';
    return resultText;
  };

  formatTag = function(l) {
    var cleanTag, collectClasses, finalTag, j, ref, sp, tagArray, tagClass, x;
    // get rid of indentation
    sp = countSpaces(l);
    l = l.slice(sp);
    tagArray = l.split(' ');
    cleanTag = [];
    for (x = j = 0, ref = tagArray.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (tagArray[x] !== "") {
        cleanTag.push(tagArray[x]);
      }
    }
    finalTag = '<' + cleanTag[0];
    if (cleanTag.length > 1) {
      if (cleanTag[1] !== 'is') {
        finalTag += ' id="' + cleanTag[1] + '"';
      }
      x = 0;
      tagClass = "";
      collectClasses = false;
      while (x < cleanTag.length) {
        if (collectClasses) {
          tagClass += cleanTag[x];
          if (x < cleanTag.length - 1) {
            tagClass += ' ';
          }
        } else {
          if (cleanTag[x] === 'is') {
            if (x < cleanTag.length - 1) {
              collectClasses = true;
            }
          }
        }
        x += 1;
      }
      if (tagClass.length > 0) {
        finalTag += ' class="' + tagClass + '"';
      }
    }
    return finalTag;
  };

  formatProperty = function(l) {
    var cleanProperty, propertyNameSearch, sp, t;
    // get rid of indentation
    sp = countSpaces(l);
    l = l.slice(sp);
    cleanProperty = '="';
    propertyNameSearch = /^[\w\-]+( *)?"/i;
    t = l.match(propertyNameSearch)[0];
    t = t.split(" ")[0];
    t = t.split('"')[0];
    cleanProperty = t + cleanProperty;
    t = l.split('"')[1];
    cleanProperty += t + '"';
    return cleanProperty;
  };

  formatStyleProperty = function(l) {
    var afterArray, cleanStyleProperty, dividerPosition, j, propertyAfter, ref, sp, x;
    // get rid of indentation
    sp = countSpaces(l);
    l = l.slice(sp);
    dividerPosition = l.indexOf(':');
    propertyAfter = l.slice(dividerPosition + 1);
    cleanStyleProperty = l.split(':')[0] + ':';
    afterArray = propertyAfter.split(' ');
    for (x = j = 0, ref = afterArray.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (afterArray[x] !== '') {
        cleanStyleProperty += afterArray[x];
        if (x < afterArray.length - 1) {
          cleanStyleProperty += ' ';
        }
      }
    }
    return cleanStyleProperty;
  };

  formatString = function(l) {
    var cleanString;
    cleanString = l.split('"')[1];
    return cleanString;
  };

  checkSelfClosing = function(t) {
    var i, j, ref, selfClosing;
    selfClosing = true;
    for (i = j = 0, ref = selfClosingTags.length; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
      if (t === selfClosingTags[i]) {
        selfClosing = false;
      }
    }
    return selfClosing;
  };

  // the main recursive machines!
  processHead = function(lines = [], links, types, lineNums) {
    var childStyleNums, childTagNums, finalHead, j, p, ref, styleChildLines, styleChildTypes, tagChildLineNums, tagChildLines, tagChildLinks, tagChildTypes, tn, x;
    finalHead = '<head>';
    // collect children
    childStyleNums = [];
    childTagNums = [];
    if (lines.length > 0) {
      for (x = j = 0, ref = lines.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
        if (links[x] === -1) {
          if (types[x] === styleClassType) {
            childStyleNums.push(x);
          }
          if (types[x] === headTagType) {
            childTagNums.push(x);
          }
        }
      }
    }
    // process head styles
    if (childStyleNums.length > 0) {
      finalHead += '<style>';
      x = 0;
      while (x < childStyleNums.length) {
        if (formatHtml) {
          finalHead += '\n';
        }
        styleChildLines = [];
        styleChildTypes = [];
        p = childStyleNums[x] + 1;
        while (links[p] >= childStyleNums[x]) {
          if (p < lines.length) {
            styleChildLines.push(lines[p]);
            styleChildTypes.push(types[p]);
            p += 1;
          } else {
            break;
          }
        }
        finalHead += processStyleTag(lines[childStyleNums[x]], styleChildLines, styleChildTypes);
        x += 1;
      }
      finalHead += '</style>';
    }
    // process head tags
    if (childTagNums.length > 0) {
      x = 0;
      while (x < childTagNums.length) {
        if (formatHtml) {
          finalHead += '\n';
        }
        tagChildLines = [];
        tagChildLinks = [];
        tagChildTypes = [];
        tagChildLineNums = [];
        p = childTagNums[x] + 1;
        while (links[p] >= childTagNums[x]) {
          if (p < lines.length) {
            tagChildLines.push(lines[p]);
            tagChildLinks.push(links[p]);
            tagChildTypes.push(types[p]);
            tagChildLineNums.push(lineNums[p]);
            p += 1;
          } else {
            break;
          }
        }
        tn = childTagNums[x];
        finalHead += processTag(lines[tn], lineNums[tn], tagChildLines, tagChildLinks, tagChildTypes, tagChildLineNums);
        x += 1;
      }
    }
    finalHead += '</head>';
    return finalHead;
  };

  processStyleTag = function(tagLine, childLines = [], childTypes) {
    var finalTag, j, ref, x;
    finalTag = '#';
    if (tagLine.split(' ')[0] === 'class') {
      finalTag = '.';
    }
    if (tagLine.split(' ')[1] === 'tag') { //if styling tag, not the id or class
      finalTag = '';
      finalTag += tagLine.split(' ')[2] + '{';
    } else {
      finalTag += tagLine.split(' ')[1] + '{';
    }
    for (x = j = 0, ref = childLines.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (childTypes[x] === stylePropertyType) {
        finalTag += formatStyleProperty(childLines[x]) + ';';
      }
    }
    finalTag += '}';
    return finalTag;
  };

  processTag = function(tagLine, selfLink, childLines = [], childLinks, childTypes, lineNums) {
    var childStrings, childs, closable, finalTag, j, k, l, m, o, p, ref, ref1, ref2, ref3, scriptBefore, sp, styleChildLines, styleChildTypes, tagChildLineNums, tagChildLines, tagChildLinks, tagChildTypes, tagName, tagProperties, tagStyles, tl, variables, x;
    // get rid of indentation
    sp = countSpaces(tagLine);
    tagLine = tagLine.slice(sp);
    tagName = tagLine.split(' ')[0];
    finalTag = formatTag(tagLine);
    closable = checkSelfClosing(tagLine.split(' ')[0]);
    // collect all the children
    tagProperties = [];
    tagStyles = [];
    childs = [];
    childStrings = [];
    variables = [];
    if (childLines.length > 0) {
      for (x = j = 0, ref = childLines.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
        if (childLinks[x] === selfLink) {
          if (childTypes[x] === tagPropertyType) {
            tagProperties.push(childLines[x]);
          }
          if (childTypes[x] === stylePropertyType) {
            tagStyles.push(childLines[x]);
          }
          if (childTypes[x] === tagType) {
            childs.push(x);
          }
          if (childTypes[x] === stringType) {
            childs.push(x);
          }
          if (childTypes[x] === styleClassType) {
            childs.push(x);
          }
          if (childTypes[x] === variableType) {
            childs.push(x);
          }
        }
      }
    }
    // add tag properties
    if (tagProperties.length > 0) {
      for (x = k = 0, ref1 = tagProperties.length; (0 <= ref1 ? k < ref1 : k > ref1); x = 0 <= ref1 ? ++k : --k) {
        tagProperties[x] = formatProperty(tagProperties[x]);
        finalTag += ' ' + tagProperties[x];
      }
    }
    // add tag style
    if (tagStyles.length > 0) {
      finalTag += ' style="';
      for (x = m = 0, ref2 = tagStyles.length; (0 <= ref2 ? m < ref2 : m > ref2); x = 0 <= ref2 ? ++m : --m) {
        finalTag += formatStyleProperty(tagStyles[x]) + ';';
      }
      finalTag += '"';
    }
    finalTag += '>';
    //... process child tags, strings, styleTags
    x = 0;
    if (tagName !== 'coffeescript') {
      while (x < childs.length) {
        tl = childs[x];
        if (childTypes[tl] === stringType) {
          finalTag += formatString(childLines[tl]);
        }
        if (childTypes[tl] === styleClassType) {
          if (childLinks[tl] !== -1) {
            if (formatHtml) {
              finalTag += '\n';
            }
            styleChildLines = [];
            styleChildTypes = [];
            p = tl + 1;
            while (childLinks[p] >= tl) {
              if (p < childLines.length) {
                styleChildLines.push(childLines[p]);
                styleChildTypes.push(childTypes[p]);
                p += 1;
              } else {
                break;
              }
            }
            finalTag += processStyleTag(childLines[tl], styleChildLines, styleChildTypes);
          }
        }
        if (childTypes[tl] === tagType) {
          if (formatHtml) {
            finalTag += '\n';
          }
          tagChildLines = [];
          tagChildLinks = [];
          tagChildTypes = [];
          tagChildLineNums = [];
          p = tl + 1;
          while (childLinks[p] >= tl) {
            if (p < childLines.length) {
              tagChildLines.push(childLines[p]);
              tagChildLinks.push(childLinks[p]);
              tagChildTypes.push(childTypes[p]);
              tagChildLineNums.push(lineNums[p]);
              p += 1;
            } else {
              break;
            }
          }
          finalTag += processTag(childLines[tl], lineNums[tl], tagChildLines, tagChildLinks, tagChildTypes, tagChildLineNums);
        }
        x += 1;
      }
    } else {
      scriptBefore = '';
      for (l = o = 0, ref3 = childLines.length; (0 <= ref3 ? o < ref3 : o > ref3); l = 0 <= ref3 ? ++o : --o) {
        scriptBefore += childLines[l] + '\n';
      }
      finalTag = '<script>';
      tagName = 'script';
      finalTag += coffee.compile(scriptBefore);
    }
    // close tag and return final string
    if (closable) {
      finalTag += '</' + tagName + '>';
    }
    if (formatHtml) {
      finalTag += '\n';
    }
    return finalTag;
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

  exports.christinizeFile = function(chrisFilePath) {
    var christinizedFile, sourceFile;
    sourceFile = fs.readFileSync(chrisFilePath, 'utf8');
    sourceFile = cleanUpFile(sourceFile);
    chrisRootFolder = Path.dirname(chrisFilePath);
    christinizedFile = shtml(sourceFile);
    fs.writeFile(chrisFilePath + '.html', christinizedFile, function() {
      return console.log('ok');
    });
    return christinizedFile;
  };

  exports.christinizeAndSave = function(chrisSource) {
    var christinizedFile;
    christinizedFile = shtml(chrisSource);
    return fs.writeFile('./chrisPreview.html', christinizedFile);
  };

  exports.christinizeFileWithoutSaving = function(chrisFilePath) {
    var sourceFile;
    sourceFile = fs.readFileSync(chrisFilePath, 'utf8');
    sourceFile = cleanUpFile(sourceFile);
    chrisRootFolder = Path.dirname(chrisFilePath);
    return shtml(sourceFile);
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsZ0JBQUEsRUFBQSxlQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLFVBQUEsRUFBQSxjQUFBLEVBQUEsWUFBQSxFQUFBLG1CQUFBLEVBQUEsU0FBQSxFQUFBLGNBQUEsRUFBQSxFQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBLGFBQUEsRUFBQSxlQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLGVBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxVQUFBLEVBQUEsZUFBQSxFQUFBLEtBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsY0FBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxlQUFBLEVBQUEsT0FBQSxFQUFBLGNBQUEsRUFBQTs7RUFBQSxlQUFBLEdBQWtCLENBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxPQUFkLEVBQXVCLElBQXZCLEVBQTZCLE1BQTdCLEVBQXFDLE1BQXJDOztFQUNsQixRQUFBLEdBQVcsQ0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixPQUFsQixFQUEyQixPQUEzQixFQUFvQyxNQUFwQzs7RUFFWCxVQUFBLEdBQWE7O0VBQ2IsU0FBQSxHQUFZOztFQUVaLGVBQUEsR0FBa0I7O0VBRWxCLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBQSxHQUFTLE9BQUEsQ0FBUSxlQUFSLEVBVlQ7OztFQWVBLE9BQUEsR0FBc0IsRUFmdEI7O0VBZ0JBLFNBQUEs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QUFDdEIsUUFBQSxnQkFBQSxFQUFBO0lBQUEsVUFBQSxHQUFhLEVBQUUsQ0FBQyxZQUFILENBQWdCLGFBQWhCLEVBQStCLE1BQS9CO0lBQ2IsVUFBQSxHQUFhLFdBQUEsQ0FBWSxVQUFaO0lBRWIsZUFBQSxHQUFrQixJQUFJLENBQUMsT0FBTCxDQUFhLGFBQWI7SUFDbEIsZ0JBQUEsR0FBbUIsS0FBQSxDQUFNLFVBQU47SUFFbkIsRUFBRSxDQUFDLFNBQUgsQ0FBYSxhQUFBLEdBQWdCLE9BQTdCLEVBQXNDLGdCQUF0QyxFQUF3RCxRQUFBLENBQUEsQ0FBQTthQUFHLE9BQU8sQ0FBQyxHQUFSLENBQVksSUFBWjtJQUFILENBQXhEO1dBQ0E7RUFSc0I7O0VBVzFCLE9BQU8sQ0FBQyxrQkFBUixHQUE2QixRQUFBLENBQUMsV0FBRCxDQUFBO0FBQ3pCLFFBQUE7SUFBQSxnQkFBQSxHQUFtQixLQUFBLENBQU0sV0FBTjtXQUNuQixFQUFFLENBQUMsU0FBSCxDQUFhLHFCQUFiLEVBQW9DLGdCQUFwQztFQUZ5Qjs7RUFLN0IsT0FBTyxDQUFDLDRCQUFSLEdBQXVDLFFBQUEsQ0FBQyxhQUFELENBQUE7QUFDbkMsUUFBQTtJQUFBLFVBQUEsR0FBYSxFQUFFLENBQUMsWUFBSCxDQUFnQixhQUFoQixFQUErQixNQUEvQjtJQUNiLFVBQUEsR0FBYSxXQUFBLENBQVksVUFBWjtJQUViLGVBQUEsR0FBa0IsSUFBSSxDQUFDLE9BQUwsQ0FBYSxhQUFiO1dBQ2xCLEtBQUEsQ0FBTSxVQUFOO0VBTG1DO0FBOWhCdkMiLCJzb3VyY2VzQ29udGVudCI6WyJzZWxmQ2xvc2luZ1RhZ3MgPSBbJ2JyJywgJ2ltZycsICdpbnB1dCcsICdocicsICdtZXRhJywgJ2xpbmsnXVxuaGVhZFRhZ3MgPSBbJ21ldGEnLCAndGl0bGUnLCAnc3R5bGUnLCAnY2xhc3MnLCAnbGluayddXG5cbmZvcm1hdEh0bWwgPSBmYWxzZVxuZGVidWdNb2RlID0gZmFsc2VcblxuY2hyaXNSb290Rm9sZGVyID0gJydcblxuZnMgPSByZXF1aXJlICdmcydcblBhdGggPSByZXF1aXJlICdwYXRoJ1xuY29mZmVlID0gcmVxdWlyZSAnY29mZmVlLXNjcmlwdCdcblxuXG5cbiMgTElORSBUWVBFU1xudGFnVHlwZSAgICAgICAgICAgICA9IDAgI2lmIG5vIGFub3RoZXIgdHlwZSBmb3VuZCBhbmQgdGhpcyBpcyBub3QgYSBzY3JpcHRcbnRhZ0ZpbHRlciAgICAgICAgICAgPSAvXlxccypbXFx3XFwtXSsgKigoICtcXHcrKT8oICopPyggK2lzKCArLiopPyk/KT8kL2lcblxudGFnUHJvcGVydHlUeXBlICAgICA9IDEgI2lmIGZvdW5kIHByb3BlcnR5IFwic29tZXRoaW5nXCJcbnRhZ1Byb3BlcnR5RmlsdGVyICAgPSAvXlxccypbXFx3XFwtXSsgKlwiLipcIi9cblxuc3R5bGVDbGFzc1R5cGUgICAgICA9IDIgI2lmIHRoaXMgaXMgdGFnIGFuZCB0aGUgdGFnIGlzIHN0eWxlXG5zdHlsZUNsYXNzRmlsdGVyICAgID0gL15cXHMqKHN0eWxlfGNsYXNzKVxccytbXFx3Ol8tXSsvaVxuXG5zdHlsZVByb3BlcnR5VHlwZSAgID0gMyAjaWYgZm91bmQgcHJvcGVydHk6IHNvbWV0aGluZ1xuc3R5bGVQcm9wZXJ0eUZpbHRlciA9IC9eXFxzKlteXCInIF0rICo6ICouKi9pXG5cbnN0cmluZ1R5cGUgICAgICAgICAgPSA0ICNpZiBmb3VuZCBcInN0cmluZ1wiXG5zdHJpbmdGaWx0ZXIgICAgICAgID0gL15cXHMqXCIuKlwiL2lcblxuc2NyaXB0VHlwZSAgICAgICAgICA9IDUgI2lmIGl0IGlzIHVuZGVyIHRoZSBzY3JpcHQgdGFnXG5cbnZhcmlhYmxlVHlwZSAgICAgICAgPSA2ICMgaWYgZm91bmQgbmFtZSA9IHNvbWV0aGluZ1xudmFyaWFibGVGaWx0ZXIgICAgICA9IC9eXFxzKlxcdytcXHMqPVxccypbXFx3XFxXXSsvaVxuXG5oZWFkVGFnVHlwZSAgICAgICAgID0gN1xuaGVhZFRhZ0ZpbHRlciAgICAgICA9IC9eXFxzKihtZXRhfHRpdGxlfGxpbmt8YmFzZSkvaVxuXG5tb2R1bGVUeXBlICAgICAgICAgID0gOFxubW9kdWxlRmlsdGVyICAgICAgICA9IC9eXFxzKmluY2x1ZGVcXHMqXCIuKy5jaHJpc1wiL2lcblxuaWdub3JhYmxlVHlwZSAgICAgICA9IC0yXG5lbXB0eUZpbHRlciAgICAgICAgID0gL15bXFxXXFxzX10qJC9cbmNvbW1lbnRGaWx0ZXIgICAgICAgPSAvXlxccyojL2lcblxuXG5cblxuXG5jb3VudFNwYWNlcyA9IChsKSAtPlxuICAgIHggPSAwXG4gICAgaWYgbFswXSA9PSBcIiBcIlxuICAgICAgICB3aGlsZSBsW3hdID09IFwiIFwiXG4gICAgICAgICAgICB4Kz0xXG4gICAgeFxuXG5cblxuYW5hbGlzZVR5cGUgPSAobCkgLT5cbiAgICBsbiA9IC0xXG5cbiAgICBsbiA9IGlnbm9yYWJsZVR5cGUgaWYgY29tbWVudEZpbHRlci50ZXN0IGxcbiAgICBsbiA9IGlnbm9yYWJsZVR5cGUgaWYgZW1wdHlGaWx0ZXIudGVzdCBsXG4gICAgbG4gPSBzdHlsZVByb3BlcnR5VHlwZSBpZiBzdHlsZVByb3BlcnR5RmlsdGVyLnRlc3QgbFxuICAgIGxuID0gdGFnVHlwZSBpZiB0YWdGaWx0ZXIudGVzdCBsXG4gICAgbG4gPSBoZWFkVGFnVHlwZSBpZiBoZWFkVGFnRmlsdGVyLnRlc3QgbFxuICAgIGxuID0gc3R5bGVDbGFzc1R5cGUgaWYgc3R5bGVDbGFzc0ZpbHRlci50ZXN0IGxcbiAgICBsbiA9IHRhZ1Byb3BlcnR5VHlwZSBpZiB0YWdQcm9wZXJ0eUZpbHRlci50ZXN0IGxcbiAgICBsbiA9IHN0cmluZ1R5cGUgaWYgc3RyaW5nRmlsdGVyLnRlc3QgbFxuICAgIGxuID0gdmFyaWFibGVUeXBlIGlmIHZhcmlhYmxlRmlsdGVyLnRlc3QgbFxuICAgIGxuID0gbW9kdWxlVHlwZSBpZiBtb2R1bGVGaWx0ZXIudGVzdCBsXG4gICAgbG5cblxuXG5nZXRIaWVyYXJjaHkgPSAobGluZXMpIC0+XG4gICAgbGluZUxldmVscyA9IFtdXG4gICAgbGluZVBhcmVudHM9W11cblxuICAgIGxhc3RMaW5lT2ZMZXZlbCA9IFstMV1cbiAgICBjdXJyZW50TGV2ZWwgPSBbMF1cbiAgICBjdXJyZW50UmVhbExldmVsID0gMFxuXG4gICAgZm9yIHggaW4gWzAuLi5saW5lcy5sZW5ndGhdXG4gICAgICAgIG4gPSBjb3VudFNwYWNlcyBsaW5lc1t4XVxuICAgICAgICAjbGluZXNbeF0gPSBsaW5lc1t4XS5zbGljZShuKVxuXG4gICAgICAgIGlmIG4gPiBjdXJyZW50TGV2ZWxbY3VycmVudFJlYWxMZXZlbF1cbiAgICAgICAgICAgIGxhc3RMaW5lT2ZMZXZlbC5wdXNoIHggLSAxXG4gICAgICAgICAgICBjdXJyZW50TGV2ZWwucHVzaCBuXG4gICAgICAgICAgICBjdXJyZW50UmVhbExldmVsICs9IDFcblxuICAgICAgICB3aGlsZSBuIDwgY3VycmVudExldmVsW2N1cnJlbnRSZWFsTGV2ZWxdXG4gICAgICAgICAgICBpZiBuIDwgY3VycmVudExldmVsW2N1cnJlbnRSZWFsTGV2ZWxdXG4gICAgICAgICAgICAgICAgY3VycmVudExldmVsLnBvcCgpXG4gICAgICAgICAgICAgICAgbGFzdExpbmVPZkxldmVsLnBvcCgpXG4gICAgICAgICAgICAgICAgY3VycmVudFJlYWxMZXZlbCAtPSAxXG5cbiAgICAgICAgbGluZUxldmVscy5wdXNoIGN1cnJlbnRSZWFsTGV2ZWxcbiAgICAgICAgbGluZVBhcmVudHNbeF0gPSBsYXN0TGluZU9mTGV2ZWxbbGFzdExpbmVPZkxldmVsLmxlbmd0aC0xXVxuXG4gICAgbGluZVBhcmVudHNcblxuXG5mb3JtYXRWYXJpYWJsZSA9IChsKSAtPlxuICAgIGV4cG9ydEFycmF5ID0gW11cbiAgICB2YXJDb250ZW50ID0gJydcblxuICAgIHZhck5hbWUgPSBsLnNwbGl0KCc9JylbMF1cbiAgICB3ID0gMFxuICAgIHdoaWxlIHZhck5hbWUuc3BsaXQoJyAnKVt3XSA9PSAnJ1xuICAgICAgICB3ICs9IDFcbiAgICB2YXJOYW1lID0gdmFyTmFtZS5zcGxpdCgnICcpW3ddXG5cbiAgICBjID0gbC5zcGxpdCgnPScpXG4gICAgYyA9IGNbMV0uc3BsaXQoJyAnKVxuICAgIHcgPSAwXG4gICAgd2hpbGUgdyA8IGMubGVuZ3RoXG4gICAgICAgIGlmIGNbd10gIT0gJydcbiAgICAgICAgICAgIHZhckNvbnRlbnQgKz0gJyAnIGlmIHZhckNvbnRlbnQgIT0gJydcbiAgICAgICAgICAgIHZhckNvbnRlbnQgKz0gY1t3XVxuICAgICAgICB3ICs9IDFcblxuICAgIGV4cG9ydEFycmF5WzBdID0gdmFyTmFtZVxuICAgIGV4cG9ydEFycmF5WzFdID0gdmFyQ29udGVudFxuICAgIGV4cG9ydEFycmF5XG5cblxucHJvY2Vzc1ZhcmlhYmxlcyA9IChscywgdHBzKSAtPlxuICAgIHZhck5hbWVzICAgID0gW11cbiAgICB2YXJDb250ZW50cyA9IFtdXG5cbiAgICBmb3IgeCBpbiBbMC4uLmxzLmxlbmd0aF1cbiAgICAgICAgaWYgdHBzW3hdID09IHZhcmlhYmxlVHlwZVxuICAgICAgICAgICAgdmFyTmFtZXMucHVzaCBmb3JtYXRWYXJpYWJsZShsc1t4XSlbMF1cbiAgICAgICAgICAgIHZhckNvbnRlbnRzLnB1c2ggZm9ybWF0VmFyaWFibGUobHNbeF0pWzFdXG5cbiAgICAgICAgaWYgdHBzW3hdID09IHN0eWxlUHJvcGVydHlUeXBlXG4gICAgICAgICAgICBmb3IgZiBpbiBbMC4uLnZhck5hbWVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBsc1t4XSA9IGxzW3hdLnJlcGxhY2UodmFyTmFtZXNbZl0sIHZhckNvbnRlbnRzW2ZdKS5yZXBsYWNlKHZhck5hbWVzW2ZdLCB2YXJDb250ZW50c1tmXSkucmVwbGFjZSh2YXJOYW1lc1tmXSwgdmFyQ29udGVudHNbZl0pLnJlcGxhY2UodmFyTmFtZXNbZl0sIHZhckNvbnRlbnRzW2ZdKVxuXG4gICAgbHNcblxuXG4gIyBNb2R1bGUgcHJvY2Vzc2luZyBmdW5jdGlvbnNcblxubG9hZENocmlzTW9kdWxlID0gKG1vZHVsZUZpbGVQYXRoKSAtPlxuICAgIG1zbHMgPSBmcy5yZWFkRmlsZVN5bmMobW9kdWxlRmlsZVBhdGgsICd1dGY4JylcbiAgICBtc2xzID0gY2xlYW5VcEZpbGUobXNscylcbiAgICBtbHMgPSBtc2xzLnNwbGl0ICdcXG4nXG4gICAgbWxzXG5cbnByb2Nlc3NNb2R1bGVzID0gKGxzLCBmKSAtPlxuICAgIHJlc3VsdExzID0gW11cbiAgICBtb2R1bGVMZXZlbEZpbHRlciA9IC9eXFxzKi9cblxuICAgIGZvciB4IGluIFswLi4ubHMubGVuZ3RoXVxuICAgICAgICBpZiBtb2R1bGVGaWx0ZXIudGVzdCBsc1t4XVxuICAgICAgICAgICAgY2hyaXNNb2R1bGVQYXRoID0gbHNbeF0uc3BsaXQoJ1wiJylbMV1cbiAgICAgICAgICAgIG1vZHVsZUxpbmVzID0gbG9hZENocmlzTW9kdWxlKGYgKyAnLycgKyBjaHJpc01vZHVsZVBhdGgpXG5cbiAgICAgICAgICAgIG1vZHVsZUxldmVsID0gbW9kdWxlTGV2ZWxGaWx0ZXIuZXhlYyhsc1t4XSlcbiAgICAgICAgICAgIG1vZHVsZUxpbmVzW2xdID0gbW9kdWxlTGV2ZWwgKyBtb2R1bGVMaW5lc1tsXSBmb3IgbCBpbiBbMC4uLm1vZHVsZUxpbmVzLmxlbmd0aF1cblxuICAgICAgICAgICAgbW9kdWxlTGluZXMgPSBwcm9jZXNzTW9kdWxlcyhtb2R1bGVMaW5lcywgUGF0aC5kaXJuYW1lKGYgKyAnLycgKyBjaHJpc01vZHVsZVBhdGgpKVxuICAgICAgICAgICAgcmVzdWx0THMgPSByZXN1bHRMcy5jb25jYXQobW9kdWxlTGluZXMpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc3VsdExzLnB1c2ggbHNbeF1cblxuICAgIHJlc3VsdExzXG5cblxuXG4jIE1BSU4gQ0hSSVNUSU5FIEZVTkNUSU9OXG5cbmV4cG9ydHMuY2hyaXN0aW5pemUgPSAoc3QpIC0+XG4gICAgc2h0bWwoc3QpXG5cbiAgICBcbmNsZWFuVXBMaW5lcyA9IChscykgLT5cbiAgICBuZXdMcyA9IFtdXG4gICAgXG4gICAgZm9yIHggaW4gWzAuLi5scy5sZW5ndGhdXG4gICAgICAgIGlmIGFuYWxpc2VUeXBlKGxzW3hdKSAhPSAtMlxuICAgICAgICAgICAgICAgIG5ld0xzLnB1c2ggbHNbeF1cbiAgICAgICAgICBcbiAgICBuZXdMc1xuXG5cbnNodG1sID0gKHNvdXJjZVRleHQpIC0+XG5cbiAgICBsaW5lcyAgICAgICA9IFtdXG4gICAgcmVzdWx0TGluZXMgPSBbXVxuICAgIGxpbmVUeXBlcyAgID0gW11cbiAgICBsaW5lUGFyZW50cyA9IFtdXG4gICAgbGluZU51bXMgICAgPSBbXVxuICAgIHJlc3VsdFRleHQgID0gJydcblxuICAgIGxpbmVzID0gc291cmNlVGV4dC5zcGxpdCAnXFxuJ1xuXG4gICAgbGluZXMgPSBwcm9jZXNzTW9kdWxlcyhsaW5lcywgY2hyaXNSb290Rm9sZGVyKVxuXG5cbiAgICBsaW5lcyA9IGNsZWFuVXBMaW5lcyhsaW5lcywgbGluZVR5cGVzKVxuXG4gICAgIyBwcm9jZXNzIHR5cGVzIGFuZCBmaWx0ZXIgbGluZXNcbiAgICBmb3IgeCBpbiBbMC4uLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgdCA9IGFuYWxpc2VUeXBlKGxpbmVzW3hdKVxuICAgICAgICBsaW5lVHlwZXMucHVzaCB0XG4gICAgICAgIHJlc3VsdExpbmVzLnB1c2ggbGluZXNbeF1cblxuICAgIHJlc3VsdExpbmVzID0gcHJvY2Vzc1ZhcmlhYmxlcyhyZXN1bHRMaW5lcywgbGluZVR5cGVzKVxuXG4gICAgbGluZVBhcmVudHMgPSBnZXRIaWVyYXJjaHkgcmVzdWx0TGluZXNcblxuICAgIGxpbmVOdW1zLnB1c2goeCkgZm9yIHggaW4gWzAuLi5yZXN1bHRMaW5lcy5sZW5ndGhdXG5cbiAgICByZXN1bHRUZXh0ICs9IFwiIyN7bGluZU51bXNbeF19ICN7bGluZVR5cGVzW3hdfSAje3Jlc3VsdExpbmVzW3hdfSAtICN7bGluZVBhcmVudHNbeF19XFxuXCIgZm9yIHggaW4gWzAuLi5yZXN1bHRMaW5lcy5sZW5ndGhdIGlmIGRlYnVnTW9kZVxuXG4gICAgcmVzdWx0VGV4dCArPSAnPCFkb2N0eXBlIGh0bWw+J1xuICAgIHJlc3VsdFRleHQgKz0gJzxodG1sPidcbiAgICByZXN1bHRUZXh0ICs9IHByb2Nlc3NIZWFkKHJlc3VsdExpbmVzLCBsaW5lUGFyZW50cywgbGluZVR5cGVzLCBsaW5lTnVtcylcbiAgICByZXN1bHRUZXh0ICs9IHByb2Nlc3NUYWcoXCJib2R5XCIsIC0xLCByZXN1bHRMaW5lcywgbGluZVBhcmVudHMsIGxpbmVUeXBlcywgbGluZU51bXMpXG4gICAgcmVzdWx0VGV4dCArPSAnPC9odG1sPidcblxuICAgIHJlc3VsdFRleHRcblxuXG5cblxuZm9ybWF0VGFnID0gKGwpIC0+XG5cbiAgICAjIGdldCByaWQgb2YgaW5kZW50YXRpb25cbiAgICBzcCA9IGNvdW50U3BhY2VzIGxcbiAgICBsID0gbC5zbGljZShzcClcblxuICAgIHRhZ0FycmF5ID0gbC5zcGxpdCAnICdcbiAgICBjbGVhblRhZyA9IFtdXG5cbiAgICBmb3IgeCBpbiBbMC4uLnRhZ0FycmF5Lmxlbmd0aF1cbiAgICAgICAgY2xlYW5UYWcucHVzaCB0YWdBcnJheVt4XSBpZiB0YWdBcnJheVt4XSAhPSBcIlwiXG5cbiAgICBmaW5hbFRhZyA9ICc8JyArIGNsZWFuVGFnWzBdXG5cbiAgICBpZiBjbGVhblRhZy5sZW5ndGggPiAxXG4gICAgICAgIGlmIGNsZWFuVGFnWzFdICE9ICdpcydcbiAgICAgICAgICAgIGZpbmFsVGFnICs9ICcgaWQ9XCInICsgY2xlYW5UYWdbMV0gKyAnXCInXG5cbiAgICAgICAgeCA9IDBcbiAgICAgICAgdGFnQ2xhc3MgPSBcIlwiXG4gICAgICAgIGNvbGxlY3RDbGFzc2VzID0gZmFsc2VcbiAgICAgICAgd2hpbGUgeCA8IGNsZWFuVGFnLmxlbmd0aFxuICAgICAgICAgICAgaWYgY29sbGVjdENsYXNzZXNcbiAgICAgICAgICAgICAgICB0YWdDbGFzcyArPSBjbGVhblRhZ1t4XVxuICAgICAgICAgICAgICAgIHRhZ0NsYXNzICs9ICcgJyBpZiB4IDwgY2xlYW5UYWcubGVuZ3RoIC0gMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIGNsZWFuVGFnW3hdID09ICdpcydcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdENsYXNzZXMgPSB0cnVlIGlmIHggPCBjbGVhblRhZy5sZW5ndGggLSAxXG4gICAgICAgICAgICB4ICs9IDFcbiAgICAgICAgZmluYWxUYWcgKz0gJyBjbGFzcz1cIicgKyB0YWdDbGFzcyArICdcIicgaWYgdGFnQ2xhc3MubGVuZ3RoID4gMFxuXG4gICAgZmluYWxUYWdcblxuXG5cblxuZm9ybWF0UHJvcGVydHkgPSAobCkgLT5cblxuICAgICMgZ2V0IHJpZCBvZiBpbmRlbnRhdGlvblxuICAgIHNwID0gY291bnRTcGFjZXMgbFxuICAgIGwgPSBsLnNsaWNlKHNwKVxuXG4gICAgY2xlYW5Qcm9wZXJ0eSA9ICc9XCInXG4gICAgcHJvcGVydHlOYW1lU2VhcmNoID0gL15bXFx3XFwtXSsoICopP1wiL2lcbiAgICB0ID0gbC5tYXRjaChwcm9wZXJ0eU5hbWVTZWFyY2gpWzBdXG4gICAgdCA9IHQuc3BsaXQoXCIgXCIpWzBdXG4gICAgdCA9IHQuc3BsaXQoJ1wiJylbMF1cbiAgICBjbGVhblByb3BlcnR5ID0gdCArIGNsZWFuUHJvcGVydHlcbiAgICB0ID0gbC5zcGxpdCgnXCInKVsxXVxuICAgIGNsZWFuUHJvcGVydHkgKz0gdCArICdcIidcbiAgICBjbGVhblByb3BlcnR5XG5cbmZvcm1hdFN0eWxlUHJvcGVydHkgPSAobCkgLT5cblxuICAgICMgZ2V0IHJpZCBvZiBpbmRlbnRhdGlvblxuICAgIHNwID0gY291bnRTcGFjZXMgbFxuICAgIGwgPSBsLnNsaWNlKHNwKVxuXG4gICAgZGl2aWRlclBvc2l0aW9uID0gbC5pbmRleE9mICc6J1xuICAgIHByb3BlcnR5QWZ0ZXIgPSBsLnNsaWNlIChkaXZpZGVyUG9zaXRpb24gKyAxKVxuICAgIGNsZWFuU3R5bGVQcm9wZXJ0eSA9IGwuc3BsaXQoJzonKVswXSArICc6J1xuICAgIGFmdGVyQXJyYXkgPSBwcm9wZXJ0eUFmdGVyLnNwbGl0ICcgJ1xuXG4gICAgZm9yIHggaW4gWzAuLi5hZnRlckFycmF5Lmxlbmd0aF1cbiAgICAgICAgaWYgYWZ0ZXJBcnJheVt4XSAhPSAnJ1xuICAgICAgICAgICAgY2xlYW5TdHlsZVByb3BlcnR5ICs9IGFmdGVyQXJyYXlbeF1cbiAgICAgICAgICAgIGNsZWFuU3R5bGVQcm9wZXJ0eSArPSAnICcgaWYgeCA8IGFmdGVyQXJyYXkubGVuZ3RoIC0gMVxuXG4gICAgY2xlYW5TdHlsZVByb3BlcnR5XG5cblxuZm9ybWF0U3RyaW5nID0gKGwpIC0+XG4gICAgY2xlYW5TdHJpbmcgPSBsLnNwbGl0KCdcIicpWzFdXG4gICAgY2xlYW5TdHJpbmdcblxuY2hlY2tTZWxmQ2xvc2luZyA9ICh0KSAtPlxuICAgIHNlbGZDbG9zaW5nID0gdHJ1ZVxuICAgIGZvciBpIGluIFswLi5zZWxmQ2xvc2luZ1RhZ3MubGVuZ3RoXVxuICAgICAgICBzZWxmQ2xvc2luZyA9IGZhbHNlIGlmIHQgPT0gc2VsZkNsb3NpbmdUYWdzW2ldXG4gICAgc2VsZkNsb3NpbmdcblxuXG5cblxuXG4jIHRoZSBtYWluIHJlY3Vyc2l2ZSBtYWNoaW5lcyFcblxucHJvY2Vzc0hlYWQgPSAobGluZXMgPSBbXSwgbGlua3MsIHR5cGVzLCBsaW5lTnVtcykgLT5cbiAgICBmaW5hbEhlYWQgPSAnPGhlYWQ+J1xuXG4gICAgIyBjb2xsZWN0IGNoaWxkcmVuXG5cbiAgICBjaGlsZFN0eWxlTnVtcyA9IFtdXG4gICAgY2hpbGRUYWdOdW1zID0gW11cblxuICAgIGlmIGxpbmVzLmxlbmd0aCA+IDBcbiAgICAgICAgZm9yIHggaW4gWzAuLi5saW5lcy5sZW5ndGhdXG4gICAgICAgICAgICBpZiBsaW5rc1t4XSA9PSAtMVxuICAgICAgICAgICAgICAgIGNoaWxkU3R5bGVOdW1zLnB1c2ggeCBpZiB0eXBlc1t4XSA9PSBzdHlsZUNsYXNzVHlwZVxuICAgICAgICAgICAgICAgIGNoaWxkVGFnTnVtcy5wdXNoIHggaWYgdHlwZXNbeF0gPT0gaGVhZFRhZ1R5cGVcblxuXG4gICAgIyBwcm9jZXNzIGhlYWQgc3R5bGVzXG5cbiAgICBpZiBjaGlsZFN0eWxlTnVtcy5sZW5ndGggPiAwXG4gICAgICAgIGZpbmFsSGVhZCArPSAnPHN0eWxlPidcbiAgICAgICAgeCA9IDBcbiAgICAgICAgd2hpbGUgeCA8IGNoaWxkU3R5bGVOdW1zLmxlbmd0aFxuICAgICAgICAgICAgZmluYWxIZWFkICs9ICdcXG4nIGlmIGZvcm1hdEh0bWxcblxuICAgICAgICAgICAgc3R5bGVDaGlsZExpbmVzID0gW11cbiAgICAgICAgICAgIHN0eWxlQ2hpbGRUeXBlcyA9IFtdXG5cbiAgICAgICAgICAgIHAgPSBjaGlsZFN0eWxlTnVtc1t4XSArIDFcbiAgICAgICAgICAgIHdoaWxlIGxpbmtzW3BdID49IGNoaWxkU3R5bGVOdW1zW3hdXG4gICAgICAgICAgICAgICAgaWYgcCA8IGxpbmVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBzdHlsZUNoaWxkTGluZXMucHVzaCBsaW5lc1twXVxuICAgICAgICAgICAgICAgICAgICBzdHlsZUNoaWxkVHlwZXMucHVzaCB0eXBlc1twXVxuICAgICAgICAgICAgICAgICAgICBwICs9IDFcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBmaW5hbEhlYWQgKz0gcHJvY2Vzc1N0eWxlVGFnKGxpbmVzW2NoaWxkU3R5bGVOdW1zW3hdXSwgc3R5bGVDaGlsZExpbmVzLCBzdHlsZUNoaWxkVHlwZXMpXG5cbiAgICAgICAgICAgIHggKz0gMVxuXG4gICAgICAgIGZpbmFsSGVhZCArPSAnPC9zdHlsZT4nXG5cbiAgICAjIHByb2Nlc3MgaGVhZCB0YWdzXG5cbiAgICBpZiBjaGlsZFRhZ051bXMubGVuZ3RoID4gMFxuICAgICAgICB4ID0gMFxuICAgICAgICB3aGlsZSB4IDwgY2hpbGRUYWdOdW1zLmxlbmd0aFxuICAgICAgICAgICAgZmluYWxIZWFkICs9ICdcXG4nIGlmIGZvcm1hdEh0bWxcbiAgICAgICAgICAgIHRhZ0NoaWxkTGluZXMgPSBbXVxuICAgICAgICAgICAgdGFnQ2hpbGRMaW5rcyA9IFtdXG4gICAgICAgICAgICB0YWdDaGlsZFR5cGVzID0gW11cbiAgICAgICAgICAgIHRhZ0NoaWxkTGluZU51bXMgPSBbXVxuXG4gICAgICAgICAgICBwID0gY2hpbGRUYWdOdW1zW3hdICsgMVxuICAgICAgICAgICAgd2hpbGUgbGlua3NbcF0gPj0gY2hpbGRUYWdOdW1zW3hdXG4gICAgICAgICAgICAgICAgaWYgcCA8IGxpbmVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB0YWdDaGlsZExpbmVzLnB1c2ggbGluZXNbcF1cbiAgICAgICAgICAgICAgICAgICAgdGFnQ2hpbGRMaW5rcy5wdXNoIGxpbmtzW3BdXG4gICAgICAgICAgICAgICAgICAgIHRhZ0NoaWxkVHlwZXMucHVzaCB0eXBlc1twXVxuICAgICAgICAgICAgICAgICAgICB0YWdDaGlsZExpbmVOdW1zLnB1c2ggbGluZU51bXNbcF1cbiAgICAgICAgICAgICAgICAgICAgcCArPSAxXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgdG4gPSBjaGlsZFRhZ051bXNbeF1cbiAgICAgICAgICAgIGZpbmFsSGVhZCArPSBwcm9jZXNzVGFnKGxpbmVzW3RuXSwgbGluZU51bXNbdG5dLCB0YWdDaGlsZExpbmVzLCB0YWdDaGlsZExpbmtzLCB0YWdDaGlsZFR5cGVzLCB0YWdDaGlsZExpbmVOdW1zKVxuXG4gICAgICAgICAgICB4ICs9IDFcblxuXG4gICAgZmluYWxIZWFkICs9ICc8L2hlYWQ+J1xuICAgIGZpbmFsSGVhZFxuXG5cblxuXG5cblxucHJvY2Vzc1N0eWxlVGFnID0gKHRhZ0xpbmUsIGNoaWxkTGluZXMgPSBbXSwgY2hpbGRUeXBlcykgLT5cbiAgICBmaW5hbFRhZyA9ICcjJ1xuICAgIGZpbmFsVGFnID0gJy4nIGlmIHRhZ0xpbmUuc3BsaXQoJyAnKVswXSA9PSAnY2xhc3MnXG5cbiAgICBpZiB0YWdMaW5lLnNwbGl0KCcgJylbMV0gPT0gJ3RhZycgI2lmIHN0eWxpbmcgdGFnLCBub3QgdGhlIGlkIG9yIGNsYXNzXG4gICAgICAgIGZpbmFsVGFnID0gJydcbiAgICAgICAgZmluYWxUYWcgKz0gdGFnTGluZS5zcGxpdCgnICcpWzJdICsgJ3snXG4gICAgZWxzZVxuICAgICAgICBmaW5hbFRhZyArPSB0YWdMaW5lLnNwbGl0KCcgJylbMV0gKyAneydcblxuICAgIGZvciB4IGluIFswLi4uY2hpbGRMaW5lcy5sZW5ndGhdXG4gICAgICAgIGZpbmFsVGFnICs9IGZvcm1hdFN0eWxlUHJvcGVydHkoY2hpbGRMaW5lc1t4XSkgKyAnOycgaWYgY2hpbGRUeXBlc1t4XSA9PSBzdHlsZVByb3BlcnR5VHlwZVxuXG4gICAgZmluYWxUYWcgKz0gJ30nXG4gICAgZmluYWxUYWdcblxuXG5cblxuXG5cbnByb2Nlc3NUYWcgPSAodGFnTGluZSwgc2VsZkxpbmssIGNoaWxkTGluZXMgPSBbXSwgY2hpbGRMaW5rcywgY2hpbGRUeXBlcywgbGluZU51bXMpIC0+XG4gICAgIyBnZXQgcmlkIG9mIGluZGVudGF0aW9uXG4gICAgc3AgPSBjb3VudFNwYWNlcyB0YWdMaW5lXG4gICAgdGFnTGluZSA9IHRhZ0xpbmUuc2xpY2Uoc3ApXG5cbiAgICB0YWdOYW1lID0gdGFnTGluZS5zcGxpdCgnICcpWzBdXG4gICAgZmluYWxUYWcgPSBmb3JtYXRUYWcgdGFnTGluZVxuICAgIGNsb3NhYmxlID0gY2hlY2tTZWxmQ2xvc2luZyh0YWdMaW5lLnNwbGl0KCcgJylbMF0pXG5cbiAgICAjIGNvbGxlY3QgYWxsIHRoZSBjaGlsZHJlblxuICAgIHRhZ1Byb3BlcnRpZXMgPSBbXVxuICAgIHRhZ1N0eWxlcyAgICAgPSBbXVxuICAgIGNoaWxkcyAgICAgICAgPSBbXVxuICAgIGNoaWxkU3RyaW5ncyAgPSBbXVxuICAgIHZhcmlhYmxlcyAgICAgPSBbXVxuXG4gICAgaWYgY2hpbGRMaW5lcy5sZW5ndGggPiAwXG4gICAgICAgIGZvciB4IGluIFswLi4uY2hpbGRMaW5lcy5sZW5ndGhdXG4gICAgICAgICAgICBpZiBjaGlsZExpbmtzW3hdID09IHNlbGZMaW5rXG4gICAgICAgICAgICAgICAgdGFnUHJvcGVydGllcy5wdXNoIGNoaWxkTGluZXNbeF0gaWYgY2hpbGRUeXBlc1t4XSA9PSB0YWdQcm9wZXJ0eVR5cGVcbiAgICAgICAgICAgICAgICB0YWdTdHlsZXMucHVzaCBjaGlsZExpbmVzW3hdICAgICBpZiBjaGlsZFR5cGVzW3hdID09IHN0eWxlUHJvcGVydHlUeXBlXG4gICAgICAgICAgICAgICAgY2hpbGRzLnB1c2ggeCAgICAgICAgICAgICAgICAgICAgaWYgY2hpbGRUeXBlc1t4XSA9PSB0YWdUeXBlXG4gICAgICAgICAgICAgICAgY2hpbGRzLnB1c2ggeCAgICAgICAgICAgICAgICAgICAgaWYgY2hpbGRUeXBlc1t4XSA9PSBzdHJpbmdUeXBlXG4gICAgICAgICAgICAgICAgY2hpbGRzLnB1c2ggeCAgICAgICAgICAgICAgICAgICAgaWYgY2hpbGRUeXBlc1t4XSA9PSBzdHlsZUNsYXNzVHlwZVxuICAgICAgICAgICAgICAgIGNoaWxkcy5wdXNoIHggICAgICAgICAgICAgICAgICAgIGlmIGNoaWxkVHlwZXNbeF0gPT0gdmFyaWFibGVUeXBlXG5cbiAgICAjIGFkZCB0YWcgcHJvcGVydGllc1xuICAgIGlmIHRhZ1Byb3BlcnRpZXMubGVuZ3RoID4gMFxuICAgICAgICBmb3IgeCBpbiBbMC4uLnRhZ1Byb3BlcnRpZXMubGVuZ3RoXVxuICAgICAgICAgICAgdGFnUHJvcGVydGllc1t4XSA9IGZvcm1hdFByb3BlcnR5IHRhZ1Byb3BlcnRpZXNbeF1cbiAgICAgICAgICAgIGZpbmFsVGFnICs9ICcgJyArIHRhZ1Byb3BlcnRpZXNbeF1cblxuICAgICMgYWRkIHRhZyBzdHlsZVxuICAgIGlmIHRhZ1N0eWxlcy5sZW5ndGggPiAwXG4gICAgICAgIGZpbmFsVGFnICs9ICcgc3R5bGU9XCInXG4gICAgICAgIGZvciB4IGluIFswLi4udGFnU3R5bGVzLmxlbmd0aF1cbiAgICAgICAgICAgIGZpbmFsVGFnICs9IGZvcm1hdFN0eWxlUHJvcGVydHkodGFnU3R5bGVzW3hdKSArICc7J1xuICAgICAgICBmaW5hbFRhZyArPSAnXCInXG5cbiAgICBmaW5hbFRhZyArPSAnPidcblxuICAgICMuLi4gcHJvY2VzcyBjaGlsZCB0YWdzLCBzdHJpbmdzLCBzdHlsZVRhZ3NcbiAgICB4ID0gMFxuICAgIGlmIHRhZ05hbWUhPSdjb2ZmZWVzY3JpcHQnXG4gICAgICAgIHdoaWxlIHggPCBjaGlsZHMubGVuZ3RoXG4gICAgICAgICAgICB0bCA9IGNoaWxkc1t4XVxuXG4gICAgICAgICAgICBpZiBjaGlsZFR5cGVzW3RsXSA9PSBzdHJpbmdUeXBlXG4gICAgICAgICAgICAgICAgZmluYWxUYWcgKz0gZm9ybWF0U3RyaW5nKGNoaWxkTGluZXNbdGxdKVxuXG4gICAgICAgICAgICBpZiBjaGlsZFR5cGVzW3RsXSA9PSBzdHlsZUNsYXNzVHlwZVxuICAgICAgICAgICAgICAgIGlmIGNoaWxkTGlua3NbdGxdICE9IC0xXG4gICAgICAgICAgICAgICAgICAgIGZpbmFsVGFnICs9ICdcXG4nIGlmIGZvcm1hdEh0bWxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVDaGlsZExpbmVzID0gW11cbiAgICAgICAgICAgICAgICAgICAgc3R5bGVDaGlsZFR5cGVzID0gW11cblxuICAgICAgICAgICAgICAgICAgICBwID0gdGwgKyAxXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIGNoaWxkTGlua3NbcF0gPj0gdGxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHAgPCBjaGlsZExpbmVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlQ2hpbGRMaW5lcy5wdXNoIGNoaWxkTGluZXNbcF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZUNoaWxkVHlwZXMucHVzaCBjaGlsZFR5cGVzW3BdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgZmluYWxUYWcgKz0gcHJvY2Vzc1N0eWxlVGFnKGNoaWxkTGluZXNbdGxdLCBzdHlsZUNoaWxkTGluZXMsIHN0eWxlQ2hpbGRUeXBlcylcblxuICAgICAgICAgICAgaWYgY2hpbGRUeXBlc1t0bF0gPT0gdGFnVHlwZVxuICAgICAgICAgICAgICAgIGZpbmFsVGFnICs9ICdcXG4nIGlmIGZvcm1hdEh0bWxcbiAgICAgICAgICAgICAgICB0YWdDaGlsZExpbmVzICA9IFtdXG4gICAgICAgICAgICAgICAgdGFnQ2hpbGRMaW5rcyAgPSBbXVxuICAgICAgICAgICAgICAgIHRhZ0NoaWxkVHlwZXMgID0gW11cbiAgICAgICAgICAgICAgICB0YWdDaGlsZExpbmVOdW1zID0gW11cblxuICAgICAgICAgICAgICAgIHAgPSB0bCArIDFcbiAgICAgICAgICAgICAgICB3aGlsZSBjaGlsZExpbmtzW3BdID49IHRsXG4gICAgICAgICAgICAgICAgICAgIGlmIHAgPCBjaGlsZExpbmVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnQ2hpbGRMaW5lcy5wdXNoIGNoaWxkTGluZXNbcF1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ0NoaWxkTGlua3MucHVzaCBjaGlsZExpbmtzW3BdXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdDaGlsZFR5cGVzLnB1c2ggY2hpbGRUeXBlc1twXVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnQ2hpbGRMaW5lTnVtcy5wdXNoIGxpbmVOdW1zW3BdXG4gICAgICAgICAgICAgICAgICAgICAgICBwICs9IDFcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuXG4gICAgICAgICAgICAgICAgZmluYWxUYWcgKz0gcHJvY2Vzc1RhZyhjaGlsZExpbmVzW3RsXSwgbGluZU51bXNbdGxdLCB0YWdDaGlsZExpbmVzLCB0YWdDaGlsZExpbmtzLCB0YWdDaGlsZFR5cGVzLCB0YWdDaGlsZExpbmVOdW1zKVxuXG4gICAgICAgICAgICB4ICs9IDFcbiAgICBlbHNlXG4gICAgICAgIHNjcmlwdEJlZm9yZSA9ICcnXG4gICAgICAgIGZvciBsIGluIFswLi4uY2hpbGRMaW5lcy5sZW5ndGhdXG4gICAgICAgICAgICBzY3JpcHRCZWZvcmUgKz0gY2hpbGRMaW5lc1tsXSArICdcXG4nXG5cbiAgICAgICAgZmluYWxUYWcgPSAnPHNjcmlwdD4nXG4gICAgICAgIHRhZ05hbWUgPSAnc2NyaXB0J1xuICAgICAgICBmaW5hbFRhZyArPSBjb2ZmZWUuY29tcGlsZShzY3JpcHRCZWZvcmUpXG5cbiAgICAjIGNsb3NlIHRhZyBhbmQgcmV0dXJuIGZpbmFsIHN0cmluZ1xuICAgIGlmIGNsb3NhYmxlXG4gICAgICAgIGZpbmFsVGFnICs9ICc8LycgKyB0YWdOYW1lICsgJz4nXG5cbiAgICBmaW5hbFRhZyArPSAnXFxuJyBpZiBmb3JtYXRIdG1sXG5cbiAgICBmaW5hbFRhZ1xuXG5cbmNsZWFuVXBGaWxlID0gKHNGaWxlKSAtPlxuICAgIGNhcnJpYWdlVGFiVGVzdCA9IC9bXFxyXFx0XS9nbWlcblxuICAgIHJGaWxlID0gc0ZpbGVcbiAgICB3aGlsZSBjYXJyaWFnZVRhYlRlc3QudGVzdChyRmlsZSlcbiAgICAgICAgckZpbGUgPSByRmlsZS5yZXBsYWNlKCdcXHInLCAnXFxuJykucmVwbGFjZSgnXFx0JywgJyAgICAnKVxuICAgIHJGaWxlXG5cbmV4cG9ydHMuY2hyaXN0aW5pemVGaWxlID0gKGNocmlzRmlsZVBhdGgpIC0+XG4gICAgc291cmNlRmlsZSA9IGZzLnJlYWRGaWxlU3luYyhjaHJpc0ZpbGVQYXRoLCAndXRmOCcpXG4gICAgc291cmNlRmlsZSA9IGNsZWFuVXBGaWxlKHNvdXJjZUZpbGUpXG5cbiAgICBjaHJpc1Jvb3RGb2xkZXIgPSBQYXRoLmRpcm5hbWUgY2hyaXNGaWxlUGF0aFxuICAgIGNocmlzdGluaXplZEZpbGUgPSBzaHRtbChzb3VyY2VGaWxlKVxuXG4gICAgZnMud3JpdGVGaWxlKGNocmlzRmlsZVBhdGggKyAnLmh0bWwnLCBjaHJpc3Rpbml6ZWRGaWxlLCAtPiBjb25zb2xlLmxvZyAnb2snKVxuICAgIGNocmlzdGluaXplZEZpbGVcblxuXG5leHBvcnRzLmNocmlzdGluaXplQW5kU2F2ZSA9IChjaHJpc1NvdXJjZSkgLT5cbiAgICBjaHJpc3Rpbml6ZWRGaWxlID0gc2h0bWwoY2hyaXNTb3VyY2UpXG4gICAgZnMud3JpdGVGaWxlKCcuL2NocmlzUHJldmlldy5odG1sJywgY2hyaXN0aW5pemVkRmlsZSlcblxuXG5leHBvcnRzLmNocmlzdGluaXplRmlsZVdpdGhvdXRTYXZpbmcgPSAoY2hyaXNGaWxlUGF0aCkgLT5cbiAgICBzb3VyY2VGaWxlID0gZnMucmVhZEZpbGVTeW5jKGNocmlzRmlsZVBhdGgsICd1dGY4JylcbiAgICBzb3VyY2VGaWxlID0gY2xlYW5VcEZpbGUoc291cmNlRmlsZSlcblxuICAgIGNocmlzUm9vdEZvbGRlciA9IFBhdGguZGlybmFtZSBjaHJpc0ZpbGVQYXRoXG4gICAgc2h0bWwoc291cmNlRmlsZSkiXX0=
//# sourceURL=coffeescript