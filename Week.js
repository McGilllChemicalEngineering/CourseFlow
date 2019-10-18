//Definition of the week class, which includes both actual weeks in the course level and just a container for nodes at the activity level.

/*    Copyright (C) 2019  SALTISE

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>*/

class Week {
    constructor(graph,wf){
        this.graph=graph;
        this.nodes=[];
        this.box;
        this.name;
        this.index;
        this.wf=wf;
        this.id = this.wf.project.genID();
    }
    
    setNameSilent(name){
        if(name!=null && name!=""){
            name = name.replace(/&/g," and ").replace(/</g,"[").replace(/>/g,"]");
            this.name=name;
            return name;
        }else{
            this.name=null;
            return this.getDefaultName();
        }
    }
    
    setName(name){
        if(name!=null && name!=""){
            name = name.replace(/&/g," and ").replace(/</g,"[").replace(/>/g,"]");
            this.graph.getModel().setValue(this.box,name);
        }else{
            this.name = null;
            this.graph.getModel().setValue(this.titleNode,this.getDefaultName());
            
        }
        
    }  
    
    getDefaultName(){
        return "Week "+(this.wf.weeks.indexOf(this)+1);
    }
    
    toXML(){
        var xml = "";
        xml+=makeXML(this.id,"weekid");
        if(this.name!=null)xml+=makeXML(this.name,"weekname");
        for(var i=0;i<this.nodes.length;i++){
            xml+=this.nodes[i].toXML();
        }
        return makeXML(xml,"week");
    }
    
    fromXML(xmlData){
        var graph = this.graph;
        var wf = this.wf;
        this.id = getXMLVal(xmlData,"weekid");
        var name = getXMLVal(xmlData,"weekname");
        if(name!=null)this.setName(name);
        var xmlnodes = xmlData.getElementsByTagName("node");
        for(var i=0;i<xmlnodes.length;i++){
            var xmlnode = xmlnodes[i];
            var column = getXMLVal(xmlnode,"column");
            var node = wf.createNodeOfType(column);
            node.week = this;
            node.fromXML(xmlnode);
            this.addNode(node);
            if(xmlnode.getElementsByTagName("isdropped").length>0)node.toggleDropDown();
        }
    }
    
    createBox(x,y,width){
        this.box = this.graph.insertVertex(this.graph.getDefaultParent(),null,'',x,y,width,emptyWeekSize,this.getStyle());
        var week = this;
        this.box.valueChanged = function(value){
            if(value==week.getDefaultName())return mxCell.prototype.valueChanged.apply(this,arguments);
            var value1 = week.setNameSilent(value);
            if(value1!=value)week.graph.getModel().setValue(week.box,value1);
            else mxCell.prototype.valueChanged.apply(this,arguments);
            
        }
        this.box.isWeek=true;
        this.box.week=this;
        this.graph.orderCells(true,[this.box]);
        this.box.cellOverlays=[];
        this.addPlusOverlay();
        this.addDelOverlay();
        this.addCopyOverlay();
        this.addMoveOverlays();
    }
    
    getStyle(){
        return defaultWeekStyle;
    }
    
    //Adds a node. If we are just switching the node, we don't need to push weeks.
    addNode(node,origin=0,index=-1){
        this.resizeWeek(node.vertex.h()+cellSpacing,origin);
        if(index<0||origin<0||index>this.nodes.length-1){this.nodes.push(node);}
        else if(origin > 0) {this.nodes.splice(0,0,node);}
        else this.nodes.splice(index,0,node);
        index=this.nodes.indexOf(node);
        node.makeFlushWithAbove(index,this);
        if(index<this.nodes.length-1)this.pushNodesFast(index+1);
        node.makeAutoLinks();
    }
    
    //Adds a node without pushing anything
    addNodeSilent(node,origin=0,index=-1){
        this.resizeWeek(node.vertex.h()+cellSpacing,origin);
        if(index<0||origin<0||index>this.nodes.length-1){this.nodes.push(node);}
        else if(origin > 0) {this.nodes.splice(0,0,node);}
        else this.nodes.splice(index,0,node);
        index=this.nodes.indexOf(node);
        node.makeFlushWithAbove(index,this);
    }
    
    //Removes a node. If we are just switching the node, we don't need to push weeks.
    removeNode(node,origin=0){
        var index=this.nodes.indexOf(node);
        this.nodes.splice(index,1);
        this.resizeWeek(-1*node.vertex.h()-cellSpacing,origin);
        if(index<this.nodes.length)this.pushNodesFast(index);
    }
    
    pushNodes(startIndex,endIndex=-1){
        if(startIndex==0) {this.nodes[0].makeFlushWithAbove(0);startIndex++;}
        if(startIndex>this.nodes.length-1)return;
        var dy = this.nodes[startIndex-1].vertex.b()+cellSpacing-this.nodes[startIndex].vertex.y();
        for(var i=startIndex;i<this.nodes.length;i++){
            this.nodes[i].moveNode(0,dy);
            if(i==endIndex)break;
        }
    }
    
    //A significantly faster version of this function, which first computes what must be moved, then moves it all at once in a single call to moveCells
    pushNodesFast(startIndex,endIndex=-1,dy=null){
        if(startIndex==0) {this.nodes[0].makeFlushWithAbove(0);startIndex++;}
        if(startIndex>this.nodes.length-1)return;
        if(dy==null)dy = this.nodes[startIndex-1].vertex.b()+cellSpacing-this.nodes[startIndex].vertex.y();
        var vertices=[];
        var brackets=[];
        for(var i=startIndex;i<this.nodes.length;i++){
            vertices.push(this.nodes[i].vertex);
            for(var j=0;j<this.nodes[i].brackets.length;j++){
                var bracket = this.nodes[i].brackets[j];
                if(brackets.indexOf(bracket)<0)brackets.push(bracket);
            }
            if(i==endIndex)break;
        }
        this.graph.moveCells(vertices,0,dy);
        for(i=0;i<brackets.length;i++)brackets[i].updateVertical();
    }
    
    getNearestNode(y){
        for(var i=0;i<this.nodes.length;i++){
            var vertex = this.nodes[i].vertex;
            //find first node AFTER the point
            if(vertex.y()+vertex.h()/2>y){
                if(i==0)return 0; //we are above the first node
                var pvertex = this.nodes[i-1].vertex;
                if(vertex.y()+vertex.h()/2-y<y-pvertex.y()-pvertex.h()/2)return i;
                return i-1;
            }
        }
        return this.nodes.length-1; //we are past the last node
    }
    
    getNextIndexFromPoint(y){
        for(var i=0;i<this.nodes.length;i++){
            var vertex = this.nodes[i].vertex;
            if(vertex.y()>y)return i;
        }
        return this.nodes.length+1;
    }
    
    shiftNode(initIndex,finalIndex){
        if(initIndex==finalIndex)return;
        var prevNode = this.wf.findNextNodeOfSameType(this.nodes[initIndex],-1)
        this.nodes.splice(finalIndex,0,this.nodes.splice(initIndex,1)[0]);
        var min = Math.min(initIndex,finalIndex);
        var max = Math.max(initIndex,finalIndex)
        this.nodes[finalIndex].makeFlushWithAbove(finalIndex);
        if(initIndex<finalIndex)this.pushNodesFast(min,max);
        else this.pushNodesFast(min+1,max);
        //Make the autolinks if needed
        if(this.nodes[finalIndex].makeAutoLinks()){
            if(prevNode!=null)prevNode.makeAutoLinks();
        }
        
    }
    
    //Lays out all the cells within the week. This should only be used for loading files, due to how slow it is.
    doLayout(){
        var y=this.box.y();
        for(i=0;i<this.nodes.length;i++){
            var cell = this.nodes[i].vertex;
            y+=cellSpacing;
            this.graph.moveCells([cell],0,y-cell.y());
            y+=cell.h();
        }
        if(y+cellSpacing>this.box.b()){
            this.resizeWeek(y+cellSpacing-this.box.h());
        }
    }
    
    makeFlushWithAbove(index){
        if(index==0) this.moveWeek(this.wf.columns[0].head.b()+cellSpacing-this.box.y());
        else this.moveWeek(this.wf.weeks[this.index-1].box.b()-this.box.y());
    }
    
    moveWeek(dy){
        this.graph.moveCells([this.box],0,dy);
        this.graph.moveCells(this.nodes.map(mapWeekVertices),0,dy);
    }
    
    resizeWeek(dy,origin){
        var rect;
        if(dy*origin>0) rect = new mxRectangle(this.box.x(),this.box.y()-dy,this.box.w(),this.box.h()+dy);
        else rect = new mxRectangle(this.box.x(),this.box.y(),this.box.w(),this.box.h()+dy);
        this.graph.resizeCells([this.box],[rect]);
        if(origin==0 && this.index<this.wf.weeks.length-1){this.wf.pushWeeksFast(this.index+1,dy);}
        return;
        
    }
    
    //Determines whether the position of the point in a week below (1), above (-1), or in (0) the week.
    relativePos(y){
        if(y>this.box.b() && this.index<this.wf.weeks.length-1)return 1;
        if(y<this.box.y() && this.index>0)return -1;
        return 0;
    }
    
    //Add the overlay to create new weeks
    addPlusOverlay(){
        var w = this;
        var overlay = new mxCellOverlay(new mxImage('resources/images/add48.png', 24, 24), 'Insert week below');
        overlay.getBounds = function(state){ //overrides default bounds
            var bounds = mxCellOverlay.prototype.getBounds.apply(this, arguments);
            var pt = state.view.getPoint(state, {x: 0, y: 0, relative: true});
            bounds.x = pt.x - bounds.width / 2;
            return bounds;
        };
        var graph = this.graph;
        overlay.cursor = 'pointer';
        overlay.addListener(mxEvent.CLICK, function(sender, plusEvent){
            graph.clearSelection();
            w.insertBelow();
            w.wf.makeUndo("Add Week",w);
        });
        this.box.cellOverlays.push(overlay);
        //this.graph.addCellOverlay(this.box, overlay);
    }
    
    //Add the overlay to delete the week
    addDelOverlay(){
        var w = this;
        var overlay = new mxCellOverlay(new mxImage('resources/images/delrect48.png', 24, 24), 'Delete this week');
        overlay.getBounds = function(state){ //overrides default bounds
            var bounds = mxCellOverlay.prototype.getBounds.apply(this, arguments);
            var pt = state.view.getPoint(state, {x: 0, y: 0, relative: true});
            bounds.y = pt.y-w.box.h()/2;
            bounds.x = pt.x-bounds.width+w.box.w()/2;
            return bounds;
        }
        var graph = this.graph;
        overlay.cursor = 'pointer';
        overlay.addListener(mxEvent.CLICK, function(sender, plusEvent){
            if(mxUtils.confirm("Delete this week? Warning: this will delete any nodes still inside!")){
                graph.clearSelection();
                w.deleteSelf();
                w.wf.makeUndo("Delete Week",w);
            }
        });
        this.box.cellOverlays.push(overlay);
        //this.graph.addCellOverlay(this.box, overlay);
    }
    
    addCopyOverlay(){
        var w = this;
        var overlay = new mxCellOverlay(new mxImage('resources/images/copy48.png', 24, 24), 'Duplicate week');
        overlay.getBounds = function(state){ //overrides default bounds
            var bounds = mxCellOverlay.prototype.getBounds.apply(this, arguments);
            var pt = state.view.getPoint(state, {x: 0, y: 0, relative: true});
            bounds.x = pt.x-bounds.width+w.box.w()/2;
            bounds.y = pt.y-w.box.h()/2+24;
            return bounds;
        };
        var graph = this.graph;
        overlay.cursor = 'pointer';
        overlay.addListener(mxEvent.CLICK, function(sender, plusEvent){
            graph.clearSelection();
            w.duplicateWeek();
        });
        this.box.cellOverlays.push(overlay);
        //this.graph.addCellOverlay(this.vertex, overlay);
    }
    
    addMoveOverlays(){
        var w = this;
        var overlayUp = new mxCellOverlay(new mxImage('resources/images/moveup24.png', 16, 16), 'Move week');
        var overlayDown = new mxCellOverlay(new mxImage('resources/images/movedown24.png', 16, 16), 'Move week');
        overlayUp.getBounds = function(state){ //overrides default bounds
            var bounds = mxCellOverlay.prototype.getBounds.apply(this, arguments);
            var pt = state.view.getPoint(state, {x: 0, y: 0, relative: true});
            bounds.x = pt.x-w.box.w()/2;
            bounds.y = pt.y-w.box.h()/2;
            return bounds;
        };
        overlayDown.getBounds = function(state){ //overrides default bounds
            var bounds = mxCellOverlay.prototype.getBounds.apply(this, arguments);
            var pt = state.view.getPoint(state, {x: 0, y: 0, relative: true});
            bounds.x = pt.x-w.box.w()/2;
            bounds.y = pt.y+w.box.h()/2-bounds.height;
            return bounds;
        };
        var graph = this.graph;
        overlayUp.cursor = 'pointer';
        overlayDown.cursor = 'pointer';
        overlayUp.addListener(mxEvent.CLICK, function(sender, plusEvent){
            graph.clearSelection();
            w.wf.moveWeek(w,-1);
        });
        overlayDown.addListener(mxEvent.CLICK, function(sender, plusEvent){
            graph.clearSelection();
            w.wf.moveWeek(w,+1);
        });
        this.box.cellOverlays.push(overlayUp);
        this.box.cellOverlays.push(overlayDown);
        //this.graph.addCellOverlay(this.vertex, overlay);
        
    }
    
    //Causes the week to delete itself and all its contents
    deleteSelf(){
        while(this.nodes.length>0){
            this.nodes[this.nodes.length-1].deleteSelf();
        }
        this.graph.removeCells([this.box]);
        this.wf.weeks.splice(this.index,1);
        this.wf.updateWeekIndices();
        //pull everything upward
        if(this.index<this.wf.weeks.length)this.wf.pushWeeksFast(this.index);
        //if we deleted all the weeks, better make a fresh one!
        if(this.wf.weeks.length==0)this.wf.createBaseWeek(this.graph);
    }
    
    //Insert a new week below
    insertBelow(){
        var newWeek = new Week(this.graph,this.wf);
        newWeek.createBox(this.box.x(),this.box.b(),weekWidth);
        this.wf.weeks.splice(this.index+1,0,newWeek);
        this.wf.updateWeekIndices();
        //push everything downward
        if(this.index<this.wf.weeks.length-2)this.wf.pushWeeksFast(this.index+2);
        
    }
    
    
    //Duplicate the week and insert the copy below
    duplicateWeek(){
        var newWeek = new Week(this.graph,this.wf);
        this.wf.weeks.splice(this.index+1,0,newWeek);
        newWeek.createBox(this.box.x(),this.box.b(),weekWidth);
        newWeek.fromXML((new DOMParser).parseFromString(this.toXML(),"text/xml"));
        this.wf.updateWeekIndices();
        //push everything downward
        if(this.index<this.wf.weeks.length-2)this.wf.pushWeeksFast(this.index+2);
        
    }
    
    
}

class WFArea extends Week{
    addDelOverlay(){}
    
    addPlusOverlay(){}
    
    addCopyOverlay(){}
    
    addMoveOverlays(){}
    
    getStyle(){
        return defaultWFAreaStyle;
    }
    
    
}