@f16 =
    createFromComponent : (component, additionalData, additionalUpdate) ->
        cloneData = JSON.parse JSON.stringify component.data

        mergeObjects = (objFrom, objTo) ->
            for k in Object.keys(objFrom)
                if typeof objTo[k] != 'object'
                    objTo[k] = objFrom[k]
                else
                    if typeof objFrom[k] == 'object'
                        mergeObjects objFrom[k], objTo[k]
                    else
                        objTo[k] = objFrom[k]

            objTo

        if additionalData
            mergeObjects additionalData, cloneData
                

        onUpdate = new Array
        onUpdate.push additionalUpdate if additionalUpdate
        onUpdate.push component.onUpdate

        newComponentCopy = f16.createFromTemplate component.template, cloneData, onUpdate, component.onCreated
        newComponentCopy
        

    createFromTemplate : (template, data, onUpdate, onCreated) ->
        newEl = template.cloneNode true
        newEl.removeAttribute 'id'
        newEl.classList.toggle 'hidden', false

        newElobj = 
            type : 'f16'
            template :
                node : newEl
                nodesToUpdate : []
                
            node : newEl
            data : data
            children : []
            add : (child) ->
                this.children.push child

                if child.placement
                    whereToPlace = this.node.getElementsByTagName('levelTagPlacement')[0]
                    whereToPlace.parentNode.insertBefore child.node, whereToPlace
                else
                    this.node.appendChild child.node

                child.update()
            
            addBefore : (child) ->
                @children.unshift child
                @node.insertBefore child.node, @node.children[0]
                child.update()

            onUpdate : onUpdate
            onCreated : onCreated

            update : () ->
                for nodeToUpdate in this.template.nodesToUpdate
                    nodeToUpdate.node.nodeValue = f16.processVars nodeToUpdate.template, this.data
                ###
                for i in [0...this.children.length]
                    try
                        this.children[i].node.parentNode.removeChild this.children[i].node
                    
                this.node.innerHTML = f16.processVars this.template, this.data
                for i in [0...this.children.length]
                    this.node.appendChild this.children[i].node
                    this.children[i].update()
                ###
        
        childrenToUpdate = f16.parseChildNodes newElobj.node
        
        for c in childrenToUpdate
            n =
                node : c
                template : c.nodeValue
                
            newElobj.template.nodesToUpdate.push n
        
        
        #window[template.id] = template
        #if template.parentNode
        #    template.parentNode.removeChild template

        newElobj.node.parentREl = newElobj
        newElobj.update()
        newElobj.onCreated() if newElobj.onCreated

        if newElobj.onUpdate
            if Array.isArray(newElobj.onUpdate)
                for f in [0...newElobj.onUpdate.length]
                    newElobj.onUpdate[f] = newElobj.onUpdate[f].bind(newElobj)
                    newElobj.onUpdate[f]()
            else
                newElobj.onUpdate()

        watch data, () ->
            newElobj.data = data
            newElobj.update()
            if newElobj.onUpdate
                if Array.isArray(newElobj.onUpdate)
                    for f in [0...newElobj.onUpdate.length]
                        newElobj.onUpdate[f]()
                else
                    newElobj.onUpdate()

        newElobj
    
    
    parseChildNodes : (node) ->
        childs = new Array
        
        for child in node.childNodes
            if child.nodeType == Node.TEXT_NODE
                childs.push child
            else
                if child.hasChildNodes
                    childChilds = f16.parseChildNodes child
                    for childChild in childChilds
                        childs.push childChild
        
        childs
    
    
    createIterator : (parameters) ->
        newIterator =
            parent : parameters.parent
            template : parameters.template
            data : parameters.data
            onUpdate : parameters.onUpdate
            onCreated : parameters.onCreated
            children : []
            update : () ->
                newChildren = new Array
                oldChildrenData = new Array
                
                for i in [0...this.children.length]
                    oldChildrenData.push this.children[i].data
                
                checkDiff = f16.diff oldChildrenData, this.data # CHECK THE DIFFERENCE
                
                p = 0
                
                for i in [0...checkDiff.length]                 # NEUTRAL ELEMENT
                    if checkDiff[i].action == ' '
                        newChildren.push this.children[checkDiff[i].oldPosition]
                    
                    
                    
                    if checkDiff[i].action == '+'
                        if checkDiff[i].isMoved == false        # CREATE NEW ELEMENT
                            newChild = f16.createFromTemplate this.template, this.data[p], this.onUpdate, this.onCreated
                            try
                                this.parent.insertBefore newChild.node, this.children[p].node
                            catch
                                this.parent.appendChild newChild.node
                            newChildren.push newChild
                        
                        else                                    # MOVE ELEMENT
                            
                            if newChildren[newChildren.length]
                                this.parent.insertBefore this.children[checkDiff[i].isMoved].node, newChildren[newChildren.length].node
                            else
                                this.parent.appendChild this.children[checkDiff[i].isMoved].node
                            
                            newChildren.push this.children[checkDiff[i].isMoved]
                    
                    
                    
                    if checkDiff[i].action == '-'               # REMOVE ELEMENT
                        this.parent.removeChild this.children[checkDiff[i].position].node
                        p -= 1
                    
                    p += 1
                
                this.children = newChildren
            
            
        for i in [0...newIterator.data.length]
            newObj = this.createFromTemplate newIterator.template, newIterator.data[i], newIterator.onUpdate, newIterator.onCreated
            
            newIterator.parent.appendChild newObj.node
            
            newIterator.children.push newObj
            
        watch parameters.data, () ->
            newIterator.update()
        
        newIterator
    
    
    
    diff : (old, neu) ->
        isMoved = (whatFind, whereFind) ->
            for i in [0...whereFind.length]
                if whatFind == whereFind[i]
                    return i
            return false

        N = old.length
        M = neu.length
        MAX = M + N
        offs = MAX + 1

        iRange = 2 * MAX
        V = new Array
        paths = new Array

        elementsToMove = new Array
        elementsToDelete = new Array

        for i in [0..iRange]
            V.push(0)

        paths.push(new Array) for i in [0..iRange]

        for D in [0..MAX]
            for k in [(0 - D)..D] by 2
                goDown = (k == (0 - D)) || ((k != D) && (V[k - 1 + offs] < V[k + 1 + offs]))
                if goDown
                    x = V[k + 1 + offs]
                    path = paths[k + 1 + offs].slice(0)
                    y = x - k

                    if (y > 0) && (y <= neu.length)
                        newElement = new Object
                        newElement =
                            position : y - 1
                            action : '+'
                            value : neu[y - 1]
                            isMoved : isMoved(neu[y - 1], old)
                        path.push newElement

                else
                    x = V[k - 1 + offs] + 1

                    path = paths[k - 1 + offs].slice(0)

                    if (x > 0) && (x <= old.length)
                        delElement = new Object
                        delElement =
                            position : x - 1
                            action : '-'
                            value : old[x - 1]
                            isMoved : isMoved(old[x - 1], neu)
                        path.push delElement

                y = x - k

                while (x < N) and (y < M) and (old[x] == neu[y])
                    stayElement = new Object
                    stayElement =
                        oldPosition : x
                        position : y
                        action : ' '
                        value : neu[y]
                    path.push stayElement

                    x += 1
                    y += 1

                V[k + offs] = x
                paths[k + offs] = path


                if x >= N and y >= M
                    return path
    
    
    
    processVars : (el, vars) ->
        allVars = Object.keys vars

        for i in [0...allVars.length]
            r = new RegExp '{{' + allVars[i] + '}}', 'g'
            el = el.replace r, vars[allVars[i]]

        el