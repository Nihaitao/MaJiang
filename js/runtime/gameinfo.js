import DataBus from '../databus'
const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

let databus = new DataBus()

//首页
let indexImg = new Image()
indexImg.src = 'images/welcome.jpg'

//重玩
let reStartImg = new Image()
reStartImg.src = 'images/replay.png'

//洗牌
let xpImg = new Image()
xpImg.src = 'images/xipai.png'


//返回
let backImg = new Image()
backImg.src = 'images/back.png'


//游戏结束
let atlas = new Image()
atlas.src = 'images/Common.png'

//排行榜
let rankImg = new Image()
rankImg.src = 'images/rank.png'

let instance
export default class GameInfo {
  constructor() {
    if (instance)
      return instance
    instance = this
  }

  render(ctx) {
    if (databus.playModel === 'Index') {
      this.renderIndex(ctx)
      this.renderRank(ctx)
      if (databus.showRankList) {
        this.renderRankList(ctx)
      }
    } else if (databus.playModel === 'Single') {
      if (databus.gameWin) {
        this.renderGameOver(ctx, databus.totalScore)
      } else {
        this.renderTime(ctx)
        this.renderTotalScore(ctx)
        this.renderGameStart(ctx)
        this.renderGameXipai(ctx)
        this.renderUserinfo(ctx)
        this.renderBack(ctx)
      }

    } else if (databus.playModel === 'Double') {
      this.renderBack(ctx)
      if (databus.doubleType === 0) {//等待加入房间
        this.renderDouble(ctx)
      } else if (databus.doubleType === 1) {//已加入房间|开始游戏
        this.renderDoubleRoom(ctx)
        if (databus.confirmLeaveRoom){//确认离开房间对话框
          this.renderConfirmLeave(ctx)
        }
      } 
    }

    if (databus.errorInfo !== ''){
      this.showError(ctx, databus.errorInfo)
    }
  }

  //首页面
  renderIndex(ctx) {
    ctx.drawImage(indexImg, screenWidth * 0.1, screenHeight * 0.3, screenWidth * 0.8, screenWidth * 0.8 * 0.16)

    ctx.font = "30px Verdana"
    ctx.fillStyle = "black"
    ctx.textAlign = "center"
    ctx.fillText('单人模式', screenWidth * 0.3, screenHeight - 60)
    ctx.fillText('对战模式', screenWidth * 0.7, screenHeight - 60)
  }
  //重新开始
  renderGameStart(ctx) {
    ctx.drawImage(reStartImg, screenWidth / 2 + 100, 10, 30, 46)
  }
  //洗牌
  renderGameXipai(ctx) {
    ctx.drawImage(xpImg, screenWidth / 2 + 150, 10, 30, 46)
  }
  //角色信息
  renderUserinfo(ctx) {
    let roleImg = new Image()
    roleImg.src = databus.selfImageUrl
    ctx.drawImage(roleImg, 60, 10, 48, 48)
    ctx.font = "30px Arial"
    ctx.fillStyle = "#fff"
    ctx.textAlign = "left"
    ctx.fillText(databus.selfNickName, 120, 30, 120)
  }
  //返回主页
  renderBack(ctx) {
    ctx.drawImage(backImg, 5, 5, 24, 24)
  }

  //排行榜
  renderRank(ctx) {
    ctx.drawImage(rankImg, 20, 20, 40, 40)
  }
  //得分
  renderTotalScore(ctx) {
    ctx.font = "36px Arial"
    ctx.fillStyle = "#fff"
    ctx.textAlign = "center"
    ctx.fillText(databus.totalScore, screenWidth / 2 , 50)
  }
  //时间
  renderTime(ctx) {
    ctx.font = "24px Arial"
    ctx.fillStyle = "#fff"
    ctx.textAlign = "left"
    ctx.fillText(databus.getCurrentTime(), 120, 60)
  }
  //游戏结束
  renderGameOver(ctx, score, time) {
    ctx.drawImage(atlas, 0, 0, 118, 106, screenWidth / 2 - 150, screenHeight / 2 - 150, 300, 300)

    ctx.fillStyle = "#ffffff"
    ctx.font = "20px Arial"
    ctx.textAlign = "center"
    ctx.fillText(
      '游戏结束',
      screenWidth / 2,
      screenHeight / 2 - 100
    )

    ctx.fillText(
      '得分: ' + score,
      screenWidth / 2 ,
      screenHeight / 2 - 100 + 80
    )

    ctx.drawImage(
      atlas,
      120, 6, 39, 24,
      screenWidth / 2 - 60,
      screenHeight / 2 - 100 + 130,
      120, 40
    )

    ctx.fillText(
      '重新开始',
      screenWidth / 2,
      screenHeight / 2 - 100 + 155
    )

    /**
     * 重新开始按钮区域
     * 方便简易判断按钮点击
     */
    this.btnArea = {
      startX: screenWidth / 2 - 40,
      startY: screenHeight / 2 - 100 + 130,
      endX: screenWidth / 2 + 50,
      endY: screenHeight / 2 - 100 + 205
    }
  }
  //对战模式
  renderDouble(ctx) {
    //对战模式
    ctx.font = "30px Arial"
    ctx.fillStyle = "black"
    ctx.textAlign = "center"
    ctx.fillText('加入房间', screenWidth * 0.3, screenHeight - 60)
    ctx.fillText('创建房间', screenWidth * 0.7, screenHeight - 60)
  }
  //对战模式
  renderDoubleRoom(ctx) {  
    let play1 = new Image()
    play1.src = databus.player1['selfImageUrl']
    ctx.drawImage(play1, 60, 10, 48, 48)
    ctx.font = "30px Arial"
    ctx.fillStyle = "#fff"
    ctx.textAlign = "left"
    ctx.fillText(databus.player1['selfNickName'], 120, 30, 120)  
    if (databus.player2['selfNickName'] && databus.player2['selfImageUrl']){
      //玩家2
      let play2 = new Image()
      play2.src = databus.player2['selfImageUrl']
      ctx.drawImage(play2, screenWidth - 108, 10, 48, 48)
      ctx.font = "30px Arial"
      ctx.fillStyle = "#fff"
      ctx.textAlign = "right"
      ctx.fillText(databus.player2['selfNickName'], screenWidth - 118 , 30, 120) 
      
      if (databus.player1['ready'] && databus.player2['ready']) {//游戏开始
        if(databus.playerIsLeave){//对方逃跑
          this.renderLeaveTips(ctx)
        }
        //得分
        ctx.font = "24px Arial"
        ctx.fillStyle = "#fff"
        ctx.textAlign = "left"
        ctx.fillText(databus.player1.score, 120, 60)
        ctx.textAlign = "right"
        ctx.fillText(databus.player2.score, screenWidth - 118, 60)     
        //倒计时
        ctx.font = "48px Arial"
        if (databus.myRound) {
          ctx.fillStyle = "#fff"
        } else {
          ctx.fillStyle = "#000"
        }
        ctx.textAlign = "center"
        ctx.fillText(databus.getCountDown(), screenWidth / 2, 55)

      }else{//准备阶段
        if (databus.player1['ready']) {
          ctx.fillStyle = "#e0c410"
          ctx.font = "bold 20px Arial"
          ctx.textAlign = "left"
          ctx.fillText('Ready', 130, 55, 120)
        } else {
          ctx.fillStyle = "#000"
          ctx.font = "36px Arial"
          ctx.textAlign = "center"
          ctx.fillText('准备', screenWidth / 2 , screenHeight / 2)
        }
        if (databus.player2['ready']) {
          ctx.fillStyle = "#e0c410"
          ctx.font = "bold 20px Arial"
          ctx.textAlign = "right"
          ctx.fillText('Ready', screenWidth - 128, 55, 120)
        } else {
          ctx.fillStyle = "#bfbfbf"
          ctx.font = "bold 20px Arial"
          ctx.textAlign = "right"
          ctx.fillText('UnReady', screenWidth - 128, 55, 120)
        }
      }
    } else {
      ctx.textAlign = "center"
      ctx.fillStyle = "#fff"
      ctx.font = "36px Arial"
      ctx.fillText(databus.roomNumber, screenWidth / 2, screenHeight / 2 - 18)
      ctx.font = "24px Arial"
      ctx.fillText('请等待玩家', screenWidth / 2, screenHeight / 2 + 24)
    }

  }
  //离开确认框
  renderConfirmLeave(ctx) {
    ctx.drawImage(atlas, 268, 126, 115, 85, screenWidth / 2 - 200 , screenHeight / 2 - 100, 400, 200)
    ctx.fillStyle = "#000"
    ctx.font = "30px Arial"
    ctx.textAlign = "center"
    ctx.fillText(
      '确认离开',
      screenWidth / 2,
      screenHeight / 2
    )

    ctx.drawImage(
      atlas,
      120, 6, 39, 24,
      screenWidth / 2 - 150,
      screenHeight / 2 - 100 + 130,
      120, 40
    )
    ctx.drawImage(
      atlas,
      120, 6, 39, 24,
      screenWidth / 2 + 30,
      screenHeight / 2 - 100 + 130,
      120, 40
    )
    ctx.font = "20px Arial"
    ctx.fillStyle = "#fff"
    ctx.fillText(
      '确定',
      screenWidth / 2 - 90,
      screenHeight / 2 - 100 + 155
    )
    ctx.fillText(
      '取消',
      screenWidth / 2 + 90,
      screenHeight / 2 - 100 + 155
    )

    this.btnLeaveYes = {
      startX: screenWidth / 2 - 150,
      startY: screenHeight / 2 - 100 + 130,
      endX: screenWidth / 2 - 20,
      endY: screenHeight / 2 - 100 + 180
    }
    this.btnLeaveNo = {
      startX: screenWidth / 2 + 20,
      startY: screenHeight / 2 - 100 + 130,
      endX: screenWidth / 2 + 150,
      endY: screenHeight / 2 - 100 + 180
    }
  }
  //提示对方已经离开游戏
  renderLeaveTips(ctx) {
    ctx.drawImage(atlas, 0, 0, 118, 106, screenWidth / 2 - 150, screenHeight / 2 - 150, 300, 300)

    ctx.fillStyle = "#ffffff"
    ctx.font = "20px Arial"
    ctx.textAlign = "center"
    ctx.fillText(
      '游戏胜利',
      screenWidth / 2,
      screenHeight / 2 - 100
    )

    ctx.fillText(
      '对方已落荒而逃' ,
      screenWidth / 2,
      screenHeight / 2 - 100 + 80
    )

    ctx.drawImage(
      atlas,
      120, 6, 39, 24,
      screenWidth / 2 - 60,
      screenHeight / 2 - 100 + 130,
      120, 40
    )

    ctx.fillText(
      '确定',
      screenWidth / 2,
      screenHeight / 2 - 100 + 155
    )

    /**
     * 重新开始按钮区域
     * 方便简易判断按钮点击
     */
    this.gameoverArea = {
      startX: screenWidth / 2 - 40,
      startY: screenHeight / 2 - 100 + 130,
      endX: screenWidth / 2 + 50,
      endY: screenHeight / 2 - 100 + 180
    }
  }
  //排行榜
  renderRankList(ctx) {
    const startY = 20
    const rankHeight = screenHeight - 40
    const startX = screenWidth * 0.1
    const rankWidth = screenWidth * 0.8
    ctx.fillStyle = "rgba(26,22,16,0.7)"
    ctx.fillRect(startX, startY, rankWidth, rankHeight)
    ctx.fillStyle = "gold"
    ctx.font = "24px Arial"
    ctx.textAlign = "left"

    databus.rankList.forEach((item, index) => {
      let count = index + 1
      let Y = startY + 58 * count
      if (Y > rankHeight) {
        return
      }
      //序号
      ctx.fillText(count, startX + 10, Y)
      //头像
      let img = new Image()
      img.src = item.face
      ctx.drawImage(img, startX + 40, Y - 35, 48, 48)
      //名称
      ctx.fillText(item.name, startX + 95, Y, rankWidth / 2 - 100)
      //分数
      ctx.fillText(item.score, startX + rankWidth / 2, Y, rankWidth / 4 - 10)
      //时间
      ctx.fillText(databus.timeFormat('MM-dd hh:mm', item.time), startX + rankWidth / 4 * 3, Y, rankWidth / 4 - 10)
    })

  }

  showError(ctx, info) {
    ctx.font = "20px Arial"
    ctx.fillStyle = "#fff"
    ctx.textAlign = "center"
    ctx.fillText(info, screenWidth / 2, screenHeight * 0.1)
  }
}