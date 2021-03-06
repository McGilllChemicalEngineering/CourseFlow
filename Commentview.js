//The visualization of a comment to be instantiated in the Workflowview.

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

class Commentview{
    constructor(graph,comment){
        this.graph=graph;
        this.comment=comment;
        this.vertex;
        this.state=false;
    }
    
    createVertex(){
        var parent;
        if(this.comment.parent)parent = this.comment.parent.view.vertex;
        else parent = this.graph.getDefaultParent();
        this.vertex = this.graph.insertVertex(parent,null,'',this.comment.x,this.comment.y,defaultCommentSize,defaultCommentSize,defaultCommentStyle);
        this.vertex.isComment=true;
        this.vertex.comment=this.comment;
        this.vertex.cellOverlays=[];
        this.addDelOverlay();
    }
    
    show(){
        var com = this.comment;
        var graphWrapper = document.getElementById("graphContainer");
        var clickDiv = document.createElement('div');
        clickDiv.className = "commentDiv";
        var parentOffsetx = 0;
        var parentOffsety = 0;
        if(com.parent){parentOffsetx = com.parent.view.vertex.x();parentOffsety = com.parent.view.vertex.y();}
        clickDiv.style.left=int(com.x)+parentOffsetx+"px";
        clickDiv.style.top=int(com.y)+parentOffsety+"px";
        var textDiv=document.createElement('div');
        textDiv.innerHTML=com.text;
        clickDiv.appendChild(textDiv);
        var inputField = document.createElement("textarea");
        var inputButton = document.createElement("button");
        inputButton.innerHTML=LANGUAGE_TEXT.comment.addcomment[USER_LANGUAGE];
        
        
        var appendComment = function(evt2){
            com.text+="<p>"+inputField.value.replace(/\n/g,"<br>")+"</p>";
            inputField.value="";
            textDiv.innerHTML=com.text;
        }
        inputButton.addEventListener('click',appendComment);
        clickDiv.appendChild(inputField);
        clickDiv.appendChild(inputButton);
        graphWrapper.appendChild(clickDiv);
        
        //removes the div when the user clicks outside the element. The first click bubbles up, and causes the state to change ONLY once it hits the top.
        var outsideClickListener = function(evt2){
            if(!(clickDiv.contains(evt2.target)) && com.view.state){
                removeDiv();
                com.view.state=false;
            }else{com.view.state=true;}
        };

        function removeDiv(){
            clickDiv.parentElement.removeChild(clickDiv);
            document.removeEventListener('click',outsideClickListener);
        };
        document.addEventListener('click',outsideClickListener);
        
        
    }
    
    //Add the overlay to delete the node
    addDelOverlay(){
        var n = this.comment;
        var overlay = new mxCellOverlay(new mxImage(iconpath+'delrect.svg', 12, 12), LANGUAGE_TEXT.comment.delete[USER_LANGUAGE]);
        overlay.getBounds = function(state){ //overrides default bounds
            var bounds = mxCellOverlay.prototype.getBounds.apply(this, arguments);
            var pt = state.view.getPoint(state, {x: 0, y: 0, relative: true});
            bounds.y = pt.y-n.view.vertex.h()/2;
            bounds.x = pt.x-bounds.width+n.view.vertex.w()/2;
            return bounds;
        }
        var graph = this.graph;
        overlay.cursor = 'pointer';
        overlay.addListener(mxEvent.CLICK, function(sender, plusEvent){
            if(mxUtils.confirm(LANGUAGE_TEXT.confirm.deletecomment[USER_LANGUAGE])){
                graph.clearSelection();
                n.deleteSelf();
                n.wf.updated("Delete Comment",n);
            }
        });
        this.vertex.cellOverlays.push(overlay);
        //n.graph.addCellOverlay(n.vertex, overlay);
    }
    
    deleted(){
        this.graph.removeCells([this.vertex]);
    }
    
    populateMenu(menu){
        this.comment.populateMenu(menu);
    }
}