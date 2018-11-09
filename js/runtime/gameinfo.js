import DataBus from '../databus'
const screenWidth = window.innerWidth
const screenHeight = window.innerHeight
// 菜单图片
const IMG_BG_SRC = 'images/replay.png'
const IMG_BG_WIDTH = 40
const IMG_BG_HEIGHT = 40

let atlas = new Image()
atlas.src = 'images/Common.png'

let databus = new DataBus()
let instance

export default class GameInfo {
  constructor() {
    if (instance)
      return instance
    instance = this    
  }

  render(ctx) {
    if (databus.gameWin){
      this.renderGameOver(ctx, databus.totalScore)
    }else{
      this.renderTime(ctx)
      this.renderTotalScore(ctx)
      this.renderGameStart(ctx)
    }
  }

  renderGameStart(ctx) {
    let atlas = new Image()
    atlas.src = IMG_BG_SRC
    ctx.drawImage(atlas, 10, 10, IMG_BG_WIDTH, IMG_BG_HEIGHT)
  }

  renderGameOver(ctx, score, time) {
    ctx.drawImage(atlas, 0, 0, 119, 108, screenWidth / 2 - 150, screenHeight / 2 - 150, 300, 300)

    ctx.fillStyle = "#ffffff"
    ctx.font = "20px Arial"

    ctx.fillText(
      '游戏结束',
      screenWidth / 2 - 40,
      screenHeight / 2 - 100 
    )

    ctx.fillText(
      '得分: ' + score,
      screenWidth / 2 - 40,
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
      screenWidth / 2 - 40,
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



  renderTotalScore(ctx) {
    ctx.font = "30px Verdana"
    ctx.fillStyle = "black"
    ctx.fillText(`score:${databus.totalScore}`, screenWidth - 300, 40)
  }


  renderTime(ctx) {
    ctx.font = "30px Verdana"
    ctx.fillStyle = "black"
    ctx.fillText(databus.getCurrentTime(), 75, 40)
  }
}