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
wx.onHide(() => {
  databus.pauseStartTime = Date.now()
})
wx.onShow(() => {
  if (databus.pauseStartTime) {
    databus.pauseTotalTime += (Date.now() - databus.pauseStartTime)
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
              databus.playModel = 'Index'
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


    if (databus.gameWin) {
      let area = this.gameInfo.btnArea

      if (x >= area.startX
        && x <= area.endX
        && y >= area.startY
        && y <= area.endY)
        this.startGame()
    }

    //点击事件
    if (databus.playModel === 'Single') {//单人模式
      //重新开始
      if (x >= screenWidth / 2 + 100 && x <= screenWidth / 2 + 130 && y >= 10 && y <= 56) {
        this.startGame()
      }
      //洗牌
      else if (x >= screenWidth / 2 + 150 && x <= screenWidth / 2 + 180 && y >= 10 && y <= 56) {
        this.xipai()
      }
      //返回主页
      else if (x >= 0 && x <= 30 && y >= 0 && y <= 30) {
        databus.playModel = 'Index'
        databus.reset()
      }
    } else if (databus.playModel === 'Index') {//首页
      //排行榜
      if (x >= 10 && x <= 70 && y >= 10 && y <= 70) {
        if (databus.showRankList) {
          databus.showRankList = false
        } else {
          this.getRankList()
        }
      }
      //单人模式
      else if (x >= screenWidth * 0.2 && x <= screenWidth * 0.2 + 120 && y >= screenHeight - 90 && y <= screenHeight - 60) {
        databus.playModel = 'Single'
        this.startGame()
      }
      //对战模式
      else if (x >= screenWidth * 0.8 - 120 && x <= screenWidth * 0.8 && y >= screenHeight - 90 && y <= screenHeight - 60) {
        databus.playModel = 'Double'
        databus.doubleType = 0
      }
    } else if (databus.playModel === 'Double') {
      //socket.io
      if (!databus.socket) {
        databus.socket = wxappIo('https://www.20180905.cn/mj/')
      }
      const socket = databus.socket
      //加入房间
      if (x >= screenWidth * 0.2 && x <= screenWidth * 0.2 + 120 && y >= screenHeight - 90 && y <= screenHeight - 60 && databus.doubleType === 0) {
        databus.keyboard = true
        wx.showKeyboard({ defaultValue: '', maxLength: 5, multipl: false, confirmHold: true, confirmType: 'done' })
        wx.onKeyboardConfirm(cb => {
          databus.roomNumber = cb.value
          socket.emit('joinroom', cb.value, databus.selfImageUrl, databus.selfNickName)
          if (!socket._callbacks.$joinroomres) {
            socket.on('joinroomres', rsp => {
              if (rsp.msg === 'success') {
                console.log('我加入了房间')
                databus.doubleType = 1
                databus.player1 = { ready: false, selfImageUrl: databus.selfImageUrl, selfNickName: databus.selfNickName, score: 0 }
                databus.player2 = { ready: rsp.ready, selfImageUrl: rsp.selfImageUrl, selfNickName: rsp.selfNickName, score: 0 }
                databus.keyboard = false
                wx.hideKeyboard()
                wx.offKeyboardConfirm()
              } else if (rsp.msg === 'fail') {
                databus.errorInfo = '没有找到相应房间'
                setTimeout(() => { databus.errorInfo = '' }, 1000)
              } else if (rsp.msg === 'full'){
                databus.errorInfo = '房间已满'
                setTimeout(() => { databus.errorInfo = '' }, 1000)
              } else {
                databus.errorInfo = '网络错误'
                setTimeout(() => { databus.errorInfo = '' }, 1000)
              }
            });
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
                databus.player2 = {}
                databus.player1.ready = false
                console.log('对方离开了房间')
              } else {
                console.log('对方逃跑了')
                databus.playerIsLeave = true
              }
            })
          }
          //对方退出后就成了房主
          if (!socket._callbacks.$waitForJoin) {
            socket.on('waitForJoin', rsp => {
              console.log('我是新房主，对手加入了房间')
              databus.player2 = { ready: rsp.ready, selfImageUrl: rsp.selfImageUrl, selfNickName: rsp.selfNickName, score: 0 }
            })
          }
        })
      }

      //创建房间
      else if (x >= screenWidth * 0.8 - 120 && x <= screenWidth * 0.8 && y >= screenHeight - 90 && y <= screenHeight - 60 && databus.doubleType === 0) {
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
      else if (x >= 0 && x <= 30 && y >= 0 && y <= 30) {
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
                  console.log('轮到我了')
                  databus.dyadicArr = rsp.dyadicArr
                  databus.player2.score = rsp.totalScore
                  if (rsp.movePath) {
                    //模拟对手动作
                    if (rsp.movePath.step === 0) {//闪烁消失
                      databus.mjArr.forEach(mj => {
                        if (mj.visible && mj.col === rsp.movePath.start.col && mj.row === rsp.movePath.start.row) {
                          mj.blink()
                        } else if (mj.visible && mj.col === rsp.movePath.end.col && mj.row === rsp.movePath.end.row) {
                          mj.blink()
                        }
                      })
                    } else if (rsp.movePath.counts === "0") {
                      databus.mjArr.forEach(mj => {
                        if (mj.visible && mj.col === rsp.movePath.start.col && mj.row === rsp.movePath.start.row) {
                          mj.moveBlink(rsp.movePath.step, rsp.movePath.move, true)
                        } else if (mj.visible && mj.col === rsp.movePath.end.col && mj.row === rsp.movePath.end.row) {
                          setTimeout(() => { mj.blink() }, 1000)
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
                          mj.moveBlink(rsp.movePath.step, rsp.movePath.move, true)
                        } else if (mj.visible && mj.col === rsp.movePath.end.col && mj.row === rsp.movePath.end.row) {
                          setTimeout(() => { mj.blink() }, 1000)
                        }
                      })
                    }
                  } else {//对手超时
                    databus.myRound = true
                    databus.startTime = Date.now()
                  }
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

  //重新洗牌
  xipai() {

    if (databus.totalScore < 2000)
      return
    databus.totalScore -= 2000
    let arr = []
    for (let i = 0; i < databus.dyadicArr.length; i++) {
      for (let j = 0; j < databus.dyadicArr[i].length; j++) {
        if (databus.dyadicArr[i][j] > 0) {
          arr.push(databus.dyadicArr[i][j])
        }
      }
    }
    for (let i = 0; i < databus.dyadicArr.length; i++) {
      for (let j = 0; j < databus.dyadicArr[i].length; j++) {
        if (databus.dyadicArr[i][j] > 0) {
          let index = Math.floor(Math.random() * arr.length)
          databus.dyadicArr[i][j] = arr[index]
          arr.splice(index, 1)
        }
      }
    }

    databus.mjArr.forEach(item => {
      if (item.visible) {
        item.img.src = `images/${databus.dyadicArr[item.row][item.col]}.png`
        item.Identification = databus.dyadicArr[item.row][item.col]
      }
    })
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
    databus.showRankList = true
    wx.cloud.callFunction({
      name: 'getRankList'
    }).then(res => {
      databus.rankList = res.result.data
    })
  }

}