let instance

/**
 * 统一的音效管理器
 */
export default class Music {
  constructor() {
    if (instance)
      return instance

    instance = this
    
    this.bgmAudio = new Audio()
    this.bgmAudio.loop = true
    this.bgmAudio.src = 'audio/bgm.mp3'

    this.eatAudio = new Audio()
    this.eatAudio.src = 'audio/eat.mp3'

    this.backAudio = new Audio()
    this.backAudio.src = 'audio/back.mp3'

    this.winAudio = new Audio()
    this.winAudio.src = 'audio/win.mp3'
    this.isPlayWin = false

    this.beginAudio = new Audio()
    this.beginAudio.src = 'audio/begin.mp3'

    this.playBgm()

  }

  playBgm() {
    this.bgmAudio.play()
  }

  eatMaJiang() {
    this.eatAudio.currentTime = 0
    this.eatAudio.play()
  }

  goBack() {
    this.backAudio.currentTime = 0
    this.backAudio.play()
  }

  playBegin(){
    this.winAudio.pause()
    this.isPlayWin = false
    this.beginAudio.currentTime = 0
    this.beginAudio.play()
  }

  playWin(){
    if (this.isPlayWin){
      return
    }
    this.winAudio.currentTime = 0
    this.winAudio.play()
    this.isPlayWin = true
  }
}
