# LINE TYPES

tagType             = 0 #if no another type found and this is not a script
tagFilter           = /^\s*\w+ *(( +\w+)?( *)?( +is( +.*)?)?)?$/i

tagPropertyType     = 1 #if found property "something"
tagPropertyFilter   = /^\s*[\w\-]+ *".*"/

styleClassType      = 2 #if this is tag and the tag is style
styleClassFilter    = /^\s*(style|class)\s+[\w:_-]+/i

stylePropertyType   = 3 #if found property: something
stylePropertyFilter = /^\s*[^"' ]+ *: *.*/i

stringType          = 4 #if found "string"
stringFilter        = /^\s*".*"/i

scriptType          = 5 #if it is under the script tag

variableType        = 6 # if found name = something
variableFilter      = /^\s*\w+\s*=\s*[\w\W]+/i

headTagType         = 7
headTagFilter       = /^\s*(meta|title|link|base)/i

moduleType          = 8
moduleFilter        = /^\s*include\s*".+.chris"/i

ignorableType       = -2
emptyFilter         = /^[\W\s_]*$/
commentFilter       = /^\s*#/i




@christine =
    christinize : (sourceText) ->
        chrisFile =
            source : []
            inProgressLines : 
                level : -1
                children : []
                source : 'html'
                type : 0

            final : ''
        
        chrisFile.inProgressLines.parent = chrisFile.inProgressLines

        chrisFile.source = cleanupLines sourceText.split '\n'

        processHierarchy chrisFile
        processTypes chrisFile.inProgressLines
        sortByTypes chrisFile.inProgressLines
        finaliseTag chrisFile.inProgressLines

        console.log chrisFile.inProgressLines.final
        chrisFile.final = chrisFile.inProgressLines.final

        console.log chrisFile


cleanupLines = (sourceLines) ->
    newSourceLines = new Array

    for line in sourceLines
        if analiseType(line) != -2
            console.log "pushing line: " + line
            newSourceLines.push line
    
    newSourceLines


analiseType = (line) ->
    lineType = -1

    lineType = ignorableType if commentFilter.test line
    lineType = ignorableType if emptyFilter.test line
    lineType = stylePropertyType if stylePropertyFilter.test line
    lineType = tagType if tagFilter.test line
    lineType = headTagType if headTagFilter.test line
    lineType = styleClassType if styleClassFilter.test line
    lineType = tagPropertyType if tagPropertyFilter.test line
    lineType = stringType if stringFilter.test line
    lineType = variableType if variableFilter.test line
    lineType = moduleType if moduleFilter.test line
    
    lineType




countSpaces = (line) ->
    spaces = 0
    if line[0] == ' '
        while line[spaces] == ' '
            spaces += 1
    
    spaces


processHierarchy = (file) ->
    currentParent = file.inProgressLines
    currentChild = file.inProgressLines

    for line in [0...file.source.length]
        lineLevel = countSpaces file.source[line]

        if lineLevel >= currentParent.level
            if lineLevel > currentChild.level
                currentParent = currentChild

            newLine =
                source : file.source[line].slice lineLevel
                children : []
                parent : currentParent
                level : lineLevel

            currentParent.children.push newLine
            currentChild = newLine

        else
            while lineLevel <= currentParent.level
                currentParent = currentParent.parent

            newLine =
                source : file.source[line].slice lineLevel
                children : []
                parent : currentParent
                level : lineLevel

            currentParent.children.push newLine
            currentChild = newLine



processTypes = (lines) ->
    for line in lines.children
        if line.source
            line.type = analiseType line.source
        else
            line.type = -2
        
        if line.children.length > 0
            processTypes line



sortByTypes = (lines) ->
    # extract the styles, properties and strings to their parents

    lastChild = lines.children.length - 1

    for line in [lastChild..0]
        if lines.children[line].children.length > 0
            sortByTypes lines.children[line]

        if lines.children[line].type == tagPropertyType
            if !lines.children[line].parent.properties
                lines.children[line].parent.properties = new Array
            
            lines.children[line].parent.properties.push lines.children[line]
            lines.children[line].parent.children.splice line , 1

            continue
        
        if lines.children[line].type == stylePropertyType
            if !lines.children[line].parent.styles
                lines.children[line].parent.styles = new Array
            
            lines.children[line].parent.styles.push lines.children[line]
            lines.children[line].parent.children.splice line , 1

            continue


finaliseTag = (line) ->
    addSpaces = ''
    if line.level > 0
        addSpaces += ' ' for i in [0..line.level]


    if line.type == 0
        line.final = addSpaces + '<' + line.source

        if line.styles
            line.final += ' style="'
            for style in line.styles
                line.final += style.source + ';'

            line.final += '"'
        
        if line.properties
            for property in line.properties
                line.final += property + ' '
        
        line.final += '>\n'

        if line.children.length > 0
            for child in line.children
                finaliseTag child
            
            for child in line.children
                line.final += child.final
        
        line.final += addSpaces + '</' + line.source + '>\n'
    
    else
        line.final = addSpaces + line.source + '\n'
    
    
