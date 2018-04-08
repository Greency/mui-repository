var util = {
	/*
	 *写入剪切板
	 *@param {String} str 复制的内容
	 * */
	copyToClip: function(str) {
		//android剪切板
		if(mui.os.android) {
			var Context = plus.android.importClass("android.content.Context"),
				main = plus.android.runtimeMainActivity(),
				clip = main.getSystemService(Context.CLIPBOARD_SERVICE)
			plus.android.invoke(clip, "setText", str)
		} else {
			//ios剪切板
			var UIPasteboard = plus.ios.importClass("UIPasteboard"),
				generalPasteboard = UIPasteboard.generalPasteboard()
			generalPasteboard.setValueforPasteboardType(str, "public.utf8-plain-text")
		}
	},
	/*
	 *读取剪切板
	 *@return {String} 前切板的内容
	 * */
	pasteFromClip: function() {
		//android前切板
		if(mui.os.android) {
			var Context = plus.android.importClass("android.content.Context"),
				main = plus.android.runtimeMainActivity(),
				clip = main.getSystemService(Context.CLIPBOARD_SERVICE)
			return plus.android.invoke(clip, "getText")
		} else {
			//ios剪切板
			var UIPasteboard = plus.ios.importClass("UIPasteboard"),
				generalPasteboard = UIPasteboard.generalPasteboard()
			return generalPasteboard.valueForPasteboardType("public.utf8-plain-text")
		}

	},
	/*
	 *提示信息
	 *@param {String} promptMessage 提示信息
	 * */
	showToast: function(promptMessage) {
		plus.nativeUI.toast(promptMessage, {
			duration: "long"
		})
	},
	/*
	 *等待框显示
	 *@return {Object} w 等待框
	 * */
	showWaiting: function() {
		var w = null
		if(plus.os.name === 'Android') {
			w = plus.nativeUI.showWaiting()
		}
		return w
	},
	/*
	 *等贷款关闭
	 *@param {Object} w 等待框对象
	 * */
	closeWaiting: function(w) {
		w && w.close()
		w = null
	},
	/*
	 *用户移动端emoji表情在数据库中的存储
	 *用于把用utf16编码的字符转换成实体字符，以供后台存储 
	 *@param  {String} str 将要转换的字符串，其中含有utf16字符将被自动检出 
	 *@return {String} str   转换后的字符串，utf16字符将被转换成&#xxxx;形式的实体字符 
	 * */
	utf16toEntities: function(str) {
		var reg = /[\ud800-\udbff][\udc00-\udfff]/g,
			str = str.replace(reg, function(char) {
				var H, L, code
				if(char.length === 2) {
					H = char.charCodeAt(0)
					L = char.charCodeAt(1)
					code = (H - 0xD800) * 0x400 + 0x10000 + L - 0xDC00
					return "&#" + code + ";"
				} else {
					return char
				}
			})
		return str
	},
	/*
	 *&#xxxxxx;形式的字符串存入数据库后
	 *读出来的形式为 &amp;#xxxxxx;
	 *此种格式html解析不出来原有的符号
	 *&被转成了&amp;
	 *此方法是将字符串中的&amp;转成&
	 *@param {String} str 未被转换的字符串
	 *@return {String} str 转换后的字符串
	 * */
	changeToStr: function(str) {
		var reg = /&amp;/g,
			str = str.replace(reg, function(char) {
				return '&'
			})
		return str
	},
	/*
	 *验证手机号
	 *@param {String} phoneNumber 手机号
	 *@return {Boolean} 
	 * */
	verifyPhoneNumber: function(phoneNumber) {
		if(/^1[3|4|5|8][0-9]\d{8}$/.test(phoneNumber)) {
			return true
		} else {
			return false
		}
	},
	/*
	 *将undefined转换为约定的值
	 *@param {String|Number|Object} initValue 初始值
	 *@param {String|Number} translateValue 需要将undefined值转换成什么值
	 *@return {String|Number} translateValue 转换后的值 
	 * */
	translateUndefined: function(initValue, translateValue) {
		if(typeof initValue === 'undefined' || initValue === null) {
			return translateValue
		} else {
			return initValue
		}
	},
	/*
	 *创建新的webView并打开 
	 *@param {Object} options 配置 {id,url,titleText,createNew,extras,show}
	 * */
	openWebView: function(options) {
		var _titleText = options.titleText || '',
			_creatNew = options.createNew || false,
			_extras = options.extras || {},
			_show = {
				autoShow: true,
				aniShow: "slide-in-right",
				duration: 600
			}
		
		mui.extend(_show, options.show)
		if(!plus.webview.getWebviewById(options.id)){
			//如果此窗口不存在，就创建一个新的窗口
			plus.webview.create(options.url, options.id, {}, _extras)
		}
		plus.webview.show(options.id, _show.aniShow, _show.aniShow, _show.duration)
	},
	/**
	 *识别淘口令 
	 *@param {FUNCTION} toPayCallback
	 */
	recognitionTkl: function(toPayCallback) {
		var content = this.pasteFromClip().trim(), //获取剪切版中的内容
			self = this
		if(content != '') {
			//当前切板中的内容不为空时才想服务器请求识别淘口令
			mui.ajax('https://wxzapi.jubaisi.cn/Home/Goods/tkl', {
				type: 'POST',
				dataType: 'json',
				data: {
					content: content
				},
				success: function(data) {
					//console.log(data)
					if(data.price) {
						//淘口令有返佣再回有price字段存在
						//alert(data.url)
						mui.confirm(data.content, '分享购买', ['去购买', '取消'], function(e) {
							var index = e.index
							if(index === 0) {
								//判断用户是否登陆成功
								if(plus.storage.getItem('isLogin') === '1') {
									toPayCallback(data.url)
								} else {
									self.showToast('登录后才能购买！')
								}
							}
						})
					}
					//清空前切板中的内容
					self.copyToClip('')
				},
				error: function() {}
			})
		}
	},
	/**
	 *判断是否有网 
	 *@param {String} url 没网时，点击刷新要加载的页面
	 * */
	hasNetWork: function(url){
		var self = this
		if(plus.networkinfo.getCurrentType() === plus.networkinfo.CONNECTION_NONE){
			document.querySelector('.mui-content').innerHTML = '<div class="no-network-container" style="box-sizing: border-box;display: flex;flex-wrap: wrap;justify-content: center;width: 90%;padding: 5px 10px;margin: auto;margin-top: 200px;font-size: 15px;background-color: white;border-radius: 5px;">'+
					'<span style="width: 100%;text-align: center;">网络加载失败</span>'+
					'<span style="width: 100%;text-align: center;">请检查网络后，点击重新加载</span>'+
					'<span class="cy-retry" style="margin-top: 20px;padding: 5px 10px;background-color: red;color: white;border-radius: 5px;">重新加载</span>'+
					'</div>'
			//防止重复绑定事件
			mui('.no-network-container').off('tap','.cy-retry',function(){})
			mui('.no-network-container').on('tap','.cy-retry',function(){
				plus.webview.currentWebview().loadURL(url)
			})
			return false
		}
		return true
	}
}