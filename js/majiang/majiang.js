import Sprite from '../base/sprite'
import DataBus from '../databus'

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

// 麻将相关常量设置   单个麻将尺寸46*72，高72(牌面64，上截面8)  真实牌面=46*(64+8)
const CheckerboardHeight = screenHeight * 0.8                             //棋盘高度
const PLAYER_HEIGHT = CheckerboardHeight / 6                              //麻将高度
const HEIGHT_WIDTH_RATE = 46 / 72                                         //麻将宽高比
const PLAYER_WIDTH = PLAYER_HEIGHT * HEIGHT_WIDTH_RATE                    //麻将宽度
const PLAYER_WIDTH_RATE = 1                                               //麻将宽度偏差指数
const PLAYER_HEIGHT_RATE = 0.89                                           //麻将高度偏差指数（64/72）
const CheckerboardWidth = PLAYER_WIDTH * PLAYER_WIDTH_RATE * 18           //棋盘宽度
const Width_Middle = screenWidth - (screenWidth - CheckerboardWidth) / 2  //棋盘水平居中位置控制

let databus = new DataBus()

export default class MaJiang extends Sprite {
  constructor(params) {
    const PLAYER_IMG_SRC = `images/${params.value}.png`
    super(PLAYER_IMG_SRC, PLAYER_WIDTH, PLAYER_HEIGHT)
    this.index = params.count
    this.col = params.count % 18
    this.row = parseInt((108 - params.count) / 18)
    this.x = Width_Middle - this.width * (18 - this.col) * PLAYER_WIDTH_RATE
    this.y = CheckerboardHeight - this.height * (5 - this.row) * PLAYER_HEIGHT_RATE

    databus.dyadicArr[this.row][this.col] = params.value

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
    const deviationX = 0 //x轴偏移量
    const deviationY = PLAYER_HEIGHT * (PLAYER_HEIGHT_RATE - 1) //y轴偏移量
    return !!(x >= this.x - deviationX &&
      y >= this.y - deviationY &&
      x <= this.x + this.width + deviationX &&
      y <= this.y + this.height && this.visible && databus.currentMj === null && databus.myRound)
  }

  /**
   * 根据手指的位置设置麻将的位置
   * 保证手指处于麻将中间
   * 同时限定麻将的活动范围限制在棋盘中
   */
  setMaJiangAcrossFingerPosZ(x, y) {
    let disX = x - this.width / 2
    let disY = y - this.height / 2
    if (this.currentMoving === 'left' || (this.currentMoving === '' && this.touchedx - x > Math.abs(this.touchedy - y))) {
      disY = this.ex_y
      disX = Math.min(disX, this.ex_x)
      this.currentMoving = 'left'
    } else if (this.currentMoving === 'right' || (this.currentMoving === '' && x - this.touchedx > Math.abs(this.touchedy - y))) {
      disY = this.ex_y
      disX = Math.max(disX, this.ex_x)
      this.currentMoving = 'right'
    } else if (this.currentMoving === 'up' || (this.currentMoving === '' && Math.abs(this.touchedx - x) < this.touchedy - y)) {
      disX = this.ex_x
      disY = Math.min(disY, this.ex_y)
      this.currentMoving = 'up'
    } else if (this.currentMoving === 'down' || (this.currentMoving === '' && Math.abs(this.touchedx - x) < y - this.touchedy)) {
      disX = this.ex_x
      disY = Math.max(disY, this.ex_y)
      this.currentMoving = 'down'
    } else {
      disX = this.ex_x
      disY = this.ex_y
    }
    this.movePath.forEach(item => {
      if (item.left && this.currentMoving === 'left') {
        let _arr = item.left.split('_')
        if (disX < this.ex_x - _arr[0] * PLAYER_WIDTH * PLAYER_WIDTH_RATE) {
          disX = this.ex_x - _arr[0] * PLAYER_WIDTH * PLAYER_WIDTH_RATE
        }
        if (_arr[0] > 0) {
          if (_arr[2] === 'true') {
            if (disX == this.ex_x - _arr[0] * PLAYER_WIDTH * PLAYER_WIDTH_RATE) {
              databus.dyadicArr[this.row][this.col] = 0
              databus.dyadicArr[this.row][this.col - _arr[0] * 1 - 1] = 0
              databus.change.push({
                'row': this.row,
                'col': this.col,
                'move': 'left',
                'disabled': true,
                'step': _arr[0] * 1 + 1
              })
            }
          } else {
            for (var i = this.col; i >= this.col - _arr[1]; i--) {
              databus.change.push({
                'row': this.row,
                'col': i,
                'move': 'left',
                'x': disX + (i - this.col) * PLAYER_WIDTH * PLAYER_WIDTH_RATE
              })
            }
          }
        } else if (_arr[2] === 'true') {
          databus.dyadicArr[this.row][this.col] = 0
          databus.dyadicArr[this.row][this.col - 1] = 0
          databus.change.push({
            'row': this.row,
            'col': this.col,
            'disabled': true
          })
          databus.change.push({
            'row': this.row,
            'col': this.col - 1,
            'disabled': true
          })
        }
      }
      if (item.right && this.currentMoving === 'right') {
        let _arr = item.right.split('_')
        if (disX > this.ex_x + _arr[0] * PLAYER_WIDTH * PLAYER_WIDTH_RATE) {
          disX = this.ex_x + _arr[0] * PLAYER_WIDTH * PLAYER_WIDTH_RATE
        }
        if (_arr[0] > 0) {
          if (_arr[2] === 'true') {
            if (disX == this.ex_x + _arr[0] * PLAYER_WIDTH * PLAYER_WIDTH_RATE) {
              databus.dyadicArr[this.row][this.col] = 0
              databus.dyadicArr[this.row][this.col + _arr[0] * 1 + 1] = 0
              databus.change.push({
                'row': this.row,
                'col': this.col,
                'move': 'right',
                'disabled': true,
                'step': _arr[0] * 1 + 1
              })
            }
          } else {
            for (var i = this.col; i <= this.col + _arr[1] * 1; i++) {
              databus.change.push({
                'row': this.row,
                'col': i,
                'move': 'right',
                'x': disX - (this.col - i) * PLAYER_WIDTH * PLAYER_WIDTH_RATE
              })
            }
          }
        } else if (_arr[2] === 'true') {
          databus.dyadicArr[this.row][this.col] = 0
          databus.dyadicArr[this.row][this.col + 1] = 0
          databus.change.push({
            'row': this.row,
            'col': this.col,
            'disabled': true
          })
          databus.change.push({
            'row': this.row,
            'col': this.col + 1,
            'disabled': true
          })
        }
      }
      if (item.up && this.currentMoving === 'up') {
        let _arr = item.up.split('_')
        if (disY < this.ex_y - _arr[0] * PLAYER_HEIGHT * PLAYER_HEIGHT_RATE) {
          disY = this.ex_y - _arr[0] * PLAYER_HEIGHT * PLAYER_HEIGHT_RATE
        }
        if (_arr[0] > 0) {
          if (_arr[2] === 'true') {
            if (disY == this.ex_y - _arr[0] * PLAYER_HEIGHT * PLAYER_HEIGHT_RATE) {
              databus.dyadicArr[this.row - _arr[0] * 1 - 1][this.col] = 0
              databus.dyadicArr[this.row][this.col] = 0
              databus.change.push({
                'row': this.row,
                'col': this.col,
                'move': 'up',
                'disabled': true,
                'step': _arr[0] * 1 + 1
              })
            }
          } else {
            for (var i = this.row; i >= this.row - _arr[1]; i--) {
              databus.change.push({
                'row': i,
                'col': this.col,
                'move': 'up',
                'y': disY + (i - this.row) * PLAYER_HEIGHT * PLAYER_HEIGHT_RATE
              })
            }

          }
        } else if (_arr[2] === 'true') {
          databus.dyadicArr[this.row][this.col] = 0
          databus.dyadicArr[this.row - 1][this.col] = 0
          databus.change.push({
            'row': this.row,
            'col': this.col,
            'disabled': true
          })
          databus.change.push({
            'row': this.row - 1,
            'col': this.col,
            'disabled': true
          })
        }
      }
      if (item.down && this.currentMoving === 'down') {
        let _arr = item.down.split('_')
        if (disY > this.ex_y + _arr[0] * PLAYER_HEIGHT * PLAYER_HEIGHT_RATE) {
          disY = this.ex_y + _arr[0] * PLAYER_HEIGHT * PLAYER_HEIGHT_RATE
        }
        if (_arr[0] > 0) {
          if (_arr[2] === 'true') {
            if (disY == this.ex_y + _arr[0] * PLAYER_HEIGHT * PLAYER_HEIGHT_RATE) {
              databus.dyadicArr[this.row + _arr[0] * 1 + 1][this.col] = 0
              databus.dyadicArr[this.row][this.col] = 0
              databus.change.push({
                'row': this.row,
                'col': this.col,
                'move': 'down',
                'disabled': true,
                'step': _arr[0] * 1 + 1
              })
            }
          } else {
            for (var i = this.row; i <= this.row + _arr[1] * 1; i++) {
              databus.change.push({
                'row': i,
                'col': this.col,
                'move': 'down',
                'y': disY - (this.row - i) * PLAYER_HEIGHT * PLAYER_HEIGHT_RATE
              })
            }
          }
        } else if (_arr[2] === 'true') {
          databus.dyadicArr[this.row][this.col] = 0
          databus.dyadicArr[this.row + 1][this.col] = 0
          databus.change.push({
            'row': this.row,
            'col': this.col,
            'disabled': true
          })
          databus.change.push({
            'row': this.row + 1,
            'col': this.col,
            'disabled': true
          })
        }
      }
    })
    if (!databus.touchmove || (Math.abs(databus.touchmove.x - disX) > 5 && Math.abs(databus.touchmove.y - disY) > 5)) {
      databus.touchmove = { 'x': disX, 'y': disY }
    }
    databus.resetMjArr()

    this.x = disX
    this.y = disY
  }

  touchstart(e) {
    e.preventDefault()
    let x = e.touches[0].clientX
    let y = e.touches[0].clientY
    //当前选中的麻将
    if (this.checkIsFingerOnAir(x, y)) {   
      this.touched = true
      databus.currentMj = this
      // 获取麻将移动方式
      databus.getPathOfParticle(this)
      // 用于判断移动方向
      this.touchedx = x
      this.touchedy = y
    }
  }

  touchmove(e) {
    e.preventDefault()
    let x = e.touches[0].clientX
    let y = e.touches[0].clientY
    if (this.touched) {
      this.setMaJiangAcrossFingerPosZ(x, y)
    }
  }

  touchend(e){
    e.preventDefault()
    if (this.touched && this.visible) {
      databus.around(this)
      // console.table(databus.dyadicArr)
    }
    if (databus.currentMj) {
      databus.currentMj = null
    }
    this.currentMoving = ''
    this.touched = false

    if (databus.myRound) {
      this.x = this.ex_x
      this.y = this.ex_y

    }
  }

  /**
   * 玩家响应手指的触摸事件
   * 改变麻将的位置
   */
  initEvent() {
    this.touchstartHandler = this.touchstart.bind(this)
    canvas.addEventListener('touchstart', this.touchstartHandler)

    this.touchmoveHandler = this.touchmove.bind(this)
    canvas.addEventListener('touchmove', this.touchmoveHandler)

    this.touchendHandler = this.touchend.bind(this)
    canvas.addEventListener('touchend', this.touchendHandler)
  }

  removeEvent(){
    this.visible = false

    canvas.removeEventListener(
      'touchstart',
      this.touchstartHandler
    )

    canvas.removeEventListener(
      'touchmove',
      this.touchmoveHandler
    )

    canvas.removeEventListener(
      'touchend',
      this.touchendHandler
    )
  }

  blink(lag) {
    const time = Date.now()    
    let interval = setInterval(() => {
      this.visible = !this.visible
      if (Date.now() - time >= 1000) {
        clearInterval(interval)
        this.visible = false
        //我的回合开始
        databus.myRound = true
        databus.startTime = Date.now() - lag
      }
    }, 100)
  }
  moveBlink(step, direction, blink, lag) {
    const time = Date.now()
    let x = this.width * step
    let y = this.height * PLAYER_HEIGHT_RATE * step
    var si = setInterval(() => {
      if (direction === 'left') {
        this.x -= x / 10
      } else if (direction === 'right') {
        this.x += x / 10
      } else if (direction === 'up') {
        this.y -= y / 10
      } else if (direction === 'down') {
        this.y += y / 10
      }
      if (Date.now() - time >= 1000) {
        clearInterval(si)
        if (blink) {
          this.blink(lag)
        } else {
          if (direction === 'left') {
            this.col -= step
            this.ex_x -= x
          } else if (direction === 'right') {
            this.col += step
            this.ex_x += x
          } else if (direction === 'up') {
            this.row -= step
            this.ex_y -= y 
          } else if (direction === 'down') {
            this.row += step
            this.ex_y += y 
          }
        }
      }
    }, 100)
  }

  tips() {
    const time = Date.now()    
    let interval = setInterval(() => {
      this.visible = !this.visible
      if (Date.now() - time >= 1000) {
        clearInterval(interval)
        this.visible = true
        databus.myRound = true
      }
    }, 100)
  }

}