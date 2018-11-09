const width = window.innerWidth / 2 - 80
const height = window.innerHeight / 2 - 30

export default class Score {
  constructor() {
  }

  drawToCanvas(ctx){
    ctx.font = "60px Verdana"
    // 创建渐变
    var gradient = ctx.createLinearGradient(width, height, width + 200 , height + 80)
    gradient.addColorStop("0", "magenta")
    gradient.addColorStop("0.5", "blue")
    gradient.addColorStop("1.0", "red")
    // 用渐变填色
    ctx.fillStyle = gradient
    ctx.fillText(this.val , this.x, this.y, 200)
  }
  init(val, x, y, speed) {
    this.val = val
    this.x = x
    this.y = y
    this.speed = speed
  }

  // 每一帧更新子弹位置
  update() {
    this.y -= this.speed
  }
}
