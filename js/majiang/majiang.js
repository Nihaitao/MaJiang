import Sprite from '../base/sprite'
import DataBus from '../databus'

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

let databus = new DataBus()

// 麻将相关常量设置   原尺寸72*72，真实图宽48，高72(牌面64，上截面8)  真实牌面=48*(64+8)
const PLAYER_WIDTH = 48
const PLAYER_HEIGHT = 48
const PLAYER_WIDTH_RATE = 0.64 //   48/72 + 偏差 
const PLAYER_HEIGHT_RATE = 0.89 //   64/72 + 偏差

// 棋盘大小
const CheckerboardWidth = PLAYER_WIDTH * PLAYER_WIDTH_RATE * 18
const CheckerboardHeight = PLAYER_HEIGHT * 6

export default class MaJiang extends Sprite {
  constructor(params) {
    const PLAYER_IMG_SRC = `images/${params.value}.png`
    super(PLAYER_IMG_SRC, PLAYER_WIDTH, PLAYER_HEIGHT)
    this.col = params.count % 18
    this.row = parseInt((108 - params.count) / 18)
    this.x = CheckerboardWidth - this.width * this.col * PLAYER_WIDTH_RATE
    this.y = CheckerboardHeight - this.height * this.row * PLAYER_HEIGHT_RATE

    // 用于在手指移动的时候标识手指是否已经在麻将上了
    this.touched = false
    // 标记当前位置，用于归位操作
    this.ex_x = this.x
    this.ex_y = this.y
    this.currentMoving = ''
    this.Identification = params.value
    // 初始化事件监听
    this.initEvent()
  }


  /**
   * 当手指触摸屏幕的时候
   * 判断手指是否在麻将上
   * @param {Number} x: 手指的X轴坐标
   * @param {Number} y: 手指的Y轴坐标
   * @return {Boolean}: 用于标识手指是否在麻将上的布尔值
   */
  checkIsFingerOnAir(x, y) {
    const deviationX = PLAYER_WIDTH * (-0.2) //x轴偏移量
    const deviationY = PLAYER_HEIGHT * (PLAYER_HEIGHT_RATE - 1) //y轴偏移量
    return !!(x >= this.x - deviationX &&
      y >= this.y - deviationY &&
      x <= this.x + this.width + deviationX &&
      y <= this.y + this.height && this.visible)
  }

  /**
   * 根据手指的位置设置麻将的位置
   * 保证手指处于麻将中间
   * 同时限定麻将的活动范围限制在棋盘中
   */
  setAirPosAcrossFingerPosZ(x, y) {
    if (databus.cantMove) {
      this.x = this.ex_x
      this.y = this.ex_y
      databus.cantMove = false
      return
    }
    let disX = x - this.width / 2
    let disY = y - this.height / 2
    if (this.currentMoving === 'horizontal' || (this.currentMoving === '' && Math.abs(this.touchedx - x) >= Math.abs(this.touchedy - y))) {
      console.log('horizontal')
      disY = this.ex_y
      this.currentMoving = 'horizontal'
    } else if (this.currentMoving === 'vertical' || (this.currentMoving === '' && Math.abs(this.touchedx - x) < Math.abs(this.touchedy - y))) {
      console.log('vertical')
      disX = this.ex_x
      this.currentMoving = 'vertical'
    }

    //活动范围限制在棋盘中
    if (disX < PLAYER_WIDTH * PLAYER_WIDTH_RATE)
      disX = PLAYER_WIDTH * PLAYER_WIDTH_RATE
    else if (disX > CheckerboardWidth)
      disX = CheckerboardWidth

    if (disY <= CheckerboardHeight - PLAYER_HEIGHT * PLAYER_HEIGHT_RATE * 5)
      disY = CheckerboardHeight - PLAYER_HEIGHT * PLAYER_HEIGHT_RATE * 5
    else if (disY > CheckerboardHeight)
      disY = CheckerboardHeight

    this.x = disX
    this.y = disY
  }

  /**
   * 玩家响应手指的触摸事件
   * 改变麻将的位置
   */
  initEvent() {
    canvas.addEventListener('touchstart', ((e) => {
      e.preventDefault()
      console.log('touchstart')
      let x = e.touches[0].clientX
      let y = e.touches[0].clientY

      //当前选中的麻将
      if (this.checkIsFingerOnAir(x, y)) {
        this.touched = true
        
        databus.getPathOfParticle(this)

        // 用于判断移动方向
        this.touchedx = x
        this.touchedy = y
        databus.currentId = this.Identification
      }

    }).bind(this))

    canvas.addEventListener('touchmove', ((e) => {
      e.preventDefault()

      let x = e.touches[0].clientX
      let y = e.touches[0].clientY
      if (this.touched) {
        this.setAirPosAcrossFingerPosZ(x, y)
        if (databus.hidden) {
          this.visible = false
          databus.hidden = false
        }
      } else if (this.checkIsFingerOnAir(x, y)) {
        if (databus.currentId === this.Identification && !databus.passId) {
          databus.hidden = true //通知目标可以消失了
          this.visible = false 
          databus.currentId = 0
          databus.passId = 0
        } else if (databus.currentId !== 0) {
          databus.cantMove = true
          if (!databus.passId){
            databus.passId = this.Identification
          }
        } else {
          
        }
      }

    }).bind(this))

    canvas.addEventListener('touchend', ((e) => {
      e.preventDefault()
      console.log('touchend')
      databus.passId = 0
      this.currentMoving = ''
      this.touched = false
      this.x = this.ex_x
      this.y = this.ex_y
    }).bind(this))
  }

}