import DataBus from './databus'
import MaJiang from './majiang/majiang'

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight
canvas.width = screenWidth
canvas.height = screenHeight
let ctx = canvas.getContext('2d')
let databus = new DataBus()


let atlas = new Image()
atlas.src = 'images/replay.png'
/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.aniId = 0
    this.restart()
    // this.touchHandler = this.touchEventHandler.bind(this)
    // canvas.addEventListener('touchstart', this.touchHandler)
  }

  restart() {
    let indexArr = [{ value: 1, count: 4 }, { value: 2, count: 4 }, { value: 3, count: 4 }, { value: 4, count: 4 }, { value: 5, count: 4 }, { value: 6, count: 4 }, { value: 7, count: 4 }, { value: 8, count: 4 }, { value: 9, count: 4 }, { value: 10, count: 4 }, { value: 11, count: 4 }, { value: 12, count: 4 }, { value: 13, count: 4 }, { value: 14, count: 4 }, { value: 15, count: 4 }, { value: 16, count: 4 }, { value: 17, count: 4 }, { value: 18, count: 4 }, { value: 19, count: 4 }, { value: 20, count: 4 }, { value: 21, count: 4 }, { value: 22, count: 4 }, { value: 23, count: 4 }, { value: 24, count: 4 }, { value: 25, count: 4 }, { value: 26, count: 4 }, { value: 27, count: 4 }]
    databus.reset()

    this.bindLoop = this.loop.bind(this)
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

    // 清除上一局的动画
    window.cancelAnimationFrame(this.aniId);
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'green'
    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }
  // 重新开始的触摸事件处理逻辑
  touchEventHandler(e) {
    e.preventDefault()

    let x = e.touches[0].clientX
    let y = e.touches[0].clientY

    if (x >= 10 && x <= 50 && y >= 10 && y <= 50) {
      this.restart()
    }
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    ctx.fillRect(0, 0, screenWidth, screenHeight)
    // ctx.drawImage(atlas, 10, 10, 40, 40)
    databus.mjArr.forEach(item => {
      item.drawToCanvas(ctx)
    })
  }

  // 实现游戏帧循环
  loop() {
    this.render()
    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }
}