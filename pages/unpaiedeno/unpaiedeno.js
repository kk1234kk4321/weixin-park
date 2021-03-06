const app = getApp()
Page({
  data:{
    feetsData:{},
    openid:''
  },
  onLoad(res) {  
    console.log('用户信息为：', res.openId)
    this.setData({
      openid: res.openid
    })
    

    wx.setNavigationBarTitle({
      title: '待缴费'
    })
  },
  onShow(){
    var that = this
    var openid = that.data.openid
    wx.request({
      url: app.globalData.url + '/car/weixin/unpaiedeno/openid/' + encodeURI(openid),
      method: 'GET',
      data: {},
      header: {
        "content-type": 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        console.log("调用接口成功")
        console.log("feetsData====>", res)
        if (res.data.data) {
          that.setData({
            feetsData: res.data.data
          })
        } else {
          that.setData({
            feetsData: ''
          })
        }
      }
    })

  },


  paymentInfo:function(e){
    var plateNum = e.currentTarget.dataset.plateNum;
    console.log('查看缴费记录，车牌号为', e.currentTarget.dataset);
    wx.navigateTo({
      url: '/pages/paymentInfo/paymentInfo?plateNum=' + plateNum
    })
  },
  goUpdate:function(e){
    var recordId = e.currentTarget.dataset.recordId; 
    var originFee = e.currentTarget.dataset.originFee;
    var openId = app.globalData.openId;
    this.updateStatus(openId, 0, 0, recordId, originFee,0);
  },
  goDeal:function(e){
    console.log('缴费按钮触发事件：', e)
    var price = e.currentTarget.dataset.price;
    var carNo = e.currentTarget.dataset.carNo;
    var parkNo = e.currentTarget.dataset.parkNo;
    wx.navigateTo({
      url: '/pages/memberDeals/memberDeals?price=' + price+'&carNo='+carNo+'&parkNo='+parkNo+'&currCount=0&currPrice=0' ,
    })
  },
  goPay:function(e){
    console.log('支付按钮触发事件：', e.currentTarget.dataset)
    var fee = e.currentTarget.dataset.fee;
    var recordId = e.currentTarget.dataset.recordId;
    var originFee = e.currentTarget.dataset.originFee;
    var parkNo = e.currentTarget.dataset.parkNo;
    console.log('应缴金额originFee：', originFee)
    var openId = app.globalData.openId;
    var that = this
    that.generateOrder(openId, (fee * 100).toFixed(), recordId, originFee,parkNo);
    
  },
  /**生成商户订单 */
  generateOrder: function (openId, fee, recordId, originFee,parkNo) {
    console.log('生成商户订单')
    console.log('openId=', openId)
    console.log('fee=', fee)
    var that = this
    var title = '支付测试'
    fee=parseFloat(fee)
    //统一支付   
    wx.request({
      url: app.globalData.url +'/car/weixin/pay/openid/' + openId + '/title/' + title + '/fee/' + fee,
      method: 'GET',
      header: {
        "content-type": 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        console.log("调用接口成功")
        console.log(res.data)
        //发起支付   
        var timeStamp = res.data.data.timeStamp;
        console.log("timeStamp:" + timeStamp)
        var packages = res.data.data.package;
        console.log("package:" + packages)
        var paySign = res.data.data.paySign;
        console.log("paySign:" + paySign)
        var nonceStr = res.data.data.nonceStr;
        console.log("nonceStr:" + nonceStr)
        var tradeNo = res.data.data.tradeNo;
        var param = { "timeStamp": timeStamp, "package": packages, "paySign": paySign, "signType": "MD5", "nonceStr": nonceStr,"tradeNo":tradeNo };
        that.pay(param, openId, fee, recordId,originFee,parkNo)
      },
      fail: function (res) {
        console.log("接口调用失败")
        console.log(res)
      }
    })
  },
  /* 支付   */
  pay: function (param, openId, fee, recordId, originFee,parkNo) {
    var that = this
    console.log("支付")
    console.log(param)
    wx.requestPayment({
      timeStamp: param.timeStamp,
      nonceStr: param.nonceStr,
      package: param.package,
      signType: param.signType,
      paySign: param.paySign,
      success: function (res) {
        // success   
        console.log("支付成功")
        console.log(res)

        //更新支付状态
        that.updateStatus(openId, param.tradeNo, fee, recordId, originFee,parkNo);
      },
      fail: function (res) {
        // fail   
        console.log("支付失败")
        console.log(res)
      },
      complete: function () {
        // complete   
        console.log("pay complete")
      }
    })
  },
  updateStatus: function (openId, tradeNo, fee, recordId, originFee,parkNo){
    console.log('调用修改支付状态接口。。。')
    var carno = this.data.plateNum
    wx.request({
      url: app.globalData.url + '/car/weixin/parkPay/openid/' + openId + '/tradeNo/' + tradeNo + '/fee/' + fee + '/recordId/' + recordId + '/originFee/' + originFee + '/carNo/' + encodeURI(carno)+'/parkNo/'+parkNo,
      method: 'GET',
      header: {
        "content-type": 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        console.log('调用修改支付状态接口成功！')
        wx.navigateBack({
          delta: 1, // 回退前 delta(默认为1) 页面   
          success: function (res) {
            wx.showToast({
              title: '支付成功',
              icon: 'success',
              duration: 2000
            })
          },
          fail: function () {
            wx.showToast({
              title: '支付失败',
              icon: 'fail',
              duration: 2000
            })
          },
          complete: function () {
            // complete   
          }
        })
      }
    })
  },
  deleteCar: function (e) {
    var carNo = this.data.plateNum;
    wx.request({
      url: app.globalData.url + '/car/weixin/deleteCar/openid/' + app.globalData.openId + '/carno/' + encodeURI(carNo),
      method: 'GET',
      data: {},
      header: {
        "content-type": 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        console.log("调用解除绑定接口成功")
        console.log("res.data====>", res)
        wx.reLaunch({
          url: '/pages/index/index',
          success: function (res) {
            wx.showToast({
              title: '解除绑定成功',
              icon: 'success',
              duration: 2000
            })
          }
        })
      },
      fail: function (res) {
        console.log("调用解除绑定接口失败")
        console.log(res)
        wx.showToast({
          title: '解除绑定失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
})