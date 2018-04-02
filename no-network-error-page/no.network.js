function noNetWork(){
	document.querySelector('.mui-content').innerHTML = '<div class="no-network-container">'+
					'<span>网络加载失败</span>'+
					'<span>请检查网络后，点击重新加载</span>'+
					'<span onclick="retry()">重新加载</span>'+
					'</div>'
}

function retry() {
	plus.webview.currentWebview().loadURL('productDetail.html')
}
