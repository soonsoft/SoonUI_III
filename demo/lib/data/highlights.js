;(function(ui) {
	ui.theme.highlights = [
		{"Name":"琥珀色","Id":"Amber","Color":"#F29D00"},
		{"Name":"蓝色","Id":"Blue","Color":"#2078EF"},
		{"Name":"褐色","Id":"Brown","Color":"#752918"},
		{"Name":"洋红","Id":"Carmine","Color":"#FF2968"},
		{"Name":"青色","Id":"Cyan","Color":"#00CCCC"},
		{"Name":"暗红","Id":"DarkRed","Color":"#990000"},
		{"Name":"藏蓝","Id":"Default","Color":"#3E5A99"},
		{"Name":"草绿","Id":"GrassGreen","Color":"#99DA0D"},
		{"Name":"灰色","Id":"Gray","Color":"#909090"},
		{"Name":"绿","Id":"Green","Color":"#008A00"},
		{"Name":"靛蓝","Id":"Indigo","Color":"#5122B5"},
		{"Name":"光","Id":"Light","Color":"#FFCC00"},
		{"Name":"橙色","Id":"Orange","Color":"#FF8627"},
		{"Name":"粉红","Id":"Pink","Color":"#F567C5"},
		{"Name":"粉紫","Id":"PinkPurple","Color":"#A988DF"},
		{"Name":"紫","Id":"Purple","Color":"#9F4AC9"},
		{"Name":"玫瑰红","Id":"Rose","Color":"#BF1E4B"},
		{"Name":"海蓝","Id":"SeaBlue","Color":"#0F80C1"},
		{"Name":"天蓝","Id":"SkyBlue","Color":"#5DB2FF"},
		{"Name":"天际","Id":"SkyLine","Color":"#00C8F8"},
		{"Name":"亮绿色","Id":"GreenLight","Color":"#66FF99"},
		{"Name":"唇色","Id":"Lip","Color":"#D783A7"},
		{"Name":"金色","Id":"Golden","Color":"#BDB76B"},
		{"Name":"红色","Id":"Red","Color":"#E53935"},
		{"Name":"深空灰","Id":"SpaceGray","Color":"#616161"},
		{"Name":"翡翠","Id":"Jade","Color":"#1ABC9C"},
		{"Name":"蓝灰","Id":"BlueGray","Color":"#4B8BAE"},
		{"Name":"橄榄","Id":"Olive","Color":"#8AAD92"}
	];

	ui.page.ready(function(e) {
		//初始化主题
		var sheet = $("#" + ui.theme.highlightSheetId),
			highlight = null;
		if(sheet.length == 0) {
			return;
		}
		highlight = sheet.prop("href");
		highlight = highlight.substr(highlight.lastIndexOf("/"));
		highlight = highlight.split(".");
		highlight = highlight[highlight.length - 2];
		
		ui.theme.currentHighlight = ui.theme.getHighlight(highlight);
	}, ui.eventPriority.masterReady);
})(window.ui);
