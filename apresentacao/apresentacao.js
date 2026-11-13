import { FUNNEL, MARCOS_AUDIO_VERSION, MARCOS_PARTS, MARCOS_PHOTO_FILES, clinicEstimate, pageModel } from './config.js'

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

async function findIn(folders, names) {
  const key = `${folders.join(',')}::${names.join('|')}`
  if (fileCache.has(key)) return fileCache.get(key)
  const pending = (async () => {
    for (const folder of folders) {
      for (const name of names) {
        const path = `${folder}${name}`
        try {
          const response = await fetch(path, { headers: { Range: 'bytes=0-15' } })
          const type = response.headers.get('content-type') || ''
          if (response.ok && !/text\/html/i.test(type)) return new URL(path, window.location.href).href
        } catch {
          /* tenta o próximo arquivo */
        }
      }
    }
    return ''
  })()
  fileCache.set(key, pending)
  return pending
}

function findAudio(names) {
  return findIn(['./audio/'], names)
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
  if (!node) return
  node.replaceChildren()
  if (!photoUrl) {
    node.textContent = 'M'
    return
  }
  const image = document.createElement('img')
  image.alt = ''
  image.addEventListener('error', () => {
    node.replaceChildren()
    node.textContent = 'M'
  })
  image.src = photoUrl
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
    const hint = document.querySelector('.voice-hint')
    if (hint) hint.hidden = parts.length < 2
    paintMarcos()
  })
  findIn(['./', './audio/'], MARCOS_PHOTO_FILES).then((url) => {
    paintAvatar(document.querySelector('#marcos-avatar'), url)
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
    if (!demo) {
      frame.hidden = true
      frame.removeAttribute('src')
      note.textContent = card.dataset.note || 'Em breve.'
      return
    }
    note.textContent = 'Demonstração ilustrativa, com dados fictícios.'
    frame.hidden = false
    if (frame.getAttribute('src') !== demo) frame.src = demo
    mini.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' })
  })
}

function apply(search) {
  const model = pageModel(search)
  const kicker = document.querySelector('#kicker')
  if (kicker) kicker.textContent = model.kicker
  document.querySelector('#doutor-copy').textContent =
    `Acompanha o caminho do paciente ${model.place}, no consultório ou fora. A tela é a visão do dono, com dados fictícios.`
  document.querySelector('#atendente-copy').textContent =
    `Conduz a fila, as conversas e a agenda no mesmo painel ${model.place}. A recepção vê o que está esperando.`
  document.querySelectorAll('.cta-help:not([data-keep])').forEach((node) => {
    node.textContent = model.ctaHelp
  })
  document.querySelector('#phone-name').textContent = model.header
  document.querySelector('#phone-initial').textContent = model.initial
  const radio = document.querySelector(`input[name="nicho"][value="${model.niche}"]`)
  if (radio) radio.checked = true
  document.querySelectorAll('[data-cta]').forEach((cta) => {
    cta.rel = 'noopener'
    if (model.href) {
      cta.href = model.href
      cta.target = '_blank'
      cta.removeAttribute('aria-disabled')
    } else {
      cta.removeAttribute('href')
      cta.removeAttribute('target')
      cta.setAttribute('aria-disabled', 'true')
    }
  })
  document.querySelectorAll('.cta-missing').forEach((missing) => {
    missing.hidden = Boolean(model.href)
  })
  runThread(model.thread)
  return model
}

function currentSearch() {
  return window.location.search
}

function line(text, patient = false) {
  const node = document.createElement('p')
  node.className = `bubble-demo${patient ? ' from-patient' : ''}`
  node.textContent = text
  return node
}

let funnelToken = 0

function paintFunnel(index, channel) {
  const step = FUNNEL[index]
  const stage = document.querySelector('#funnel-stage')
  const steps = document.querySelector('#funnel-steps')
  const method = document.querySelector('#funnel-method')
  if (!step || !stage || !steps) return
  const token = ++funnelToken
  steps.querySelectorAll('[role="tab"]').forEach((tab, tabIndex) => {
    const selected = tabIndex === index
    tab.setAttribute('aria-selected', selected ? 'true' : 'false')
    tab.classList.toggle('is-done', tabIndex < index)
    tab.tabIndex = selected ? 0 : -1
    if (selected && steps.scrollWidth > steps.clientWidth) {
      const left = tab.offsetLeft - steps.clientWidth / 2 + tab.clientWidth / 2
      steps.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? 'auto' : 'smooth' })
    }
  })
  const name = step.card ? 'Painel do doutor' : 'Clínica Dra. Paula'
  const avatar = document.querySelector('#chat-avatar')
  if (avatar) avatar.textContent = step.card ? '★' : 'P'
  const who = document.querySelector('#chat-name')
  if (who) who.textContent = name
  const time = document.querySelector('#chat-time')
  if (time) time.textContent = step.card ? 'Automatize · hoje' : `${channel === 'instagram' ? 'Instagram Direct' : 'WhatsApp'} · ${step.time}`
  stage.setAttribute('aria-labelledby', `funnel-${step.id}`)
  stage.classList.toggle('is-panel', Boolean(step.card))
  stage.replaceChildren()
  const title = document.createElement('p')
  title.className = 'chat-day'
  title.textContent = step.title
  stage.append(title)
  const nodes = []
  if (step.card) {
    const grid = document.createElement('div')
    grid.className = 'kpi-grid'
    step.stats.forEach(([label, value]) => {
      const box = document.createElement('div')
      const strong = document.createElement('strong')
      strong.textContent = value
      const small = document.createElement('span')
      small.textContent = label
      box.append(strong, small)
      grid.append(box)
    })
    nodes.push(grid)
    step.rows.forEach(([who, where]) => {
      const row = document.createElement('div')
      row.className = 'kpi-row'
      const b = document.createElement('b')
      b.textContent = who
      const span = document.createElement('span')
      span.textContent = where
      row.append(b, span)
      nodes.push(row)
    })
  } else {
    step.chat.forEach((msg, msgIndex) => {
      const text = msgIndex === 0 && channel === 'instagram' && step.instagram ? step.instagram : msg.text
      if (msg.from === 'note') {
        const n = document.createElement('p')
        n.className = 'chat-note'
        n.textContent = text
        nodes.push(n)
        return
      }
      const node = line(text, msg.from === 'patient')
      if (msg.from === 'clinic') node.classList.add('from-clinic')
      nodes.push(node)
    })
  }
  if (reduceMotion) stage.append(...nodes)
  else {
    nodes.forEach((node, nodeIndex) => {
      window.setTimeout(() => {
        if (token !== funnelToken) return
        node.classList.add('pop')
        stage.append(node)
      }, 250 + nodeIndex * 650)
    })
  }
  if (method) {
    method.replaceChildren()
    const k = document.createElement('p')
    k.className = 'method-kicker'
    k.textContent = `Etapa ${index + 1} de ${FUNNEL.length} · Método`
    const h = document.createElement('h3')
    h.textContent = step.method
    const p = document.createElement('p')
    p.textContent = step.why
    method.append(k, h, p)
  }
  const prev = document.querySelector('#step-prev')
  const next = document.querySelector('#step-next')
  if (prev) prev.disabled = index === 0
  if (next) next.disabled = index === FUNNEL.length - 1
}

function wireFunnel() {
  const host = document.querySelector('#funnel-steps')
  const play = document.querySelector('#funnel-play')
  if (!host) return
  let index = 0
  let channel = 'whatsapp'
  let timer = 0
  let playing = !reduceMotion
  const paintPlay = () => {
    if (!play) return
    play.hidden = reduceMotion
    play.textContent = playing ? 'Pausar' : 'Retomar'
    play.setAttribute('aria-pressed', playing ? 'true' : 'false')
    play.setAttribute('aria-label', playing ? 'Pausar a demonstração' : 'Retomar a demonstração')
  }
  const stop = () => {
    window.clearInterval(timer)
    timer = 0
  }
  const start = () => {
    stop()
    if (!playing || reduceMotion) return
    timer = window.setInterval(() => {
      index = (index + 1) % FUNNEL.length
      paintFunnel(index, channel)
    }, 6500)
  }
  FUNNEL.forEach((step, stepIndex) => {
    const tab = document.createElement('button')
    tab.type = 'button'
    tab.role = 'tab'
    tab.id = `funnel-${step.id}`
    tab.setAttribute('aria-controls', 'funnel-stage')
    const mark = document.createElement('i')
    mark.textContent = String(stepIndex + 1)
    const label = document.createElement('span')
    label.textContent = step.label
    tab.append(mark, label)
    tab.addEventListener('click', () => {
      playing = false
      paintPlay()
      stop()
      index = stepIndex
      paintFunnel(index, channel)
    })
    host.append(tab)
  })
  host.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    playing = false
    paintPlay()
    stop()
    index = event.key === 'ArrowRight' ? Math.min(FUNNEL.length - 1, index + 1) : Math.max(0, index - 1)
    paintFunnel(index, channel)
    host.querySelectorAll('[role="tab"]')[index]?.focus()
  })
  document.querySelectorAll('input[name="canal"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return
      channel = input.value
      paintFunnel(index, channel)
    })
  })
  document.querySelector('#step-prev')?.addEventListener('click', () => {
    playing = false
    paintPlay()
    stop()
    index = Math.max(0, index - 1)
    paintFunnel(index, channel)
  })
  document.querySelector('#step-next')?.addEventListener('click', () => {
    playing = false
    paintPlay()
    stop()
    index = Math.min(FUNNEL.length - 1, index + 1)
    paintFunnel(index, channel)
  })
  play?.addEventListener('click', () => {
    playing = !playing
    paintPlay()
    if (playing) start()
    else stop()
  })
  paintPlay()
  paintFunnel(0, channel)
  const block = document.querySelector('.funnel')
  if (!block || !('IntersectionObserver' in window) || reduceMotion) return
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) start()
    else stop()
  }, { threshold: 0.35 })
  observer.observe(block)
}

function animateFigure(node, text, target) {
  if (!node) return
  if (reduceMotion || !Number.isFinite(target)) {
    node.textContent = text
    return
  }
  const from = Number(node.dataset.n || 0)
  const money = text.includes('R$')
  const start = performance.now()
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / 420)
    const current = Math.round(from + (target - from) * progress)
    node.dataset.n = String(current)
    node.textContent = money
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(current)
      : new Intl.NumberFormat('pt-BR').format(current)
    if (progress < 1) requestAnimationFrame(tick)
    else node.textContent = text
  }
  requestAnimationFrame(tick)
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function buildRuler(node, onChange) {
  const min = Number(node.dataset.min)
  const max = Number(node.dataset.max)
  const step = Number(node.dataset.step)
  const major = Number(node.dataset.major)
  const gap = 12
  const strip = document.createElement('div')
  strip.className = 'ruler-strip'
  const count = Math.round((max - min) / step)
  for (let i = 0; i <= count; i += 1) {
    const value = min + i * step
    const tick = document.createElement('span')
    const isMajor = value % major === 0
    const isMid = !isMajor && value % (major / 2) === 0
    tick.className = `tick${isMajor ? ' major' : isMid ? ' mid' : ''}`
    if (isMajor) {
      tick.dataset.label = node.dataset.money ? (value >= 1000 ? `${value / 1000} mil` : String(value)) : String(value)
    }
    strip.append(tick)
  }
  const needle = document.createElement('i')
  needle.className = 'needle'
  const wrap = document.createElement('div')
  wrap.className = 'ruler-wrap'
  node.before(wrap)
  wrap.append(node, needle)
  node.append(strip)
  const toValue = () => Math.min(max, Math.max(min, min + Math.round(node.scrollLeft / gap) * step))
  let last = null
  const set = (value, smooth) => {
    node.scrollTo({ left: ((value - min) / step) * gap, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' })
  }
  node.addEventListener('scroll', () => {
    const value = toValue()
    if (value === last) return
    last = value
    node.setAttribute('aria-valuenow', String(value))
    if (navigator.vibrate && node.dataset.touched) navigator.vibrate(4)
    onChange(value)
  }, { passive: true })
  node.addEventListener('pointerdown', () => { node.dataset.touched = '1' })
  node.addEventListener('keydown', (event) => {
    const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key]
    if (!delta) return
    event.preventDefault()
    set(Math.min(max, Math.max(min, toValue() + delta * step)), true)
  })
  requestAnimationFrame(() => set(Number(node.dataset.value), false))
  onChange(Number(node.dataset.value))
}

function wireCalculator() {
  const form = document.querySelector('#risco')
  if (!form) return
  const state = { messages: 30, value: 0 }
  const revenueCard = form.querySelector('#out-revenue-card')
  const paint = () => {
    const result = clinicEstimate({ messagesPerDay: state.messages, averageValue: state.value })
    if (!result) return
    animateFigure(form.querySelector('#out-conversations'), new Intl.NumberFormat('pt-BR').format(result.conversations), result.conversations)
    animateFigure(form.querySelector('#out-patients'), new Intl.NumberFormat('pt-BR').format(result.patients), result.patients)
    if (revenueCard) revenueCard.hidden = result.revenue == null
    if (result.revenue != null) animateFigure(form.querySelector('#out-revenue'), brl.format(result.revenue), result.revenue)
  }
  const msgs = form.querySelector('#msgs-ruler')
  const valor = form.querySelector('#valor-ruler')
  if (msgs) buildRuler(msgs, (value) => {
    state.messages = value
    form.querySelector('#msgs-out').textContent = String(value)
    paint()
  })
  if (valor) buildRuler(valor, (value) => {
    state.value = value
    form.querySelector('#valor-out').textContent = value ? brl.format(value) : 'Arraste para incluir'
    form.querySelector('#valor-out').classList.toggle('is-empty', !value)
    paint()
  })
}

export function boot() {
  wireAudio()
  wireModuleCards()
  wireFunnel()
  wireCalculator()
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
  document.querySelectorAll('[data-cta]').forEach((cta) => {
    cta.addEventListener('click', (event) => {
      if (!event.currentTarget.getAttribute('href')) event.preventDefault()
    })
  })
}

if (document.querySelector('#play')) boot()
