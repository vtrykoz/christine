var Path, analiseType, checkSelfClosing, chrisRootFolder, cleanUpFile, coffee, countSpaces, debugMode, formatHtml, formatProperty, formatString, formatStyleProperty, formatTag, formatVariable, fs, getHierarchy, headTagFilter, headTagType, headTags, loadChrisModule, moduleFilter, moduleType, processHead, processModules, processStyleTag, processTag, processVariables, scriptType, selfClosingTags, shtml, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

selfClosingTags = ['br', 'img', 'input', 'hr', 'meta', 'link'];

headTags = ['meta', 'title', 'style', 'class', 'link'];

formatHtml = false;

debugMode = false;

chrisRootFolder = '';

fs = require('fs');

Path = require('path');

coffee = require('coffee-script');

tagType = 0;

tagFilter = /^\s*\w+ *(( +\w+)?( *)?( +is( +.*)?)?)?$/i;

tagPropertyType = 1;

tagPropertyFilter = /^\s*\w+ *".*"/i;

styleClassType = 2;

styleClassFilter = /^\s*(style|class)\s+[\w:_-]+/i;

stylePropertyType = 3;

stylePropertyFilter = /^\s*[^"' ]+ *: *.*/i;

stringType = 4;

stringFilter = /^\s*".*"/i;

scriptType = 5;

variableType = 6;

variableFilter = /^\s*\w+\s*=\s*[\w\W]+/i;

headTagType = 7;

headTagFilter = /^\s*(meta|title|link|base)/i;

moduleType = 8;

moduleFilter = /^\s*include\s*".+.chris"/i;

countSpaces = function(l) {
  var x;
  x = 0;
  if (l[0] = " ") {
    while (l[x] === " ") {
      x += 1;
    }
  }
  return x;
};

analiseType = function(l) {
  var ln;
  ln = -1;
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
  var currentLevel, currentRealLevel, lastLineOfLevel, lineLevels, lineParents, n, x, _i, _ref;
  lineLevels = [];
  lineParents = [];
  lastLineOfLevel = [-1];
  currentLevel = [0];
  currentRealLevel = 0;
  for (x = _i = 0, _ref = lines.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
    n = countSpaces(lines[x]);
    lines[x] = lines[x].slice(n);
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
  var f, varContents, varNames, x, _i, _j, _ref, _ref1;
  varNames = [];
  varContents = [];
  for (x = _i = 0, _ref = ls.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
    if (tps[x] === variableType) {
      varNames.push(formatVariable(ls[x])[0]);
      varContents.push(formatVariable(ls[x])[1]);
    }
    if (tps[x] === stylePropertyType) {
      for (f = _j = 0, _ref1 = varNames.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; f = 0 <= _ref1 ? ++_j : --_j) {
        ls[x] = ls[x].replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]);
      }
    }
  }
  return ls;
};

loadChrisModule = function(moduleFilePath) {
  var mls, msls;
  msls = fs.readFileSync('./' + moduleFilePath, 'utf8');
  msls = cleanUpFile(msls);
  mls = msls.split('\n');
  return mls;
};

processModules = function(ls, f) {
  var chrisModulePath, l, moduleLevel, moduleLevelFilter, moduleLines, resultLs, x, _i, _j, _ref, _ref1;
  resultLs = [];
  moduleLevelFilter = /^\s*/;
  for (x = _i = 0, _ref = ls.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
    if (moduleFilter.test(ls[x])) {
      chrisModulePath = ls[x].split('"')[1];
      moduleLines = loadChrisModule(f + '/' + chrisModulePath);
      moduleLevel = moduleLevelFilter.exec(ls[x]);
      for (l = _j = 0, _ref1 = moduleLines.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; l = 0 <= _ref1 ? ++_j : --_j) {
        moduleLines[l] = moduleLevel + moduleLines[l];
      }
      moduleLines = processModules(moduleLines, path.dirname(f + '/' + chrisModulePath));
      resultLs = resultLs.concat(moduleLines);
    } else {
      resultLs.push(ls[x]);
    }
  }
  return resultLs;
};

exports.christinize = function(st) {
  return shtml(st);
};

shtml = function(sourceText) {
  var lineNums, lineParents, lineTypes, lines, resultLines, resultText, t, x, _i, _j, _k, _ref, _ref1, _ref2;
  lines = [];
  resultLines = [];
  lineTypes = [];
  lineParents = [];
  lineNums = [];
  resultText = '';
  lines = sourceText.split('\n');
  lines = processModules(lines, chrisRootFolder);
  for (x = _i = 0, _ref = lines.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
    t = analiseType(lines[x]);
    if (t !== -1) {
      lineTypes.push(t);
      resultLines.push(lines[x]);
    }
  }
  resultLines = processVariables(resultLines, lineTypes);
  lineParents = getHierarchy(resultLines);
  for (x = _j = 0, _ref1 = resultLines.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
    lineNums.push(x);
  }
  if (debugMode) {
    for (x = _k = 0, _ref2 = resultLines.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; x = 0 <= _ref2 ? ++_k : --_k) {
      resultText += "#" + lineNums[x] + " " + lineTypes[x] + " " + resultLines[x] + " - " + lineParents[x] + "\n";
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
  var cleanTag, collectClasses, finalTag, tagArray, tagClass, x, _i, _ref;
  tagArray = l.split(' ');
  cleanTag = [];
  for (x = _i = 0, _ref = tagArray.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
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
  var cleanProperty, propertyNameSearch, t;
  cleanProperty = '="';
  propertyNameSearch = /^\w+( *)?"/i;
  t = l.match(propertyNameSearch)[0];
  t = t.split(" ")[0];
  t = t.split('"')[0];
  cleanProperty = t + cleanProperty;
  t = l.split('"')[1];
  cleanProperty += t + '"';
  return cleanProperty;
};

formatStyleProperty = function(l) {
  var afterArray, cleanStyleProperty, dividerPosition, propertyAfter, x, _i, _ref;
  dividerPosition = l.indexOf(':');
  propertyAfter = l.slice(dividerPosition + 1);
  cleanStyleProperty = l.split(':')[0] + ':';
  afterArray = propertyAfter.split(' ');
  for (x = _i = 0, _ref = afterArray.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
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
  var i, selfClosing, _i, _ref;
  selfClosing = true;
  for (i = _i = 0, _ref = selfClosingTags.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
    if (t === selfClosingTags[i]) {
      selfClosing = false;
    }
  }
  return selfClosing;
};

processHead = function(lines, links, types, lineNums) {
  var childStyleNums, childTagNums, finalHead, p, styleChildLines, styleChildTypes, tagChildLineNums, tagChildLines, tagChildLinks, tagChildTypes, tn, x, _i, _ref;
  if (lines == null) {
    lines = [];
  }
  finalHead = '<head>';
  childStyleNums = [];
  childTagNums = [];
  if (lines.length > 0) {
    for (x = _i = 0, _ref = lines.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
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

processStyleTag = function(tagLine, childLines, childTypes) {
  var finalTag, x, _i, _ref;
  if (childLines == null) {
    childLines = [];
  }
  finalTag = '#';
  if (tagLine.split(' ')[0] === 'class') {
    finalTag = '.';
  }
  if (tagLine.split(' ')[1] === 'tag') {
    finalTag = '';
    finalTag += tagLine.split(' ')[2] + '{';
  } else {
    finalTag += tagLine.split(' ')[1] + '{';
  }
  for (x = _i = 0, _ref = childLines.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
    if (childTypes[x] === stylePropertyType) {
      finalTag += formatStyleProperty(childLines[x]) + ';';
    }
  }
  finalTag += '}';
  return finalTag;
};

processTag = function(tagLine, selfLink, childLines, childLinks, childTypes, lineNums) {
  var childStrings, childs, closable, finalTag, l, p, scriptBefore, styleChildLines, styleChildTypes, tagChildLineNums, tagChildLines, tagChildLinks, tagChildTypes, tagName, tagProperties, tagStyles, tl, variables, x, _i, _j, _k, _l, _ref, _ref1, _ref2, _ref3;
  if (childLines == null) {
    childLines = [];
  }
  tagName = tagLine.split(' ')[0];
  finalTag = formatTag(tagLine);
  closable = checkSelfClosing(tagLine.split(' ')[0]);
  tagProperties = [];
  tagStyles = [];
  childs = [];
  childStrings = [];
  variables = [];
  if (childLines.length > 0) {
    for (x = _i = 0, _ref = childLines.length; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
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
  if (tagProperties.length > 0) {
    for (x = _j = 0, _ref1 = tagProperties.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
      tagProperties[x] = formatProperty(tagProperties[x]);
      finalTag += ' ' + tagProperties[x];
    }
  }
  if (tagStyles.length > 0) {
    finalTag += ' style="';
    for (x = _k = 0, _ref2 = tagStyles.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; x = 0 <= _ref2 ? ++_k : --_k) {
      finalTag += formatStyleProperty(tagStyles[x]) + ';';
    }
    finalTag += '"';
  }
  finalTag += '>';
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
    for (l = _l = 0, _ref3 = childLines.length; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; l = 0 <= _ref3 ? ++_l : --_l) {
      scriptBefore += childLines[l] + '\n';
    }
    console.log(scriptBefore);
    finalTag = '<script>';
    finalTag += coffee.compile(scriptBefore);
    finalTag += '</script>';
  }
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
  fs.writeFile('./' + chrisFilePath + '.html', christinizedFile);
  return christinizedFile;
};

exports.christinizeAndSave = function(chrisSource) {
  var christinizedFile;
  christinizedFile = shtml(chrisSource);
  return fs.writeFile('./chrisPreview.html', christinizedFile);
};
