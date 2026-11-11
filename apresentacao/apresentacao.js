import { MARCOS_AUDIO_VERSION, MARCOS_PARTS, MARCOS_PHOTO_FILES, pageModel } from './config.js'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function readPause(text) {
  return Math.min(2100, 650 + text.length * 16)
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function checkMark() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 16 11')
  svg.setAttribute('width', '14')
  svg.setAttribute('height', '10')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M1 6.2 3.4 8.6 8.2 2.2M6.2 8.8 8.4 9.6 14.2 2.4')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', '#53bdeb')
  path.setAttribute('stroke-width', '1.4')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  svg.append(path)
  return svg
}

function renderStep(step) {
  if (step.kind === 'note') {
    const note = document.createElement('p')
    note.className = 'day'
    note.textContent = step.text
    return note
  }
  const bubble = document.createElement('div')
  bubble.className = `bubble ${step.kind === 'paciente' ? 'from-paciente' : 'from-equipe'}`
  const text = document.createElement('p')
  text.textContent = step.text
  const time = document.createElement('span')
  time.className = 'time'
  time.textContent = step.time
  if (step.kind === 'paciente') time.append(checkMark())
  bubble.append(text, time)
  return bubble
}

function typingNode() {
  const node = document.createElement('div')
  node.className = 'typing'
  node.setAttribute('aria-hidden', 'true')
  for (let index = 0; index < 3; index += 1) node.append(document.createElement('span'))
  return node
}

let runId = 0

async function runThread(thread) {
  const id = ++runId
  stopPatient()
  const chat = document.querySelector('#chat')
  const phase = document.querySelector('#phase')
  const typing = typingNode()
  const firstStatus = thread.find((step) => step.kind === 'status')
  if (firstStatus) phase.textContent = firstStatus.text

  const showAll = () => {
    chat.replaceChildren()
    for (const step of thread) {
      if (step.kind === 'typing' || step.kind === 'status') continue
      chat.append(step.kind === 'voice' ? renderVoice(step) : renderStep(step))
    }
    const last = [...thread].reverse().find((step) => step.kind === 'status')
    if (last) phase.textContent = last.text
    chat.scrollTop = chat.scrollHeight
  }

  if (reduceMotion) {
    showAll()
    return
  }

  while (id === runId) {
    if (!(await waitIfPatientPlaying(id))) return
    chat.classList.add('is-reset')
    await wait(180)
    if (id !== runId) return
    chat.replaceChildren()
    chat.classList.remove('is-reset')
    for (const step of thread) {
      if (id !== runId) return
      if (step.kind === 'status') {
        phase.textContent = step.text
        await wait(200)
        continue
      }
      if (step.kind === 'typing') {
        chat.append(typing)
        chat.scrollTop = chat.scrollHeight
        await wait(1100)
        typing.remove()
        continue
      }
      chat.append(step.kind === 'voice' ? renderVoice(step) : renderStep(step))
      chat.scrollTop = chat.scrollHeight
      await wait(step.kind === 'voice' ? 1400 : step.kind === 'note' ? 480 : readPause(step.text))
    }
    if (id !== runId) return
    await wait(2600)
  }
}

function paintBars(bars, ratio) {
  const lit = Math.round(Math.min(1, Math.max(0, ratio)) * bars.length)
  bars.forEach((bar, index) => bar.classList.toggle('is-on', index < lit))
}

function patientAudios() {
  return [...document.querySelectorAll('.voice-bubble audio')]
}

function stopPatient() {
  patientAudios().forEach((audio) => {
    if (!audio.paused) audio.pause()
  })
}

async function waitIfPatientPlaying(id) {
  const playing = () => patientAudios().some((audio) => !audio.paused && !audio.ended)
  while (playing()) {
    await wait(200)
    if (id !== runId) return false
  }
  return id === runId
}

const fileCache = new Map()

async function findAudio(names) {
  const key = names.join('|')
  if (fileCache.has(key)) return fileCache.get(key)
  const pending = (async () => {
    for (const name of names) {
      try {
        const response = await fetch(`./audio/${name}`, { headers: { Range: 'bytes=0-15' } })
        const type = response.headers.get('content-type') || ''
        if (response.ok && !/text\/html/i.test(type)) return new URL(`./audio/${name}`, window.location.href).href
      } catch {
        /* tenta o próximo nome */
      }
    }
    return ''
  })()
  fileCache.set(key, pending)
  return pending
}

function playIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('class', 'icon-play')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M8 5.5v13l11-6.5-11-6.5Z')
  path.setAttribute('fill', 'currentColor')
  svg.append(path)
  return svg
}

function pauseIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('class', 'icon-pause')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z')
  path.setAttribute('fill', 'currentColor')
  svg.append(path)
  return svg
}

function renderVoice(step) {
  const wrap = document.createElement('div')
  wrap.className = 'voice-wrap'
  const bubble = document.createElement('div')
  bubble.className = 'bubble from-paciente voice-bubble'
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'play play-mini'
  button.disabled = true
  button.setAttribute('aria-label', 'Áudio do paciente em breve')
  button.append(playIcon(), pauseIcon())
  const main = document.createElement('div')
  main.className = 'note-main'
  const wave = document.createElement('div')
  wave.className = 'wave wave-mini'
  wave.setAttribute('aria-hidden', 'true')
  for (const height of [8, 14, 20, 12, 18, 10, 16, 22, 9]) {
    const bar = document.createElement('span')
    bar.style.height = `${height}px`
    wave.append(bar)
  }
  const clock = document.createElement('p')
  clock.className = 'clock'
  clock.textContent = 'em breve'
  const transcript = document.createElement('p')
  transcript.className = 'transcript'
  const label = document.createElement('span')
  label.textContent = 'Transcrição'
  transcript.append(label, document.createTextNode(` ${step.text}`))
  main.append(wave, clock, transcript)
  bubble.append(button, main)
  const stamp = document.createElement('span')
  stamp.className = 'time'
  stamp.textContent = step.time
  stamp.append(checkMark())
  bubble.append(stamp)
  const audio = document.createElement('audio')
  audio.className = 'sr-audio'
  audio.preload = 'auto'
  audio.setAttribute('playsinline', '')
  audio.playsInline = true
  bubble.append(audio)
  wrap.append(bubble)

  const bars = [...wave.children]
  const paint = () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0
    if (!audio.paused && !audio.ended) {
      clock.textContent = formatTime(audio.currentTime)
      paintBars(bars, duration ? audio.currentTime / duration : 0)
      return
    }
    paintBars(bars, 0)
    if (duration > 0) clock.textContent = formatTime(duration)
  }
  let frame = 0
  const track = () => {
    paint()
    if (!audio.paused && !audio.ended) frame = window.requestAnimationFrame(track)
  }
  audio.addEventListener('loadedmetadata', paint)
  audio.addEventListener('durationchange', paint)
  audio.addEventListener('timeupdate', paint)
  audio.addEventListener('play', () => {
    button.setAttribute('aria-pressed', 'true')
    button.setAttribute('aria-label', 'Pausar o áudio do paciente')
    window.cancelAnimationFrame(frame)
    track()
  })
  audio.addEventListener('pause', () => {
    window.cancelAnimationFrame(frame)
    button.setAttribute('aria-pressed', 'false')
    button.setAttribute('aria-label', 'Ouvir o áudio do paciente')
    paint()
  })
  audio.addEventListener('ended', () => {
    window.cancelAnimationFrame(frame)
    paint()
  })
  audio.addEventListener('error', () => {
    button.disabled = true
    button.setAttribute('aria-label', 'Áudio do paciente em breve')
    clock.textContent = 'em breve'
  })
  button.addEventListener('click', () => {
    if (button.disabled || !audio.src) return
    pauseMarcos()
    patientAudios().forEach((other) => {
      if (other !== audio && !other.paused) other.pause()
    })
    if (!audio.paused && !audio.ended) {
      audio.pause()
      return
    }
    const pending = audio.play()
    pending?.catch(() => {
      button.disabled = true
      clock.textContent = 'em breve'
    })
  })

  findAudio([step.file]).then((url) => {
    if (!bubble.isConnected) return
    if (!url) return
    audio.src = url
    button.disabled = false
    button.setAttribute('aria-label', 'Ouvir o áudio do paciente')
  })
  return wrap
}

function paintAvatar(node, photoUrl) {
  node.replaceChildren()
  if (!photoUrl) {
    node.textContent = 'M'
    return
  }
  const image = document.createElement('img')
  image.src = photoUrl
  image.alt = ''
  node.append(image)
}

const marcosUi = []
let marcosIndex = -1
let marcosChain = false
let marcosSwitching = false
let marcosFrame = 0

function listenLabel() {
  return document.querySelector('#listen-label')
}

function ouçaEm(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Ouça a mensagem'
  return `Ouça em ${formatTime(seconds)}`
}

function pauseMarcos() {
  marcosChain = false
  const audio = document.querySelector('#marcos-audio')
  if (audio && !audio.paused) audio.pause()
  paintMarcos()
}

function paintMarcos() {
  const audio = document.querySelector('#marcos-audio')
  const button = document.querySelector('#play')
  const label = listenLabel()
  const bars = [...document.querySelectorAll('#wave span')]
  const playing = audio && !audio.paused && !audio.ended && marcosIndex >= 0
  const total = marcosUi.reduce((sum, part) => sum + (part.duration || 0), 0)
  if (button) {
    button.disabled = marcosUi.length === 0
    button.setAttribute('aria-pressed', playing ? 'true' : 'false')
    button.setAttribute('aria-label', playing ? 'Pausar a mensagem' : 'Ouvir a mensagem do Marcos')
  }
  if (!label) return
  if (playing) {
    const part = marcosUi[marcosIndex]
    const progress = formatTime(audio.currentTime)
    label.textContent = marcosUi.length > 1 ? `${progress} · parte ${marcosIndex + 1} de ${marcosUi.length}` : progress
    paintBars(bars, part?.duration ? audio.currentTime / part.duration : 0)
    return
  }
  paintBars(bars, 0)
  label.textContent = marcosUi.length ? ouçaEm(total) : 'Áudio em breve'
}

function trackMarcos() {
  paintMarcos()
  const audio = document.querySelector('#marcos-audio')
  if (audio && !audio.paused && !audio.ended) marcosFrame = window.requestAnimationFrame(trackMarcos)
}

function playMarcos(index) {
  const audio = document.querySelector('#marcos-audio')
  const part = marcosUi[index]
  if (!audio || !part?.url) return
  stopPatient()
  if (marcosIndex === index && audio.dataset.src === part.url && !audio.paused && !audio.ended) {
    marcosChain = false
    audio.pause()
    return
  }
  marcosChain = true
  marcosIndex = index
  if (!audio.paused) {
    marcosSwitching = true
    audio.pause()
  }
  if (audio.dataset.src !== part.url) {
    audio.src = part.url
    audio.dataset.src = part.url
  }
  window.cancelAnimationFrame(marcosFrame)
  const pending = audio.play()
  pending?.catch(() => {
    marcosChain = false
    paintMarcos()
  })
}

function measureDuration(url) {
  return new Promise((resolve) => {
    const probe = document.createElement('audio')
    probe.preload = 'metadata'
    probe.src = url
    probe.addEventListener('loadedmetadata', () => resolve(Number.isFinite(probe.duration) ? probe.duration : 0))
    probe.addEventListener('error', () => resolve(0))
  })
}

function versioned(url) {
  const next = new URL(url)
  next.searchParams.set('v', MARCOS_AUDIO_VERSION)
  return next.href
}

async function loadMarcosParts() {
  const parts = []
  for (const name of MARCOS_PARTS) {
    const url = await findAudio([name])
    if (!url) continue
    const playUrl = versioned(url)
    parts.push({ url: playUrl, duration: await measureDuration(playUrl) })
  }
  return parts
}

function wireAudio() {
  const audio = document.querySelector('#marcos-audio')
  const button = document.querySelector('#play')
  const wave = document.querySelector('#wave')
  if (!audio || !button || !wave) return
  audio.playsInline = true
  for (const height of [8, 14, 22, 30, 18, 36, 26, 12, 20, 34, 28, 16, 24, 38, 22, 10, 18, 32, 14, 26]) {
    const bar = document.createElement('span')
    bar.style.height = `${height}px`
    wave.append(bar)
  }
  button.addEventListener('click', () => {
    if (!marcosUi.length) return
    playMarcos(marcosIndex >= 0 ? marcosIndex : 0)
  })
  audio.addEventListener('play', () => {
    window.cancelAnimationFrame(marcosFrame)
    trackMarcos()
  })
  audio.addEventListener('pause', () => {
    window.cancelAnimationFrame(marcosFrame)
    if (marcosSwitching) {
      marcosSwitching = false
      return
    }
    if (!audio.ended) marcosChain = false
    paintMarcos()
  })
  audio.addEventListener('ended', () => {
    window.cancelAnimationFrame(marcosFrame)
    const next = marcosIndex + 1
    if (marcosChain && next < marcosUi.length) {
      playMarcos(next)
      return
    }
    marcosChain = false
    marcosIndex = -1
    paintMarcos()
  })
  loadMarcosParts().then((parts) => {
    marcosUi.splice(0, marcosUi.length, ...parts)
    paintMarcos()
  })
  findAudio(MARCOS_PHOTO_FILES).then((url) => {
    if (url) paintAvatar(document.querySelector('#marcos-avatar'), url)
  })
}

function wireModuleCards() {
  const host = document.querySelector('#modules')
  const mini = document.querySelector('#mini')
  const note = document.querySelector('#mini-note')
  const frame = document.querySelector('#mini-frame')
  if (!host || !mini || !note || !frame) return
  host.addEventListener('click', (event) => {
    const card = event.target.closest('.module-card')
    if (!card) return
    host.querySelectorAll('.module-card').forEach((item) => {
      item.setAttribute('aria-pressed', item === card ? 'true' : 'false')
    })
    const demo = card.dataset.demo || ''
    mini.hidden = false
    if (demo === 'whatsapp') {
      frame.hidden = true
      note.textContent = 'A conversa ilustrativa, com o áudio do paciente, está logo abaixo.'
      document.querySelector('#wa-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (demo) {
      note.textContent = 'Tela da demonstração local, com dados fictícios.'
      frame.hidden = false
      if (frame.getAttribute('src') !== demo) frame.src = demo
      return
    }
    frame.hidden = true
    frame.removeAttribute('src')
    note.textContent = card.dataset.note || 'Em breve.'
  })
}

function apply(search) {
  const model = pageModel(search)
  document.querySelector('#kicker').textContent = model.kicker
  document.querySelector('#place').textContent = model.heroPlace
  document.querySelector('#doutor-copy').textContent = `Acompanha o funil ${model.place} todos os dias, no consultório ou fora. Acesse pelo celular.`
  document.querySelector('#atendente-copy').textContent = `Conduz a fila, as conversas e abre a agenda no mesmo painel ${model.place}.`
  document.querySelector('#cta-help').textContent = model.ctaHelp
  document.querySelector('#phone-name').textContent = model.header
  document.querySelector('#phone-initial').textContent = model.initial
  const radio = document.querySelector(`input[name="nicho"][value="${model.niche}"]`)
  if (radio) radio.checked = true
  const cta = document.querySelector('#cta')
  const missing = document.querySelector('#cta-missing')
  if (model.href) {
    cta.href = model.href
    cta.removeAttribute('aria-disabled')
    missing.hidden = true
  } else {
    cta.removeAttribute('href')
    cta.setAttribute('aria-disabled', 'true')
    missing.hidden = false
  }
  runThread(model.thread)
  return model
}

function currentSearch() {
  return window.location.search
}

export function boot() {
  wireAudio()
  wireModuleCards()
  apply(currentSearch())
  document.querySelectorAll('input[name="nicho"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return
      const params = new URLSearchParams(currentSearch())
      params.set('nicho', input.value)
      const next = `?${params.toString()}`
      window.history.replaceState(null, '', `${window.location.pathname}${next}`)
      apply(next)
    })
  })
  document.querySelector('#replay').addEventListener('click', () => {
    apply(currentSearch())
  })
  document.querySelector('#cta').addEventListener('click', (event) => {
    if (!event.currentTarget.getAttribute('href')) event.preventDefault()
  })
}

if (document.querySelector('#play')) boot()
