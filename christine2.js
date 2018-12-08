(function() {
  // LINE TYPES
  var analiseType, cleanupLines, commentFilter, countSpaces, emptyFilter, headTagFilter, headTagType, ignorableType, moduleFilter, moduleType, processHierarchy, processTypes, scriptType, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

  tagType = 0; //if no another type found and this is not a script

  tagFilter = /^\s*\w+ *(( +\w+)?( *)?( +is( +.*)?)?)?$/i;

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

  this.christine = {
    christinize: function(sourceText) {
      var chrisFile;
      chrisFile = {
        source: [],
        inProgressLines: {
          level: -1,
          children: []
        },
        final: ''
      };
      chrisFile.inProgressLines.parent = chrisFile.inProgressLines;
      chrisFile.source = cleanupLines(sourceText.split('\n'));
      processHierarchy(chrisFile);
      processTypes(chrisFile.inProgressLines);
      return console.log(chrisFile);
    }
  };

  cleanupLines = function(sourceLines) {
    var i, len, line, newSourceLines;
    newSourceLines = new Array;
    for (i = 0, len = sourceLines.length; i < len; i++) {
      line = sourceLines[i];
      if (analiseType(line) !== -2) {
        console.log("pushing line: " + line);
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
    }
    if (headTagFilter.test(line)) {
      lineType = headTagType;
    }
    if (styleClassFilter.test(line)) {
      lineType = styleClassType;
    }
    if (tagPropertyFilter.test(line)) {
      lineType = tagPropertyType;
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
    var currentChild, currentParent, i, line, lineLevel, newLine, ref, results;
    currentParent = file.inProgressLines;
    currentChild = file.inProgressLines;
    results = [];
    for (line = i = 0, ref = file.source.length; (0 <= ref ? i < ref : i > ref); line = 0 <= ref ? ++i : --i) {
      lineLevel = countSpaces(file.source[line]);
      if (lineLevel >= currentParent.level) {
        if (lineLevel > currentChild.level) {
          currentParent = currentChild;
        }
        newLine = {
          source: file.source[line].slice(lineLevel),
          children: [],
          parent: currentParent,
          level: lineLevel
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
          level: lineLevel
        };
        currentParent.children.push(newLine);
        results.push(currentChild = newLine);
      }
    }
    return results;
  };

  processTypes = function(lines) {
    var i, len, line, ref, results;
    ref = lines.children;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      line = ref[i];
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

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsY0FBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxlQUFBLEVBQUEsT0FBQSxFQUFBLGNBQUEsRUFBQTs7RUFFQSxPQUFBLEdBQXNCLEVBRnRCOztFQUdBLFNBQUEsR0FBc0I7O0VBRXRCLGVBQUEsR0FBc0IsRUFMdEI7O0VBTUEsaUJBQUEsR0FBc0I7O0VBRXRCLGNBQUEsR0FBc0IsRUFSdEI7O0VBU0EsZ0JBQUEsR0FBc0I7O0VBRXRCLGlCQUFBLEdBQXNCLEVBWHRCOztFQVlBLG1CQUFBLEdBQXNCOztFQUV0QixVQUFBLEdBQXNCLEVBZHRCOztFQWVBLFlBQUEsR0FBc0I7O0VBRXRCLFVBQUEsR0FBc0IsRUFqQnRCOztFQW1CQSxZQUFBLEdBQXNCLEVBbkJ0Qjs7RUFvQkEsY0FBQSxHQUFzQjs7RUFFdEIsV0FBQSxHQUFzQjs7RUFDdEIsYUFBQSxHQUFzQjs7RUFFdEIsVUFBQSxHQUFzQjs7RUFDdEIsWUFBQSxHQUFzQjs7RUFFdEIsYUFBQSxHQUFzQixDQUFDOztFQUN2QixXQUFBLEdBQXNCOztFQUN0QixhQUFBLEdBQXNCOztFQUt0QixJQUFDLENBQUEsU0FBRCxHQUNJO0lBQUEsV0FBQSxFQUFjLFFBQUEsQ0FBQyxVQUFELENBQUE7QUFDVixVQUFBO01BQUEsU0FBQSxHQUNJO1FBQUEsTUFBQSxFQUFTLEVBQVQ7UUFDQSxlQUFBLEVBQ0k7VUFBQSxLQUFBLEVBQVEsQ0FB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cGUgICAgICAgICAgICAgPSAwICNpZiBubyBhbm90aGVyIHR5cGUgZm91bmQgYW5kIHRoaXMgaXMgbm90IGEgc2NyaXB0XG50YWdGaWx0ZXIgICAgICAgICAgID0gL15cXHMqXFx3KyAqKCggK1xcdyspPyggKik/KCAraXMoICsuKik/KT8pPyQvaVxuXG50YWdQcm9wZXJ0eVR5cGUgICAgID0gMSAjaWYgZm91bmQgcHJvcGVydHkgXCJzb21ldGhpbmdcIlxudGFnUHJvcGVydHlGaWx0ZXIgICA9IC9eXFxzKltcXHdcXC1dKyAqXCIuKlwiL1xuXG5zdHlsZUNsYXNzVHlwZSAgICAgID0gMiAjaWYgdGhpcyBpcyB0YWcgYW5kIHRoZSB0YWcgaXMgc3R5bGVcbnN0eWxlQ2xhc3NGaWx0ZXIgICAgPSAvXlxccyooc3R5bGV8Y2xhc3MpXFxzK1tcXHc6Xy1dKy9pXG5cbnN0eWxlUHJvcGVydHlUeXBlICAgPSAzICNpZiBmb3VuZCBwcm9wZXJ0eTogc29tZXRoaW5nXG5zdHlsZVByb3BlcnR5RmlsdGVyID0gL15cXHMqW15cIicgXSsgKjogKi4qL2lcblxuc3RyaW5nVHlwZSAgICAgICAgICA9IDQgI2lmIGZvdW5kIFwic3RyaW5nXCJcbnN0cmluZ0ZpbHRlciAgICAgICAgPSAvXlxccypcIi4qXCIvaVxuXG5zY3JpcHRUeXBlICAgICAgICAgID0gNSAjaWYgaXQgaXMgdW5kZXIgdGhlIHNjcmlwdCB0YWdcblxudmFyaWFibGVUeXBlICAgICAgICA9IDYgIyBpZiBmb3VuZCBuYW1lID0gc29tZXRoaW5nXG52YXJpYWJsZUZpbHRlciAgICAgID0gL15cXHMqXFx3K1xccyo9XFxzKltcXHdcXFddKy9pXG5cbmhlYWRUYWdUeXBlICAgICAgICAgPSA3XG5oZWFkVGFnRmlsdGVyICAgICAgID0gL15cXHMqKG1ldGF8dGl0bGV8bGlua3xiYXNlKS9pXG5cbm1vZHVsZVR5cGUgICAgICAgICAgPSA4XG5tb2R1bGVGaWx0ZXIgICAgICAgID0gL15cXHMqaW5jbHVkZVxccypcIi4rLmNocmlzXCIvaVxuXG5pZ25vcmFibGVUeXBlICAgICAgID0gLTJcbmVtcHR5RmlsdGVyICAgICAgICAgPSAvXltcXFdcXHNfXSokL1xuY29tbWVudEZpbHRlciAgICAgICA9IC9eXFxzKiMvaVxuXG5cblxuXG5AY2hyaXN0aW5lID1cbiAgICBjaHJpc3Rpbml6ZSA6IChzb3VyY2VUZXh0KSAtPlxuICAgICAgICBjaHJpc0ZpbGUgPVxuICAgICAgICAgICAgc291cmNlIDogW11cbiAgICAgICAgICAgIGluUHJvZ3Jlc3NMaW5lcyA6IFxuICAgICAgICAgICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG5cbiAgICAgICAgICAgIGZpbmFsIDogJydcbiAgICAgICAgXG4gICAgICAgIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMucGFyZW50ID0gY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgICAgIGNocmlzRmlsZS5zb3VyY2UgPSBjbGVhbnVwTGluZXMgc291cmNlVGV4dC5zcGxpdCAnXFxuJ1xuXG4gICAgICAgIHByb2Nlc3NIaWVyYXJjaHkgY2hyaXNGaWxlXG4gICAgICAgIHByb2Nlc3NUeXBlcyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICAgICAgY29uc29sZS5sb2cgY2hyaXNGaWxlXG5cblxuY2xlYW51cExpbmVzID0gKHNvdXJjZUxpbmVzKSAtPlxuICAgIG5ld1NvdXJjZUxpbmVzID0gbmV3IEFycmF5XG5cbiAgICBmb3IgbGluZSBpbiBzb3VyY2VMaW5lc1xuICAgICAgICBpZiBhbmFsaXNlVHlwZShsaW5lKSAhPSAtMlxuICAgICAgICAgICAgY29uc29sZS5sb2cgXCJwdXNoaW5nIGxpbmU6IFwiICsgbGluZVxuICAgICAgICAgICAgbmV3U291cmNlTGluZXMucHVzaCBsaW5lXG4gICAgXG4gICAgbmV3U291cmNlTGluZXNcblxuXG5hbmFsaXNlVHlwZSA9IChsaW5lKSAtPlxuICAgIGxpbmVUeXBlID0gLTFcblxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBjb21tZW50RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBlbXB0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlUHJvcGVydHlUeXBlIGlmIHN0eWxlUHJvcGVydHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB0YWdUeXBlIGlmIHRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IGhlYWRUYWdUeXBlIGlmIGhlYWRUYWdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHlsZUNsYXNzVHlwZSBpZiBzdHlsZUNsYXNzRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gdGFnUHJvcGVydHlUeXBlIGlmIHRhZ1Byb3BlcnR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3RyaW5nVHlwZSBpZiBzdHJpbmdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB2YXJpYWJsZVR5cGUgaWYgdmFyaWFibGVGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBtb2R1bGVUeXBlIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBcbiAgICBsaW5lVHlwZVxuXG5cblxuXG5jb3VudFNwYWNlcyA9IChsaW5lKSAtPlxuICAgIHNwYWNlcyA9IDBcbiAgICBpZiBsaW5lWzBdID09ICcgJ1xuICAgICAgICB3aGlsZSBsaW5lW3NwYWNlc10gPT0gJyAnXG4gICAgICAgICAgICBzcGFjZXMgKz0gMVxuICAgIFxuICAgIHNwYWNlc1xuXG5cbnByb2Nlc3NIaWVyYXJjaHkgPSAoZmlsZSkgLT5cbiAgICBjdXJyZW50UGFyZW50ID0gZmlsZS5pblByb2dyZXNzTGluZXNcbiAgICBjdXJyZW50Q2hpbGQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgZm9yIGxpbmUgaW4gWzAuLi5maWxlLnNvdXJjZS5sZW5ndGhdXG4gICAgICAgIGxpbmVMZXZlbCA9IGNvdW50U3BhY2VzIGZpbGUuc291cmNlW2xpbmVdXG5cbiAgICAgICAgaWYgbGluZUxldmVsID49IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgIGlmIGxpbmVMZXZlbCA+IGN1cnJlbnRDaGlsZC5sZXZlbFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Q2hpbGRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50LmNoaWxkcmVuLnB1c2ggbmV3TGluZVxuICAgICAgICAgICAgY3VycmVudENoaWxkID0gbmV3TGluZVxuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIGxpbmVMZXZlbCA8PSBjdXJyZW50UGFyZW50LmxldmVsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQucGFyZW50XG5cbiAgICAgICAgICAgIG5ld0xpbmUgPVxuICAgICAgICAgICAgICAgIHNvdXJjZSA6IGZpbGUuc291cmNlW2xpbmVdLnNsaWNlIGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBwYXJlbnQgOiBjdXJyZW50UGFyZW50XG4gICAgICAgICAgICAgICAgbGV2ZWwgOiBsaW5lTGV2ZWxcblxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5jaGlsZHJlbi5wdXNoIG5ld0xpbmVcbiAgICAgICAgICAgIGN1cnJlbnRDaGlsZCA9IG5ld0xpbmVcblxuXG5cbnByb2Nlc3NUeXBlcyA9IChsaW5lcykgLT5cbiAgICBmb3IgbGluZSBpbiBsaW5lcy5jaGlsZHJlblxuICAgICAgICBpZiBsaW5lLnNvdXJjZVxuICAgICAgICAgICAgbGluZS50eXBlID0gYW5hbGlzZVR5cGUgbGluZS5zb3VyY2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGluZS50eXBlID0gLTJcblxuICAgICAgICBpZiBsaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHByb2Nlc3NUeXBlcyBsaW5lXG5cbiJdfQ==
//# sourceURL=coffeescript