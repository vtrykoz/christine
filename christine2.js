(function() {
  // LINE TYPES
  var analiseType, cleanupLines, commentFilter, countSpaces, emptyFilter, headTagFilter, headTagType, ignorableType, moduleFilter, moduleType, processHierarchy, processTypes, scriptType, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

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
      sortByTypes(chrisFile.inProgressLines);
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

  sortByTypes = function(lines) {
    var i, lastChild, line, ref, results;
    // extract the styles, properties and strings to their parents
    lastChild = lines.children.length - 1;
    results = [];
    for (line = i = ref = lastChild; (ref <= 0 ? i <= 0 : i >= 0); line = ref <= 0 ? ++i : --i) {
      if (lines.children[line].children.length > 0) {
        sortByTypes(lines.children[line]);
      }
      if (lines.children[line].type === tagPropertyType) {
        if (!lines.children[line].parent.properties) {
          lines.children[line].parent.properties = new Array;
        }
        lines.children[line].parent.properties.push(lines.children[line]);
        lines.children[line].parent.children.splice(line, 1);
        continue;
      }
      if (lines.children[line].type === stylePropertyType) {
        if (!lines.children[line].parent.styles) {
          lines.children[line].parent.styles = new Array;
        }
        lines.children[line].parent.styles.push(lines.children[line]);
        lines.children[line].parent.children.splice(line, 1);
        continue;
      }
      if (lines.children[line].type === stringType) {
        if (!lines.children[line].parent.strings) {
          lines.children[line].parent.strings = new Array;
        }
        lines.children[line].parent.strings.push(lines.children[line]);
        lines.children[line].parent.children.splice(line, 1);
        continue;
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxnQkFBQSxFQUFBLGNBQUEsRUFBQSxtQkFBQSxFQUFBLGlCQUFBLEVBQUEsU0FBQSxFQUFBLGlCQUFBLEVBQUEsZUFBQSxFQUFBLE9BQUEsRUFBQSxjQUFBLEVBQUE7O0VBRUEsT0FBQSxHQUFzQixFQUZ0Qjs7RUFHQSxTQUFBLEdBQXNCOztFQUV0QixlQUFBLEdBQXNCLEVBTHRCOztFQU1BLGlCQUFBLEdBQXNCOztFQUV0QixjQUFBLEdBQXNCLEVBUnRCOztFQVNBLGdCQUFBLEdBQXNCOztFQUV0QixpQkFBQSxHQUFzQixFQVh0Qjs7RUFZQSxtQkFBQSxHQUFzQjs7RUFFdEIsVUFBQSxHQUFzQixFQWR0Qjs7RUFlQSxZQUFBLEdBQXNCOztFQUV0QixVQUFBLEdBQXNCLEVBakJ0Qjs7RUFtQkEsWUFBQSxHQUFzQixFQW5CdEI7O0VBb0JBLGNBQUEsR0FBc0I7O0VBRXRCLFdBQUEsR0FBc0I7O0VBQ3RCLGFBQUEsR0FBc0I7O0VBRXRCLFVBQUEsR0FBc0I7O0VBQ3RCLFlBQUEsR0FBc0I7O0VBRXRCLGFBQUEsR0FBc0IsQ0FBQzs7RUFDdkIsV0FBQSxHQUFzQjs7RUFDdEIsYUFBQSxHQUFzQjs7RUFLdEIsSUFBQyxDQUFBLFNBQUQsR0FDSTtJQUFBLFdBQUEsRUFBYyxRQUFBLENBQUMsVUFBRCxDQUFBO0FBQ1YsVUFBQTtNQUFBLFNBQUEsR0FDSTtRQUFBLE1BQUEsRUFBUyxFQUFUO1FBQ0EsZUFBQSxFQUNJO1VBQUEsS0FB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LENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBbkMsQ0FBd0MsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQXZEO1FBQ0EsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQXJDLENBQTRDLElBQTVDLEVBQW1ELENBQW5EO0FBRUEsaUJBUEo7O01BU0EsSUFBRyxLQUFLLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBSyxDQUFDLElBQXJCLEtBQTZCLFVBQWhDO1FBQ0ksSUFBRyxDQUFDLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsTUFBTSxDQUFDLE9BQWhDO1VBQ0ksS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxNQUFNLENBQUMsT0FBNUIsR0FBc0MsSUFBSSxNQUQ5Qzs7UUFHQSxLQUFLLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBcEMsQ0FBeUMsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQXhEO1FBQ0EsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQXJDLENBQTRDLElBQTVDLEVBQW1ELENBQW5EO0FBRUEsaUJBUEo7T0FBQSxNQUFBOzZCQUFBOztJQXRCSixDQUFBOztFQUxVO0FBOUlkIiwic291cmNlc0NvbnRlbnQiOlsiIyBMSU5FIFRZUEVTXG5cbnRhZ1R5cGUgICAgICAgICAgICAgPSAwICNpZiBubyBhbm90aGVyIHR5cGUgZm91bmQgYW5kIHRoaXMgaXMgbm90IGEgc2NyaXB0XG50YWdGaWx0ZXIgICAgICAgICAgID0gL15cXHMqXFx3KyAqKCggK1xcdyspPyggKik/KCAraXMoICsuKik/KT8pPyQvaVxuXG50YWdQcm9wZXJ0eVR5cGUgICAgID0gMSAjaWYgZm91bmQgcHJvcGVydHkgXCJzb21ldGhpbmdcIlxudGFnUHJvcGVydHlGaWx0ZXIgICA9IC9eXFxzKltcXHdcXC1dKyAqXCIuKlwiL1xuXG5zdHlsZUNsYXNzVHlwZSAgICAgID0gMiAjaWYgdGhpcyBpcyB0YWcgYW5kIHRoZSB0YWcgaXMgc3R5bGVcbnN0eWxlQ2xhc3NGaWx0ZXIgICAgPSAvXlxccyooc3R5bGV8Y2xhc3MpXFxzK1tcXHc6Xy1dKy9pXG5cbnN0eWxlUHJvcGVydHlUeXBlICAgPSAzICNpZiBmb3VuZCBwcm9wZXJ0eTogc29tZXRoaW5nXG5zdHlsZVByb3BlcnR5RmlsdGVyID0gL15cXHMqW15cIicgXSsgKjogKi4qL2lcblxuc3RyaW5nVHlwZSAgICAgICAgICA9IDQgI2lmIGZvdW5kIFwic3RyaW5nXCJcbnN0cmluZ0ZpbHRlciAgICAgICAgPSAvXlxccypcIi4qXCIvaVxuXG5zY3JpcHRUeXBlICAgICAgICAgID0gNSAjaWYgaXQgaXMgdW5kZXIgdGhlIHNjcmlwdCB0YWdcblxudmFyaWFibGVUeXBlICAgICAgICA9IDYgIyBpZiBmb3VuZCBuYW1lID0gc29tZXRoaW5nXG52YXJpYWJsZUZpbHRlciAgICAgID0gL15cXHMqXFx3K1xccyo9XFxzKltcXHdcXFddKy9pXG5cbmhlYWRUYWdUeXBlICAgICAgICAgPSA3XG5oZWFkVGFnRmlsdGVyICAgICAgID0gL15cXHMqKG1ldGF8dGl0bGV8bGlua3xiYXNlKS9pXG5cbm1vZHVsZVR5cGUgICAgICAgICAgPSA4XG5tb2R1bGVGaWx0ZXIgICAgICAgID0gL15cXHMqaW5jbHVkZVxccypcIi4rLmNocmlzXCIvaVxuXG5pZ25vcmFibGVUeXBlICAgICAgID0gLTJcbmVtcHR5RmlsdGVyICAgICAgICAgPSAvXltcXFdcXHNfXSokL1xuY29tbWVudEZpbHRlciAgICAgICA9IC9eXFxzKiMvaVxuXG5cblxuXG5AY2hyaXN0aW5lID1cbiAgICBjaHJpc3Rpbml6ZSA6IChzb3VyY2VUZXh0KSAtPlxuICAgICAgICBjaHJpc0ZpbGUgPVxuICAgICAgICAgICAgc291cmNlIDogW11cbiAgICAgICAgICAgIGluUHJvZ3Jlc3NMaW5lcyA6IFxuICAgICAgICAgICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG5cbiAgICAgICAgICAgIGZpbmFsIDogJydcbiAgICAgICAgXG4gICAgICAgIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMucGFyZW50ID0gY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgICAgIGNocmlzRmlsZS5zb3VyY2UgPSBjbGVhbnVwTGluZXMgc291cmNlVGV4dC5zcGxpdCAnXFxuJ1xuXG4gICAgICAgIHByb2Nlc3NIaWVyYXJjaHkgY2hyaXNGaWxlXG4gICAgICAgIHByb2Nlc3NUeXBlcyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIHNvcnRCeVR5cGVzIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgICAgICBjb25zb2xlLmxvZyBjaHJpc0ZpbGVcblxuXG5jbGVhbnVwTGluZXMgPSAoc291cmNlTGluZXMpIC0+XG4gICAgbmV3U291cmNlTGluZXMgPSBuZXcgQXJyYXlcblxuICAgIGZvciBsaW5lIGluIHNvdXJjZUxpbmVzXG4gICAgICAgIGlmIGFuYWxpc2VUeXBlKGxpbmUpICE9IC0yXG4gICAgICAgICAgICBjb25zb2xlLmxvZyBcInB1c2hpbmcgbGluZTogXCIgKyBsaW5lXG4gICAgICAgICAgICBuZXdTb3VyY2VMaW5lcy5wdXNoIGxpbmVcbiAgICBcbiAgICBuZXdTb3VyY2VMaW5lc1xuXG5cbmFuYWxpc2VUeXBlID0gKGxpbmUpIC0+XG4gICAgbGluZVR5cGUgPSAtMVxuXG4gICAgbGluZVR5cGUgPSBpZ25vcmFibGVUeXBlIGlmIGNvbW1lbnRGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBpZ25vcmFibGVUeXBlIGlmIGVtcHR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3R5bGVQcm9wZXJ0eVR5cGUgaWYgc3R5bGVQcm9wZXJ0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHRhZ1R5cGUgaWYgdGFnRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gaGVhZFRhZ1R5cGUgaWYgaGVhZFRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlQ2xhc3NUeXBlIGlmIHN0eWxlQ2xhc3NGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB0YWdQcm9wZXJ0eVR5cGUgaWYgdGFnUHJvcGVydHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHJpbmdUeXBlIGlmIHN0cmluZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHZhcmlhYmxlVHlwZSBpZiB2YXJpYWJsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IG1vZHVsZVR5cGUgaWYgbW9kdWxlRmlsdGVyLnRlc3QgbGluZVxuICAgIFxuICAgIGxpbmVUeXBlXG5cblxuXG5cbmNvdW50U3BhY2VzID0gKGxpbmUpIC0+XG4gICAgc3BhY2VzID0gMFxuICAgIGlmIGxpbmVbMF0gPT0gJyAnXG4gICAgICAgIHdoaWxlIGxpbmVbc3BhY2VzXSA9PSAnICdcbiAgICAgICAgICAgIHNwYWNlcyArPSAxXG4gICAgXG4gICAgc3BhY2VzXG5cblxucHJvY2Vzc0hpZXJhcmNoeSA9IChmaWxlKSAtPlxuICAgIGN1cnJlbnRQYXJlbnQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGN1cnJlbnRDaGlsZCA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICBmb3IgbGluZSBpbiBbMC4uLmZpbGUuc291cmNlLmxlbmd0aF1cbiAgICAgICAgbGluZUxldmVsID0gY291bnRTcGFjZXMgZmlsZS5zb3VyY2VbbGluZV1cblxuICAgICAgICBpZiBsaW5lTGV2ZWwgPj0gY3VycmVudFBhcmVudC5sZXZlbFxuICAgICAgICAgICAgaWYgbGluZUxldmVsID4gY3VycmVudENoaWxkLmxldmVsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRDaGlsZFxuXG4gICAgICAgICAgICBuZXdMaW5lID1cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiBmaWxlLnNvdXJjZVtsaW5lXS5zbGljZSBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICAgICAgcGFyZW50IDogY3VycmVudFBhcmVudFxuICAgICAgICAgICAgICAgIGxldmVsIDogbGluZUxldmVsXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgbGluZUxldmVsIDw9IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50LmNoaWxkcmVuLnB1c2ggbmV3TGluZVxuICAgICAgICAgICAgY3VycmVudENoaWxkID0gbmV3TGluZVxuXG5cblxucHJvY2Vzc1R5cGVzID0gKGxpbmVzKSAtPlxuICAgIGZvciBsaW5lIGluIGxpbmVzLmNoaWxkcmVuXG4gICAgICAgIGlmIGxpbmUuc291cmNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSBhbmFsaXNlVHlwZSBsaW5lLnNvdXJjZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSAtMlxuICAgICAgICBcbiAgICAgICAgaWYgbGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICBwcm9jZXNzVHlwZXMgbGluZVxuXG5cblxuc29ydEJ5VHlwZXMgPSAobGluZXMpIC0+XG4gICAgIyBleHRyYWN0IHRoZSBzdHlsZXMsIHByb3BlcnRpZXMgYW5kIHN0cmluZ3MgdG8gdGhlaXIgcGFyZW50c1xuXG4gICAgbGFzdENoaWxkID0gbGluZXMuY2hpbGRyZW4ubGVuZ3RoIC0gMVxuXG4gICAgZm9yIGxpbmUgaW4gW2xhc3RDaGlsZC4uMF1cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0uY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgc29ydEJ5VHlwZXMgbGluZXMuY2hpbGRyZW5bbGluZV1cblxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHRhZ1Byb3BlcnR5VHlwZVxuICAgICAgICAgICAgaWYgIWxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXMgPSBuZXcgQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXMucHVzaCBsaW5lcy5jaGlsZHJlbltsaW5lXVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICBcbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSBzdHlsZVByb3BlcnR5VHlwZVxuICAgICAgICAgICAgaWYgIWxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXNcbiAgICAgICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXMucHVzaCBsaW5lcy5jaGlsZHJlbltsaW5lXVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICBcbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSBzdHJpbmdUeXBlXG4gICAgICAgICAgICBpZiAhbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0cmluZ3NcbiAgICAgICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3RyaW5ncyA9IG5ldyBBcnJheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3RyaW5ncy5wdXNoIGxpbmVzLmNoaWxkcmVuW2xpbmVdXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlIGxpbmUgLCAxXG5cbiAgICAgICAgICAgIGNvbnRpbnVlIl19
//# sourceURL=coffeescript