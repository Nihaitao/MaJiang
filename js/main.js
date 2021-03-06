import DataBus from './databus'
import MaJiang from './majiang/majiang'
import Music from './runtime/music'
import BackGround from './runtime/background'
import GameInfo from './runtime/gameinfo'

const wxappIo = require('./libs/socket.io-mp.js')

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight
canvas.width = screenWidth
canvas.height = screenHeight
let ctx = canvas.getContext('2d')
let databus = new DataBus()
//右上角圆球 退出页面
wx.onHide(() => {
  databus.pauseStartTime = Date.now()
  if (databus.socket) {
    if (databus.roomNumber) {
      databus.socket.emit('hidegame', databus.roomNumber)
    }
    databus.socket.disconnect()
  }
})
//进入页面
wx.onShow(res => {
  if (databus.pauseStartTime) {
    databus.pauseTotalTime += (Date.now() - databus.pauseStartTime)
  }
  if (databus.socket) {
    databus.socket.connect()
    if (databus.roomNumber) {
      databus.socket.emit('showgame', databus.roomNumber)
    }
  }
  //分享页面进入
  if (res.query && res.query.roomNumber && databus.roomNumber !== res.query.roomNumber) {
    if (!databus.socket) {
      databus.socket = wxappIo('wss://www.20180905.cn')
    }
    databus.roomNumber = res.query.roomNumber + ''
    databus.playModel = 'Double'
    databus.doubleType = 0
    if(databus.selfNickName){
      databus.joinRoom()
    }
  }
})
wx.showShareMenu({
  withShareTicket: true
})
//右上角三点 转发
wx.onShareAppMessage(function () {
  // console.log("用户点击了“转发”按钮")
  let query = ""
  let title = '这个小游戏可牛逼了！'
  if (databus.roomNumber && !databus.player2.selfNickName) {
    query = `roomNumber=${databus.roomNumber}`
    title = '来了老弟，战个痛快啊！'
  }
  return {
    title: title,
    imageUrl: 'images/19.png',
    query: query
  }
})


/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              var userInfo = res.userInfo
              databus.selfImageUrl = userInfo.avatarUrl
              databus.selfNickName = userInfo.nickName
              if (databus.playModel === 'Double') {//直接分享页面进来
                databus.joinRoom()
              } else {
                databus.playModel = 'Index'
              }
            }
          })
        } else {
          let button = wx.createUserInfoButton({
            type: 'text',
            text: '点击授权',
            style: {
              left: screenWidth / 2 - 100,
              top: screenHeight / 2,
              width: 200,
              height: 40,
              lineHeight: 40,
              backgroundColor: 'green',
              color: '#ffffff',
              textAlign: 'center',
              fontSize: 16,
              borderRadius: 4
            }
          })

          button.onTap((res) => {
            if (res.userInfo) {
              var userInfo = res.userInfo
              databus.selfImageUrl = userInfo.avatarUrl
              databus.selfNickName = userInfo.nickName
              databus.playModel = 'Index'

              button.destroy()
            }
          })
        }
      }
    })

    this.bg = new BackGround(ctx)
    this.gameInfo = new GameInfo(ctx)
    this.aniId = 0


    this.restart()
    this.touchHandler = this.touchEventHandler.bind(this)
    canvas.addEventListener('touchstart', this.touchHandler)
  }




  restart() {
    databus.reset()

    this.bindLoop = this.loop.bind(this)

    // 清除上一局的动画
    window.cancelAnimationFrame(this.aniId);
    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

  //单人模式开始游戏
  startGame() {
    databus.reset()

    this.music = new Music()
    this.music.playBegin()

    let indexArr = [{ value: 1, count: 4 }, { value: 2, count: 4 }, { value: 3, count: 4 }, { value: 4, count: 4 }, { value: 5, count: 4 }, { value: 6, count: 4 }, { value: 7, count: 4 }, { value: 8, count: 4 }, { value: 9, count: 4 }, { value: 10, count: 4 }, { value: 11, count: 4 }, { value: 12, count: 4 }, { value: 13, count: 4 }, { value: 14, count: 4 }, { value: 15, count: 4 }, { value: 16, count: 4 }, { value: 17, count: 4 }, { value: 18, count: 4 }, { value: 19, count: 4 }, { value: 20, count: 4 }, { value: 21, count: 4 }, { value: 22, count: 4 }, { value: 23, count: 4 }, { value: 24, count: 4 }, { value: 25, count: 4 }, { value: 26, count: 4 }, { value: 27, count: 4 }]
    //初始化棋盘
    let count = 108
    while (count > 0) {
      let index = Math.floor(Math.random() * indexArr.length)
      let value = indexArr[index].value
      indexArr[index].count--;
      if (indexArr[index].count === 0) {
        indexArr.splice(index, 1)
      }
      databus.mjArr.push(new MaJiang({ value, count }))
      count--
    }
    databus.mjArr = databus.mjArr.reverse()
  }
  //对战模式开始游戏
  startDoubleGame(majiangArr) {
    databus.reset()

    this.music = new Music()
    this.music.playBegin()

    if (majiangArr && majiangArr.length > 0) {
      majiangArr.forEach(item => {
        let value = item.value
        let count = item.count
        databus.mjArr.push(new MaJiang({ value, count }))
      })
    } else {
      let indexArr = [{ value: 1, count: 4 }, { value: 2, count: 4 }, { value: 3, count: 4 }, { value: 4, count: 4 }, { value: 5, count: 4 }, { value: 6, count: 4 }, { value: 7, count: 4 }, { value: 8, count: 4 }, { value: 9, count: 4 }, { value: 10, count: 4 }, { value: 11, count: 4 }, { value: 12, count: 4 }, { value: 13, count: 4 }, { value: 14, count: 4 }, { value: 15, count: 4 }, { value: 16, count: 4 }, { value: 17, count: 4 }, { value: 18, count: 4 }, { value: 19, count: 4 }, { value: 20, count: 4 }, { value: 21, count: 4 }, { value: 22, count: 4 }, { value: 23, count: 4 }, { value: 24, count: 4 }, { value: 25, count: 4 }, { value: 26, count: 4 }, { value: 27, count: 4 }]
      //初始化棋盘
      let count = 108
      while (count > 0) {
        let index = Math.floor(Math.random() * indexArr.length)
        let value = indexArr[index].value
        indexArr[index].count--;
        if (indexArr[index].count === 0) {
          indexArr.splice(index, 1)
        }
        databus.mjArr.push(new MaJiang({ value, count }))
        databus.dbMjArr.push({ 'value': value, 'count': count })
        count--
      }
      databus.mjArr = databus.mjArr.reverse()
      databus.dbMjArr = databus.dbMjArr.reverse()
    }
  }


  // 重新开始的触摸事件处理逻辑
  touchEventHandler(e) {
    e.preventDefault()
    let x = e.touches[0].clientX
    let y = e.touches[0].clientY

    //点击事件
    if (databus.playModel === 'Single') {//单人模式
      //重新开始
      if (x >= screenWidth / 2 + 120 && x <= screenWidth / 2 + 160 && y >= 10 && y <= 58) {
        this.startGame()
      }
      //提示
      else if (x >= screenWidth / 2 + 180 && x <= screenWidth / 2 + 220 && y >= 10 && y <= 58) {
        // databus.xipai()
        databus.tip()
      }
      //返回主页
      else if (x >= 0 && x <= 35 && y >= 0 && y <= 35) {
        databus.playModel = 'Index'
        databus.reset()
      }
      //游戏结束
      if (databus.gameWin) {
        let area = this.gameInfo.btnArea

        if (x >= area.startX
          && x <= area.endX
          && y >= area.startY
          && y <= area.endY)
          this.startGame()
      }
      //游戏死局
      if (databus.deadGame) {
        let area = this.gameInfo.btnXipaiArea
        if (x >= area.startX && x <= area.endX && y >= area.startY && y <= area.endY) {
          databus.xipaiAlive()
        }
      }
    } else if (databus.playModel === 'Index') {//首页
      //排行榜隐藏
      if (databus.showRankList && (x <= screenWidth * 0.1 || x >= screenWidth * 0.9 || y <= 10 || y >= screenHeight - 10)) {
        databus.showRankList = false
      }
      //排行榜显示
      else if (x >= 70 && x <= 110 && y >= 20 && y <= 60 && !databus.showRankList) {
        this.getRankList()
      }
      //角色信息
      else if (x >= 20 && x <= 60 && y >= 20 && y <= 60){
        wx.showToast({
          title: '敬请期待',
          icon: 'none',
          duration: 2000
        })
      }
      //单人模式
      else if (x >= screenWidth * 0.5 - 230 && x <= screenWidth * 0.5 - 50 && y >= screenHeight * 0.75 && y <= screenHeight * 0.75 + 60) {
        databus.playModel = 'Single'
        this.startGame()
      }
      //对战模式
      else if (x >= screenWidth * 0.5 + 50 && x <= screenWidth * 0.5 + 230 && y >= screenHeight * 0.75 && y <= screenHeight * 0.75 + 60) {
        databus.playModel = 'Double'
        databus.doubleType = 0
      }
    } else if (databus.playModel === 'Double') {
      //socket.io
      if (!databus.socket) {
        databus.socket = wxappIo('wss://www.20180905.cn')
        // databus.socket = wxappIo('ws://127.0.0.1:7001')
      }
      const socket = databus.socket
      //加入房间
      if (x >= screenWidth * 0.5 - 230 && x <= screenWidth * 0.5 - 50 && y >= screenHeight * 0.75 && y <= screenHeight * 0.75 + 60 && databus.doubleType === 0) {
        databus.keyboard = true
        wx.showKeyboard({ defaultValue: '', maxLength: 5, multipl: false, confirmHold: true, confirmType: 'done' })
        wx.onKeyboardConfirm(cb => {
          databus.roomNumber = cb.value
          databus.joinRoom()
        })
      }

      //创建房间
      else if (x >= screenWidth * 0.5 + 50 && x <= screenWidth * 0.5 + 230 && y >= screenHeight * 0.75 && y <= screenHeight * 0.75 + 60 && databus.doubleType === 0) {
        socket.emit('buildroom', databus.selfImageUrl, databus.selfNickName)
        if (!socket._callbacks.$buildroomres) {
          socket.on('buildroomres', msg => {
            console.log('我创建了房间')
            databus.doubleType = 1
            databus.roomNumber = msg
            databus.player1 = { ready: false, selfImageUrl: databus.selfImageUrl, selfNickName: databus.selfNickName, score: 0 }

            if (!socket._callbacks.$waitForJoin) {
              socket.on('waitForJoin', rsp => {
                console.log('对方加入了房间')
                databus.player2 = { ready: rsp.ready, selfImageUrl: rsp.selfImageUrl, selfNickName: rsp.selfNickName, score: 0 }
              })
            }
            if (!socket._callbacks.$waitForReady) {
              socket.on('waitForReady', rsp => {
                console.log('对方准备了')
                databus.player2.ready = true
              })
            }
            if (!socket._callbacks.$leave) {
              socket.on('leave', rsp => {
                if (rsp === 0) {
                  console.log('对方离开了')
                  databus.player2 = {}
                  databus.player1.ready = false
                } else {
                  console.log('对方逃跑了')
                  databus.playerIsLeave = true
                }
              })
            }
          })
        }
      }
      //返回
      else if (x >= 0 && x <= 45 && y >= 0 && y <= 45) {
        if (databus.keyboard) {
          wx.hideKeyboard()
          wx.offKeyboardConfirm()
          databus.keyboard = false
        } else if (databus.doubleType === 0) {
          databus.playModel = 'Index'
        } else if (databus.doubleType === 1) {
          databus.confirmLeaveRoom = true
        }
      }
      //对战模式【准备】
      else if (x >= screenWidth / 2 - 40 && x <= screenWidth / 2 + 40 && y >= screenHeight / 2 - 20 && y <= screenHeight / 2 + 20 && databus.doubleType === 1 && !databus.player1['ready']) {
        console.log('我准备了')
        databus.player1['ready'] = true
        if (databus.player2.ready) {
          console.log('对方先准备，我点击了准备，开始游戏')
          this.startDoubleGame()
        } else {
          if (!socket._callbacks.$waitForStart) {
            socket.on('waitForStart', rsp => {
              console.log('开始游戏')
              this.startDoubleGame(rsp.dbMjArr)
              databus.player2.ready = true
              databus.myRound = false//对手先动
              //等待我的回合
              if (!socket._callbacks.$myround) {
                socket.on('myround', rsp => {
                  if (databus.myRound) {//如果本身是自己回合，跳出
                    return
                  }
                  console.log('轮到我了')
                  databus.dyadicArr = rsp.dyadicArr
                  databus.player2.score = rsp.totalScore
                  const lag = rsp.lag || 0
                  if (rsp.movePath) {
                    //模拟对手动作
                    if (rsp.movePath.step === 0) {//闪烁消失
                      databus.mjArr.forEach(mj => {
                        if (mj.visible && mj.col === rsp.movePath.start.col && mj.row === rsp.movePath.start.row) {
                          mj.blink(lag)
                        } else if (mj.visible && mj.col === rsp.movePath.end.col && mj.row === rsp.movePath.end.row) {
                          mj.blink(lag)
                        }
                      })
                    } else if (rsp.movePath.counts === "0") {
                      databus.mjArr.forEach(mj => {
                        if (mj.visible && mj.col === rsp.movePath.start.col && mj.row === rsp.movePath.start.row) {
                          mj.moveBlink(rsp.movePath.step, rsp.movePath.move, true, lag)
                        } else if (mj.visible && mj.col === rsp.movePath.end.col && mj.row === rsp.movePath.end.row) {
                          setTimeout(() => { mj.blink(lag) }, 1000)
                        }
                      })
                    } else if (rsp.movePath.counts > 0) {
                      let i = 1
                      while (i <= rsp.movePath.counts) {
                        let row = rsp.movePath.start.row
                        let col = rsp.movePath.start.col
                        if (rsp.movePath.move === 'left') {
                          col -= i
                        } else if (rsp.movePath.move === 'right') {
                          col += i
                        } else if (rsp.movePath.move === 'up') {
                          row -= i
                        } else if (rsp.movePath.move === 'down') {
                          row += i
                        }
                        databus.mjArr.forEach(mj => {
                          if (mj.visible && mj.col === col && mj.row === row) {
                            mj.moveBlink(rsp.movePath.step, rsp.movePath.move, false)
                          }
                        })
                        i++
                      }
                      databus.mjArr.forEach(mj => {
                        if (mj.visible && mj.col === rsp.movePath.start.col && mj.row === rsp.movePath.start.row) {
                          mj.moveBlink(rsp.movePath.step, rsp.movePath.move, true, lag)
                        } else if (mj.visible && mj.col === rsp.movePath.end.col && mj.row === rsp.movePath.end.row) {
                          setTimeout(() => { mj.blink(lag) }, 1000)
                        }
                      })
                    }
                  } else {//对手超时
                    databus.myRound = true
                    databus.startTime = Date.now()
                  }

                  //判断是否死局
                  setTimeout(() => {
                    if (databus.testingGameDead()) {
                      //自动洗牌
                      databus.totalScore += 2000 //调用单机模式接口
                      databus.xipaiAlive()
                      //通知对方洗牌成功
                      socket.emit('shuffleGame', databus.roomNumber, databus.dyadicArr)
                    }
                  }, 2001)
                })
              }
              //监听对方是否洗牌
              if (!socket._callbacks.$shuffle) {
                socket.on('shuffle', rsp => {
                  databus.dyadicArr = rsp.dyadicArr
                  databus.shuffle()
                })
              }
            })
          }
        }
        console.log(databus.roomNumber)
        socket.emit('readygame', databus.roomNumber, databus.dbMjArr)
      }
      //离开房间确认按钮
      if (databus.confirmLeaveRoom) {

        let yes = this.gameInfo.btnLeaveYes
        let no = this.gameInfo.btnLeaveNo

        if (yes && x >= yes.startX && x <= yes.endX && y >= yes.startY && y <= yes.endY) {
          if (databus.player1.ready && databus.player2.ready) {//游戏已开始

            console.log('我逃跑了')
            socket.emit('leaveroom', databus.roomNumber, 1)
          } else {//游戏尚未开始
            socket.emit('leaveroom', databus.roomNumber, 0)
            console.log('我离开了')
          }
          databus.resetDouble()
        } else if (no && x >= no.startX && x <= no.endX && y >= no.startY && y <= no.endY) {
          databus.confirmLeaveRoom = false
        }
      }

      //游戏结束确认按钮
      if (databus.gameWin || databus.playerIsLeave) {

        let area = this.gameInfo.gameoverArea
        if (area && x >= area.startX && x <= area.endX && y >= area.startY && y <= area.endY) {
          console.log('游戏结束')
          databus.resetDouble()
        }
      }

    }
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    let isAniPlaying = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    this.bg.render(ctx)
    if (databus.playModel === 'Single' || (databus.playModel === 'Double' && databus.player1.ready && databus.player2.ready && databus.mjArr.length > 0)) {//单人模式|对战模式开始
      //根据麻row排序，防止靠下面的麻将覆盖上面的
      for (let i = 0; i < databus.mjArr.length - 1; i++) {
        if (databus.mjArr[i].visible) {
          for (let j = i + 1; j < databus.mjArr.length; j++) {
            if (databus.mjArr[j].visible && databus.mjArr[i].row < databus.mjArr[j].row) {
              let temp
              temp = databus.mjArr[i]
              databus.mjArr[i] = databus.mjArr[j]
              databus.mjArr[j] = temp
            }
          }
        }
      }
      //重绘每一个麻将
      databus.mjArr.forEach(item => {
        if (item.visible) {
          item.drawToCanvas(ctx)
          isAniPlaying = true
        }
      })
      databus.scorelist.forEach(item => {
        item.drawToCanvas(ctx)
      })
      this.gameInfo.render(ctx)
      //GameOver
      if (!isAniPlaying) {
        databus.gameWin = true
        this.music.playWin()
        this.saveScore()
      }
    } else if (databus.playModel === 'Double') {

      this.gameInfo.render(ctx)

    } else {
      this.gameInfo.render(ctx)

    }

  }

  // 游戏逻辑更新主函数
  update() {
    if (databus.gameWin) {
      return;
    }
    databus.scorelist = databus.scorelist.filter(item => { return item.y > 100 })
    databus.scorelist.forEach(item => {
      item.update()
    })
  }
  // 实现游戏帧循环
  loop() {
    this.update()
    this.render()
    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

  //保存得分
  saveScore() {
    if (!databus.SaveTheScore) {
      databus.SaveTheScore = true
      wx.cloud.callFunction({
        name: 'addRank',
        data: { avatarUrl: databus.selfImageUrl, nickName: databus.selfNickName, score: databus.totalScore }
      }).then(res => {
        // console.log(res)
      })
    }
  }

  //获取排行榜
  getRankList() {
    if (databus.rankList.length === 0) {
      wx.showLoading()
    } else {
      databus.showRankList = true
    }
    wx.cloud.callFunction({
      name: 'getRankList'
    }).then(res => {
      wx.hideLoading()
      databus.showRankList = true
      databus.rankList = res.result.data
    })
  }
}