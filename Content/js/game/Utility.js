window.Utility = {};
Utility.Ajax = {};

Utility.IsEmpty = function(obj) {
	return obj == undefined || obj == null || obj == '';
};

Utility.NewGuid = function() {
	var s4 = function() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

Utility.LoadDOMElement = function(tag, id, parent, html) {	
	var tag = document.createElement(tag);
	
	if(!Utility.IsEmpty(id))
		tag.id = id;
	
	if(!Utility.IsEmpty(html))
		tag.innerHTML = html;
	
	parent.appendChild(tag);
	return tag;
};

Utility.RemoveDOMElement = function(el) {
	el.parentNode.removeChild(el);
};


/* AJAX Lite Functions */
(function() {
	function ajaxLite(e){if(typeof e=='string')e=document.getElementById(e);return e};
	function collect(a,f){var n=[];for(var i=0;i<a.length;i++){var v=f(a[i]);if(v!=null)n.push(v)}return n};

	var ajax={};
	ajax.x=function(){try{return new ActiveXObject('Msxml2.XMLHTTP')}catch(e){try{return new ActiveXObject('Microsoft.XMLHTTP')}catch(e){return new XMLHttpRequest()}}};
	ajax.serialize=function(f){var g=function(n){return f.getElementsByTagName(n)};var nv=function(e){if(e.name)return encodeURIComponent(e.name)+'='+encodeURIComponent(e.value);else return ''};var i=collect(g('input'),function(i){if((i.type!='radio'&&i.type!='checkbox')||i.checked)return nv(i)});var s=collect(g('select'),nv);var t=collect(g('textarea'),nv);return i.concat(s).concat(t).join('&');};
	ajax.send=function(u,f,m,a){var x=ajax.x();x.open(m,u,true);x.onreadystatechange=function(){if(x.readyState==4)f(x.responseText)};if(m=='POST')x.setRequestHeader('Content-type','application/x-www-form-urlencoded');x.send(a)};
	ajax.get=function(url,func){ajax.send(url,func,'GET')};
	ajax.gets=function(url){var x=ajax.x();x.open('GET',url,false);x.send(null);return x.responseText};
	ajax.post=function(url,func,args){ajax.send(url,func,'POST',args)};
	ajax.update=function(url,elm){var e=ajaxLite(elm);var f=function(r){e.innerHTML=r};ajax.get(url,f)};
	ajax.submit=function(url,elm,frm){var e=ajaxLite(elm);var f=function(r){e.innerHTML=r};ajax.post(url,f,ajax.serialize(frm))};
	Utility.Ajax = ajax;
})();
