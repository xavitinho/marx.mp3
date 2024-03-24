let serverurl = 'https://servermarxmp3.onrender.com/?url='

if (window.location.href.startsWith('https://marxistmp3.web.app')) window.location.replace("https://xavitinho.com/marx.mp3")

let voices
populateVoiceList()
if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
 speechSynthesis.onvoiceschanged = populateVoiceList
}

let txttoread = JSON.parse(localStorage.getItem('txts'))
if (!txttoread) {
 txttoread = {}
}

atualizafavoritos()

let tocando = { autor: false, titulo: false, rate: 1 }

const rate = document.querySelector("#rate")
rate.addEventListener("change", e => {
 tocando.rate = e.target.value
 if (window.speechSynthesis.speaking) {
   window.speechSynthesis.cancel()
   if (tocando.titulo) speak()
 }
})

function populateVoiceList() {
 if (typeof speechSynthesis === "undefined") return
 voices = speechSynthesis.getVoices()
 for (let i = 0; i < voices.length; i++) {
   const option = document.createElement("option")
   option.textContent = `${voices[i].name} (${voices[i].lang})`
   if (voices[i].default) option.textContent += " — DEFAULT"
   option.setAttribute("data-lang", voices[i].lang)
   option.setAttribute("data-name", voices[i].name)
   document.getElementById("voiceSelect").appendChild(option)
 }
}

document.getElementById("search").addEventListener("input", e => {
 let inputed = e.target.value.toLowerCase()
 let autores = menu.querySelectorAll('.autor')
 autores.forEach(autor => {
   let autorvisible = false
   let ul = document.getElementById('#ul_' + autor.id)
   let textos = autor.querySelectorAll('.texto')
   textos.forEach(texto => {
    if (texto.textContent.toLowerCase().includes(inputed) || autor.id.toLowerCase().includes(inputed)) {
      if (texto.className != 'texto visible') texto.className = 'texto visible'
      autorvisible = true
    }
    else if (texto.className != 'texto invisible') texto.className = 'texto invisible'
   })
   if (autorvisible) {
    if (autor.className != 'autor visible') autor.className = 'autor visible'
    if (ul.className != 'visible') ul.className = 'visible'
   }
   else {
    if (autor.className != 'autor invisible') autor.className = 'autor invisible'
    if (ul.className != 'invisible') ul.className = 'invisible'
   }
   if (inputed == '' && ul.className != 'invisible') ul.className = 'invisible'
 })
})

function showtxts(autor) {
 e = document.getElementById('#ul_' + autor)
 e.className = e.className == 'invisible' ? 'visible' : 'invisible'
}

async function createtxt(txt, html) {
 let e = document.createElement('div')
 e.innerHTML = html
 for (let p of e.children) {
   if (p.className != "toplink" &&
    p.className != "info" &&
    p.className != "link" &&
    p.className != "tabela_datas" &&
    p.innerText.length > 0 &&
    p.tagName != 'TITLE' &&
    p.tagName != 'TABLE' &&
    p.tagName != 'STYLE') {
    txt.push(p.innerText.replaceAll('\n', ' ').replaceAll('\t', ''))
   }
 }
 return (txt)
}

async function requestserver(autor, titulo, url) {
 let button = document.getElementById('buttonplay')
 let leitor = document.getElementById('leitor')
 let erro = document.getElementById('errotxt')
 button.dataset.autor = 'none'
 button.dataset.titulo = 'none'
 document.getElementById('txturl').innerHTML = ''
 leitor.innerHTML = ''
 erro.innerText = 'carregando...'
 document.body.style.cursor = 'progress'
 if (!txttoread[autor]) txttoread[autor] = {}
 if (!txttoread[autor][titulo]) {
   if (!url) {
    erro.innerText = 'houve um erro. tente novamente.'
   } else {
    let xurl = serverurl + url
    txttoread[autor][titulo] = { progresso: 0, url, texto: [''] }
    if (!url.includes('.pdf')) {
      let response = await fetch(xurl).catch(e => {
       console.log(e)
       erro.innerText = 'houve um erro, tente novamente'
       return
      })
      let txt = await response.json()
      if (!txt.erro) {
       if (txt.includes('class="toc"')) {
         let e = document.createElement('div')
         e.innerHTML = txt
         let paragrafos = Array.from(e.children)
         let cont = 0
         let total = 0
         txt = ''
         let capurls = paragrafos.filter(p => {
          return (
            p.className.includes('toc') &&
            p.children.length > 0 &&
            p.children[0].getAttribute("href") &&
            !p.children[0].getAttribute("href").includes('#') &&
            !p.children[0].getAttribute("href").includes('.pdf')
          )
         }).map(p => {
          total++
          return (url.replace('index.htm', p.children[0].getAttribute("href")))
         })
         for (let capurl of capurls) {
          let response1 = await fetch(serverurl + capurl).catch(e => {
            console.log(e)
            erro.innerText = 'houve um erro, tente novamente'
            return
          })
          let txt1 = await response1.json()
          if (!txt1.erro) txttoread[autor][titulo].texto = await createtxt(txttoread[autor][titulo].texto, txt1)
          else leitor.innerText = txt1.erro
          cont++
          leitor.innerText = `${cont}/${total}...`
         }
         leitor.innerText = ''
       } else txttoread[autor][titulo].texto = await createtxt([], txt)
       erro.innerText = ''
      } else leitor.innerText = txt.erro
    } else {
      erro.innerText = ' o texto selecionado está no formato .pdf e não será possível lê-lo'
    }
   }
 } else {
   erro.innerText = ''
 }
 if (erro.innerText.length == 0) {
   leitor.innerText = ''
   let html = ''
   txttoread[autor][titulo].texto.forEach(p => {
    html += `<p>${p}</p>`
   })
   leitor.innerHTML += html
   button.dataset.autor = autor
   button.dataset.titulo = titulo
 } else {
   txttoread[autor][titulo] = undefined
 }
 document.body.style.cursor = 'auto'
 document.getElementById('txturl').innerHTML = `fonte: <a href="${txttoread[autor][titulo].url}" style="color:#f66; font-weight: bold;">${txttoread[autor][titulo].url}</a>`
 atualizafavoritos()
}

function play() {
 let erro = document.getElementById('erroplay')
 let button = document.getElementById('buttonplay')
 let { autor, titulo } = button.dataset
 if (titulo == 'none') erro.innerText = 'nenhum texto selecionado'
 else {
   window.speechSynthesis.cancel()
   tocando = { autor, titulo, rate: tocando.rate }
   erro.innerHTML = `tocando <strong>${titulo}</strong> de ${autor}`
   let buttonpause = document.getElementById('buttonpause')
   buttonpause.innerText = 'pausar'
   for (let e of document.getElementsByTagName('button')) e.className = 'ativo'
   speak()
 }
}

function pause() {
 let button = document.getElementById('buttonpause')
 if (button.className != 'disabled') {
   if (button.innerText == 'pausar') {
    button.innerText = 'continuar'
    window.speechSynthesis.pause()
   } else {
    button.innerText = 'pausar'
    window.speechSynthesis.resume()
   }
 }
}

function speak() {
 const { autor, titulo, rate } = tocando
 let progresso = txttoread[autor][titulo].progresso
 let total = txttoread[autor][titulo].texto.length
 document.getElementById('progresso').innerHTML = `<strong>${(progresso / total * 100).toFixed(2)}%</strong> : ${progresso}/${total} parágrafos ouvidos`
 if (progresso == total || progresso > total) {
   document.getElementById('erroplay').innerText = `você concluiu o texto ${titulo} de ${autor}!`
   limpar()
 } else {
   let to_speak = new SpeechSynthesisUtterance(txttoread[autor][titulo].texto[progresso])
   const selectedOption = document.getElementById("voiceSelect").selectedOptions[0].getAttribute("data-name")
   for (let i = 0; i < voices.length; i++) {
    if (voices[i].name === selectedOption) {
      to_speak.voice = voices[i]
    }
   }
   to_speak.rate = rate
   window.speechSynthesis.speak(to_speak)
   to_speak.addEventListener("end", () => {
    txttoread[autor][titulo].progresso++
    atualizafavoritos()
    speak()
   })
 }
}

function showfavoritos() {
 let e = document.getElementById('favoritos')
 e.style.display = e.style.display == 'none' ? 'block' : 'none'
 e = document.getElementsByTagName('seta')[0]
 e.innerText = e.innerText == '▲' ? '▼' : '▲'
}

function atualizafavoritos() {
 localStorage.setItem('txts', JSON.stringify(txttoread))
 let menu = document.getElementById('menufavoritos')
 menu.innerHTML = ''
 let cont = 0
 Object.keys(txttoread).forEach(autor => {
   let visible = false
   let e = document.createElement('div')
   let html = `<a class="autorfavoritos">${autor}</a><ul>`
   Object.keys(txttoread[autor]).forEach(texto => {
    if (txttoread[autor][texto] && txttoread[autor][texto]) {
      let inferno = texto.includes('"') ? "'" : '"'
      html += `<li><a style="font-weight: bold;" onclick=${inferno}requestserver(\`${autor}\`, \`${texto}\`)${inferno}>
         ${texto} (${txttoread[autor][texto].progresso}/${txttoread[autor][texto].texto.length} )
         </a><br>
         <a style="color: #f66; font-size: .8em; font-weight: bold;" 
         onclick=${inferno}liberarmemoria(\`${autor}\`, \`${texto}\`)${inferno}>× remover da memória </a></li>`
      visible = true
      cont++
    }
   })
   html += '</ul>'
   e.innerHTML = html
   if (visible) menu.appendChild(e)
 })
 if (cont<1) {
   document.getElementsByTagName('seta')[0].innerText = '▼'
   document.getElementById('favoritos').style.display = 'none'
 }
}

function liberarmemoria(autor, titulo) {
 if (tocando.autor == autor && tocando.titulo == titulo) {
   limpar()
 }
 txttoread[autor][titulo] = undefined
 atualizafavoritos()
}

function limpar() {
 let { autor, titulo, rate } = tocando
 if (autor && titulo) {
   txttoread[autor][titulo].progresso = 0
   window.speechSynthesis.cancel()
   for (let e of document.getElementsByTagName('button')) if (e.id != 'buttonplay') e.className = 'disabled'
   document.getElementById('progresso').innerText = ''
   document.getElementById('erroplay').innerText = ''
   tocando = { autor: false, titulo: false, rate }
   atualizafavoritos()
 }
}

function move(dir) {
 const { autor, titulo } = tocando
 if (autor && titulo) {
   window.speechSynthesis.cancel()
   txttoread[autor][titulo].progresso += dir
   if (txttoread[autor][titulo].progresso < 0) txttoread[autor][titulo].progresso = 0
   speak()
 }
}
