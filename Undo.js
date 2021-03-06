//A class to store a basic undo object. This stores a snapshot of an xml for a workflow as well as the source of the undo.

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


class Undo{
    constructor(wf,type,source){
        this.wf = wf;
        this.type = type;
        this.source = source;
        wf.saveXMLData();
        this.xml = wf.xmlData;
        this.tagSets = [];
        for(var i=0;i<wf.tagSets.length;i++)this.tagSets.push(wf.tagSets[i].id);
        this.usedWF = [];
        for(var i=0;i<wf.children.length;i++)this.usedWF.push(wf.children[i].id);
        
    }
    
    
    
    
    
}